using System.Linq;
using Xunit;
using AuraLoop.Services;

namespace AuraLoop.Tests
{
    public class StoreTests
    {
        [Fact]
        public void Store_Instance_InitializesWallpapers()
        {
            var store = Store.Instance;
            Assert.NotEmpty(store.AllWallpapers);
            Assert.NotNull(store.ActiveWallpaper);
        }

        [Fact]
        public void Store_SetPlaybackSpeed_ClampsWithinBounds()
        {
            var store = Store.Instance;

            store.SetPlaybackSpeed(5.0);
            Assert.Equal(3.0, store.PlaybackSpeed);

            store.SetPlaybackSpeed(0.05);
            Assert.Equal(0.25, store.PlaybackSpeed);

            store.SetPlaybackSpeed(1.5);
            Assert.Equal(1.5, store.PlaybackSpeed);
        }

        [Fact]
        public void Store_SetVolume_ClampsBetweenZeroAndOne()
        {
            var store = Store.Instance;

            store.SetVolume(-0.5);
            Assert.Equal(0.0, store.Volume);

            store.SetVolume(2.5);
            Assert.Equal(1.0, store.Volume);

            store.SetVolume(0.75);
            Assert.Equal(0.75, store.Volume);
        }

        [Fact]
        public void Store_ToggleLike_MaintainsCollections()
        {
            var store = Store.Instance;
            var item = store.AllWallpapers.First();
            string id = item.Id;

            bool wasLiked = item.IsFavorite;
            store.ToggleLike(id);

            Assert.Equal(!wasLiked, item.IsFavorite);

            // Revert
            store.ToggleLike(id);
            Assert.Equal(wasLiked, item.IsFavorite);
        }
    }
}
