using System;
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
        public string? ActiveWallpaperId { get; set; }
        public string StoragePath { get; set; } = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "AuraLoop",
            "Wallpapers");
    }
}
