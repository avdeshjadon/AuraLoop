using Xunit;
using AuraLoop.Services;

namespace AuraLoop.Tests
{
    public class SettingsServiceTests
    {
        [Fact]
        public void SettingsService_Defaults_AreValid()
        {
            var settings = SettingsService.Instance.Current;
            Assert.NotNull(settings);
            Assert.True(settings.MinimizeToTray);
            Assert.True(settings.PauseWhenCovered);
            Assert.True(settings.PauseOnBatterySaver);
            Assert.Equal(60, settings.TargetFps);
            Assert.InRange(settings.Volume, 0.0, 1.0);
        }

        [Fact]
        public void SettingsService_SaveSettings_TriggersEvent()
        {
            var service = SettingsService.Instance;
            bool eventFired = false;

            service.OnSettingsChanged += (s) => eventFired = true;
            service.SaveSettings();

            Assert.True(eventFired);
        }
    }
}
