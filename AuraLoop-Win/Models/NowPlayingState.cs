using System;
using CommunityToolkit.Mvvm.ComponentModel;

namespace AuraLoop.Models
{
    public partial class NowPlayingState : ObservableObject
    {
        [ObservableProperty]
        private WallpaperItem? _currentWallpaper;

        [ObservableProperty]
        private bool _isPlaying = true;

        [ObservableProperty]
        private double _volume = 0.0;

        [ObservableProperty]
        private double _playbackSpeed = 1.0;

        [ObservableProperty]
        private TimeSpan _position = TimeSpan.Zero;

        [ObservableProperty]
        private TimeSpan _duration = TimeSpan.FromSeconds(30);

        [ObservableProperty]
        private string _targetDisplay = "All Displays";
    }
}
