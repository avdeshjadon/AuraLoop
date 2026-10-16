using System;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Controls.Primitives;

namespace AuraLoop.Controls
{
    public sealed partial class DayTimelineControl : UserControl
    {
        public event EventHandler<double>? HourChanged;

        public DayTimelineControl()
        {
            this.InitializeComponent();
            HourSlider.Value = DateTime.Now.Hour + (DateTime.Now.Minute / 60.0);
        }

        private void HourSlider_ValueChanged(object sender, RangeBaseValueChangedEventArgs e)
        {
            int hour = (int)e.NewValue;
            int minute = (int)((e.NewValue - hour) * 60);
            if (CurrentPhaseText != null)
            {
                CurrentPhaseText.Text = $"Keyframe Time: {hour:D2}:{minute:D2}";
            }
            HourChanged?.Invoke(this, e.NewValue);
        }
    }
}
