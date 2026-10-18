import SwiftUI
import AuraLoopKit
import AppKit

/// AuraLoop Pro Upgrade Sheet
/// Minimalist design: Directs user to Sign In or Visit Website for Upgradation
public struct ProUpgradeSheet: View {
    @EnvironmentObject var store: AppStore
    @Environment(\.dismiss) private var dismiss
    @ObservedObject private var auth = AuthService.shared

    @State private var isRefreshing = false
    @State private var refreshNotice: String?

    public init() {}

    public var body: some View {
        VStack(spacing: 0) {
            topBar
                .padding(.horizontal, 28)
                .padding(.top, 24)
                .padding(.bottom, 16)

            ScrollView(.vertical, showsIndicators: false) {
                VStack(spacing: 22) {
                    if !auth.isAuthenticated {
                        // User not logged in
                        unauthenticatedView
                    } else if store.proTier == .none {
                        // User logged in, but on free tier
                        upgradePromptView
                    } else {
                        // User is Pro
                        alreadyProView
                    }

                    if let notice = refreshNotice {
                        Text(notice)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(Color(hex: 0x4ADE80))
                            .padding(.horizontal, 14)
                            .padding(.vertical, 7)
                            .background(Color(hex: 0x4ADE80).opacity(0.12))
                            .clipShape(Capsule())
                            .transition(.opacity)
                    }
                }
                .padding(.horizontal, 28)
                .padding(.bottom, 26)
            }
        }
        .frame(width: 540, height: auth.isAuthenticated && store.proTier != .none ? 360 : 420)
        .sheetSurface(cornerRadius: 26)
        .AuraLoopColorScheme()
        .animation(.easeInOut(duration: 0.22), value: auth.isAuthenticated)
        .animation(.easeInOut(duration: 0.22), value: store.proTier)
        .onAppear {
            autoSyncStatus()
        }
    }

    private func autoSyncStatus() {
        if let user = auth.currentUser {
            Task {
                await auth.syncCloudSession(idToken: user.idToken, uid: user.id)
            }
        }
    }

    // MARK: - Top Bar

    private var topBar: some View {
        HStack {
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [Color(hex: 0xF59E0B), Color(hex: 0xD97706)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 38, height: 38)
                        .shadow(color: Color(hex: 0xF59E0B).opacity(0.35), radius: 8, x: 0, y: 2)

                    Image(systemName: "crown.fill")
                        .font(.system(size: 17, weight: .bold))
                        .foregroundStyle(.white)
                }

                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 8) {
                        Text("AuraLoop Pro")
                            .font(.system(size: 19, weight: .bold))
                            .foregroundStyle(Color.AuraLoopInk)

                        if store.proTier != .none {
                            Text(store.proTier.badgeText)
                                .font(.system(size: 9.5, weight: .bold))
                                .padding(.horizontal, 7)
                                .padding(.vertical, 2.5)
                                .background(Color(hex: 0xF59E0B).opacity(0.18))
                                .foregroundStyle(Color(hex: 0xF59E0B))
                                .clipShape(Capsule())
                        }
                    }

