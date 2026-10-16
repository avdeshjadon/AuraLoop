using Microsoft.UI.Xaml.Controls;
using AuraLoop.Models;

namespace AuraLoop.Views
{
    public sealed partial class PreviewModal : ContentDialog
    {
        public WallpaperItem? Item { get; private set; }

        public PreviewModal()
        {
            this.InitializeComponent();
        }

        public void SetWallpaper(WallpaperItem item)
        {
            Item = item;
            TitleText.Text = item.Title;
            AuthorText.Text = $"By {item.Author} • {item.Category}";
            ResolutionText.Text = item.Resolution;
            FpsText.Text = $"{item.Fps} FPS";
            FileSizeText.Text = $"{item.FileSizeMB:F1} MB";
        }
    }
}
