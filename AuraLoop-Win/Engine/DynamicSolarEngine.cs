using System;
using System.Linq;
using AuraLoop.Models;

namespace AuraLoop.Engine
{
    /// <summary>
    /// Calculates solar progression for dynamic 24-hour time-shifting wallpapers.
    /// </summary>
    public class DynamicSolarEngine
    {
        private static DynamicSolarEngine? _instance;
        public static DynamicSolarEngine Instance => _instance ??= new DynamicSolarEngine();

        public event Action<WallpaperItem, DynamicKeyframe>? OnKeyframeChanged;

        private DynamicSolarEngine() { }

        public DynamicKeyframe? GetCurrentKeyframe(WallpaperItem wallpaper)
        {
            if (!wallpaper.IsDynamic || wallpaper.DynamicKeyframes.Count == 0)
                return null;

            double currentHour = DateTime.Now.Hour + (DateTime.Now.Minute / 60.0);

            // Find keyframe closest to current hour without exceeding, or wrap around
            var sorted = wallpaper.DynamicKeyframes.OrderBy(k => k.Hour).ToList();
            var active = sorted.LastOrDefault(k => k.Hour <= currentHour) ?? sorted.Last();

            return active;
        }

        public string GetTimeOfDayPhase()
        {
            int hour = DateTime.Now.Hour;
            return hour switch
            {
                >= 5 and < 8 => "Dawn",
                >= 8 and < 12 => "Morning",
                >= 12 and < 17 => "Afternoon",
                >= 17 and < 20 => "Sunset",
                >= 20 and < 23 => "Dusk",
                _ => "Night"
            };
        }
    }
}
