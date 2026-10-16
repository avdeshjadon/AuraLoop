using System.Collections.ObjectModel;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using AuraLoop.Models;
using AuraLoop.Services;

namespace AuraLoop.Views
{
    public sealed partial class HomeView : UserControl
    {
        public ObservableCollection<WallpaperItem> Wallpapers => CatalogService.Instance.Wallpapers;

        public HomeView()
        {
            this.InitializeComponent();
        }

        private void ApplyDesktop_Click(object sender, RoutedEventArgs e)
        {
            App.ViewportWindowInstance?.SetWallpaper("https://assets.auraloopwallpaper.com/wallpapers/snowfall-forest.mp4");
        }

        private void Preview_Click(object sender, RoutedEventArgs e)
        {
            // Open fullscreen preview modal
        }

        private void Favorite_Click(object sender, RoutedEventArgs e)
        {
            CatalogService.Instance.ToggleFavorite("c0b0484f-80b9-40f3-bf02-03cd0886ba82");
        }

        private void WallpaperCard_Click(object sender, ItemClickEventArgs e)
        {
            if (e.ClickedItem is WallpaperItem item)
            {
                App.ViewportWindowInstance?.SetWallpaper(item.VideoUrl);
            }
        }
    }
}
