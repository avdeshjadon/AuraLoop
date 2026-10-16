using System;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AuraLoop.Models;
using AuraLoop.Native;
using AuraLoop.Services;

namespace AuraLoop.Engine
{
    /// <summary>
    /// Evaluates scheduled automation rules, battery thresholds, and app launches.
    /// Parallels macOS AutomationScheduler.swift.
    /// </summary>
    public class AutomationScheduler
    {
        private static AutomationScheduler? _instance;
        public static AutomationScheduler Instance => _instance ??= new AutomationScheduler();

        private CancellationTokenSource? _cts;

        private AutomationScheduler() { }

        public void Start()
        {
            _cts = new CancellationTokenSource();
            Task.Run(() => ScheduleLoop(_cts.Token));
        }

        public void Stop()
        {
            _cts?.Cancel();
        }

        private async Task ScheduleLoop(CancellationToken token)
        {
            while (!token.IsCancellationRequested)
            {
                try
                {
                    EvaluateRules();
                }
                catch { }

                await Task.Delay(10000, token);
            }
        }

        private void EvaluateRules()
        {
            var rules = Store.Instance.Automations.Where(r => r.IsEnabled).ToList();
            if (rules.Count == 0) return;

            string currentTime = DateTime.Now.ToString("HH:mm");

            foreach (var rule in rules)
            {
                switch (rule.Trigger)
                {
                    case AutomationTrigger.TimeOfDay:
                        if (rule.TriggerValue.Contains(currentTime))
                        {
                            ApplyRuleTarget(rule);
                        }
                        break;

                    case AutomationTrigger.BatteryThreshold:
                        if (Win32.GetSystemPowerStatus(out var status) && status.ACLineStatus == 0)
                        {
                            if (int.TryParse(rule.TriggerValue, out int threshold) && status.BatteryLifePercent <= threshold)
                            {
                                ApplyRuleTarget(rule);
                            }
                        }
                        break;
                }
            }
        }

        private void ApplyRuleTarget(AutomationRule rule)
        {
            if (string.IsNullOrEmpty(rule.TargetWallpaperId)) return;

            var target = Store.Instance.AllWallpapers.FirstOrDefault(w => w.Id == rule.TargetWallpaperId);
            if (target != null && target != Store.Instance.ActiveWallpaper)
            {
                _ = Store.Instance.ApplyWallpaperAsync(target, ApplyTarget.All, ApplySurface.Desktop);
                Debug.WriteLine($"[AuraLoopScheduler] Triggered rule: {rule.Name} -> {target.Title}");
            }
        }
    }
}
