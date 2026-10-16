using System.Collections.ObjectModel;
using System.Linq;
using Microsoft.UI.Xaml.Controls;
using AuraLoop.Models;
using AuraLoop.Services;

namespace AuraLoop.Views
{
    public sealed partial class FavoritesView : UserControl
    {
        public ObservableCollection<WallpaperItem> FavoriteWallpapers { get; } = new();

        public FavoritesView()
        {
            this.InitializeComponent();

            foreach (var item in CatalogService.Instance.Wallpapers.Where(w => w.IsFavorite))
            {
                FavoriteWallpapers.Add(item);
            }
        }
    }
}
