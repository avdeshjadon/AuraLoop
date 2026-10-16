using System;
using System.IO;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using AuraLoop.Models;

namespace AuraLoop.Services
{
    public class DownloadManager
    {
        private static DownloadManager? _instance;
        public static DownloadManager Instance => _instance ??= new DownloadManager();

        private readonly HttpClient _client = new();
        private readonly string _libraryPath;

        private DownloadManager()
        {
            _libraryPath = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "AuraLoop",
                "Library");
            Directory.CreateDirectory(_libraryPath);
        }

        public async Task<string?> DownloadWallpaperAsync(WallpaperItem item, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrEmpty(item.VideoUrl)) return null;

            string targetFile = Path.Combine(_libraryPath, $"{item.Id}.mp4");
            if (File.Exists(targetFile))
            {
                item.LocalVideoPath = targetFile;
                item.IsDownloaded = true;
                return targetFile;
            }

            try
            {
                item.IsDownloading = true;
                item.DownloadProgress = 0.0;

                using var response = await _client.GetAsync(item.VideoUrl, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
                response.EnsureSuccessStatusCode();

                long? totalBytes = response.Content.Headers.ContentLength;
                using var contentStream = await response.Content.ReadAsStreamAsync(cancellationToken);
                using var fileStream = new FileStream(targetFile, FileMode.Create, FileAccess.Write, FileShare.None, 8192, true);

                var buffer = new byte[8192];
                long totalRead = 0;
                int bytesRead;

                while ((bytesRead = await contentStream.ReadAsync(buffer, 0, buffer.Length, cancellationToken)) > 0)
                {
                    await fileStream.WriteAsync(buffer, 0, bytesRead, cancellationToken);
                    totalRead += bytesRead;

                    if (totalBytes.HasValue && totalBytes.Value > 0)
                    {
                        item.DownloadProgress = (double)totalRead / totalBytes.Value * 100.0;
                    }
                }

                item.LocalVideoPath = targetFile;
                item.IsDownloaded = true;
                item.IsDownloading = false;
                item.DownloadProgress = 100.0;
                return targetFile;
            }
            catch
            {
                item.IsDownloading = false;
                if (File.Exists(targetFile))
                {
                    try { File.Delete(targetFile); } catch { }
                }
                return null;
            }
        }
    }
}
