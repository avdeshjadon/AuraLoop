using System;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Controls.Primitives;
using AuraLoop.Models;
using AuraLoop.Services;

namespace AuraLoop.Controls
{
    public sealed partial class PlayerBarControl : UserControl
    {
        private bool _isPlaying = true;
        public event EventHandler<bool>? PlayStateChanged;
        public event EventHandler<double>? VolumeChanged;
        public event EventHandler<double>? SpeedChanged;
        public event EventHandler? NextRequested;

        public PlayerBarControl()
        {
            this.InitializeComponent();
            VolumeSlider.Value = SettingsService.Instance.Current.Volume * 100.0;
        }

        public void UpdateActiveWallpaper(WallpaperItem item)
        {
            TitleText.Text = item.Title;
            StatusText.Text = $"{item.QualityBadge} • WorkerW Active";
        }

        private void PlayPauseButton_Click(object sender, RoutedEventArgs e)
        {
            _isPlaying = !_isPlaying;
            PlayPauseIcon.Glyph = _isPlaying ? "\uE769" : "\uE768";
            StatusText.Text = _isPlaying ? "Live Wallpaper • Active" : "Live Wallpaper • Paused";
            PlayStateChanged?.Invoke(this, _isPlaying);
        }

        private void NextWallpaper_Click(object sender, RoutedEventArgs e)
        {
            NextRequested?.Invoke(this, EventArgs.Empty);
        }

        private void MuteToggle_Click(object sender, RoutedEventArgs e)
        {
            if (VolumeSlider.Value > 0)
            {
                VolumeSlider.Value = 0;
            }
            else
            {
                VolumeSlider.Value = 50;
            }
        }

        private void VolumeSlider_ValueChanged(object sender, RangeBaseValueChangedEventArgs e)
        {
            if (VolumeIcon != null)
            {
                VolumeIcon.Glyph = e.NewValue == 0 ? "\uE74F" : "\uE767";
            }
            double vol = e.NewValue / 100.0;
            SettingsService.Instance.Current.Volume = vol;
            VolumeChanged?.Invoke(this, vol);
        }

        private void SpeedCombo_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            double speed = SpeedCombo.SelectedIndex switch
            {
                0 => 0.5,
                1 => 1.0,
                2 => 1.5,
                3 => 2.0,
                _ => 1.0
            };
            SettingsService.Instance.Current.PlaybackSpeed = speed;
            SpeedChanged?.Invoke(this, speed);
        }
    }
}
