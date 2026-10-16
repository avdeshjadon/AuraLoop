using System;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using AuraLoop.Models;
using AuraLoop.Services;

namespace AuraLoop.Controls
{
    public sealed partial class WallpaperCard : UserControl
    {
        public static readonly DependencyProperty ItemProperty =
            DependencyProperty.Register(nameof(Item), typeof(WallpaperItem), typeof(WallpaperCard), new PropertyMetadata(null));

        public WallpaperItem Item
        {
            get => (WallpaperItem)GetValue(ItemProperty);
            set => SetValue(ItemProperty, value);
        }

        public event EventHandler<WallpaperItem>? WallpaperApplied;

        public WallpaperCard()
        {
            this.InitializeComponent();
        }

        private void Favorite_Click(object sender, RoutedEventArgs e)
        {
            if (Item != null)
            {
                CatalogService.Instance.ToggleFavorite(Item.Id);
            }
        }

        private void Apply_Click(object sender, RoutedEventArgs e)
        {
            if (Item != null)
            {
                WallpaperApplied?.Invoke(this, Item);
            }
        }
    }
}
