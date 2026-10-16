using Xunit;
using AuraLoop.Services;

namespace AuraLoop.Tests
{
    public class AppleAerialServiceTests
    {
        [Fact]
        public void AppleAerialService_ContainsCuratedAerials()
        {
            var service = AppleAerialService.Instance;
            Assert.NotEmpty(service.Aerials);
        }

        [Fact]
        public void AppleAerialService_Entries_HaveValidUrlsAndResolution()
        {
            var service = AppleAerialService.Instance;
            foreach (var aerial in service.Aerials)
            {
                Assert.False(string.IsNullOrEmpty(aerial.Title));
                Assert.False(string.IsNullOrEmpty(aerial.VideoUrl));
                Assert.Equal("4K HDR", aerial.Resolution);
                Assert.Equal(60, aerial.Fps);
            }
        }
    }
}
