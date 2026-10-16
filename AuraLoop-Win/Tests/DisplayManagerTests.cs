using Xunit;
using AuraLoop.Native;

namespace AuraLoop.Tests
{
    public class DisplayManagerTests
    {
        [Fact]
        public void DisplayManager_GetConnectedMonitors_ReturnsAtLeastOne()
        {
            var monitors = DisplayManager.GetConnectedMonitors();
            Assert.NotEmpty(monitors);

            var primary = monitors.Find(m => m.IsPrimary);
            Assert.NotNull(primary);
            Assert.True(primary.Width > 0);
            Assert.True(primary.Height > 0);
        }

        [Fact]
        public void DisplayManager_Displays_HaveResolutionStrings()
        {
            var monitors = DisplayManager.GetConnectedMonitors();
            foreach (var mon in monitors)
            {
                Assert.False(string.IsNullOrEmpty(mon.ResolutionText));
                Assert.Contains("x", mon.ResolutionText);
            }
        }
    }
}
