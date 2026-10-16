using System.Collections.ObjectModel;
using System.Linq;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using AuraLoop.Models;
using AuraLoop.Services;

namespace AuraLoop.Views
{
    public sealed partial class LibraryView : UserControl
    {
        public ObservableCollection<WallpaperItem> DownloadedWallpapers { get; } = new();

        public LibraryView()
        {
            this.InitializeComponent();

            foreach (var item in CatalogService.Instance.Wallpapers)
            {
                DownloadedWallpapers.Add(item);
            }
        }

        private void ImportVideo_Click(object sender, RoutedEventArgs e)
        {
            // Windows OpenFileDialog for custom video clips
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
