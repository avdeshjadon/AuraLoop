using System;
using System.Collections.ObjectModel;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using AuraLoop.Models;

namespace AuraLoop.Services
{
    public class CatalogService
    {
        private static CatalogService? _instance;
        public static CatalogService Instance => _instance ??= new CatalogService();

        public ObservableCollection<WallpaperItem> Wallpapers { get; } = new();

        private CatalogService()
        {
            LoadCuratedCatalog();
        }

        private void LoadCuratedCatalog()
        {
            // Seed matching curated collection from AuraLoop macOS catalog
            Wallpapers.Add(new WallpaperItem
            {
                Id = "c0b0484f-80b9-40f3-bf02-03cd0886ba82",
                Title = "Snowfall in Forest",
                Author = "AuraLoop Studio",
                Category = "Nature",
                VideoUrl = "https://assets.auraloopwallpaper.com/wallpapers/snowfall-forest.mp4",
                ThumbnailUrl = "Assets/icon.png",
                DurationSeconds = 30,
                Fps = 60,
                Resolution = "4K Ultra HD",
                FileSizeMB = 120.0,
                IsDownloaded = true,
                IsFavorite = true
            });

            Wallpapers.Add(new WallpaperItem
            {
                Id = "d1a0395a-11c2-48a1-8931-15cf0182bb11",
                Title = "Nebula Aurora Drift",
                Author = "Cosmic Vision",
                Category = "Space",
                VideoUrl = "https://assets.auraloopwallpaper.com/wallpapers/nebula-aurora.mp4",
                ThumbnailUrl = "Assets/icon.png",
                DurationSeconds = 45,
                Fps = 60,
                Resolution = "4K Ultra HD",
                FileSizeMB = 95.5,
                IsFavorite = true
            });

            Wallpapers.Add(new WallpaperItem
            {
                Id = "e5f2991b-77e4-44b2-9a31-62fa9021dd33",
                Title = "Tokyo Rainy Midnight",
                Author = "Urban Motion",
                Category = "Cities",
                VideoUrl = "https://assets.auraloopwallpaper.com/wallpapers/tokyo-rain.mp4",
                ThumbnailUrl = "Assets/icon.png",
                DurationSeconds = 30,
                Fps = 60,
                Resolution = "4K Ultra HD",
                FileSizeMB = 110.2
            });

            Wallpapers.Add(new WallpaperItem
            {
                Id = "a7b3112c-99d1-43e5-8b11-41dd2940ee55",
                Title = "Liquid Glass Flow",
                Author = "Fluid Dynamics",
                Category = "Abstract",
                VideoUrl = "https://assets.auraloopwallpaper.com/wallpapers/liquid-glass.mp4",
                ThumbnailUrl = "Assets/icon.png",
                DurationSeconds = 25,
                Fps = 60,
                Resolution = "4K Ultra HD",
                FileSizeMB = 75.0
            });

            Wallpapers.Add(new WallpaperItem
            {
                Id = "b9c4223d-00e2-45f6-9c22-52ee3051ff66",
                Title = "Sonoma Valley Aerial",
                Author = "Apple Aerials",
                Category = "Apple",
                VideoUrl = "https://assets.auraloopwallpaper.com/wallpapers/sonoma-valley.mp4",
                ThumbnailUrl = "Assets/icon.png",
                DurationSeconds = 60,
                Fps = 60,
                Resolution = "4K HDR",
                FileSizeMB = 145.0,
                IsFavorite = true
            });
        }

        public void ToggleFavorite(string id)
        {
            var item = Wallpapers.FirstOrDefault(w => w.Id == id);
            if (item != null)
            {
                item.IsFavorite = !item.IsFavorite;
            }
        }
    }
}
