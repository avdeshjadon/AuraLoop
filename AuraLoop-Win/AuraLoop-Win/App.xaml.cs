using System;
using Microsoft.UI.Xaml;
using AuraLoop.Engine;
using AuraLoop.Views;

namespace AuraLoop
{
    public partial class App : Application
    {
        public static MainWindow? MainWindowInstance { get; private set; }
        public static WallpaperViewportWindow? ViewportWindowInstance { get; private set; }
        public static PlaybackMonitor Monitor { get; } = new();

        public App()
        {
            this.InitializeComponent();
        }

        protected override void OnLaunched(LaunchActivatedEventArgs args)
        {
            // 1. Create and attach Desktop Wallpaper Viewport Window
            ViewportWindowInstance = new WallpaperViewportWindow();
            ViewportWindowInstance.Activate();

            // Hook onto Windows Desktop (WorkerW behind icons)
            IntPtr viewportHwnd = WinRT.Interop.WindowNative.GetWindowHandle(ViewportWindowInstance);
            WallpaperEngine.Instance.AttachWindow(viewportHwnd, 1920, 1080);

            // 2. Start power and window auto-pause monitor
            Monitor.Start();

            // 3. Launch Main Application Gallery Window
            MainWindowInstance = new MainWindow();
            MainWindowInstance.Activate();
        }
    }
}
