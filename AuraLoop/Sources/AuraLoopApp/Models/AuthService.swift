import Foundation
import SwiftUI
import Combine
import AppKit

/// Deep-link helper to open the AuraLoop website with specific actions
public enum AuraLoopWebLink {
    public static var baseURL: String {
        UserDefaults.standard.string(forKey: "auraloop_web_url") ?? "https://aura-loop.vercel.app"
    }

    public static func open(action: String? = nil) {
        var str = baseURL
        if let action {
            str += (str.contains("?") ? "&" : "?") + "action=\(action)"
        }
        if let url = URL(string: str) {
            NSWorkspace.shared.open(url)
        }
    }
}

/// Cloud-synced user metadata (Pro Tier, UTR verification, and Favorites)
public struct CloudUserData: Codable {
    public var proTier: String?
    public var verifiedUTRs: [String]?
    public var favorites: [String]?
    public var updatedAt: Double?

    public init(proTier: String? = nil, verifiedUTRs: [String]? = nil, favorites: [String]? = nil, updatedAt: Double? = nil) {
        self.proTier = proTier
        self.verifiedUTRs = verifiedUTRs
        self.favorites = favorites
        self.updatedAt = updatedAt
    }

    public func encodeToPayloadString() -> String {
        guard let data = try? JSONEncoder().encode(self) else { return "" }
        return data.base64EncodedString()
    }

    public static func decode(from payloadString: String) -> CloudUserData? {
        guard let data = Data(base64Encoded: payloadString) else { return nil }
        return try? JSONDecoder().decode(CloudUserData.self, from: data)
    }
}

/// Profile of a signed-in AuraLoop user
public struct UserProfile: Codable, Identifiable, Equatable {
    public var id: String
    public var email: String
    public var name: String
    public var idToken: String
    public var refreshToken: String?
    public var photoUrl: String?

    public init(id: String, email: String, name: String, idToken: String, refreshToken: String? = nil, photoUrl: String? = nil) {
        self.id = id
        self.email = email
        self.name = name
        self.idToken = idToken
        self.refreshToken = refreshToken
        self.photoUrl = photoUrl
    }
}

/// Firebase Auth Service with Email OTP Verification for AuraLoop
@MainActor
public final class AuthService: ObservableObject {
    public static let shared = AuthService()

    private let apiKey = "AIzaSyCxqpRdX1n47PK3TuPlvm8R-7iyylTvUb8"
    private let projectId = "auraloop-5358f"
    private let userDefaultsKey = "auraloop.auth.user"

    @Published public private(set) var currentUser: UserProfile?
    @Published public var isBusy = false
    @Published public var errorMessage: String?
    @Published public var successMessage: String?

    // OTP Verification State
    @Published public var isAwaitingOTP = false
    @Published public var pendingEmail = ""
    @Published public var pendingName = ""
    private var pendingPassword = ""
    private var generatedOTP = ""
    private var otpExpiresAt: Date?

    public var isAuthenticated: Bool {
        currentUser != nil
    }

    private init() {
        restoreSession()
    }

    // MARK: - Session Management

    private func restoreSession() {
        guard let data = UserDefaults.standard.data(forKey: userDefaultsKey),
              let profile = try? JSONDecoder().decode(UserProfile.self, from: data) else {
            return
        }
        self.currentUser = profile
        Task {
            await syncCloudSession(idToken: profile.idToken, uid: profile.id)
        }
    }

    private func saveSession(_ profile: UserProfile) {
        self.currentUser = profile
        if let data = try? JSONEncoder().encode(profile) {
            UserDefaults.standard.set(data, forKey: userDefaultsKey)
        }
    }

    public func signOut() {
        UserDefaults.standard.removeObject(forKey: userDefaultsKey)
        self.currentUser = nil
        self.isAwaitingOTP = false
        self.pendingEmail = ""
        self.pendingName = ""
        self.pendingPassword = ""
        self.generatedOTP = ""
        self.errorMessage = nil
        self.successMessage = "Signed out successfully."
        AppStore.shared.proTier = .none
    }

    // MARK: - Sign In Flow (Email + Password)

