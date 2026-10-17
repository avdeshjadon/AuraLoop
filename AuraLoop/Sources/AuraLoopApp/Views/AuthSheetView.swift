import SwiftUI
import AuraLoopKit

/// AuraLoop Native Authentication Sheet (Sign In, Sign Up, and Email OTP Verification)
public struct AuthSheetView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject private var auth = AuthService.shared

    public enum Tab: String, CaseIterable, Identifiable {
        case signIn = "Sign In"
        case signUp = "Sign Up"
        public var id: String { rawValue }
    }

    @State private var selectedTab: Tab = .signIn

    // Form fields
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var otpCode = ""

    // Visibility toggles
    @State private var showPassword = false
    @State private var showConfirmPassword = false

    // Alerts
    @State private var showAlert = false
    @State private var alertTitle = ""
    @State private var alertMessage = ""

    public init() {}

    public var body: some View {
        ZStack {
            VisualEffectBackground(material: Appearance.shared.isLight ? .popover : .hudWindow)
                .overlay(Color.AuraLoopShade.opacity(0.35))
                .ignoresSafeArea()

            VStack(spacing: 0) {
                topBar
                    .padding(.bottom, 20)

                if auth.isAwaitingOTP {
                    otpVerificationView
                } else {
                    tabPicker
                        .padding(.bottom, 24)

                    if selectedTab == .signIn {
                        signInForm
                    } else {
                        signUpForm
                    }
                }

                if let err = auth.errorMessage {
                    HStack(spacing: 8) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundStyle(Color(hex: 0xFF6B6B))
                            .font(.system(size: 13))
                        Text(err)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(Color(hex: 0xFF6B6B))
                            .multilineTextAlignment(.leading)
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 9)
                    .background(Color(hex: 0xFF6B6B).opacity(0.12))
                    .cornerRadius(10)
                    .padding(.top, 16)
                    .transition(.opacity.combined(with: .scale(scale: 0.96)))
                }

                if let success = auth.successMessage {
                    HStack(spacing: 8) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(Color(hex: 0x4EBA6F))
                            .font(.system(size: 13))
                        Text(success)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(Color(hex: 0x4EBA6F))
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 9)
                    .background(Color(hex: 0x4EBA6F).opacity(0.12))
                    .cornerRadius(10)
                    .padding(.top, 16)
                    .transition(.opacity)
                }
            }
            .padding(32)
            .frame(width: 440)
        }
        .animation(.easeInOut(duration: 0.22), value: selectedTab)
        .animation(.easeInOut(duration: 0.22), value: auth.isAwaitingOTP)
        .animation(.easeInOut(duration: 0.2), value: auth.errorMessage)
        .animation(.easeInOut(duration: 0.2), value: auth.successMessage)
        .alert(alertTitle, isPresented: $showAlert) {
            Button("OK", role: .cancel) { }
        } message: {
            Text(alertMessage)
        }
    }

    // MARK: - Header & Top Bar

    private var topBar: some View {
        HStack {
            HStack(spacing: 10) {
                AuraLoopAppIcon()
                    .frame(width: 28, height: 28)
                AuraLoopWordmark(color: Color.AuraLoopInk)
                    .frame(height: 18)
            }

            Spacer()

            Button {
                auth.errorMessage = nil
                auth.successMessage = nil
                dismiss()
            } label: {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 18))
                    .foregroundStyle(Color.AuraLoopInk.opacity(0.45))
            }
            .buttonStyle(.plain)
            .pointingCursor()
        }
    }

    // MARK: - Tab Picker (Sign In / Sign Up)

    private var tabPicker: some View {
        HStack(spacing: 4) {
            ForEach(Tab.allCases) { tab in
                let isSelected = selectedTab == tab
                Button {
                    auth.errorMessage = nil
                    auth.successMessage = nil
                    withAnimation(.easeInOut(duration: 0.18)) {
                        selectedTab = tab
                    }
                } label: {
                    Text(tab.rawValue)
                        .font(.system(size: 13, weight: isSelected ? .semibold : .medium))
                        .foregroundStyle(isSelected ? Color.AuraLoopOnInk : Color.AuraLoopInk.opacity(0.75))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background {
                            if isSelected {
                                Capsule()
                                    .fill(Color.AuraLoopInk)
                            }
                        }
                        .contentShape(Capsule())
                }
                .buttonStyle(.plain)
                .pointingCursor()
            }
        }
        .padding(4)
        .glassCapsule(fill: 0.08, stroke: 0.14)
    }

    // MARK: - Sign In Form

    private var signInForm: some View {
        VStack(spacing: 16) {
            inputField(
                icon: "envelope.fill",
                placeholder: "Email address",
                text: $email
            )

            passwordField(
                placeholder: "Password",
                text: $password,
                showPassword: $showPassword
            )

            primaryButton(title: "Sign In", isBusy: auth.isBusy) {
                Task {
                    let success = await auth.signIn(email: email, password: password)
                    if success {
                        dismiss()
                    }
                }
            }
            .padding(.top, 6)
        }
    }

    // MARK: - Sign Up Form

    private var signUpForm: some View {
        VStack(spacing: 16) {
            inputField(
                icon: "person.fill",
                placeholder: "Full name",
                text: $name
            )

            inputField(
                icon: "envelope.fill",
                placeholder: "Email address",
                text: $email
            )

            passwordField(
                placeholder: "Password (min. 6 characters)",
                text: $password,
                showPassword: $showPassword
            )

            passwordField(
                placeholder: "Confirm password",
                text: $confirmPassword,
                showPassword: $showConfirmPassword
            )

            primaryButton(title: "Send Verification Code", isBusy: auth.isBusy) {
                Task {
                    _ = await auth.initiateSignUp(
                        name: name,
                        email: email,
                        password: password,
                        confirmPassword: confirmPassword
                    )
                }
            }
            .padding(.top, 6)
        }
    }

    // MARK: - OTP Verification View

    private var otpVerificationView: some View {
        VStack(spacing: 18) {
            VStack(spacing: 8) {
                Image(systemName: "envelope.badge.shield.half.filled")
                    .font(.system(size: 40))
                    .foregroundStyle(Color(hex: 0xC084FC))
                    .padding(.bottom, 4)

                Text("Check Your Email")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(Color.AuraLoopInk)

                Text("We sent a 6-digit verification code to\n\(auth.pendingEmail)")
                    .font(.system(size: 13))
                    .foregroundStyle(Color.AuraLoopInk.opacity(0.65))
                    .multilineTextAlignment(.center)
            }

            // Monospaced 6-digit OTP input
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.black.opacity(0.3))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color(hex: 0xC084FC).opacity(0.4), lineWidth: 1.5)
                    )

                TextField("000000", text: $otpCode)
                    .font(.system(size: 32, weight: .bold, design: .monospaced))
                    .multilineTextAlignment(.center)
                    .textFieldStyle(.plain)
                    .foregroundStyle(Color.AuraLoopInk)
                    .padding(.vertical, 14)
                    .onChange(of: otpCode) { _, newValue in
                        let filtered = newValue.filter { $0.isNumber }
                        if filtered.count > 6 {
                            otpCode = String(filtered.prefix(6))
                        } else {
                            otpCode = filtered
                        }
                    }
            }
            .frame(height: 64)
            .padding(.horizontal, 20)

            primaryButton(title: "Verify & Create Account", isBusy: auth.isBusy) {
                Task {
                    let ok = await auth.verifyOTPAndCompleteRegistration(enteredOTP: otpCode)
                    if ok {
                        dismiss()
                    }
                }
            }

            HStack(spacing: 16) {
                Button {
                    Task { _ = await auth.resendOTP() }
                } label: {
                    Text("Resend Code")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(Color(hex: 0xC084FC))
                }
                .buttonStyle(.plain)
                .pointingCursor()

                Text("·")
                    .foregroundStyle(Color.AuraLoopInk.opacity(0.3))

                Button {
                    auth.isAwaitingOTP = false
                    auth.errorMessage = nil
                } label: {
                    Text("Change Email")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(Color.AuraLoopInk.opacity(0.65))
                }
                .buttonStyle(.plain)
                .pointingCursor()
            }
            .padding(.top, 4)
        }
    }

    // MARK: - Helpers & Form Controls

    private func inputField(icon: String, placeholder: String, text: Binding<String>) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundStyle(Color.AuraLoopInk.opacity(0.5))
                .frame(width: 18)

            TextField(placeholder, text: text)
                .textFieldStyle(.plain)
                .font(.system(size: 13))
                .foregroundStyle(Color.AuraLoopInk)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.white.opacity(Appearance.shared.isLight ? 0.6 : 0.06))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.AuraLoopInk.opacity(0.12), lineWidth: 1)
                )
        )
    }

    private func passwordField(placeholder: String, text: Binding<String>, showPassword: Binding<Bool>) -> some View {
        HStack(spacing: 12) {
            Image(systemName: "lock.fill")
                .font(.system(size: 14))
                .foregroundStyle(Color.AuraLoopInk.opacity(0.5))
                .frame(width: 18)

            if showPassword.wrappedValue {
                TextField(placeholder, text: text)
                    .textFieldStyle(.plain)
                    .font(.system(size: 13))
                    .foregroundStyle(Color.AuraLoopInk)
            } else {
                SecureField(placeholder, text: text)
                    .textFieldStyle(.plain)
                    .font(.system(size: 13))
                    .foregroundStyle(Color.AuraLoopInk)
            }

            Button {
                showPassword.wrappedValue.toggle()
            } label: {
                Image(systemName: showPassword.wrappedValue ? "eye.slash.fill" : "eye.fill")
                    .font(.system(size: 14))
                    .foregroundStyle(Color.AuraLoopInk.opacity(0.55))
            }
            .buttonStyle(.plain)
            .pointingCursor()
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.white.opacity(Appearance.shared.isLight ? 0.6 : 0.06))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.AuraLoopInk.opacity(0.12), lineWidth: 1)
                )
        )
    }

    private func primaryButton(title: String, isBusy: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if isBusy {
                    ProgressView()
                        .progressViewStyle(.circular)
                        .controlSize(.small)
                        .tint(Color.AuraLoopOnInk)
                }
                Text(title)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Color.AuraLoopOnInk)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(
                Capsule()
                    .fill(Color.AuraLoopInk)
            )
            .contentShape(Capsule())
        }
        .buttonStyle(.plain)
        .disabled(isBusy)
        .pointingCursor()
    }
}
