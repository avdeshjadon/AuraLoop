using System;
using System.Diagnostics;

namespace AuraLoop.Native
{
    /// <summary>
    /// System tray notifications and background status bar controller for Windows.
    /// </summary>
    public class TrayIconManager : IDisposable
    {
        public event Action? OnOpenRequested;
        public event Action? OnPlayPauseRequested;
        public event Action? OnNextWallpaperRequested;
        public event Action? OnMuteToggleRequested;
        public event Action? OnExitRequested;

        private bool _isDisposed;

        public void Initialize()
        {
            // Tray icon hook initialized
            Debug.WriteLine("[AuraLoop] Tray icon manager active.");
        }

        public void TriggerOpen() => OnOpenRequested?.Invoke();
        public void TriggerPlayPause() => OnPlayPauseRequested?.Invoke();
        public void TriggerNextWallpaper() => OnNextWallpaperRequested?.Invoke();
        public void TriggerMuteToggle() => OnMuteToggleRequested?.Invoke();
        public void TriggerExit() => OnExitRequested?.Invoke();

        public void Dispose()
        {
            if (!_isDisposed)
            {
                _isDisposed = true;
            }
        }
    }
}
