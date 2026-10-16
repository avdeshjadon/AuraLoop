using System;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using AuraLoop.Models;
using AuraLoop.Services;

namespace AuraLoop.ViewModels
{
    public partial class ExploreViewModel : ObservableObject
    {
        [ObservableProperty]
        private string _selectedCategory = "All";

        [ObservableProperty]
        private string _searchQuery = string.Empty;

        public ObservableCollection<string> Categories => CatalogService.Instance.Categories;
        public ObservableCollection<WallpaperItem> Wallpapers => Store.Instance.FilteredWallpapers;

        public ExploreViewModel()
        {
        }

        partial void OnSelectedCategoryChanged(string value)
        {
            Store.Instance.SetCategoryFilter(value);
        }

        partial void OnSearchQueryChanged(string value)
        {
            Store.Instance.SetSearch(value);
        }

        [RelayCommand]
        public async Task ApplyWallpaperAsync(WallpaperItem item)
        {
            await Store.Instance.ApplyWallpaperAsync(item, ApplyTarget.All, ApplySurface.Desktop);
        }

        [RelayCommand]
        public void ToggleLike(WallpaperItem item)
        {
            Store.Instance.ToggleLike(item.Id);
        }
    }
}