    public func signIn(email: String, password: String) async -> Bool {
        let cleanEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleanEmail.isEmpty, !password.isEmpty else {
            self.errorMessage = "Please enter both email and password."
            return false
        }

        self.isBusy = true
        self.errorMessage = nil
        self.successMessage = nil
        defer { self.isBusy = false }

        let urlString = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=\(apiKey)"
        guard let url = URL(string: urlString) else {
            self.errorMessage = "Invalid auth endpoint."
            return false
        }

        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let payload: [String: Any] = [
            "email": cleanEmail,
            "password": password,
            "returnSecureToken": true
        ]

        guard let bodyData = try? JSONSerialization.data(withJSONObject: payload) else {
            self.errorMessage = "Failed to serialize sign-in payload."
            return false
        }
        req.httpBody = bodyData

        do {
            let (data, response) = try await URLSession.shared.data(for: req)
            guard let httpResponse = response as? HTTPURLResponse else {
                self.errorMessage = "No response from auth server."
                return false
            }

            guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                self.errorMessage = "Failed to parse auth response."
                return false
            }

            if httpResponse.statusCode != 200 {
                let errorObj = json["error"] as? [String: Any]
                let msg = errorObj?["message"] as? String ?? "Authentication failed."
                self.errorMessage = mapFirebaseError(msg)
                return false
            }

            let uid = json["localId"] as? String ?? UUID().uuidString
            let idToken = json["idToken"] as? String ?? ""
            let refreshToken = json["refreshToken"] as? String
            let displayName = json["displayName"] as? String ?? cleanEmail.components(separatedBy: "@").first ?? "Explorer"

            let profile = UserProfile(
                id: uid,
                email: cleanEmail,
                name: displayName,
                idToken: idToken,
                refreshToken: refreshToken
            )

            saveSession(profile)
            self.successMessage = "Welcome back, \(displayName)!"
            await syncCloudSession(idToken: idToken, uid: uid)
            return true
        } catch {
            self.errorMessage = error.localizedDescription
            return false
        }
    }

    // MARK: - Sign Up Initiation (Send Email OTP)

    public func initiateSignUp(name: String, email: String, password: String, confirmPassword: String) async -> Bool {
        let cleanName = name.trimmingCharacters(in: .whitespacesAndNewlines)
        let cleanEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)

        guard !cleanName.isEmpty else {
            self.errorMessage = "Please enter your name."
            return false
        }
        guard cleanEmail.contains("@") && cleanEmail.contains(".") else {
            self.errorMessage = "Please enter a valid email address."
            return false
        }
        guard password.count >= 6 else {
            self.errorMessage = "Password must be at least 6 characters."
            return false
        }
        guard password == confirmPassword else {
            self.errorMessage = "Passwords do not match."
            return false
        }

        self.isBusy = true
        self.errorMessage = nil
        self.successMessage = nil

        // Generate secure 6-digit OTP
        let randomCode = String(format: "%06d", Int.random(in: 100000...999999))
        self.generatedOTP = randomCode
        self.otpExpiresAt = Date().addingTimeInterval(600) // 10 minutes
        self.pendingName = cleanName
        self.pendingEmail = cleanEmail
        self.pendingPassword = password

        do {
            // Send OTP email with AuraLoop wordmark
            try await SMTPSender.shared.sendOTP(
                to: cleanEmail,
                otp: randomCode,
                recipientName: cleanName
            )
            self.isBusy = false
            self.isAwaitingOTP = true
            self.successMessage = "Verification code sent to \(cleanEmail)!"
            return true
        } catch {
            self.isBusy = false
            self.errorMessage = "Failed to send verification email: \(error.localizedDescription)"
            return false
        }
    }

    // MARK: - Resend OTP

    public func resendOTP() async -> Bool {
        guard !pendingEmail.isEmpty else { return false }
        self.isBusy = true
        self.errorMessage = nil

        let randomCode = String(format: "%06d", Int.random(in: 100000...999999))
        self.generatedOTP = randomCode
        self.otpExpiresAt = Date().addingTimeInterval(600)

        do {
            try await SMTPSender.shared.sendOTP(
                to: pendingEmail,
                otp: randomCode,
                recipientName: pendingName
            )
            self.isBusy = false
            self.successMessage = "A new verification code was sent to \(pendingEmail)."
            return true
        } catch {
            self.isBusy = false
            self.errorMessage = "Could not resend email: \(error.localizedDescription)"
            return false
        }
    }

    // MARK: - Verify OTP & Create Firebase Account

    public func verifyOTPAndCompleteRegistration(enteredOTP: String) async -> Bool {
        let cleanOTP = enteredOTP.trimmingCharacters(in: .whitespacesAndNewlines)
        guard cleanOTP.count == 6 else {
            self.errorMessage = "Please enter the complete 6-digit code."
            return false
        }

        if let expires = otpExpiresAt, Date() > expires {
            self.errorMessage = "Verification code expired. Please request a new code."
            return false
        }

        guard cleanOTP == generatedOTP else {
            self.errorMessage = "Invalid verification code. Please check your email."
            return false
        }

        // Code matches! Now create the account in Firebase Auth
        self.isBusy = true
        self.errorMessage = nil
        defer { self.isBusy = false }

        let signUpURL = "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=\(apiKey)"
        guard let url = URL(string: signUpURL) else {
            self.errorMessage = "Invalid registration endpoint."
            return false
        }

        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let payload: [String: Any] = [
            "email": pendingEmail,
            "password": pendingPassword,
            "returnSecureToken": true
        ]

        guard let bodyData = try? JSONSerialization.data(withJSONObject: payload) else {
            self.errorMessage = "Failed to serialize registration payload."
            return false
        }
        req.httpBody = bodyData

        do {
            let (data, response) = try await URLSession.shared.data(for: req)
            guard let httpResponse = response as? HTTPURLResponse,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                self.errorMessage = "Failed to register account with Firebase."
                return false
            }

            if httpResponse.statusCode != 200 {
                let errorObj = json["error"] as? [String: Any]
                let msg = errorObj?["message"] as? String ?? "Registration failed."
                self.errorMessage = mapFirebaseError(msg)
                return false
            }

            let uid = json["localId"] as? String ?? UUID().uuidString
            let idToken = json["idToken"] as? String ?? ""
            let refreshToken = json["refreshToken"] as? String

            // Update user display name in Firebase Auth
            await updateDisplayName(name: pendingName, idToken: idToken)

            let profile = UserProfile(
                id: uid,
                email: pendingEmail,
                name: pendingName,
                idToken: idToken,
                refreshToken: refreshToken
            )

            saveSession(profile)
            self.isAwaitingOTP = false
            self.successMessage = "Account created! Welcome to AuraLoop, \(pendingName)!"
            await syncCloudSession(idToken: idToken, uid: uid)
            return true
        } catch {
            self.errorMessage = error.localizedDescription
            return false
        }
    }

    private func updateDisplayName(name: String, idToken: String) async {
        guard let url = URL(string: "https://identitytoolkit.googleapis.com/v1/accounts:update?key=\(apiKey)") else { return }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let payload: [String: Any] = [
            "idToken": idToken,
            "displayName": name,
            "returnSecureToken": true
        ]
        req.httpBody = try? JSONSerialization.data(withJSONObject: payload)
        _ = try? await URLSession.shared.data(for: req)
    }

    // MARK: - Cloud Metadata Sync (Pro Tier & Favorites)

    public func syncCloudSession(idToken: String, uid: String) async {
        if let cloud = await fetchCloudData(idToken: idToken, uid: uid) {
            AppStore.shared.applyCloudUserData(cloud)
        } else {
            // Push existing local favorites and tier if any
            await pushCloudData(
                proTier: AppStore.shared.proTier.rawValue,
                utrs: Array(AppStore.shared.verifiedUTRs),
                favorites: Array(AppStore.shared.likedIDs)
            )
        }
    }

    public func pushCloudData(proTier: String?, utrs: [String]?, favorites: [String]?) async {
        guard let user = currentUser, !user.idToken.isEmpty else { return }

        let existing = await fetchCloudData(idToken: user.idToken, uid: user.id) ?? CloudUserData()
        var updated = existing

        if let proTier { updated.proTier = proTier }
        if let utrs {
            var combined = Set(updated.verifiedUTRs ?? [])
            combined.formUnion(utrs)
            updated.verifiedUTRs = Array(combined)
        }
        if let favorites {
            var combined = Set(updated.favorites ?? [])
            combined.formUnion(favorites)
            updated.favorites = Array(combined)
        }
        updated.updatedAt = Date().timeIntervalSince1970

        let payloadString = updated.encodeToPayloadString()
        guard !payloadString.isEmpty else { return }

        // Update Firebase Auth user photoUrl
        await updateProfilePhotoUrl(idToken: user.idToken, photoUrl: payloadString)

        // Also try Firestore if enabled
        await writeToFirestore(uid: user.id, idToken: user.idToken, data: updated)
    }

    public func fetchCloudData(idToken: String, uid: String) async -> CloudUserData? {
        // 1. Try Firebase Auth accounts:lookup
        if let photoUrl = await fetchProfilePhotoUrl(idToken: idToken),
           let decoded = CloudUserData.decode(from: photoUrl) {
            return decoded
        }

        // 2. Fallback to Firestore if available
        if let firestore = await readFromFirestore(uid: uid, idToken: idToken) {
            return firestore
        }

        return nil
    }

    private func updateProfilePhotoUrl(idToken: String, photoUrl: String) async {
        guard let url = URL(string: "https://identitytoolkit.googleapis.com/v1/accounts:update?key=\(apiKey)") else { return }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let payload: [String: Any] = [
            "idToken": idToken,
            "photoUrl": photoUrl,
            "returnSecureToken": true
        ]
        req.httpBody = try? JSONSerialization.data(withJSONObject: payload)
        _ = try? await URLSession.shared.data(for: req)
    }

    private func fetchProfilePhotoUrl(idToken: String) async -> String? {
        guard let url = URL(string: "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=\(apiKey)") else { return nil }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let payload: [String: Any] = ["idToken": idToken]
        guard let body = try? JSONSerialization.data(withJSONObject: payload) else { return nil }
        req.httpBody = body

        guard let (data, resp) = try? await URLSession.shared.data(for: req),
              let http = resp as? HTTPURLResponse, http.statusCode == 200,
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let users = json["users"] as? [[String: Any]],
              let first = users.first else {
            return nil
        }
        return first["photoUrl"] as? String
    }

    private func writeToFirestore(uid: String, idToken: String, data: CloudUserData) async {
        guard let url = URL(string: "https://firestore.googleapis.com/v1/projects/\(projectId)/databases/(default)/documents/users/\(uid)?key=\(apiKey)") else { return }
        var req = URLRequest(url: url)
        req.httpMethod = "PATCH"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("Bearer \(idToken)", forHTTPHeaderField: "Authorization")

        var fields: [String: Any] = [:]
        if let tier = data.proTier {
            fields["proTier"] = ["stringValue": tier]
        }
        if let utrs = data.verifiedUTRs {
            fields["verifiedUTRs"] = ["arrayValue": ["values": utrs.map { ["stringValue": $0] }]]
        }
        if let favs = data.favorites {
            fields["favorites"] = ["arrayValue": ["values": favs.map { ["stringValue": $0] }]]
        }
        if let updated = data.updatedAt {
            fields["updatedAt"] = ["doubleValue": updated]
        }

        let body: [String: Any] = ["fields": fields]
        req.httpBody = try? JSONSerialization.data(withJSONObject: body)
        _ = try? await URLSession.shared.data(for: req)
    }

    private func readFromFirestore(uid: String, idToken: String) async -> CloudUserData? {
        guard let url = URL(string: "https://firestore.googleapis.com/v1/projects/\(projectId)/databases/(default)/documents/users/\(uid)?key=\(apiKey)") else { return nil }
        var req = URLRequest(url: url)
        req.httpMethod = "GET"
        req.setValue("Bearer \(idToken)", forHTTPHeaderField: "Authorization")

        guard let (data, resp) = try? await URLSession.shared.data(for: req),
              let http = resp as? HTTPURLResponse, http.statusCode == 200,
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let fields = json["fields"] as? [String: Any] else {
            return nil
        }

        let tier = (fields["proTier"] as? [String: Any])?["stringValue"] as? String
        let utrObj = (fields["verifiedUTRs"] as? [String: Any])?["arrayValue"] as? [String: Any]
        let utrList = (utrObj?["values"] as? [[String: Any]])?.compactMap { $0["stringValue"] as? String }
        let favObj = (fields["favorites"] as? [String: Any])?["arrayValue"] as? [String: Any]
        let favList = (favObj?["values"] as? [[String: Any]])?.compactMap { $0["stringValue"] as? String }

        return CloudUserData(proTier: tier, verifiedUTRs: utrList, favorites: favList)
    }

    // MARK: - Error Mapping

    private func mapFirebaseError(_ code: String) -> String {
        switch code {
        case "EMAIL_EXISTS":
            return "An account with this email already exists. Please Sign In."
        case "OPERATION_NOT_ALLOWED":
            return "Email/Password sign-in is not enabled in Firebase Console."
        case "TOO_MANY_ATTEMPTS_TRY_LATER":
            return "Too many failed attempts. Please try again later."
        case "EMAIL_NOT_FOUND", "INVALID_PASSWORD", "INVALID_LOGIN_CREDENTIALS":
            return "Invalid email or password. Please verify and try again."
        case "USER_DISABLED":
            return "This user account has been disabled."
        default:
            return code.replacingOccurrences(of: "_", with: " ").capitalized
        }
    }
}
