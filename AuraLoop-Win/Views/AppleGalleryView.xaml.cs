using Microsoft.UI.Xaml.Controls;
using AuraLoop.Services;

namespace AuraLoop.Views
{
    public sealed partial class AppleGalleryView : Page
    {
        public AppleGalleryView()
        {
            this.InitializeComponent();
            AerialGridView.ItemsSource = AppleAerialService.Instance.Aerials;
        }
    }
}
