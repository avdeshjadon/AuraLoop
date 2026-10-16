using System;

namespace AuraLoop.Models
{
    public class DisplayInfo
    {
        public int Index { get; set; }
        public IntPtr Handle { get; set; }
        public string DeviceName { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public int Left { get; set; }
        public int Top { get; set; }
        public int Width { get; set; }
        public int Height { get; set; }
        public bool IsPrimary { get; set; }
        public string? CurrentWallpaperTitle { get; set; }
        public string AspectRatio => $"{Width}:{Height}";
        public string ResolutionText => $"{Width} x {Height}";
    }
}
