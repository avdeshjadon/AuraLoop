using System;
using System.IO;
using System.Text.Json;
using AuraLoop.Models;
using Microsoft.Win32;

namespace AuraLoop.Services
{
    public class SettingsService
    {
        private static SettingsService? _instance;
        public static SettingsService Instance => _instance ??= new SettingsService();

        private readonly string _settingsFilePath;
        public AppSettings Current { get; private set; }

        public event Action<AppSettings>? OnSettingsChanged;

        private const string RunRegistryKey = @"Software\Microsoft\Windows\CurrentVersion\Run";
        private const string AppRegistryName = "AuraLoop";

        private SettingsService()
        {
            string appData = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "AuraLoop");
            Directory.CreateDirectory(appData);
            _settingsFilePath = Path.Combine(appData, "settings.json");
            Current = LoadSettings();
        }

        private AppSettings LoadSettings()
        {
            try
            {
                if (File.Exists(_settingsFilePath))
                {
                    string json = File.ReadAllText(_settingsFilePath);
                    return JsonSerializer.Deserialize<AppSettings>(json) ?? new AppSettings();
                }
            }
            catch { }
            return new AppSettings();
        }

        public void SaveSettings()
        {
            try
            {
                string json = JsonSerializer.Serialize(Current, new JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(_settingsFilePath, json);
                OnSettingsChanged?.Invoke(Current);
                UpdateStartupRegistry(Current.LaunchAtStartup);
            }
            catch { }
        }

        private void UpdateStartupRegistry(bool enable)
        {
            if (!OperatingSystem.IsWindows()) return;

            try
            {
                using var key = Registry.CurrentUser.OpenSubKey(RunRegistryKey, true);
                if (key == null) return;

                if (enable)
                {
                    string exePath = Environment.ProcessPath ?? string.Empty;
                    if (!string.IsNullOrEmpty(exePath))
                    {
                        key.SetValue(AppRegistryName, $"\"{exePath}\" --background");
                    }
                }
                else
                {
                    key.DeleteValue(AppRegistryName, false);
                }
            }
            catch { }
        }
    }
}
