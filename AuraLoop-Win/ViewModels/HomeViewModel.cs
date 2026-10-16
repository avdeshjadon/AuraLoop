using System;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using AuraLoop.Models;
using AuraLoop.Services;

namespace AuraLoop.ViewModels
{
    public partial class HomeViewModel : ObservableObject
    {
        [ObservableProperty]
        private WallpaperItem? _featuredWallpaper;

        [ObservableProperty]
        private bool _isPlaying = true;

        [ObservableProperty]
        private double _volume = 0.0;

        [ObservableProperty]
        private double _playbackSpeed = 1.0;

        [ObservableProperty]
        private string _activePhase = "Day";

        public ObservableCollection<WallpaperItem> CuratedWallpapers => CatalogService.Instance.Wallpapers;
        public ObservableCollection<DisplayInfo> Displays => Store.Instance.ConnectedDisplays;

        public HomeViewModel()
        {
            FeaturedWallpaper = CuratedWallpapers.FirstOrDefault();
            Store.Instance.OnWallpaperApplied += (item, target, surfaces) =>
            {
                FeaturedWallpaper = item;
            };
        }

        [RelayCommand]
        public async Task ApplyFeaturedAsync()
        {
            if (FeaturedWallpaper != null)
            {
                await Store.Instance.ApplyWallpaperAsync(FeaturedWallpaper, ApplyTarget.All, ApplySurface.Desktop);
            }
        }

        [RelayCommand]
        public void ToggleFavorite(WallpaperItem item)
        {
            Store.Instance.ToggleLike(item.Id);
        }

        [RelayCommand]
        public void TogglePlayPause()
        {
            IsPlaying = !IsPlaying;
            if (IsPlaying)
                App.ViewportWindowInstance?.Play();
            else
                App.ViewportWindowInstance?.Pause();
        }
    }
}
