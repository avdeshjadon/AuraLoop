import React from 'react';


export default function Reports({ wallpapers, catalogStats }) {
  // Top 5 most popular wallpapers
  const topWallpapers = wallpapers.slice(0, 5).map((w, i) => ({
    ...w,
    rank: i + 1,
    downloads: Math.floor(14200 - i * 2100),
    impressions: Math.floor(48000 - i * 6500),
  }));

  return (
    <div className="reports-page">
      {/* Page Title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: -0.5 }}>
          Analytics & CDN Performance Reports
        </h1>
      </div>

      {/* Top 3 KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div className="admin-card">
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Edge Cache Savings
            </span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
            1.42 TB
          </div>
          <p style={{ fontSize: 12, color: 'var(--status-completed-text)', fontWeight: 600 }}>
            ↑ 98.4% served directly from Cloudflare Edge
          </p>
        </div>

        <div className="admin-card">
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Total Loop Impressions
            </span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
            324,800
          </div>
          <p style={{ fontSize: 12, color: 'var(--accent-orange)', fontWeight: 600 }}>
            ↑ 22% increase in macOS active sessions
          </p>
        </div>

        <div className="admin-card">
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Average Duration
            </span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
            {catalogStats.averageDuration}s
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Seamless 60 FPS loop cycles
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
        {/* Top 5 Wallpapers Table */}
        <div className="table-card">
          <h2 className="table-title" style={{ marginBottom: 16 }}>Top Performing Wallpapers</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 48 }}>No.</th>
                <th>Wallpaper</th>
                <th>Category</th>
                <th>Downloads</th>
                <th>Impressions</th>
              </tr>
            </thead>
            <tbody>
              {topWallpapers.map((w) => (
                <tr key={w.id}>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{w.rank}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img
                        src={w.thumbnail}
                        alt={w.title}
                        style={{ width: 44, height: 28, borderRadius: 4, objectFit: 'cover' }}
                      />
                      <span style={{ fontWeight: 600 }}>{w.title}</span>
                    </div>
                  </td>
                  <td>{w.category}</td>
                  <td style={{ fontWeight: 700 }}>{w.downloads.toLocaleString()}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{w.impressions.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Category Breakdown */}
        <div className="admin-card">
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
            Category Distribution ({catalogStats.totalWallpapers} Total)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {catalogStats.categories.map((c) => {
              const pct = ((c.count / catalogStats.totalWallpapers) * 100).toFixed(1);
              return (
                <div key={c.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {c.count} items ({pct}%)
                    </span>
                  </div>
                  <div className="progress-bar-track" style={{ height: 6, margin: 0 }}>
                    <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
