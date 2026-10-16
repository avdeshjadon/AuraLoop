using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using AuraLoop.Models;

namespace AuraLoop.Native
{
    /// <summary>
    /// Multi-monitor enumeration and geometry management for Windows desktop surfaces.
    /// </summary>
    public static class DisplayManager
    {
        public static List<DisplayInfo> GetConnectedMonitors()
        {
            var monitors = new List<DisplayInfo>();
            int index = 0;

            Win32.EnumDisplayMonitors(IntPtr.Zero, IntPtr.Zero, (IntPtr hMonitor, IntPtr hdcMonitor, ref Win32.RECT lprcMonitor, IntPtr dwData) =>
            {
                var mi = new Win32.MONITORINFOEX();
                mi.cbSize = Marshal.SizeOf(typeof(Win32.MONITORINFOEX));

                if (Win32.GetMonitorInfo(hMonitor, ref mi))
                {
                    bool isPrimary = (mi.dwFlags & 1) != 0;
                    monitors.Add(new DisplayInfo
                    {
                        Index = index++,
                        Handle = hMonitor,
                        DeviceName = mi.szDevice,
                        DisplayName = isPrimary ? $"Primary Display ({mi.rcMonitor.Width}x{mi.rcMonitor.Height})" : $"Display {index} ({mi.rcMonitor.Width}x{mi.rcMonitor.Height})",
                        Left = mi.rcMonitor.Left,
                        Top = mi.rcMonitor.Top,
                        Width = mi.rcMonitor.Width,
                        Height = mi.rcMonitor.Height,
                        IsPrimary = isPrimary
                    });
                }
                return true;
            }, IntPtr.Zero);

            if (monitors.Count == 0)
            {
                // Fallback virtual screen
                monitors.Add(new DisplayInfo
                {
                    Index = 0,
                    Handle = IntPtr.Zero,
                    DeviceName = "DISPLAY1",
                    DisplayName = "Primary Display (1920x1080)",
                    Left = 0,
                    Top = 0,
                    Width = 1920,
                    Height = 1080,
                    IsPrimary = true
                });
            }

            return monitors;
        }
    }
}
