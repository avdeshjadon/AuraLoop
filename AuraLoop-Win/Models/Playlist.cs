using System;
using System.Collections.Generic;

namespace AuraLoop.Models
{
    public class Playlist
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = "My Favorites";
        public List<string> WallpaperIds { get; set; } = new();
        public bool Shuffle { get; set; } = false;
        public int ChangeIntervalMinutes { get; set; } = 30;
        public bool IsActive { get; set; } = false;
    }
}
