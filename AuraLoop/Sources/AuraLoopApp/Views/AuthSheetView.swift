import SwiftUI
import AuraLoopKit

/// AuraLoop Native Authentication Sheet (Sign In, Sign Up, and Telegram-style OTP Verification)
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

    // Focus state and verification state for Telegram-style OTP
    @FocusState private var isOtpFieldFocused: Bool
    @State private var isOtpVerifiedSuccess = false

    // Alerts
    @State private var showAlert = false
    @State private var alertTitle = ""
    @State private var alertMessage = ""

    public init() {}

    private var sheetHeight: CGFloat {
        if auth.isAwaitingOTP {
            return 420
        } else if selectedTab == .signIn {
            return 390
        } else {
            return 510
        }
    }

    public var body: some View {
        VStack(spacing: 0) {
            topBar
                .padding(.horizontal, 30)
                .padding(.top, 24)
                .padding(.bottom, 14)

            if !auth.isAwaitingOTP {
                tabPicker
                    .padding(.horizontal, 30)
                    .padding(.bottom, 18)
            }

            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    if auth.isAwaitingOTP {
                        otpVerificationView
                    } else if selectedTab == .signIn {
                        signInForm
                    } else {
                        signUpForm
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
                        .padding(.vertical, 8)
                        .background(Color(hex: 0xFF5C5C).opacity(0.12))
                        .cornerRadius(9)
                        .padding(.top, 14)
                        .transition(.opacity.combined(with: .scale(scale: 0.96)))
                    }
                }
                .padding(.horizontal, 30)
                .padding(.bottom, 22)
            }
        }
        .frame(width: 470, height: sheetHeight)
        .sheetSurface()
        .AuraLoopColorScheme()
        .animation(.spring(response: 0.35, dampingFraction: 0.85), value: selectedTab)
        .animation(.spring(response: 0.35, dampingFraction: 0.85), value: auth.isAwaitingOTP)
        .animation(.spring(response: 0.35, dampingFraction: 0.85), value: sheetHeight)
        .animation(.easeInOut(duration: 0.2), value: auth.errorMessage)
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
                Image(systemName: "xmark")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(Color.AuraLoopInk.opacity(0.7))
                    .glassCircleChrome(diameter: 28)
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
                        .padding(.vertical, 7)
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
        VStack(spacing: 14) {
            Text("Sign in to sync your favorites and settings across devices.")
                .font(.system(size: 12.5))
                .foregroundStyle(Color.AuraLoopInk.opacity(0.6))
                .multilineTextAlignment(.center)
                .padding(.bottom, 2)

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
            .padding(.top, 4)
        }
    }

    // MARK: - Sign Up Form

    private var signUpForm: some View {
        VStack(spacing: 14) {
            Text("Create an account to backup wallpapers and sync across Macs.")
                .font(.system(size: 12.5))
                .foregroundStyle(Color.AuraLoopInk.opacity(0.6))
                .multilineTextAlignment(.center)
                .padding(.bottom, 2)

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
                    otpCode = ""
                    isOtpVerifiedSuccess = false
                    _ = await auth.initiateSignUp(
                        name: name,
                        email: email,
                        password: password,
                        confirmPassword: confirmPassword
                    )
                }
            }
            .padding(.top, 4)
        }
    }

    // MARK: - Telegram-Style OTP Verification View

    private var otpVerificationView: some View {
        VStack(spacing: 18) {
            VStack(spacing: 6) {
                Image(systemName: "envelope.fill")
                    .font(.system(size: 26))
                    .foregroundStyle(Color.AuraLoopInk.opacity(0.85))
                    .padding(.bottom, 2)

                Text("Check Your Email")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(Color.AuraLoopInk)

                HStack(spacing: 4) {
                    Text("We sent a 6-digit code to")
                        .foregroundStyle(Color.AuraLoopInk.opacity(0.6))
                    Text(auth.pendingEmail)
                        .foregroundStyle(Color.AuraLoopInk)
                        .fontWeight(.semibold)
                }
                .font(.system(size: 12.5))
                .multilineTextAlignment(.center)
            }

            // Telegram-style 6 individual digit boxes (clean without focus line)
            telegramOtpInput

            // Button matching the exact width of the OTP boxes (326pt)
            primaryButton(title: "Verify & Create Account", isBusy: auth.isBusy, width: 326) {
                submitOTP()
            }

            HStack(spacing: 14) {
                Button {
                    Task { _ = await auth.resendOTP() }
                } label: {
                    Text("Resend Code")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(Color.AuraLoopInk.opacity(0.75))
                }
                .buttonStyle(.plain)
                .pointingCursor()

                Text("·")
                    .foregroundStyle(Color.AuraLoopInk.opacity(0.25))

                Button {
                    auth.isAwaitingOTP = false
                    auth.errorMessage = nil
                    auth.successMessage = nil
                    otpCode = ""
                    isOtpVerifiedSuccess = false
                } label: {
                    Text("Change Email")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(Color.AuraLoopInk.opacity(0.55))
                }
                .buttonStyle(.plain)
                .pointingCursor()
            }
            .padding(.top, 2)
        }
        .onAppear {
            isOtpVerifiedSuccess = false
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                isOtpFieldFocused = true
            }
        }
    }

    private func submitOTP() {
        guard otpCode.count == 6 else { return }
        Task {
            let ok = await auth.verifyOTPAndCompleteRegistration(enteredOTP: otpCode)
            if ok {
                withAnimation(.easeInOut(duration: 0.25)) {
                    isOtpVerifiedSuccess = true
                }
                try? await Task.sleep(nanoseconds: 650_000_000)
                dismiss()
            }
        }
    }

    // MARK: - Telegram-Style 6-Box Input Component

    private var telegramOtpInput: some View {
        HStack(spacing: 10) {
            ForEach(0..<6, id: \.self) { index in
                let digit = index < otpCode.count ? String(Array(otpCode)[index]) : ""
                let isActive = (index == otpCode.count) && isOtpFieldFocused && !isOtpVerifiedSuccess
                let hasError = auth.errorMessage != nil

                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(
                            hasError ? Color(hex: 0xFF5C5C).opacity(0.12) :
                            isOtpVerifiedSuccess ? Color(hex: 0x4EBA6F).opacity(0.12) :
                            isActive ? Color.white.opacity(Appearance.shared.isLight ? 0.75 : 0.08) :
                            Color.white.opacity(Appearance.shared.isLight ? 0.5 : 0.04)
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(
                                    hasError ? Color(hex: 0xFF5C5C) :
                                    isOtpVerifiedSuccess ? Color(hex: 0x4EBA6F) :
                                    isActive ? Color.AuraLoopInk :
                                    (index < otpCode.count ? Color.AuraLoopInk.opacity(0.35) : Color.AuraLoopInk.opacity(0.12)),
                                    lineWidth: (isActive || hasError || isOtpVerifiedSuccess) ? 1.6 : 1
                                )
                        )

                    if !digit.isEmpty {
                        Text(digit)
                            .font(.system(size: 24, weight: .bold, design: .rounded))
                            .foregroundStyle(
                                hasError ? Color(hex: 0xFF5C5C) :
                                isOtpVerifiedSuccess ? Color(hex: 0x4EBA6F) :
                                Color.AuraLoopInk
                            )
                            .transition(.scale.combined(with: .opacity))
                    } else if isActive {
                        BlinkingCursor(color: Color.AuraLoopInk.opacity(0.7))
                    }
                }
                .frame(width: 46, height: 54)
            }
        }
        .contentShape(Rectangle())
        .onTapGesture {
            isOtpFieldFocused = true
        }
        .background(
            TextField("", text: $otpCode)
                .textFieldStyle(.plain)
                .font(.system(size: 1))
                .frame(width: 1, height: 1)
                .opacity(0.001)
                .focused($isOtpFieldFocused)
                .onChange(of: otpCode) { _, newValue in
                    let filtered = newValue.filter { $0.isNumber }
                    if filtered.count > 6 {
                        otpCode = String(filtered.prefix(6))
                    } else {
                        otpCode = filtered
                    }
                    if auth.errorMessage != nil {
                        auth.errorMessage = nil
                    }
                    if otpCode.count == 6 {
                        submitOTP()
                    }
                }
        )
        .frame(width: 326, height: 56)
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
        .padding(.vertical, 11)
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
        .padding(.vertical, 11)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.white.opacity(Appearance.shared.isLight ? 0.6 : 0.06))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.AuraLoopInk.opacity(0.12), lineWidth: 1)
                )
        )
    }

    private func primaryButton(title: String, isBusy: Bool, width: CGFloat? = nil, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if isBusy {
                    ProgressView()
                        .progressViewStyle(.circular)
                        .controlSize(.small)
                        .tint(Color.AuraLoopOnInk)
                }
                Text(title)
                    .font(.system(size: 13.5, weight: .semibold))
                    .foregroundStyle(Color.AuraLoopOnInk)
            }
            .frame(maxWidth: width ?? .infinity)
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

// MARK: - Telegram-Style Blinking Cursor

private struct BlinkingCursor: View {
    @State private var visible = true
    var color: Color

    var body: some View {
        RoundedRectangle(cornerRadius: 1)
            .fill(color)
            .frame(width: 2, height: 22)
            .opacity(visible ? 1 : 0)
            .onAppear {
                withAnimation(.easeInOut(duration: 0.6).repeatForever()) {
                    visible.toggle()
                }
            }
    }
}
