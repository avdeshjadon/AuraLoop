using System;

namespace AuraLoop.Models
{
    public enum AutomationTrigger
    {
        TimeOfDay,      // Triggers at specific time (e.g. 20:00)
        BatteryThreshold, // Triggers on low battery (e.g. < 20%)
        ForegroundApp   // Triggers when a specific process launches
    }

    public class AutomationRule
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = "Night Mode Wallpaper";
        public AutomationTrigger Trigger { get; set; } = AutomationTrigger.TimeOfDay;
        public string TriggerValue { get; set; } = "20:00"; // Time "HH:mm" or battery percent "20" or app "game.exe"
        public string TargetWallpaperId { get; set; } = string.Empty;
        public bool IsEnabled { get; set; } = true;
    }
}
