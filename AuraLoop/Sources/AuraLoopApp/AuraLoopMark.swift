import SwiftUI
import AppKit

/// The AuraLoop infinity brand mark geometry.
/// Original viewBox from SVG: 400 x 200
/// Path: M 42,100 C 82,35 143,35 200,100 C 257,165 318,165 358,100 C 318,35 257,35 200,100 C 143,165 82,165 42,100 Z
public struct AuraLoopInfinityShape: Shape {
    public init() {}

    public func path(in rect: CGRect) -> Path {
        var path = Path()
        let sx = rect.width / 400.0
        let sy = rect.height / 200.0
        let ox = rect.minX
        let oy = rect.minY

        func p(_ x: CGFloat, _ y: CGFloat) -> CGPoint {
            CGPoint(x: ox + x * sx, y: oy + y * sy)
        }

        path.move(to: p(42, 100))
        path.addCurve(to: p(200, 100), control1: p(82, 35), control2: p(143, 35))
        path.addCurve(to: p(358, 100), control1: p(257, 165), control2: p(318, 165))
        path.addCurve(to: p(200, 100), control1: p(318, 35), control2: p(257, 35))
        path.addCurve(to: p(42, 100), control1: p(143, 165), control2: p(82, 165))
        path.closeSubpath()
        return path
    }
}

/// The wordmark loop shape (replacing "OO" in AURALOOP).
/// Original coordinates in wordmark SVG: x from 695 to 919 (width 224), y from 61 to 161 (height 100).
public struct AuraLoopWordmarkLoopShape: Shape {
    public init() {}

    public func path(in rect: CGRect) -> Path {
        var path = Path()
        let sx = rect.width / 224.0
        let sy = rect.height / 100.0
        let ox = rect.minX
        let oy = rect.minY

        func p(_ x: CGFloat, _ y: CGFloat) -> CGPoint {
            CGPoint(x: ox + (x - 695.0) * sx, y: oy + (y - 61.0) * sy)
        }

        path.move(to: p(695, 111))
        path.addCurve(to: p(807, 111), control1: p(728, 61), control2: p(768, 61))
        path.addCurve(to: p(919, 111), control1: p(846, 161), control2: p(886, 161))
        path.addCurve(to: p(807, 111), control1: p(886, 61), control2: p(846, 61))
        path.addCurve(to: p(695, 111), control1: p(768, 161), control2: p(728, 161))
        path.closeSubpath()
        return path
    }
}

/// Cache for the loaded SVG wordmark image.
enum AuraLoopWordmarkCache {
    static func image(isDarkInk: Bool = false) -> NSImage? {
        let name = isDarkInk ? "auraloop-wordmark-dark" : "auraloop-wordmark"
        if let url = Bundle.main.url(forResource: name, withExtension: "svg"),
           let img = NSImage(contentsOf: url) {
            img.isTemplate = true
            return img
        }
        let candidatePaths = [
            "assets/\(name).svg",
            "../assets/\(name).svg",
            "AuraLoop/assets/\(name).svg",
            "/Users/avdeshjadon/AuraLoop/assets/\(name).svg"
        ]
        for path in candidatePaths {
            let u = URL(fileURLWithPath: path)
            if let img = NSImage(contentsOf: u) {
                img.isTemplate = true
                return img
            }
        }
        return nil
    }

    static let image: NSImage? = image(isDarkInk: false)
}

/// The official AuraLoop wordmark ("AURAL∞P").
/// Displays the vector wordmark SVG tinted with the specified color.
struct AuraLoopWordmark: View {
    var color: Color = Color.AuraLoopInk

    var body: some View {
        let isDarkInk = Appearance.shared.isLight
        let img = AuraLoopWordmarkCache.image(isDarkInk: isDarkInk) ?? AuraLoopWordmarkCache.image
        if let img {
            Image(nsImage: img)
                .renderingMode(.template)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .foregroundStyle(color)
        } else {
            AuraLoopVectorWordmark(color: color)
        }
    }
}

/// Pure SwiftUI vector fallback for the wordmark.
struct AuraLoopVectorWordmark: View {
    var color: Color = Color.AuraLoopInk

