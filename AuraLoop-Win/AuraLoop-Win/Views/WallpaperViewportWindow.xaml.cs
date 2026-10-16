using System;
using Microsoft.UI.Xaml;
using Windows.Media.Core;
using Windows.Media.Playback;
using AuraLoop.Models;

namespace AuraLoop.Views
{
    public sealed partial class WallpaperViewportWindow : Window
    {
        private MediaPlayer? _player;

        public WallpaperViewportWindow()
        {
            this.InitializeComponent();

            _player = WallpaperPlayer.MediaPlayer;
            if (_player != null)
            {
                _player.IsLoopingEnabled = true;
                _player.IsMuted = true;
            }

            // Wire auto-pause triggers from PlaybackMonitor
            App.Monitor.PauseStateChanged += (s, isPaused) =>
            {
                DispatcherQueue.TryEnqueue(() =>
                {
                    if (isPaused)
                        _player?.Pause();
                    else
                        _player?.Play();
                });
            };

            // Set initial wallpaper (Snowfall in Forest)
            SetWallpaper("https://assets.auraloopwallpaper.com/wallpapers/snowfall-forest.mp4");
        }

        public void SetWallpaper(string videoSourceUri)
        {
            try
            {
                if (Uri.TryCreate(videoSourceUri, UriKind.Absolute, out var uri))
                {
                    _player?.Pause();
                    WallpaperPlayer.Source = MediaSource.CreateFromUri(uri);
                    _player?.Play();
                }
            }
            catch { }
        }

        public void Pause() => _player?.Pause();
        public void Play() => _player?.Play();
    }
}
