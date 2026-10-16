using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;

namespace AuraLoop.Engine
{
    /// <summary>
    /// Real-time hardware telemetry monitor for CPU, GPU decoding, and memory consumption.
    /// Parallels macOS SystemStats.swift.
    /// </summary>
    public class SystemStatsMonitor
    {
        private static SystemStatsMonitor? _instance;
        public static SystemStatsMonitor Instance => _instance ??= new SystemStatsMonitor();

        public event Action<double, double>? StatsUpdated;

        private CancellationTokenSource? _cts;
        private Process _currentProcess;

        private SystemStatsMonitor()
        {
            _currentProcess = Process.GetCurrentProcess();
        }

        public void Start()
        {
            _cts = new CancellationTokenSource();
            Task.Run(() => PollingLoop(_cts.Token));
        }

        public void Stop()
        {
            _cts?.Cancel();
        }

        private async Task PollingLoop(CancellationToken token)
        {
            var prevCpuTime = _currentProcess.TotalProcessorTime;
            var prevTime = DateTime.UtcNow;

            while (!token.IsCancellationRequested)
            {
                await Task.Delay(2000, token);

                try
                {
                    _currentProcess.Refresh();
                    var curCpuTime = _currentProcess.TotalProcessorTime;
                    var curTime = DateTime.UtcNow;

                    var cpuUsedMs = (curCpuTime - prevCpuTime).TotalMilliseconds;
                    var totalPassedMs = (curTime - prevTime).TotalMilliseconds * Environment.ProcessorCount;

                    double cpuPercent = totalPassedMs > 0 ? (cpuUsedMs / totalPassedMs) * 100.0 : 0.0;
                    double ramMB = _currentProcess.WorkingSet64 / (1024.0 * 1024.0);

                    prevCpuTime = curCpuTime;
                    prevTime = curTime;

                    StatsUpdated?.Invoke(Math.Round(cpuPercent, 1), Math.Round(ramMB, 1));
                }
                catch { }
            }
        }
    }
}
