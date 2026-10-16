using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.IO;
using System.Linq;
using System.Text.Json;
using AuraLoop.Models;

namespace AuraLoop.Services
{
    public class CatalogService
    {
        private static CatalogService? _instance;
        public static CatalogService Instance => _instance ??= new CatalogService();

        public ObservableCollection<WallpaperItem> Wallpapers { get; } = new();
        public ObservableCollection<string> Categories { get; } = new();

        private CatalogService()
        {
            InitializeCategories();
            LoadCatalog();
        }

        private void InitializeCategories()
        {
            Categories.Clear();
            Categories.Add("All");
            Categories.Add("Featured");
            Categories.Add("Nature");
            Categories.Add("Space");
            Categories.Add("Cities");
            Categories.Add("Dynamic");
            Categories.Add("Aerials");
            Categories.Add("Abstract");
        }

        private void LoadCatalog()
        {
            Wallpapers.Clear();

            // Try reading from bundled FeaturedWallpapers.json in Assets
            string jsonPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Assets", "data", "FeaturedWallpapers.json");
            if (!File.Exists(jsonPath))
            {
                // Fallback to relative path during debug
                jsonPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "assets", "data", "FeaturedWallpapers.json");
            }

            var curatedList = new List<(string id, string title, string category, int duration, string res)>
            {
                ("c0b0484f-80b9-40f3-bf02-03cd0886ba82", "Snowfall in Forest", "Nature", 30, "4K Ultra HD"),
                ("0c68cfdf-0de9-4629-a8a6-51fd6d72ee92", "Waterfall Behind the Pines", "Nature", 35, "4K Ultra HD"),
                ("7f22ad52-9228-4de9-aa57-c15e93ed619e", "Moonlit Shore", "Nature", 40, "4K Ultra HD"),
                ("e4163448-3c37-4b25-bd12-a881af70bed4", "Aurora Lake", "Space", 45, "4K Ultra HD"),
                ("27413b79-8ee3-4c29-ab50-9f7fb9943289", "Moonlight Lake", "Nature", 30, "4K Ultra HD"),
                ("b09bb416-5cb6-4607-b611-c85a5e3edf15", "Sakura Light", "Nature", 25, "4K Ultra HD"),
                ("77d3b04d-2d42-4870-9ef1-738b9faed0fb", "Comet Night", "Space", 60, "4K Ultra HD"),
                ("4b24a85f-6aa4-4bde-b446-eec9e24f2d71", "Jungle Fireplace Porch", "Cities", 35, "4K Ultra HD"),
                ("6fe051c0-67f6-4593-ac90-2f21ac715ee9", "Night Shore", "Nature", 30, "4K Ultra HD"),
                ("60679567-7008-4f7b-81c3-7369f3e9871d", "Flight Over Snowy Peaks", "Aerials", 50, "4K HDR"),
                ("df6d9998-abe2-47f6-9c59-724d541228a4", "Milky Way Over Fuji", "Space", 45, "4K Ultra HD"),
                ("d5bc42f5-e7d9-4d62-8062-b8da44c7898c", "Misty Mountains at Night", "Nature", 40, "4K Ultra HD"),
                ("c7c25a81-d130-4e55-83e9-38b816a70e7a", "Sonoma Horizon", "Dynamic", 60, "4K HDR"),
                ("a8d36b92-e241-4f66-94fa-49c927b81f8b", "Dubai Marina Night Flight", "Cities", 45, "4K HDR"),
                ("b9e47ca3-f352-4a77-a50b-50da38c92a9c", "Deep Ocean Reef", "Nature", 50, "4K Ultra HD"),
                ("e1b58db4-0463-4b88-b61c-61eb49da3bad", "Cosmic Starlight Flow", "Abstract", 30, "4K Ultra HD")
            };

            foreach (var item in curatedList)
            {
                var wp = new WallpaperItem
                {
                    Id = item.id,
                    Title = item.title,
                    Category = item.category,
                    Author = "AuraLoop Studio",
                    VideoUrl = $"https://assets.auraloopwallpaper.com/wallpapers/{item.id}.mp4",
                    ThumbnailUrl = "Assets/png/icon.png",
                    DurationSeconds = item.duration,
                    Fps = 60,
                    Resolution = item.res,
                    FileSizeMB = 85.0 + (item.duration * 1.5),
                    IsDynamic = item.category == "Dynamic",
                    IsAerial = item.category == "Aerials",
                    IsFavorite = item.id == "c0b0484f-80b9-40f3-bf02-03cd0886ba82" || item.id == "e4163448-3c37-4b25-bd12-a881af70bed4",
                    IsDownloaded = item.id == "c0b0484f-80b9-40f3-bf02-03cd0886ba82"
                };

                if (wp.IsDynamic)
                {
                    wp.DynamicKeyframes.Add(new DynamicKeyframe { Hour = 6, Label = "Dawn", VideoUrl = wp.VideoUrl });
                    wp.DynamicKeyframes.Add(new DynamicKeyframe { Hour = 12, Label = "Noon", VideoUrl = wp.VideoUrl });
                    wp.DynamicKeyframes.Add(new DynamicKeyframe { Hour = 18, Label = "Sunset", VideoUrl = wp.VideoUrl });
                    wp.DynamicKeyframes.Add(new DynamicKeyframe { Hour = 22, Label = "Midnight", VideoUrl = wp.VideoUrl });
                }

                Wallpapers.Add(wp);
            }
        }

        public void ToggleFavorite(string id)
        {
            var item = Wallpapers.FirstOrDefault(w => w.Id == id);
            if (item != null)
            {
                item.IsFavorite = !item.IsFavorite;
            }
        }

        public IEnumerable<WallpaperItem> GetWallpapersByCategory(string category)
        {
            if (string.IsNullOrEmpty(category) || category == "All")
                return Wallpapers;

            if (category == "Featured")
                return Wallpapers.Take(6);

            return Wallpapers.Where(w => w.Category.Equals(category, StringComparison.OrdinalIgnoreCase));
        }

        public IEnumerable<WallpaperItem> SearchWallpapers(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
                return Wallpapers;

            return Wallpapers.Where(w =>
                w.Title.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                w.Category.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                w.Author.Contains(query, StringComparison.OrdinalIgnoreCase));
        }
    }
}
