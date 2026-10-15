import Foundation

public struct FeaturedWallpaperEntry: Codable, Identifiable {
    public let id: String
    public let title: String
}

public enum FeaturedRotationConfig {
    public static let defaultItems: [FeaturedWallpaperEntry] = [
        .init(id: "0c68cfdf-0de9-4629-a8a6-51fd6d72ee92", title: "Waterfall Behind the Pines"),
        .init(id: "7f22ad52-9228-4de9-aa57-c15e93ed619e", title: "Moonlit Shore"),
        .init(id: "e4163448-3c37-4b25-bd12-a881af70bed4", title: "Aurora Lake"),
        .init(id: "27413b79-8ee3-4c29-ab50-9f7fb9943289", title: "Moonlight Lake"),
        .init(id: "b09bb416-5cb6-4607-b611-c85a5e3edf15", title: "Sakura Light"),
        .init(id: "77d3b04d-2d42-4870-9ef1-738b9faed0fb", title: "Comet Night"),
        .init(id: "4b24a85f-6aa4-4bde-b446-eec9e24f2d71", title: "Jungle Fireplace Porch"),
        .init(id: "6fe051c0-67f6-4593-ac90-2f21ac715ee9", title: "Night Shore"),
        .init(id: "60679567-7008-4f7b-81c3-7369f3e9871d", title: "Flight Over Snowy Peaks"),
        .init(id: "df6d9998-abe2-47f6-9c59-724d541228a4", title: "Milky Way Over Fuji"),
        .init(id: "d5bc42f5-e7d9-4d62-8062-b8da44c7898c", title: "Misty Mountains at Night"),
        .init(id: "c0b0484f-80b9-40f3-bf02-03cd0886ba82", title: "Snowfall in Forest"),
        .init(id: "b1ec6889-53a4-4fea-9e3d-deec336e1df6", title: "Arrakis (Dune)"),
        .init(id: "87d9da09-a105-465a-8eac-af7da1cc51f3", title: "Lone Katana")
    ]

    public static func loadConfiguredList() -> [FeaturedWallpaperEntry] {
        let appSupport = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
        let userFile = appSupport?.appendingPathComponent("AuraLoop").appendingPathComponent("FeaturedWallpapers.json")

        if let userFile, FileManager.default.fileExists(atPath: userFile.path) {
            if let data = try? Data(contentsOf: userFile),
               let list = try? JSONDecoder().decode([FeaturedWallpaperEntry].self, from: data),
               !list.isEmpty {
                return list
            }
        }

        // Try bundle resource
        if let bundleFile = Bundle.main.url(forResource: "FeaturedWallpapers", withExtension: "json"),
           let data = try? Data(contentsOf: bundleFile),
           let list = try? JSONDecoder().decode([FeaturedWallpaperEntry].self, from: data),
           !list.isEmpty {
            return list
        }

        // Try local developer assets path
        for devPath in [
            "assets/FeaturedWallpapers.json",
            "../assets/FeaturedWallpapers.json",
            "/Users/avdeshjadon/AuraLoop/assets/FeaturedWallpapers.json"
        ] {
            let url = URL(fileURLWithPath: devPath)
            if FileManager.default.fileExists(atPath: url.path),
               let data = try? Data(contentsOf: url),
               let list = try? JSONDecoder().decode([FeaturedWallpaperEntry].self, from: data),
               !list.isEmpty {
                return list
            }
        }

        // Seed user file if directory exists
        if let userFile {
            try? FileManager.default.createDirectory(at: userFile.deletingLastPathComponent(), withIntermediateDirectories: true)
            if let data = try? JSONEncoder().encode(defaultItems) {
                try? data.write(to: userFile)
            }
        }

        return defaultItems
    }
}
