using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using AuraLoop.Native;

namespace AuraLoop.Engine
{
    /// <summary>
    /// Desktop Live Wallpaper Engine for Windows.
    /// Injects rendering surfaces directly into Windows' WorkerW hierarchy behind desktop icons.
    /// </summary>
    public class WallpaperEngine
    {
        private static WallpaperEngine? _instance;
        public static WallpaperEngine Instance => _instance ??= new WallpaperEngine();

        public IntPtr WorkerWHwnd { get; private set; } = IntPtr.Zero;
        public IntPtr CurrentViewportHwnd { get; private set; } = IntPtr.Zero;
        public bool IsAttached => CurrentViewportHwnd != IntPtr.Zero && WorkerWHwnd != IntPtr.Zero;

        private WallpaperEngine() { }

        /// <summary>
        /// Sends message 0x052C to Progman to spawn and retrieve the WorkerW window 
        /// which sits directly behind desktop icons.
        /// </summary>
        public bool InitializeDesktopTarget()
        {
            try
            {
                IntPtr progman = Win32.FindWindow("Progman", null);
                if (progman == IntPtr.Zero)
                {
                    Debug.WriteLine("[AuraLoopEngine] Could not locate Progman.");
                    return false;
                }

                // Send 0x052C to Progman to trigger WorkerW creation
                Win32.SendMessageTimeout(
                    progman,
                    Win32.WM_SPAWN_WORKERW,
                    new IntPtr(0xD),
                    new IntPtr(0x1),
                    Win32.SMTO_NORMAL,
                    1000,
                    out _);

                IntPtr foundWorkerW = IntPtr.Zero;

                // Find the WorkerW that sits right behind the shell desktop view
                Win32.EnumWindows((tophandle, _) =>
                {
                    IntPtr defView = Win32.FindWindowEx(tophandle, IntPtr.Zero, "SHELLDLL_DefView", null);
                    if (defView != IntPtr.Zero)
                    {
                        // The WorkerW directly behind Progman is the next window in z-order
                        foundWorkerW = Win32.FindWindowEx(IntPtr.Zero, tophandle, "WorkerW", null);
                    }
                    return true;
                }, IntPtr.Zero);

                if (foundWorkerW == IntPtr.Zero)
                {
                    // Fallback to Progman if WorkerW was not separately detached
                    foundWorkerW = progman;
                }

                WorkerWHwnd = foundWorkerW;
                Debug.WriteLine($"[AuraLoopEngine] Attached to desktop target handle: {WorkerWHwnd:X8}");
                return true;
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"[AuraLoopEngine] Initialization failed: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Injects the specified viewport window handle into the Windows desktop background.
        /// </summary>
        public bool AttachWindow(IntPtr viewportHwnd, int width, int height)
        {
            if (WorkerWHwnd == IntPtr.Zero && !InitializeDesktopTarget())
                return false;

            try
            {
                // Remove borders and titlebar, set as child window
                long style = (long)Win32.GetWindowLongPtr(viewportHwnd, Win32.GWL_STYLE);
                style &= ~0x00C00000L; // WS_CAPTION
                style &= ~0x00800000L; // WS_BORDER
                style |= Win32.WS_CHILD | Win32.WS_VISIBLE;
                Win32.SetWindowLongPtr(viewportHwnd, Win32.GWL_STYLE, new IntPtr(style));

                // Make WorkerW the parent of this window
                Win32.SetParent(viewportHwnd, WorkerWHwnd);

                // Resize to desktop dimensions without grabbing focus
                Win32.SetWindowPos(
                    viewportHwnd,
                    IntPtr.Zero,
                    0, 0,
                    width, height,
                    Win32.SWP_NOZORDER | Win32.SWP_NOACTIVATE | Win32.SWP_SHOWWINDOW);

                CurrentViewportHwnd = viewportHwnd;
                return true;
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"[AuraLoopEngine] AttachWindow error: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Restores standard desktop when closing the app.
        /// </summary>
        public void Detach()
        {
            if (CurrentViewportHwnd != IntPtr.Zero)
            {
                Win32.ShowWindow(CurrentViewportHwnd, Win32.SW_HIDE);
                Win32.SetParent(CurrentViewportHwnd, IntPtr.Zero);
                CurrentViewportHwnd = IntPtr.Zero;
            }
        }
    }
}
