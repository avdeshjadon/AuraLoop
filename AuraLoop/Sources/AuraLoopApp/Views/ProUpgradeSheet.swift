import SwiftUI
import CoreImage
import AuraLoopKit
import AppKit

/// Generates crystal-clear, high-resolution QR codes using macOS CoreImage
enum UPIQRCode {
    static func generate(from string: String, size: CGFloat = 160) -> NSImage? {
        guard let data = string.data(using: .utf8) else { return nil }
        guard let filter = CIFilter(name: "CIQRCodeGenerator") else { return nil }
        filter.setValue(data, forKey: "inputMessage")
        filter.setValue("M", forKey: "inputCorrectionLevel")
        guard let outputImage = filter.outputImage else { return nil }

        let extent = outputImage.extent
        guard extent.width > 0, extent.height > 0 else { return nil }

        let scale = size / extent.width
        let transform = CGAffineTransform(scaleX: scale, y: scale)
        let scaledImage = outputImage.transformed(by: transform)

        let rep = NSCIImageRep(ciImage: scaledImage)
        let nsImage = NSImage(size: NSSize(width: size, height: size))
        nsImage.addRepresentation(rep)
        return nsImage
    }
}

/// The Liquid Glass Pro Upgrade Sheet
public struct ProUpgradeSheet: View {
    @EnvironmentObject var store: AppStore
    @Environment(\.dismiss) private var dismiss

    @State private var selectedTier: ProTier = .lifetime
    @State private var utrInput: String = ""
    @State private var copiedUPI: Bool = false
    @State private var isVerifying: Bool = false
    @State private var errorMessage: String?
    @State private var isSuccess: Bool = false

    private let upiID = "avdeshjadon@ptaxis"

    public init() {}

    private var currentQRString: String {
        let titleParam = selectedTier.title.replacingOccurrences(of: " ", with: "%20")
        return "upi://pay?pa=\(upiID)&pn=AuraLoop&am=\(selectedTier.priceINR)&cu=INR&tn=AuraLoop%20\(titleParam)"
    }

    private var cleanUTR: String {
        utrInput.replacingOccurrences(of: " ", with: "")
            .replacingOccurrences(of: "-", with: "")
    }

    public var body: some View {
        ZStack {
            VStack(spacing: 0) {
                header
                    .padding(.horizontal, 28)
                    .padding(.top, 24)
                    .padding(.bottom, 16)

                ScrollView(.vertical, showsIndicators: false) {
                    VStack(spacing: 20) {
                        tierCardsSection

                        paymentDetailSection

                        utrVerificationSection

                        if let err = errorMessage {
                            HStack(spacing: 8) {
                                Image(systemName: "exclamationmark.circle.fill")
                                    .foregroundStyle(Color(hex: 0xEF4444))
                                    .font(.system(size: 13))
                                Text(err)
                                    .font(.system(size: 12, weight: .medium))
                                    .foregroundStyle(Color(hex: 0xEF4444))
                            }
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(Color(hex: 0xEF4444).opacity(0.12))
                            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                            .transition(.opacity.combined(with: .scale(scale: 0.96)))
                        }
                    }
                    .padding(.horizontal, 28)
                    .padding(.bottom, 26)
                }
            }

            if isSuccess {
                successOverlay
                    .transition(.opacity.combined(with: .scale(scale: 0.95)))
            }
        }
        .frame(width: 680, height: 600)
        .sheetSurface(cornerRadius: 28)
        .AuraLoopColorScheme()
        .animation(.easeInOut(duration: 0.22), value: selectedTier)
        .animation(.easeInOut(duration: 0.2), value: errorMessage)
        .animation(.spring(response: 0.35, dampingFraction: 0.75), value: isSuccess)
        .onAppear {
            if store.proTier == .starter {
                selectedTier = .plus
            } else if store.proTier == .plus {
                selectedTier = .lifetime
            } else if store.proTier == .lifetime {
                selectedTier = .lifetime
            }
        }
    }

    // MARK: - Header

