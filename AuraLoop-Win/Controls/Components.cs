using System;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Media;
using Windows.UI;

namespace AuraLoop.Controls
{
    /// <summary>
    /// Reusable UI component builders and dialogs for Windows WinUI 3.
    /// Parallels macOS Components.swift.
    /// </summary>
    public static class Components
    {
        public static Button CreatePillButton(string label, string glyph, bool isAccent, RoutedEventHandler onClick)
        {
            var icon = new FontIcon
            {
                Glyph = glyph,
                FontSize = 13,
                Foreground = isAccent ? new SolidColorBrush(Color.FromArgb(255, 9, 13, 22)) : new SolidColorBrush(GlassKit.TextInk)
            };

            var text = new TextBlock
            {
                Text = label,
                FontSize = 13,
                FontWeight = isAccent ? Microsoft.UI.Text.FontWeights.Bold : Microsoft.UI.Text.FontWeights.SemiBold,
                Foreground = isAccent ? new SolidColorBrush(Color.FromArgb(255, 9, 13, 22)) : new SolidColorBrush(GlassKit.TextInk)
            };

            var stack = new StackPanel
            {
                Orientation = Orientation.Horizontal,
                Spacing = 8,
                Children = { icon, text }
            };

            var btn = new Button
            {
                Content = stack,
                CornerRadius = new CornerRadius(18),
                Padding = new Thickness(16, 7),
                Background = isAccent ? new SolidColorBrush(GlassKit.AccentElectricBlue) : new SolidColorBrush(Color.FromArgb(255, 26, 36, 59)),
                BorderBrush = isAccent ? null : new SolidColorBrush(GlassKit.GlassBorderStroke),
                BorderThickness = isAccent ? new Thickness(0) : new Thickness(1)
            };

            btn.Click += onClick;
            return btn;
        }

        public static Border CreateMetricCard(string label, string value, Color accentColor)
        {
            var stack = new StackPanel { Spacing = 4 };

            stack.Children.Add(new TextBlock
            {
                Text = label.ToUpperInvariant(),
                FontSize = 10,
                FontWeight = Microsoft.UI.Text.FontWeights.Bold,
                Foreground = new SolidColorBrush(GlassKit.TextMuted)
            });

            stack.Children.Add(new TextBlock
            {
                Text = value,
                FontSize = 20,
                FontWeight = Microsoft.UI.Text.FontWeights.Bold,
                Foreground = new SolidColorBrush(accentColor)
            });

            return GlassKit.CreateGlassCard(stack, 12);
        }
    }
}
