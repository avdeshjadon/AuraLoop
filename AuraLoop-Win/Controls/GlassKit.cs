using System;
using System.Runtime.InteropServices;
using Microsoft.UI;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Media;
using Windows.UI;
using AuraLoop.Native;

namespace AuraLoop.Controls
{
    /// <summary>
    /// Liquid Glass and Mica styling toolkit for Windows WinUI 3.
    /// Parallels macOS GlassKit.swift for visual fidelity and dark-mode elegance.
    /// </summary>
    public static class GlassKit
    {
        // Liquid Glass Palette Constants
        public static readonly Color GlassDarkBackground = Color.FromArgb(255, 9, 13, 22);
        public static readonly Color GlassCardSurface = Color.FromArgb(210, 19, 27, 46);
        public static readonly Color GlassBorderStroke = Color.FromArgb(255, 36, 50, 77);
        public static readonly Color AccentElectricBlue = Color.FromArgb(255, 60, 196, 240);
        public static readonly Color AccentMint = Color.FromArgb(255, 56, 214, 165);
        public static readonly Color TextInk = Color.FromArgb(255, 242, 245, 248);
        public static readonly Color TextMuted = Color.FromArgb(255, 154, 164, 178);

        /// <summary>
        /// Enables Windows 11 Mica backdrop or Windows 10 Acrylic on a native window handle.
        /// </summary>
        public static bool ApplySystemBackdrop(IntPtr hwnd, bool isDark = true)
        {
            try
            {
                int darkMode = isDark ? 1 : 0;
                Win32.DwmSetWindowAttribute(hwnd, Win32.DWMWA_USE_IMMERSIVE_DARK_MODE, ref darkMode, sizeof(int));

                // DWMWA_SYSTEMBACKDROP_TYPE: 2 = Mica, 3 = Acrylic, 4 = Mica Alt
                int backdropType = 2; // Mica
                Win32.DwmSetWindowAttribute(hwnd, Win32.DWMWA_SYSTEMBACKDROP_TYPE, ref backdropType, sizeof(int));
                return true;
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Creates a modern frosted glass card border with rounded corners.
        /// </summary>
        public static Border CreateGlassCard(UIElement content, double cornerRadius = 14)
        {
            return new Border
            {
                Background = new SolidColorBrush(GlassCardSurface),
                BorderBrush = new SolidColorBrush(GlassBorderStroke),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(cornerRadius),
                Padding = new Thickness(16),
                Child = content
            };
        }

        /// <summary>
        /// Creates a category or quality pill tag.
        /// </summary>
        public static Border CreatePillBadge(string text, Color background, Color foreground)
        {
            return new Border
            {
                Background = new SolidColorBrush(background),
                CornerRadius = new CornerRadius(10),
                Padding = new Thickness(8, 3),
                Child = new TextBlock
                {
                    Text = text,
                    FontSize = 10,
                    FontWeight = Microsoft.UI.Text.FontWeights.SemiBold,
                    Foreground = new SolidColorBrush(foreground)
                }
            };
        }
    }
}
