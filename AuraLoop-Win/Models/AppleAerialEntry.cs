using System;
using System.Collections.Generic;

namespace AuraLoop.Models
{
    public class AppleAerialEntry
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Subcategory { get; set; } = "Landscape"; // Landscape, City, Earth, Underwater
        public string VideoUrl { get; set; } = string.Empty;
        public string PreviewUrl { get; set; } = string.Empty;
        public string ShowInPhase { get; set; } = "Day"; // Day, Night, All
        public string Resolution { get; set; } = "4K HDR";
        public int Fps { get; set; } = 60;
    }
}