    private var header: some View {
        HStack(alignment: .center) {
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

                    Text("Unlock 4K 60fps master quality live wallpapers · Direct UPI activation")
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

    // MARK: - 3 Tier Cards

    private var tierCardsSection: some View {
        HStack(spacing: 12) {
            tierCard(
                tier: .starter,
                price: "₹129",
                limit: "50 Wallpapers",
                subtitle: "Starter collection in 4K"
            )

            tierCard(
                tier: .plus,
                price: "₹169",
                limit: "100 Wallpapers",
                subtitle: "Expanded library access"
            )

            tierCard(
                tier: .lifetime,
                price: "₹199",
                limit: "Entire Wallpaper Library (300+ Wallpapers)",
                subtitle: "Complete library perpetual pass",
                badge: "BEST VALUE"
            )
        }
    }

    private func tierCard(
        tier: ProTier,
        price: String,
        limit: String,
        subtitle: String,
        badge: String? = nil
    ) -> some View {
        let isSelected = selectedTier == tier
        let isCurrent = store.proTier == tier

        return Button {
            withAnimation(.spring(response: 0.25, dampingFraction: 0.75)) {
                selectedTier = tier
                errorMessage = nil
            }
        } label: {
            VStack(alignment: .leading, spacing: 8) {
                HStack(alignment: .top) {
                    Text(tier.title)
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(Color.AuraLoopInk)

                    Spacer()

                    if let badge {
                        Text(badge)
                            .font(.system(size: 8.5, weight: .heavy))
                            .tracking(0.5)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2.5)
                            .background(
                                LinearGradient(
                                    colors: [Color(hex: 0xF59E0B), Color(hex: 0xD97706)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .foregroundStyle(.white)
                            .clipShape(Capsule())
                    } else if isCurrent {
                        Text("ACTIVE")
                            .font(.system(size: 8.5, weight: .bold))
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2.5)
                            .background(Color(hex: 0x10B981).opacity(0.2))
                            .foregroundStyle(Color(hex: 0x10B981))
                            .clipShape(Capsule())
                    }
                }

                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text(price)
                        .font(.system(size: 22, weight: .heavy, design: .rounded))
                        .foregroundStyle(isSelected ? Color(hex: 0xF59E0B) : Color.AuraLoopInk)

                    Text("one-time")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(Color.AuraLoopSecondary)
                }

                VStack(alignment: .leading, spacing: 3) {
                    Text(limit)
                        .font(.system(size: 11.5, weight: .semibold))
                        .foregroundStyle(isSelected ? Color.AuraLoopInk : Color.AuraLoopInk.opacity(0.85))
                        .lineLimit(2)
                        .fixedSize(horizontal: false, vertical: true)

                    Text(subtitle)
                        .font(.system(size: 10.5))
                        .foregroundStyle(Color.AuraLoopSecondary)
                        .lineLimit(1)
                }
            }
            .padding(14)
            .frame(maxWidth: .infinity, minHeight: 128, alignment: .topLeading)
            .background(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(isSelected
                          ? (Appearance.shared.isLight ? Color(hex: 0xF59E0B).opacity(0.08) : Color(hex: 0xF59E0B).opacity(0.12))
                          : Color.AuraLoopInk.opacity(0.04))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .strokeBorder(
                        isSelected
                            ? Color(hex: 0xF59E0B).opacity(0.85)
                            : Color.AuraLoopInk.opacity(0.12),
                        lineWidth: isSelected ? 1.8 : 1
                    )
            )
            .scaleEffect(isSelected ? 1.02 : 1.0)
            .shadow(color: isSelected ? Color(hex: 0xF59E0B).opacity(0.18) : .clear, radius: 10, x: 0, y: 4)
        }
        .buttonStyle(.plain)
        .pointingCursor()
    }

    // MARK: - Dynamic Payment Box (QR + Steps)

    private var paymentDetailSection: some View {
        HStack(spacing: 20) {
            // High-DPI QR Code Box
            VStack(spacing: 8) {
                ZStack {
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .fill(Color.white)
                        .frame(width: 146, height: 146)
                        .shadow(color: Color.black.opacity(0.08), radius: 8, x: 0, y: 3)

                    if let qrImage = UPIQRCode.generate(from: currentQRString, size: 134) {
                        Image(nsImage: qrImage)
                            .interpolation(.none)
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(width: 134, height: 134)
                    }
                }

                Text("Scan with any UPI App")
                    .font(.system(size: 9.5, weight: .semibold))
                    .foregroundStyle(Color.AuraLoopSecondary)
            }
            .frame(width: 160)

            // Payment Instructions & VPA Copy
            VStack(alignment: .leading, spacing: 12) {
                // UPI Address Pill
                VStack(alignment: .leading, spacing: 4) {
                    Text("UPI ID / VPA")
                        .font(.system(size: 9.5, weight: .bold))
                        .tracking(1.0)
                        .foregroundStyle(Color.AuraLoopSecondary)

                    HStack(spacing: 8) {
                        Text(upiID)
                            .font(.system(size: 13, weight: .semibold, design: .monospaced))
                            .foregroundStyle(Color.AuraLoopInk)

                        Spacer()

                        Button {
                            copyUPI()
                        } label: {
                            HStack(spacing: 4) {
                                Image(systemName: copiedUPI ? "checkmark" : "doc.on.doc")
                                    .font(.system(size: 10, weight: .semibold))
                                Text(copiedUPI ? "Copied" : "Copy")
                                    .font(.system(size: 11, weight: .semibold))
                            }
                            .foregroundStyle(copiedUPI ? Color(hex: 0x10B981) : Color.AuraLoopInk)
                            .padding(.horizontal, 9)
                            .padding(.vertical, 4.5)
                            .background(Color.AuraLoopInk.opacity(0.08))
                            .clipShape(Capsule())
                        }
                        .buttonStyle(.plain)
                        .pointingCursor()
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Color.AuraLoopInk.opacity(0.05))
                    .clipShape(RoundedRectangle(cornerRadius: 11, style: .continuous))
                }

                // 3 Step Guide
                VStack(alignment: .leading, spacing: 6) {
                    stepRow(
                        num: "1",
                        text: "Scan QR or transfer \(priceForSelected) to \(upiID)"
                    )
                    stepRow(
                        num: "2",
                        text: "Open receipt & copy the 12-digit UTR / UPI Ref ID"
                    )
                    stepRow(
                        num: "3",
                        text: "Paste the 12-digit UTR below to unlock instantly"
                    )
                }
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(Color.AuraLoopInk.opacity(0.035))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(Color.AuraLoopInk.opacity(0.09), lineWidth: 1)
        )
    }

    private var priceForSelected: String {
        "₹\(selectedTier.priceINR)"
    }

    private func stepRow(num: String, text: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Text(num)
                .font(.system(size: 9.5, weight: .bold))
                .foregroundStyle(Color(hex: 0xF59E0B))
                .frame(width: 17, height: 17)
                .background(Color(hex: 0xF59E0B).opacity(0.16))
                .clipShape(Circle())

            Text(text)
                .font(.system(size: 11.5))
                .foregroundStyle(Color.AuraLoopInk.opacity(0.85))
                .lineLimit(2)
        }
    }

    // MARK: - UTR Input & Verification Button

    private var utrVerificationSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("ENTER 12-DIGIT UTR / UPI REF ID")
                    .font(.system(size: 10, weight: .bold))
                    .tracking(1.0)
                    .foregroundStyle(Color.AuraLoopSecondary)

                Spacer()

                Text("\(cleanUTR.count)/12 digits")
                    .font(.system(size: 10.5, weight: .semibold, design: .monospaced))
                    .foregroundStyle(cleanUTR.count == 12 ? Color(hex: 0x10B981) : Color.AuraLoopSecondary)
            }

            HStack(spacing: 10) {
                // Input Field
                HStack(spacing: 8) {
                    Image(systemName: "number")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(Color.AuraLoopSecondary)

                    TextField("e.g. 4281 9283 1092", text: $utrInput)
                        .textFieldStyle(.plain)
                        .font(.system(size: 14, weight: .semibold, design: .monospaced))
                        .foregroundStyle(Color.AuraLoopInk)
                        .onChange(of: utrInput) { _, newValue in
                            formatUTRInput(newValue)
                        }

                    if !utrInput.isEmpty {
                        Button {
                            utrInput = ""
                            errorMessage = nil
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .font(.system(size: 13))
                                .foregroundStyle(Color.AuraLoopSecondary)
                        }
                        .buttonStyle(.plain)
                    }

                    Button {
                        pasteFromClipboard()
                    } label: {
                        Text("Paste")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(Color(hex: 0xF59E0B))
                            .padding(.horizontal, 9)
                            .padding(.vertical, 4)
                            .background(Color(hex: 0xF59E0B).opacity(0.12))
                            .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                    .pointingCursor()
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(Color.AuraLoopInk.opacity(0.06))
                .clipShape(RoundedRectangle(cornerRadius: 13, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 13, style: .continuous)
                        .strokeBorder(
                            cleanUTR.count == 12 ? Color(hex: 0xF59E0B).opacity(0.65) : Color.AuraLoopInk.opacity(0.12),
                            lineWidth: 1
                        )
                )

                // Verify Button
                Button {
                    verifyAndUnlock()
                } label: {
                    HStack(spacing: 6) {
                        if isVerifying {
                            ProgressView()
                                .controlSize(.small)
                                .colorInvert()
                        } else {
                            Image(systemName: "checkmark.shield.fill")
                                .font(.system(size: 12, weight: .bold))
                            Text("Verify & Unlock")
                                .font(.system(size: 13, weight: .bold))
                        }
                    }
                    .foregroundStyle(.white)
                    .padding(.horizontal, 18)
                    .padding(.vertical, 10.5)
                    .background(
                        LinearGradient(
                            colors: cleanUTR.count == 12
                                ? [Color(hex: 0xF59E0B), Color(hex: 0xD97706)]
                                : [Color.gray.opacity(0.5), Color.gray.opacity(0.6)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 13, style: .continuous))
                    .shadow(
                        color: cleanUTR.count == 12 ? Color(hex: 0xF59E0B).opacity(0.35) : .clear,
                        radius: 8, x: 0, y: 3
                    )
                }
                .buttonStyle(.plain)
                .disabled(cleanUTR.count != 12 || isVerifying)
                .pointingCursor()
            }
        }
    }

    // MARK: - Success Overlay

    private var successOverlay: some View {
        ZStack {
            VisualEffectBackground(material: .popover)
                .ignoresSafeArea()

            VStack(spacing: 16) {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [Color(hex: 0x10B981), Color(hex: 0x059669)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 64, height: 64)
                        .shadow(color: Color(hex: 0x10B981).opacity(0.4), radius: 14, x: 0, y: 4)

                    Image(systemName: "checkmark")
                        .font(.system(size: 28, weight: .bold))
                        .foregroundStyle(.white)
                }

                VStack(spacing: 6) {
                    Text("\(selectedTier.title) Activated!")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(Color.AuraLoopInk)

                    Text(selectedTier == .lifetime
                         ? "You have unlocked the Entire Wallpaper Library (300+ Wallpapers) with perpetual 4K 60fps access."
                         : "You have unlocked \(selectedTier.displayLimit) in master 4K 60fps quality.")
                        .font(.system(size: 13))
                        .foregroundStyle(Color.AuraLoopSecondary)
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: 420)
                }

                Button {
                    dismiss()
                } label: {
                    Text("Start Exploring")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 24)
                        .padding(.vertical, 9)
                        .background(
                            LinearGradient(
                                colors: [Color(hex: 0xF59E0B), Color(hex: 0xD97706)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .clipShape(Capsule())
                        .shadow(color: Color(hex: 0xF59E0B).opacity(0.35), radius: 8, x: 0, y: 3)
                }
                .buttonStyle(.plain)
                .padding(.top, 8)
                .pointingCursor()
            }
            .padding(32)
        }
    }

    // MARK: - Actions

    private func formatUTRInput(_ value: String) {
        let filtered = value.filter { $0.isNumber }
        let truncated = String(filtered.prefix(12))

        // Group in 4s: 4281 9283 1092
        var formatted = ""
        for (i, char) in truncated.enumerated() {
            if i > 0 && i % 4 == 0 {
                formatted.append(" ")
            }
            formatted.append(char)
        }

        if formatted != utrInput {
            utrInput = formatted
        }
        if truncated.count == 12 {
            errorMessage = nil
        }
    }

    private func copyUPI() {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(upiID, forType: .string)
        withAnimation { copiedUPI = true }
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            withAnimation { copiedUPI = false }
        }
    }

    private func pasteFromClipboard() {
        if let clipboard = NSPasteboard.general.string(forType: .string) {
            formatUTRInput(clipboard)
        }
    }

    private func verifyAndUnlock() {
        guard cleanUTR.count == 12 else {
            errorMessage = "Please enter all 12 digits of your UTR number."
            return
        }

        isVerifying = true
        errorMessage = nil

        // Simulate seamless verification delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
            isVerifying = false
            let result = store.verifyAndUnlockPro(utr: cleanUTR, tier: selectedTier)
            if result.success {
                NSHapticFeedbackManager.defaultPerformer.perform(.alignment, performanceTime: .default)
                withAnimation {
                    isSuccess = true
                }
                // Automatically dismiss after celebration
                DispatchQueue.main.asyncAfter(deadline: .now() + 2.2) {
                    dismiss()
                }
            } else {
                errorMessage = result.message
            }
        }
    }
}
