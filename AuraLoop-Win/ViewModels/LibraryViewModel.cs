using System.Collections.ObjectModel;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using AuraLoop.Models;
using AuraLoop.Services;

namespace AuraLoop.ViewModels
{
    public partial class LibraryViewModel : ObservableObject
    {
        public ObservableCollection<WallpaperItem> DownloadedItems => Store.Instance.Downloaded;
        public ObservableCollection<WallpaperItem> CustomItems => LibraryService.Instance.ImportedWallpapers;
        public ObservableCollection<Playlist> Playlists => LibraryService.Instance.Playlists;

        [ObservableProperty]
        private string _totalStorageUsed = "420.5 MB";

        [ObservableProperty]
        private int _totalItemsCount = 5;

        public LibraryViewModel()
        {
        }

        [RelayCommand]
        public async Task ApplyItemAsync(WallpaperItem item)
        {
            await Store.Instance.ApplyWallpaperAsync(item, ApplyTarget.All, ApplySurface.Desktop);
        }

        [RelayCommand]
        public void ImportFile(string path)
        {
            var item = LibraryService.Instance.ImportCustomVideo(path);
            if (item != null)
            {
                TotalItemsCount++;
            }
        }
    }
}
