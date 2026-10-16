using System;
using System.Collections.Generic;
using System.IO;

namespace AuraLoop.Models
{
    public class AppSettings
    {
        public bool LaunchAtStartup { get; set; } = false;
        public bool MinimizeToTray { get; set; } = true;
        public bool PauseWhenCovered { get; set; } = true;
        public bool PauseOnBatterySaver { get; set; } = true;
        public int TargetFps { get; set; } = 60; // 30 or 60
        public double PlaybackSpeed { get; set; } = 1.0; // 0.5 to 2.0
        public double Volume { get; set; } = 0.0; // 0.0 to 1.0 (default muted)
        public bool MuteWhenOtherAppPlaysAudio { get; set; } = true;
        public string DisplayMode { get; set; } = "PerMonitor"; // PerMonitor or Span
        public string? ActiveWallpaperId { get; set; }
        public Dictionary<int, string> DisplayWallpapers { get; set; } = new();
        public int ScreenSaverIdleMinutes { get; set; } = 5; // 0 = never
        public bool SyncLockScreen { get; set; } = false;
        public bool DynamicWallpaperSolarSync { get; set; } = true;
        public string Theme { get; set; } = "Dark";
        public string HardwareAcceleration { get; set; } = "DirectX12";
        public string? ActivePlaylistId { get; set; }
        public string StoragePath { get; set; } = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "AuraLoop",
            "Wallpapers");
    }
}
