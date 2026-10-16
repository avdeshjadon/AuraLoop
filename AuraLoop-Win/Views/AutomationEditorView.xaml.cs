using System.Collections.ObjectModel;
using Microsoft.UI.Xaml.Controls;
using AuraLoop.Models;

namespace AuraLoop.Views
{
    public sealed partial class AutomationEditorView : Page
    {
        public ObservableCollection<AutomationRule> Rules { get; } = new();

        public AutomationEditorView()
        {
            this.InitializeComponent();
            LoadSampleRules();
        }

        private void LoadSampleRules()
        {
            Rules.Clear();
            Rules.Add(new AutomationRule
            {
                Name = "Sunset Transition to Tokyo Midnight",
                Trigger = AutomationTrigger.TimeOfDay,
                TriggerValue = "Trigger at 19:30 Daily",
                TargetWallpaperId = "e5f2991b-77e4-44b2-9a31-62fa9021dd33",
                IsEnabled = true
            });

            Rules.Add(new AutomationRule
            {
                Name = "Pause Live Rendering on Battery Saver",
                Trigger = AutomationTrigger.BatteryThreshold,
                TriggerValue = "When battery drops below 20%",
                TargetWallpaperId = string.Empty,
                IsEnabled = true
            });

            Rules.Add(new AutomationRule
            {
                Name = "Game Launch Low-Overhead Pause",
                Trigger = AutomationTrigger.ForegroundApp,
                TriggerValue = "When Fullscreen 3D DirectX Game runs",
                TargetWallpaperId = string.Empty,
                IsEnabled = true
            });

            RulesListView.ItemsSource = Rules;
        }
    }
}
