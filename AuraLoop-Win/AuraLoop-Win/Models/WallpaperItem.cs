using System;
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

        [ObservableProperty]
        private bool _isFavorite;

        [ObservableProperty]
        private bool _isDownloaded;

        [ObservableProperty]
        private bool _isPlaying;
    }
}
