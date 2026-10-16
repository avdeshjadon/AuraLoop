using System.Collections.ObjectModel;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using AuraLoop.Models;
using AuraLoop.Services;

namespace AuraLoop.Views
{
    public sealed partial class ExploreView : UserControl
    {
        public ObservableCollection<WallpaperItem> Wallpapers => CatalogService.Instance.Wallpapers;

        public ExploreView()
        {
            this.InitializeComponent();
        }

        private void ApplyItem_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button btn && btn.DataContext is WallpaperItem item)
            {
                App.ViewportWindowInstance?.SetWallpaper(item.VideoUrl);
            }
        }
    }
}
