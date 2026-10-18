import SwiftUI
import AuraLoopKit

/// AuraLoop Native Authentication Sheet (Clean Sign In only — registrations on website)
public struct AuthSheetView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject private var auth = AuthService.shared

    // Form fields
    @State private var email = ""
    @State private var password = ""
    @State private var showPassword = false

    public init() {}

    public var body: some View {
        VStack(spacing: 0) {
            topBar
                .padding(.horizontal, 26)
                .padding(.top, 22)
                .padding(.bottom, 12)

            ScrollView(showsIndicators: false) {
                VStack(spacing: 20) {
                    if let user = auth.currentUser {
                        signedInView(user: user)
                    } else {
                        signInForm
                    }

                    if let err = auth.errorMessage {
                        HStack(spacing: 8) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundStyle(Color(hex: 0xFF5C5C))
                                .font(.system(size: 13))
                            Text(err)
                                .font(.system(size: 12, weight: .medium))
                                .foregroundStyle(Color(hex: 0xFF5C5C))
                                .multilineTextAlignment(.leading)
                        }
                        .padding(.horizontal, 14)
                        .padding(.vertical, 9)
                        .background(Color(hex: 0xFF5C5C).opacity(0.12))
                        .cornerRadius(10)
                        .transition(.opacity.combined(with: .scale(scale: 0.96)))
                    }

                    if let success = auth.successMessage {
                        HStack(spacing: 8) {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(Color(hex: 0x4ADE80))
                                .font(.system(size: 13))
                            Text(success)
                                .font(.system(size: 12, weight: .medium))
                                .foregroundStyle(Color(hex: 0x4ADE80))
                        }
                        .padding(.horizontal, 14)
                        .padding(.vertical, 9)
                        .background(Color(hex: 0x4ADE80).opacity(0.12))
                        .cornerRadius(10)
                        .transition(.opacity.combined(with: .scale(scale: 0.96)))
                    }
                }
                .padding(.horizontal, 26)
                .padding(.bottom, 24)
            }
        }
        .frame(width: 440, height: auth.currentUser != nil ? 310 : 380)
        .sheetSurface(cornerRadius: 24)
        .AuraLoopColorScheme()
        .animation(.easeInOut(duration: 0.2), value: auth.currentUser)
        .animation(.easeInOut(duration: 0.2), value: auth.errorMessage)
    }

    // MARK: - Top Bar

    private var topBar: some View {
        HStack {
            HStack(spacing: 9) {
                AuraLoopAppIcon()
                    .frame(width: 26, height: 26)
                AuraLoopWordmark(color: Color.AuraLoopInk)
                    .frame(height: 17)
            }

            Spacer()

            Button {
                auth.errorMessage = nil
                auth.successMessage = nil
                dismiss()
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(Color.AuraLoopInk.opacity(0.85))
                    .glassCircleChrome()
            }
            .buttonStyle(.plain)
            .keyboardShortcut(.cancelAction)
            .pointingCursor()
        }
    }

    // MARK: - Sign In Form

    private var signInForm: some View {
        VStack(spacing: 16) {
            VStack(spacing: 4) {
                Text("Sign In to AuraLoop")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(Color.AuraLoopInk)

                Text("Enter the email & password from your AuraLoop account")
                    .font(.system(size: 12))
                    .foregroundStyle(Color.AuraLoopSecondary)
                    .multilineTextAlignment(.center)
            }
            .padding(.top, 4)

            VStack(spacing: 12) {
                // Email field
                HStack(spacing: 10) {
                    Image(systemName: "envelope.fill")
                        .font(.system(size: 12))
                        .foregroundStyle(Color.AuraLoopSecondary)
                        .frame(width: 18)

                    TextField("Email Address", text: $email)
                        .textFieldStyle(.plain)
                        .font(.system(size: 13))
                        .foregroundStyle(Color.AuraLoopInk)
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(Color.AuraLoopInk.opacity(0.05))
                .cornerRadius(12)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .strokeBorder(Color.AuraLoopInk.opacity(0.12), lineWidth: 1)
                )

                // Password field
                HStack(spacing: 10) {
                    Image(systemName: "lock.fill")
                        .font(.system(size: 12))
                        .foregroundStyle(Color.AuraLoopSecondary)
                        .frame(width: 18)

                    if showPassword {
                        TextField("Password", text: $password)
                            .textFieldStyle(.plain)
                            .font(.system(size: 13))
                            .foregroundStyle(Color.AuraLoopInk)
                    } else {
                        SecureField("Password", text: $password)
                            .textFieldStyle(.plain)
                            .font(.system(size: 13))
                            .foregroundStyle(Color.AuraLoopInk)
                    }

                    Button {
                        showPassword.toggle()
                    } label: {
                        Image(systemName: showPassword ? "eye.slash.fill" : "eye.fill")
                            .font(.system(size: 12))
                            .foregroundStyle(Color.AuraLoopSecondary)
                    }
                    .buttonStyle(.plain)
                    .pointingCursor()
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(Color.AuraLoopInk.opacity(0.05))
                .cornerRadius(12)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .strokeBorder(Color.AuraLoopInk.opacity(0.12), lineWidth: 1)
                )
            }

            // Submit Button
            Button {
                Task {
                    let success = await auth.signIn(email: email, password: password)
                    if success {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
                            dismiss()
                        }
                    }
                }
            } label: {
                HStack(spacing: 8) {
                    if auth.isBusy {
                        ProgressView()
                            .controlSize(.small)
                            .tint(Color.AuraLoopOnInk)
                    }
                    Text(auth.isBusy ? "Signing In…" : "Sign In")
                        .font(.system(size: 13.5, weight: .semibold))
                }
                .foregroundStyle(Color.AuraLoopOnInk)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 11)
                .background(Color.AuraLoopInk)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
            .buttonStyle(.plain)
            .disabled(auth.isBusy || email.isEmpty || password.isEmpty)
            .opacity(email.isEmpty || password.isEmpty ? 0.6 : 1)
            .pointingCursor()

            // Footer: Register on Website
            HStack(spacing: 5) {
                Text("Don't have an account?")
                    .font(.system(size: 12))
                    .foregroundStyle(Color.AuraLoopSecondary)

                Button {
                    AuraLoopWebLink.open(action: "signup")
                } label: {
                    Text("Register on Website ↗")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(Color(hex: 0x818CF8))
                }
                .buttonStyle(.plain)
                .pointingCursor()
            }
            .padding(.top, 4)
        }
    }

    // MARK: - Signed In View

    private func signedInView(user: UserProfile) -> some View {
        VStack(spacing: 16) {
            HStack(spacing: 14) {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [Color(hex: 0x818CF8), Color(hex: 0x6366F1)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 44, height: 44)

                    Text(String(user.name.prefix(1)).uppercased())
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(.white)
                }

                VStack(alignment: .leading, spacing: 3) {
                    HStack(spacing: 6) {
                        Text(user.name)
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(Color.AuraLoopInk)

                        if AppStore.shared.proTier != .none {
                            Text(AppStore.shared.proTier.badgeText)
                                .font(.system(size: 9, weight: .bold))
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color(hex: 0xF59E0B).opacity(0.18))
                                .foregroundStyle(Color(hex: 0xF59E0B))
                                .clipShape(Capsule())
                        }
                    }

                    Text(user.email)
                        .font(.system(size: 12))
                        .foregroundStyle(Color.AuraLoopSecondary)
                }

                Spacer()
            }
            .padding(14)
            .background(Color.AuraLoopInk.opacity(0.04))
            .cornerRadius(14)

            HStack(spacing: 12) {
                Button {
                    Task {
                        await auth.syncCloudSession(idToken: user.idToken, uid: user.id)
                    }
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "arrow.clockwise")
                            .font(.system(size: 11))
                        Text("Sync Account")
                            .font(.system(size: 12, weight: .medium))
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(Color.AuraLoopInk.opacity(0.08))
                    .clipShape(Capsule())
                }
                .buttonStyle(.plain)
                .pointingCursor()

                Spacer()

                Button {
                    auth.signOut()
                } label: {
                    Text("Sign Out")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(Color(hex: 0xFF5C5C))
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(Color(hex: 0xFF5C5C).opacity(0.12))
                        .clipShape(Capsule())
                }
                .buttonStyle(.plain)
                .pointingCursor()
            }
        }
        .padding(.top, 6)
    }
}