    var body: some View {
        HStack(spacing: 2) {
            Text("AURAL")
                .font(.custom("Avenir Next", size: 16).weight(.light))
                .tracking(2.5)
                .foregroundStyle(color)

            AuraLoopWordmarkLoopShape()
                .stroke(color, style: StrokeStyle(lineWidth: 1.8, lineCap: .round, lineJoin: .round))
                .frame(width: 24, height: 11)
                .padding(.horizontal, 1)

            Text("P")
                .font(.custom("Avenir Next", size: 16).weight(.light))
                .tracking(2.5)
                .foregroundStyle(color)
        }
    }
}

/// The app mark as a rounded tile — Home top bar, Settings header, and in-app fallback.
struct AuraLoopMark: View {
    var cornerRadius: CGFloat = 8

    private var shape: RoundedRectangle {
        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
    }

    var body: some View {
        GeometryReader { proxy in
            let size = proxy.size
            let symbolW = size.width * 0.65
            let symbolH = symbolW * 0.50

            ZStack {
                // Midnight background gradient
                LinearGradient(
                    stops: [
                        .init(color: Color(red: 24/255, green: 38/255, blue: 68/255), location: 0),
                        .init(color: Color(red: 14/255, green: 24/255, blue: 46/255), location: 0.55),
                        .init(color: Color(red: 8/255, green: 12/255, blue: 22/255), location: 1.0),
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )

                // Soft radial moonbeam glow
                RadialGradient(
                    colors: [
                        Color(red: 169/255, green: 196/255, blue: 255/255).opacity(0.45),
                        Color(red: 169/255, green: 196/255, blue: 255/255).opacity(0)
                    ],
                    center: .center,
                    startRadius: 0,
                    endRadius: size.width * 0.5
                )

                // Crisp infinity symbol
                AuraLoopInfinityShape()
                    .stroke(
                        Color.white,
                        style: StrokeStyle(
                            lineWidth: max(1.5, size.width * 0.05),
                            lineCap: .round,
                            lineJoin: .round
                        )
                    )
                    .frame(width: symbolW, height: symbolH)
                    .shadow(color: Color(red: 169/255, green: 196/255, blue: 255/255).opacity(0.8), radius: size.width * 0.04)
            }
            .clipShape(shape)
            .overlay(shape.strokeBorder(Color.white.opacity(0.18), lineWidth: 1))
        }
        .aspectRatio(1, contentMode: .fit)
    }
}

/// The menu bar glyph: an infinity symbol reduced to what survives at 18pt.
/// Drawn through `NSImage(size:flipped:)` so it re-renders per scale factor instead of being
/// an upscaled bitmap, and flagged `isTemplate` so macOS tints it for light and dark menu bars.
enum AuraLoopGlyph {
    static func menuBarImage(size: CGFloat = 18) -> NSImage {
        let image = NSImage(size: NSSize(width: size, height: size), flipped: false) { rect in
            guard let c = NSGraphicsContext.current?.cgContext else { return false }
            let s = rect.width / 18   // designed against an 18pt box, y-up

            let w: CGFloat = 13.5 * s
            let h: CGFloat = 6.8 * s
            let ox = (rect.width - w) / 2
            let oy = (rect.height - h) / 2
            let sx = w / 400.0
            let sy = h / 200.0

            func p(_ x: CGFloat, _ y: CGFloat) -> CGPoint {
                CGPoint(x: ox + x * sx, y: oy + y * sy)
            }

            let path = CGMutablePath()
            path.move(to: p(42, 100))
            path.addCurve(to: p(200, 100), control1: p(82, 35), control2: p(143, 35))
            path.addCurve(to: p(358, 100), control1: p(257, 165), control2: p(318, 165))
            path.addCurve(to: p(200, 100), control1: p(318, 35), control2: p(257, 35))
            path.addCurve(to: p(42, 100), control1: p(143, 165), control2: p(82, 165))
            path.closeSubpath()

            c.addPath(path)
            c.setStrokeColor(NSColor.black.cgColor)
            c.setLineWidth(1.6 * s)
            c.setLineCap(.round)
            c.setLineJoin(.round)
            c.strokePath()
            return true
        }
        image.isTemplate = true
        return image
    }
}
