using System.Linq;
using Xunit;
using AuraLoop.Services;

namespace AuraLoop.Tests
{
    public class CatalogServiceTests
    {
        [Fact]
        public void CatalogService_LoadsCuratedWallpapers()
        {
            var catalog = CatalogService.Instance;
            Assert.NotEmpty(catalog.Wallpapers);
            Assert.Contains(catalog.Wallpapers, w => w.Title == "Snowfall in Forest");
        }

        [Fact]
        public void CatalogService_ToggleFavorite_ChangesState()
        {
            var catalog = CatalogService.Instance;
            var item = catalog.Wallpapers.First();
            bool initial = item.IsFavorite;

            catalog.ToggleFavorite(item.Id);
            Assert.Equal(!initial, item.IsFavorite);

            // Revert back
            catalog.ToggleFavorite(item.Id);
            Assert.Equal(initial, item.IsFavorite);
        }

        [Fact]
        public void CatalogService_Categories_IncludeExpectedPresets()
        {
            var catalog = CatalogService.Instance;
            Assert.Contains("All", catalog.Categories);
            Assert.Contains("Nature", catalog.Categories);
            Assert.Contains("Space", catalog.Categories);
            Assert.Contains("Cities", catalog.Categories);
            Assert.Contains("Dynamic", catalog.Categories);
        }

        [Fact]
        public void CatalogService_FilterByCategory_ReturnsMatchingItems()
        {
            var catalog = CatalogService.Instance;
            var natureItems = catalog.GetWallpapersByCategory("Nature");
            Assert.NotEmpty(natureItems);
            Assert.All(natureItems, w => Assert.Equal("Nature", w.Category));
        }

        [Fact]
        public void CatalogService_Search_ReturnsMatchingResults()
        {
            var catalog = CatalogService.Instance;
            var results = catalog.SearchWallpapers("Snowfall").ToList();
            Assert.NotEmpty(results);
            Assert.Contains(results, w => w.Title.Contains("Snowfall"));
        }
    }
}
