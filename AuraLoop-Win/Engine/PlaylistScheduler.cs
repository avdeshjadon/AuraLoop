using System;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AuraLoop.Models;
using AuraLoop.Services;

namespace AuraLoop.Engine
{
    /// <summary>
    /// Handles playlist-based wallpaper rotation timer and shuffle transitions.
    /// Parallels macOS Playlist.swift.
    /// </summary>
    public class PlaylistScheduler
    {
        private static PlaylistScheduler? _instance;
        public static PlaylistScheduler Instance => _instance ??= new PlaylistScheduler();

        private CancellationTokenSource? _cts;
        private int _currentIndex = 0;

        private PlaylistScheduler() { }

        public void Start()
        {
            _cts = new CancellationTokenSource();
            Task.Run(() => RotationLoop(_cts.Token));
        }

        public void Stop()
        {
            _cts?.Cancel();
        }

        private async Task RotationLoop(CancellationToken token)
        {
            while (!token.IsCancellationRequested)
            {
                var activePlaylist = LibraryService.Instance.Playlists.FirstOrDefault(p => p.IsActive);
                int intervalMinutes = activePlaylist?.ChangeIntervalMinutes ?? 30;

                await Task.Delay(TimeSpan.FromMinutes(Math.Max(1, intervalMinutes)), token);

                try
                {
                    AdvanceWallpaper();
                }
                catch { }
            }
        }

        public void AdvanceWallpaper()
        {
            var activePlaylist = LibraryService.Instance.Playlists.FirstOrDefault(p => p.IsActive);
            if (activePlaylist == null || activePlaylist.WallpaperIds.Count == 0) return;

            string nextId;
            if (activePlaylist.Shuffle)
            {
                var rnd = new Random();
                int idx = rnd.Next(activePlaylist.WallpaperIds.Count);
                nextId = activePlaylist.WallpaperIds[idx];
            }
            else
            {
                _currentIndex = (_currentIndex + 1) % activePlaylist.WallpaperIds.Count;
                nextId = activePlaylist.WallpaperIds[_currentIndex];
            }

            var nextWp = CatalogService.Instance.Wallpapers.FirstOrDefault(w => w.Id == nextId);
            if (nextWp != null)
            {
                _ = Store.Instance.ApplyWallpaperAsync(nextWp, ApplyTarget.All, ApplySurface.Desktop);
                Debug.WriteLine($"[AuraLoopPlaylist] Rotated to: {nextWp.Title}");
            }
        }
    }
}
