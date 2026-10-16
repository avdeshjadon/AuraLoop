using System;
using System.Collections.Generic;
using CommunityToolkit.Mvvm.ComponentModel;

namespace AuraLoop.Models
{
    public partial class WallpaperItem : ObservableObject
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Title { get; set; } = string.Empty;
        public string Author { get; set; } = "AuraLoop Studio";
        public string Category { get; set; } = "Nature";
        public string VideoUrl { get; set; } = string.Empty;
        public string? LocalVideoPath { get; set; }
        public string ThumbnailUrl { get; set; } = string.Empty;
        public int DurationSeconds { get; set; } = 30;
        public int Fps { get; set; } = 60;
        public string Resolution { get; set; } = "4K Ultra HD";
        public double FileSizeMB { get; set; } = 85.0;
        public bool IsDynamic { get; set; } = false;
        public bool IsAerial { get; set; } = false;
        public string Location { get; set; } = string.Empty;
        public List<string> Tags { get; set; } = new();
        public List<DynamicKeyframe> DynamicKeyframes { get; set; } = new();

        [ObservableProperty]
        private bool _isFavorite;

        [ObservableProperty]
        private bool _isDownloaded;

        [ObservableProperty]
        private bool _isPlaying;

        [ObservableProperty]
        private double _downloadProgress = 0.0;

        [ObservableProperty]
        private bool _isDownloading = false;

        public string FormattedDuration => $"{DurationSeconds / 60:D2}:{DurationSeconds % 60:D2}";
        public string QualityBadge => $"{Resolution} • {Fps} FPS";
    }

    public class DynamicKeyframe
    {
        public double Hour { get; set; } // 0.0 to 24.0
        public string Label { get; set; } = "Day";
        public string VideoUrl { get; set; } = string.Empty;
        public string ThumbnailUrl { get; set; } = string.Empty;
    }
}
