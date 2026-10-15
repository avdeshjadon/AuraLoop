// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "AuraLoop",
    platforms: [.macOS(.v14)],
    targets: [
        .target(
            name: "AuraLoopKit",
            path: "Sources/AuraLoopKit"
        ),
        .executableTarget(
            name: "AuraLoop-app",
            dependencies: ["AuraLoopKit"],
            path: "Sources/AuraLoopApp"
        ),
        .executableTarget(
            name: "AuraLoop-engine",
            dependencies: ["AuraLoopKit"],
            path: "Sources/AuraLoopEngine"
        ),
        .executableTarget(
            name: "AuraLoop-import",
            dependencies: ["AuraLoopKit"],
            path: "Sources/AuraLoopImport"
        ),
        .executableTarget(
            name: "AuraLoop-set",
            dependencies: ["AuraLoopKit"],
            path: "Sources/AuraLoopSet"
        ),
        .executableTarget(
            name: "AuraLoop-publish",
            dependencies: ["AuraLoopKit"],
            path: "Sources/AuraLoopPublish"
        ),
        .executableTarget(
            name: "AuraLoop-prepare",
            dependencies: ["AuraLoopKit"],
            path: "Sources/AuraLoopPrepare"
        ),
        // Ships inside AuraLoop.app: a picture of a screen saver that has none.
        .executableTarget(
            name: "AuraLoop-saver-picture",
            path: "Sources/AuraLoopSaverPicture"
        ),
        .testTarget(
            name: "AuraLoopKitTests",
            dependencies: ["AuraLoopKit"],
            path: "Tests/AuraLoopKitTests"
        )
    ]
)