                    Text("Unlock 1,582+ 4K master quality live wallpapers")
                        .font(.system(size: 12))
                        .foregroundStyle(Color.AuraLoopSecondary)
                }
            }

            Spacer()

            Button {
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

    // MARK: - Case 1: Unauthenticated

    private var unauthenticatedView: some View {
        VStack(spacing: 20) {
            VStack(spacing: 8) {
                Text("Sign in to Access Pro Wallpapers")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(Color.AuraLoopInk)

                Text("Log in with your registered AuraLoop account to sync your Pro status and unlock the entire 4K wallpaper library.")
                    .font(.system(size: 12.5))
                    .foregroundStyle(Color.AuraLoopSecondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 16)
            }
            .padding(.top, 10)

            VStack(spacing: 12) {
                // Button 1: Sign In in App
                Button {
                    dismiss()
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                        store.authSheetOpen = true
                    }
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "lock.fill")
                            .font(.system(size: 12))
                        Text("Sign In with Email & Password")
                            .font(.system(size: 13.5, weight: .semibold))
                    }
                    .foregroundStyle(Color.AuraLoopOnInk)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(Color.AuraLoopInk)
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
                .buttonStyle(.plain)
                .pointingCursor()

                // Button 2: Register on Website
                Button {
                    AuraLoopWebLink.open(action: "signup")
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "safari")
                            .font(.system(size: 12))
                        Text("Create Account on Website ↗")
                            .font(.system(size: 13.5, weight: .semibold))
                    }
                    .foregroundStyle(Color.AuraLoopInk)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(Color.AuraLoopInk.opacity(0.08))
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
                .buttonStyle(.plain)
                .pointingCursor()
            }
        }
    }

    // MARK: - Case 2: Logged in on Free Tier -> Visit Website for Upgradation

    private var upgradePromptView: some View {
        VStack(spacing: 20) {
            if let user = auth.currentUser {
                // Account bar
                HStack(spacing: 12) {
                    Circle()
                        .fill(Color(hex: 0x818CF8).opacity(0.2))
                        .frame(width: 36, height: 36)
                        .overlay(
                            Text(String(user.name.prefix(1)).uppercased())
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(Color(hex: 0x818CF8))
                        )

                    VStack(alignment: .leading, spacing: 2) {
                        Text(user.name)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(Color.AuraLoopInk)
                        Text(user.email)
                            .font(.system(size: 11.5))
                            .foregroundStyle(Color.AuraLoopSecondary)
                    }

                    Spacer()

                    Text("Free Plan")
                        .font(.system(size: 11, weight: .semibold))
                        .padding(.horizontal, 9)
                        .padding(.vertical, 4)
                        .background(Color.AuraLoopInk.opacity(0.06))
                        .clipShape(Capsule())
                }
                .padding(12)
                .background(Color.AuraLoopInk.opacity(0.04))
                .cornerRadius(14)
            }

            VStack(spacing: 8) {
                Text("Visit to Website for Upgradation")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(Color.AuraLoopInk)

                Text("To unlock all 1,582+ 4K ultra-wide wallpapers and audio synchronization, upgrade your membership on our website.")
                    .font(.system(size: 12.5))
                    .foregroundStyle(Color.AuraLoopSecondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 10)
            }

            VStack(spacing: 12) {
                // Primary action: Open Website Upgrade
                Button {
                    AuraLoopWebLink.open(action: "upgrade")
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "crown.fill")
                            .font(.system(size: 13))
                        Text("Visit to Website for Upgradation ↗")
                            .font(.system(size: 14, weight: .bold))
                    }
                    .foregroundStyle(.black)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 13)
                    .background(
                        LinearGradient(
                            colors: [Color(hex: 0xF59E0B), Color(hex: 0xD97706)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .shadow(color: Color(hex: 0xF59E0B).opacity(0.35), radius: 8, x: 0, y: 3)
                }
                .buttonStyle(.plain)
                .pointingCursor()

                // Secondary action: Refresh Pro Status
                Button {
                    if let user = auth.currentUser {
                        isRefreshing = true
                        Task {
                            await auth.syncCloudSession(idToken: user.idToken, uid: user.id)
                            isRefreshing = false
                            if store.proTier != .none {
                                refreshNotice = "✦ Pro membership unlocked!"
                            } else {
                                refreshNotice = "Refreshed. If you just upgraded on the web, please allow a few seconds."
                            }
                            DispatchQueue.main.asyncAfter(deadline: .now() + 4) {
                                refreshNotice = nil
                            }
                        }
                    }
                } label: {
                    HStack(spacing: 6) {
                        if isRefreshing {
                            ProgressView()
                                .controlSize(.small)
                        } else {
                            Image(systemName: "arrow.clockwise")
                                .font(.system(size: 12))
                        }
                        Text("Refresh Pro Status")
                            .font(.system(size: 12.5, weight: .medium))
                    }
                    .foregroundStyle(Color.AuraLoopSecondary)
                    .padding(.vertical, 6)
                }
                .buttonStyle(.plain)
                .disabled(isRefreshing)
                .pointingCursor()
            }
        }
    }

    // MARK: - Case 3: Already Pro

    private var alreadyProView: some View {
        VStack(spacing: 16) {
            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 44))
                .foregroundStyle(
                    LinearGradient(
                        colors: [Color(hex: 0xF59E0B), Color(hex: 0xD97706)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )

            VStack(spacing: 6) {
                Text("✦ Lifetime Pro Active")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(Color.AuraLoopInk)

                if let user = auth.currentUser {
                    Text("All premium wallpapers and 4K features are unlocked for \(user.email).")
                        .font(.system(size: 12.5))
                        .foregroundStyle(Color.AuraLoopSecondary)
                        .multilineTextAlignment(.center)
                }
            }

            Button {
                dismiss()
            } label: {
                Text("Done")
                    .font(.system(size: 13.5, weight: .semibold))
                    .foregroundStyle(Color.AuraLoopOnInk)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 11)
                    .background(Color.AuraLoopInk)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
            .buttonStyle(.plain)
            .pointingCursor()
            .padding(.top, 10)
        }
        .padding(.vertical, 10)
    }
}
