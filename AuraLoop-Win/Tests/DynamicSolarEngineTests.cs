using System.Collections.Generic;
using Xunit;
using AuraLoop.Engine;
using AuraLoop.Models;

namespace AuraLoop.Tests
{
    public class DynamicSolarEngineTests
    {
        [Fact]
        public void DynamicSolarEngine_GetTimeOfDayPhase_ReturnsValidString()
        {
            var engine = DynamicSolarEngine.Instance;
            string phase = engine.GetTimeOfDayPhase();
            Assert.Contains(phase, new[] { "Dawn", "Morning", "Afternoon", "Sunset", "Dusk", "Night" });
        }

        [Fact]
        public void DynamicSolarEngine_DynamicWallpaper_ResolvesKeyframe()
        {
            var engine = DynamicSolarEngine.Instance;
            var wp = new WallpaperItem
            {
                Title = "Dynamic Mojave",
                IsDynamic = true,
                DynamicKeyframes = new List<DynamicKeyframe>
                {
                    new() { Hour = 6, Label = "Dawn" },
                    new() { Hour = 12, Label = "Noon" },
                    new() { Hour = 18, Label = "Sunset" },
                    new() { Hour = 22, Label = "Night" }
                }
            };

            var keyframe = engine.GetCurrentKeyframe(wp);
            Assert.NotNull(keyframe);
            Assert.Contains(keyframe.Label, new[] { "Dawn", "Noon", "Sunset", "Night" });
        }

        [Fact]
        public void DynamicSolarEngine_StaticWallpaper_ReturnsNullKeyframe()
        {
            var engine = DynamicSolarEngine.Instance;
            var wp = new WallpaperItem { Title = "Static Image", IsDynamic = false };

            var keyframe = engine.GetCurrentKeyframe(wp);
            Assert.Null(keyframe);
        }
    }
}
