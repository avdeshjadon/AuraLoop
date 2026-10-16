using System;
using System.Collections.ObjectModel;
using System.IO;
using System.Linq;
using AuraLoop.Models;

namespace AuraLoop.Services
{
    public class LibraryService
    {
        private static LibraryService? _instance;
        public static LibraryService Instance => _instance ??= new LibraryService();

        public ObservableCollection<WallpaperItem> ImportedWallpapers { get; } = new();
        public ObservableCollection<Playlist> Playlists { get; } = new();

        private LibraryService()
        {
            SeedSamplePlaylists();
        }

        private void SeedSamplePlaylists()
        {
            Playlists.Add(new Playlist
            {
                Name = "Daily Relax",
                ChangeIntervalMinutes = 15,
                Shuffle = true,
                IsActive = true,
                WallpaperIds = new() { "c0b0484f-80b9-40f3-bf02-03cd0886ba82", "0c68cfdf-0de9-4629-a8a6-51fd6d72ee92" }
            });

            Playlists.Add(new Playlist
            {
                Name = "Deep Space Focus",
                ChangeIntervalMinutes = 30,
                Shuffle = false,
                IsActive = false,
                WallpaperIds = new() { "e4163448-3c37-4b25-bd12-a881af70bed4", "77d3b04d-2d42-4870-9ef1-738b9faed0fb" }
            });
        }

        public WallpaperItem? ImportCustomVideo(string filePath)
        {
            if (!File.Exists(filePath)) return null;

            var fileInfo = new FileInfo(filePath);
            var item = new WallpaperItem
            {
                Id = Guid.NewGuid().ToString(),
                Title = Path.GetFileNameWithoutExtension(filePath),
                Author = "Custom Import",
                Category = "Custom",
                LocalVideoPath = filePath,
                VideoUrl = filePath,
                ThumbnailUrl = "Assets/png/icon.png",
                DurationSeconds = 30,
                Fps = 60,
                Resolution = "High Definition",
                FileSizeMB = Math.Round((double)fileInfo.Length / (1024 * 1024), 1),
                IsDownloaded = true
            };

            ImportedWallpapers.Add(item);
            CatalogService.Instance.Wallpapers.Add(item);
            return item;
        }

        public void RemoveImportedWallpaper(string id)
        {
            var item = ImportedWallpapers.FirstOrDefault(w => w.Id == id);
            if (item != null)
            {
                ImportedWallpapers.Remove(item);
                CatalogService.Instance.Wallpapers.Remove(item);
            }
        }
    }
}
