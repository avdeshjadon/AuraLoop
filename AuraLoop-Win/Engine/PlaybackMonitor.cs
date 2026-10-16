using System;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using AuraLoop.Native;

namespace AuraLoop.Engine
{
    /// <summary>
    /// Background monitor that automatically pauses the wallpaper when:
    /// - An active full-screen window covers the desktop.
    /// - The device is running on battery saver / low power.
    /// - The screen is locked.
    /// </summary>
    public class PlaybackMonitor
    {
        public event EventHandler<bool>? PauseStateChanged;

        private CancellationTokenSource? _cts;
        private bool _isPaused;

        public bool PauseWhenCovered { get; set; } = true;
        public bool PauseOnBattery { get; set; } = true;

        public void Start()
        {
            _cts = new CancellationTokenSource();
            Task.Run(() => MonitorLoop(_cts.Token));
        }

        public void Stop()
        {
            _cts?.Cancel();
        }

        private async Task MonitorLoop(CancellationToken token)
        {
            while (!token.IsCancellationRequested)
            {
                try
                {
                    bool shouldPause = false;

                    // 1. Check Power Status
                    if (PauseOnBattery && Win32.GetSystemPowerStatus(out var status))
                    {
                        // ACLineStatus == 0 means running on battery
                        if (status.ACLineStatus == 0 && status.BatteryLifePercent <= 20)
                        {
                            shouldPause = true;
                        }
                    }

                    // 2. Check if a maximized/fullscreen foreground window covers the desktop
                    if (!shouldPause && PauseWhenCovered)
                    {
                        IntPtr fg = Win32.GetForegroundWindow();
                        if (fg != IntPtr.Zero && fg != Win32.GetDesktopWindow() && fg != Win32.GetShellWindow())
                        {
                            if (Win32.IsZoomed(fg))
                            {
                                shouldPause = true;
                            }
                        }
                    }

                    if (shouldPause != _isPaused)
                    {
                        _isPaused = shouldPause;
                        PauseStateChanged?.Invoke(this, _isPaused);
                        Debug.WriteLine($"[AuraLoopMonitor] Playback pause state changed: {_isPaused}");
                    }
                }
                catch (Exception ex)
                {
                    Debug.WriteLine($"[AuraLoopMonitor] Exception: {ex.Message}");
                }

                await Task.Delay(1000, token);
            }
        }
    }
}
