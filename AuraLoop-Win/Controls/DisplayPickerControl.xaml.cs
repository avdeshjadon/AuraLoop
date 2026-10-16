using System;
using System.Collections.ObjectModel;
using Microsoft.UI.Xaml.Controls;
using AuraLoop.Models;
using AuraLoop.Native;

namespace AuraLoop.Controls
{
    public sealed partial class DisplayPickerControl : UserControl
    {
        public ObservableCollection<DisplayInfo> Monitors { get; } = new();
        public event EventHandler<DisplayInfo>? DisplaySelected;

        public DisplayPickerControl()
        {
            this.InitializeComponent();
            RefreshDisplays();
        }

        public void RefreshDisplays()
        {
            Monitors.Clear();
            var list = DisplayManager.GetConnectedMonitors();
            foreach (var mon in list)
            {
                Monitors.Add(mon);
            }
            DisplaysListView.ItemsSource = Monitors;
            if (Monitors.Count > 0)
            {
                DisplaysListView.SelectedIndex = 0;
            }
        }

        private void DisplaysListView_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (DisplaysListView.SelectedItem is DisplayInfo selected)
            {
                DisplaySelected?.Invoke(this, selected);
            }
        }
    }
}
