using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using AuraLoop.Models;
using AuraLoop.Native;
using AuraLoop.Engine;

namespace AuraLoop.Services
{
    public enum ApplyTargetType
    {
        AllDisplays,
        SpecificDisplay
    }

    public class ApplyTarget
    {
        public ApplyTargetType Type { get; set; } = ApplyTargetType.AllDisplays;
        public int DisplayIndex { get; set; } = 0;

        public static ApplyTarget All => new() { Type = ApplyTargetType.AllDisplays };
        public static ApplyTarget Display(int index) => new() { Type = ApplyTargetType.SpecificDisplay, DisplayIndex = index };
    }

    [Flags]
    public enum ApplySurface
    {
        Desktop = 1,
        LockScreen = 2,
        ScreenSaver = 4,
        All = Desktop | LockScreen | ScreenSaver
    }

    /// <summary>
    /// Central reactive state store for AuraLoop Windows.
    /// Manages wallpaper catalogs, active surfaces, playlists, downloads, and system hooks.
    /// Parallels AuraLoop macOS Store.swift architecture.
    /// </summary>
    public partial class Store : ObservableObject
    {
        private static Store? _instance;
        public static Store Instance => _instance ??= new Store();

        [ObservableProperty]
        private WallpaperItem? _activeWallpaper;

        [ObservableProperty]
        private bool _isPlaying = true;

        [ObservableProperty]
        private double _volume = 0.0;

        [ObservableProperty]
        private double _playbackSpeed = 1.0;

        [ObservableProperty]
        private ApplySurface _activeSurfaces = ApplySurface.Desktop;

        [ObservableProperty]
        private string _activeCategory = "All";

        [ObservableProperty]
        private string _searchQuery = string.Empty;

        [ObservableProperty]
        private double _cpuUsagePercent = 0.0;

        [ObservableProperty]
        private double _ramUsageMB = 0.0;

        public ObservableCollection<WallpaperItem> AllWallpapers { get; } = new();
        public ObservableCollection<WallpaperItem> FilteredWallpapers { get; } = new();
        public ObservableCollection<WallpaperItem> Favorites { get; } = new();
        public ObservableCollection<WallpaperItem> Downloaded { get; } = new();
        public ObservableCollection<DisplayInfo> ConnectedDisplays { get; } = new();
        public ObservableCollection<Playlist> Playlists { get; } = new();
        public ObservableCollection<AutomationRule> Automations { get; } = new();

        public HashSet<string> LikedIDs { get; } = new();

        public event Action<WallpaperItem, ApplyTarget, ApplySurface>? OnWallpaperApplied;

        private Store()
        {
            InitializeData();
            RefreshDisplays();
        }

        public void InitializeData()
        {
            AllWallpapers.Clear();
            foreach (var wp in CatalogService.Instance.Wallpapers)
            {
                AllWallpapers.Add(wp);
                if (wp.IsFavorite) Favorites.Add(wp);
                if (wp.IsDownloaded) Downloaded.Add(wp);
            }

            ApplyFilters();

            // Set initial active wallpaper
            ActiveWallpaper = AllWallpapers.FirstOrDefault();
        }

        public void RefreshDisplays()
        {
            ConnectedDisplays.Clear();
            var list = DisplayManager.GetConnectedMonitors();
            foreach (var mon in list)
            {
                ConnectedDisplays.Add(mon);
            }
        }

        public void ToggleLike(string id)
        {
            var item = AllWallpapers.FirstOrDefault(w => w.Id == id);
            if (item == null) return;

            item.IsFavorite = !item.IsFavorite;
            if (item.IsFavorite)
            {
                LikedIDs.Add(id);
                if (!Favorites.Contains(item)) Favorites.Add(item);
            }
            else
            {
                LikedIDs.Remove(id);
                Favorites.Remove(item);
            }
        }

        public async Task ApplyWallpaperAsync(WallpaperItem item, ApplyTarget target, ApplySurface surfaces)
        {
            ActiveWallpaper = item;
            ActiveSurfaces = surfaces;

            // Ensure video file is available (download if needed)
            if (!item.IsDownloaded && !string.IsNullOrEmpty(item.VideoUrl))
            {
                await DownloadManager.Instance.DownloadWallpaperAsync(item);
            }

            string pathToUse = !string.IsNullOrEmpty(item.LocalVideoPath) && File.Exists(item.LocalVideoPath)
                ? item.LocalVideoPath
                : item.VideoUrl;

            // 1. Desktop Surface
            if (surfaces.HasFlag(ApplySurface.Desktop))
            {
                App.ViewportWindowInstance?.SetWallpaper(pathToUse);
            }

            // 2. Lock Screen Surface
            if (surfaces.HasFlag(ApplySurface.LockScreen) && !string.IsNullOrEmpty(item.ThumbnailUrl))
            {
                WallpaperEngine.Instance.SetLockScreenStill(item.ThumbnailUrl);
            }

            // 3. Update Settings
            SettingsService.Instance.Current.ActiveWallpaperId = item.Id;
            SettingsService.Instance.SaveSettings();

            OnWallpaperApplied?.Invoke(item, target, surfaces);
        }

        public void SetPlaybackSpeed(double speed)
        {
            PlaybackSpeed = Math.Clamp(speed, 0.25, 3.0);
            SettingsService.Instance.Current.PlaybackSpeed = PlaybackSpeed;
            SettingsService.Instance.SaveSettings();
        }

        public void SetVolume(double vol)
        {
            Volume = Math.Clamp(vol, 0.0, 1.0);
            SettingsService.Instance.Current.Volume = Volume;
            SettingsService.Instance.SaveSettings();
        }

        public void SetCategoryFilter(string category)
        {
            ActiveCategory = category;
            ApplyFilters();
        }

        public void SetSearch(string query)
        {
            SearchQuery = query;
            ApplyFilters();
        }

        private void ApplyFilters()
        {
            FilteredWallpapers.Clear();

            var query = AllWallpapers.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(ActiveCategory) && ActiveCategory != "All")
            {
                query = query.Where(w => w.Category.Equals(ActiveCategory, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(SearchQuery))
            {
                query = query.Where(w =>
                    w.Title.Contains(SearchQuery, StringComparison.OrdinalIgnoreCase) ||
                    w.Author.Contains(SearchQuery, StringComparison.OrdinalIgnoreCase) ||
                    w.Category.Contains(SearchQuery, StringComparison.OrdinalIgnoreCase));
            }

            foreach (var item in query)
            {
                FilteredWallpapers.Add(item);
            }
        }
    }
}
