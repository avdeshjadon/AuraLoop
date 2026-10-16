using Microsoft.UI.Xaml;
using AuraLoop.Views;

namespace AuraLoop
{
    public sealed partial class MainWindow : Window
    {
        private readonly HomeView _homeView = new();
        private readonly ExploreView _exploreView = new();
        private readonly LibraryView _libraryView = new();
        private readonly FavoritesView _favoritesView = new();
        private readonly SettingsView _settingsView = new();

        public MainWindow()
        {
            this.InitializeComponent();
            this.Title = "AuraLoop - Live Wallpapers";

            // Default to HomeView
            MainContentFrame.Content = _homeView;
        }

        private void NavHome_Click(object sender, RoutedEventArgs e) => MainContentFrame.Content = _homeView;
        private void NavExplore_Click(object sender, RoutedEventArgs e) => MainContentFrame.Content = _exploreView;
        private void NavLibrary_Click(object sender, RoutedEventArgs e) => MainContentFrame.Content = _libraryView;
        private void NavFavorites_Click(object sender, RoutedEventArgs e) => MainContentFrame.Content = _favoritesView;
        private void NavSettings_Click(object sender, RoutedEventArgs e) => MainContentFrame.Content = _settingsView;
    }
}
