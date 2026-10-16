using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using AuraLoop.Models;
using AuraLoop.Services;

namespace AuraLoop.ViewModels
{
    public partial class SettingsViewModel : ObservableObject
    {
        [ObservableProperty]
        private bool _launchAtStartup;

        [ObservableProperty]
        private bool _minimizeToTray;

        [ObservableProperty]
        private bool _pauseWhenCovered;

        [ObservableProperty]
        private bool _pauseOnBattery;

        [ObservableProperty]
        private bool _syncLockScreen;

        [ObservableProperty]
        private int _idleTimeoutMinutes;

        public SettingsViewModel()
        {
            var cur = SettingsService.Instance.Current;
            LaunchAtStartup = cur.LaunchAtStartup;
            MinimizeToTray = cur.MinimizeToTray;
            PauseWhenCovered = cur.PauseWhenCovered;
            PauseOnBattery = cur.PauseOnBatterySaver;
            SyncLockScreen = cur.SyncLockScreen;
            IdleTimeoutMinutes = cur.ScreenSaverIdleMinutes;
        }

        [RelayCommand]
        public void Save()
        {
            var cur = SettingsService.Instance.Current;
            cur.LaunchAtStartup = LaunchAtStartup;
            cur.MinimizeToTray = MinimizeToTray;
            cur.PauseWhenCovered = PauseWhenCovered;
            cur.PauseOnBatterySaver = PauseOnBattery;
            cur.SyncLockScreen = SyncLockScreen;
            cur.ScreenSaverIdleMinutes = IdleTimeoutMinutes;
            SettingsService.Instance.SaveSettings();
        }
    }
}
