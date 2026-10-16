using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using AuraLoop.Native;

namespace AuraLoop.Engine
{
    /// <summary>
    /// Monitors system idle timeout and controls interactive wallpaper screen saver overlay.
    /// </summary>
    public class ScreenSaverEngine
    {
        private static ScreenSaverEngine? _instance;
        public static ScreenSaverEngine Instance => _instance ??= new ScreenSaverEngine();

        public event Action? OnScreenSaverTriggered;
        public event Action? OnScreenSaverDismissed;

        public bool IsScreenSaverActive { get; private set; }
        public int IdleTimeoutMinutes { get; set; } = 5;

        private CancellationTokenSource? _cts;

        private ScreenSaverEngine() { }

        public void Start()
        {
            _cts = new CancellationTokenSource();
            Task.Run(() => IdleMonitorLoop(_cts.Token));
        }

        public void Stop()
        {
            _cts?.Cancel();
        }

        private async Task IdleMonitorLoop(CancellationToken token)
        {
            while (!token.IsCancellationRequested)
            {
                try
                {
                    if (IdleTimeoutMinutes > 0)
                    {
                        var lastInput = new Win32.LASTINPUTINFO();
                        lastInput.cbSize = (uint)Marshal.SizeOf(lastInput);

                        if (Win32.GetLastInputInfo(ref lastInput))
                        {
                            uint elapsedMs = (uint)Environment.TickCount - lastInput.dwTime;
                            double idleMinutes = elapsedMs / 60000.0;

                            if (idleMinutes >= IdleTimeoutMinutes && !IsScreenSaverActive)
                            {
                                IsScreenSaverActive = true;
                                OnScreenSaverTriggered?.Invoke();
                                Debug.WriteLine("[AuraLoop] Idle threshold reached, screen saver activated.");
                            }
                            else if (idleMinutes < 0.1 && IsScreenSaverActive)
                            {
                                IsScreenSaverActive = false;
                                OnScreenSaverDismissed?.Invoke();
                                Debug.WriteLine("[AuraLoop] Activity detected, screen saver dismissed.");
                            }
                        }
                    }
                }
                catch { }

                await Task.Delay(2000, token);
            }
        }
    }
}
