using System.Collections.ObjectModel;
using AuraLoop.Models;

namespace AuraLoop.Services
{
    public class AppleAerialService
    {
        private static AppleAerialService? _instance;
        public static AppleAerialService Instance => _instance ??= new AppleAerialService();

        public ObservableCollection<AppleAerialEntry> Aerials { get; } = new();

        private AppleAerialService()
        {
            SeedAppleAerials();
        }

        private void SeedAppleAerials()
        {
            Aerials.Add(new AppleAerialEntry
            {
                Id = "aerial-sonoma-01",
                Title = "Sonoma Hills Fog",
                Subcategory = "Landscape",
                VideoUrl = "https://assets.auraloopwallpaper.com/wallpapers/sonoma-hills.mp4",
                PreviewUrl = "Assets/png/icon.png",
                ShowInPhase = "Day",
                Resolution = "4K HDR",
                Fps = 60
            });

            Aerials.Add(new AppleAerialEntry
            {
                Id = "aerial-dubai-02",
                Title = "Dubai Skyscrapers Drift",
                Subcategory = "City",
                VideoUrl = "https://assets.auraloopwallpaper.com/wallpapers/dubai-skyscrapers.mp4",
                PreviewUrl = "Assets/png/icon.png",
                ShowInPhase = "Night",
                Resolution = "4K HDR",
                Fps = 60
            });

            Aerials.Add(new AppleAerialEntry
            {
                Id = "aerial-earth-03",
                Title = "Aurora Borealis from Orbit",
                Subcategory = "Earth",
                VideoUrl = "https://assets.auraloopwallpaper.com/wallpapers/earth-aurora.mp4",
                PreviewUrl = "Assets/png/icon.png",
                ShowInPhase = "All",
                Resolution = "4K HDR",
                Fps = 60
            });

            Aerials.Add(new AppleAerialEntry
            {
                Id = "aerial-hawaii-04",
                Title = "Tahiti Coral Reef",
                Subcategory = "Underwater",
                VideoUrl = "https://assets.auraloopwallpaper.com/wallpapers/coral-reef.mp4",
                PreviewUrl = "Assets/png/icon.png",
                ShowInPhase = "Day",
                Resolution = "4K HDR",
                Fps = 60
            });
        }
    }
}
