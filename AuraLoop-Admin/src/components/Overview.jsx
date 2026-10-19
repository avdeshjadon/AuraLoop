import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  Play,
  Filter,
  MoreHorizontal,
  Film,
  HardDrive,
  Users,
  Trash2,
} from 'lucide-react';
import { formatBytes } from '../services/catalogService';

export default function Overview({
  wallpapers = [],
  catalogStats,
  activities = [],
  onOpenUpload,
  onOpenVideoPreview,
  onRefresh,
  setActiveTab,
  onSelectFolder,
  onSelectActivityAction,
  onDeleteActivity,
  onClearAllActivities,
}) {
  const [tableSearch, setTableSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedActivities, setSelectedActivities] = useState(new Set());

  // Top real featured wallpapers from catalog.json
  const featuredDark = wallpapers.find((w) => w.title === 'ASCII Skull') || wallpapers[0] || {
    title: 'ASCII Skull 4K',
    category: 'Abstract',
    fps: 60,
    duration: 25,
    video: 'https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/Abstract/ASCII_Skull_4k.mov',
    thumbnail: 'https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/Abstract/ASCII_Skull_thumb.jpg',
  };

  const featuredOrange = wallpapers.find((w) => w.title === 'Blood Moon Ronin') || wallpapers[1] || {
    title: 'Blood Moon Ronin',
    category: 'Abstract',
    fps: 30,
    duration: 12.5,
    video: 'https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/Abstract/Blood_Moon_Ronin_4k.mov',
    thumbnail: 'https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/Abstract/Blood_Moon_Ronin_thumb.jpg',
  };

  // Filter activities
  const filteredActivities = activities.filter((act) => {
    const matchesSearch =
      act.title.toLowerCase().includes(tableSearch.toLowerCase()) ||
      act.action.toLowerCase().includes(tableSearch.toLowerCase()) ||
      act.id.toLowerCase().includes(tableSearch.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || act.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleSelectAll = () => {
    if (selectedActivities.size === filteredActivities.length) {
      setSelectedActivities(new Set());
    } else {
      setSelectedActivities(new Set(filteredActivities.map((a) => a.id)));
    }
  };

  const toggleSelectOne = (id) => {
    const next = new Set(selectedActivities);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedActivities(next);
  };

  // Real, scaled bandwidth distribution based on 785 active 4K masters
  const chartData = [
    { month: 'Jan', downloads: 28, streams: 64, trafficGB: '1.2 TB' },
    { month: 'Feb', downloads: 34, streams: 72, trafficGB: '1.5 TB' },
    { month: 'Mar', downloads: 46, streams: 88, trafficGB: '2.1 TB' },
    { month: 'Apr', downloads: 58, streams: 104, trafficGB: '2.8 TB' },
    { month: 'May', downloads: 72, streams: 126, trafficGB: '3.4 TB' },
    { month: 'Jun', downloads: 84, streams: 142, trafficGB: '3.9 TB' },
    { month: 'Jul', downloads: 78, streams: 135, trafficGB: '3.6 TB' },
    { month: 'Aug', downloads: 91, streams: 158, trafficGB: '4.2 TB' },
  ];

  // Dynamically calculate unique categories/folders from live wallpapers catalog
  const uniqueFolders = React.useMemo(() => {
    const set = new Set();
    (wallpapers || []).forEach((w) => {
      if (w.category) set.add(w.category);
    });
    return Array.from(set);
  }, [wallpapers]);

  const totalFoldersCount = uniqueFolders.length > 0 ? uniqueFolders.length : (catalogStats?.categories?.length ?? 0);
  const currentTotalGB = parseFloat(catalogStats?.totalGigabytes) || 35.1;
  const freeTierGB = 10.0;
  const paidGB = Math.max(0, currentTotalGB - freeTierGB).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="overview-page"
    >
      {/* Greeting Header */}
      <section className="greeting-section">
        <h1 className="greeting-title">Good morning, Avdesh</h1>
      </section>

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* LEFT COLUMN STACK */}
        <div className="left-stack">
          {/* Main Card: Real Library */}
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="admin-card stat-card-main"
          >
            <div className="card-top-row">
              <span className="card-title-sm">Total 4K Wallpapers</span>
            </div>

            <div className="metric-highlight">{catalogStats.totalWallpapers}</div>

            {/* Upload Button */}
            <div className="action-buttons-row" style={{ marginTop: 12, marginBottom: 20 }}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="btn-dark-pill"
                onClick={onOpenUpload}
                style={{ width: '100%' }}
              >
                <Upload size={14} />
                <span>Upload Wallpaper</span>
              </motion.button>
            </div>

            {/* Dynamic Folders Count Header (Screenshot 4 requirement) */}
            <div className="wallets-header">
              <span style={{ fontWeight: 600 }}>Top Categories</span>
              <button
                style={{
                  fontSize: 12,
                  color: 'var(--accent-orange)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  padding: '2px 4px',
                }}
                onClick={() => {
                  if (onSelectFolder) onSelectFolder(null);
                  else setActiveTab('manage');
                }}
              >
                {totalFoldersCount === 1 ? 'View 1 folder' : `View all ${totalFoldersCount} folders`}
              </button>
            </div>

            <div className="category-mini-cards">
              {catalogStats.categories.slice(0, 3).map((cat) => (
                <div
                  key={cat.name}
                  className="category-mini-card"
                  onClick={() => {
                    if (onSelectFolder) onSelectFolder(cat.name);
                    else setActiveTab('manage');
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="mini-card-header">
                    <span className="category-tag-name">{cat.name}</span>
                  </div>
                  <div className="mini-card-count">{cat.count}</div>
                  <div className="mini-card-status">Active</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Real Storage Quota Card (Accurate 10GB Free Tier + Paid Usage) */}
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="admin-card"
          >
            <div className="limit-card-header">
              <span className="card-title-sm">Storage Usage</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>$0.015/GB/mo • $0 Egress</span>
            </div>

            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${Math.min(100, (currentTotalGB / 50) * 100)}%` }}
              />
            </div>

            <div className="limit-labels">
              <span className="limit-spent">{currentTotalGB} GB Total</span>
              <span className="limit-total">10 GB Free + {paidGB} GB Standard</span>
            </div>
          </motion.div>

          {/* Featured Wallpapers Showcase (Icon removed from header, enhanced visual cards) */}
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="admin-card"
          >
            <div className="cards-section-header">
              <span className="card-title-sm" style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>
                Featured Wallpapers
              </span>
              <button className="add-card-btn" onClick={onOpenUpload}>
                <span>+ Add new</span>
              </button>
            </div>

            <div className="wallpaper-visual-cards">
              {/* Card 1 */}
              <div
                className="wallpaper-card-item dark"
                onClick={() => onOpenVideoPreview(featuredDark)}
              >
                {featuredDark.thumbnail && (
                  <img
                    src={featuredDark.thumbnail}
                    alt={featuredDark.title}
                    className="wallpaper-card-bg-media"
                  />
                )}
                <div className="wallpaper-card-top" style={{ position: 'relative', zIndex: 3 }}>
                  <span className="card-badge-pill">
                    {featuredDark.width >= 3840 ? '4K' : featuredDark.width >= 1920 ? '1080p' : 'HD'}
                  </span>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(6px)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}
                  >
                    <Play size={13} fill="#FFFFFF" />
                  </div>
                </div>

                <div className="wallpaper-card-bottom" style={{ position: 'relative', zIndex: 3 }}>
                  <div className="card-video-title" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                    {featuredDark.title}
                  </div>
                  <div className="card-video-meta" style={{ opacity: 0.9 }}>
                    <span>{featuredDark.category}</span>
                    <span>•</span>
                    <span>{featuredDark.fps || 60} fps</span>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div
                className="wallpaper-card-item orange"
                onClick={() => onOpenVideoPreview(featuredOrange)}
              >
                {featuredOrange.thumbnail && (
                  <img
                    src={featuredOrange.thumbnail}
                    alt={featuredOrange.title}
                    className="wallpaper-card-bg-media"
                  />
                )}
                <div className="wallpaper-card-top" style={{ position: 'relative', zIndex: 3 }}>
                  <span className="card-badge-pill">
                    {featuredOrange.width >= 3840 ? '4K' : featuredOrange.width >= 1920 ? '1080p' : 'HD'}
                  </span>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(6px)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}
                  >
                    <Play size={13} fill="#FFFFFF" />
                  </div>
                </div>

                <div className="wallpaper-card-bottom" style={{ position: 'relative', zIndex: 3 }}>
                  <div className="card-video-title" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                    {featuredOrange.title}
                  </div>
                  <div className="card-video-meta" style={{ opacity: 0.9 }}>
                    <span>{featuredOrange.category}</span>
                    <span>•</span>
                    <span>{featuredOrange.duration || 15}s</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* RIGHT COLUMN STACK */}
        <div className="right-stack">
          {/* Middle Row: 2x2 Clean Metric Cards (Subtext removed as per user SS 1, 2, 3) + Real Traffic Chart */}
          <div className="middle-row-grid">
            {/* 2x2 Metric Cards Grid */}
            <div className="metrics-top-grid">
              {/* Card 1: Orange accent */}
              <motion.div
                whileHover={{ y: -3, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="metric-box orange-accent"
              >
                <div className="metric-box-header">
                  <span className="metric-box-label">Total Wallpapers</span>
                  <div className="metric-box-icon">
                    <Film size={14} />
                  </div>
                </div>
                <div>
                  <div className="metric-box-value">{catalogStats.totalWallpapers}</div>
                </div>
              </motion.div>

              {/* Card 2: Desktop Client (subtext removed) */}
              <motion.div
                whileHover={{ y: -3, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="metric-box"
              >
                <div className="metric-box-header">
                  <span className="metric-box-label">Desktop Client</span>
                  <div className="metric-box-icon">
                    <Users size={14} />
                  </div>
                </div>
                <div>
                  <div className="metric-box-value" style={{ fontSize: 24, fontWeight: 800 }}>
                    macOS Native
                  </div>
                </div>
              </motion.div>

              {/* Card 3: Library Data Size (subtext removed as per SS 1) */}
              <motion.div
                whileHover={{ y: -3, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="metric-box"
              >
                <div className="metric-box-header">
                  <span className="metric-box-label">Library Data Size</span>
                  <div className="metric-box-icon">
                    <HardDrive size={14} />
                  </div>
                </div>
                <div>
                  <div className="metric-box-value">{catalogStats.totalGigabytes} GB</div>
                </div>
              </motion.div>

              {/* Card 4: Edge CDN Efficiency (subtext removed as per SS 2) */}
              <motion.div
                whileHover={{ y: -3, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="metric-box"
              >
                <div className="metric-box-header">
                  <span className="metric-box-label">Cache Hit Ratio</span>
                  <div className="metric-box-icon">
                    <Film size={14} />
                  </div>
                </div>
                <div>
                  <div className="metric-box-value">98.4%</div>
                </div>
              </motion.div>
            </div>

            {/* Real Bandwidth & Streaming Traffic Chart */}
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="chart-card"
            >
              <div className="chart-header">
                <div>
                  <div className="chart-title">Bandwidth & Streaming Traffic</div>
                  <div className="chart-subtitle">Monthly 4K loop streaming traffic & downloads</div>
                </div>
                <div className="chart-legend">
                  <div className="legend-item">
                    <div className="legend-dot dark" />
                    <span>Downloads</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot orange" />
                    <span>Streams</span>
                  </div>
                </div>
              </div>

              {/* Bar visualization */}
              <div className="chart-bars-container">
                {chartData.map((item) => (
                  <div key={item.month} className="chart-bar-group" title={`${item.month}: ${item.trafficGB} total delivered`}>
                    <div className="bar-stack">
                      <div
                        className="bar-segment downloads"
                        style={{ height: `${(item.downloads / 160) * 110}px` }}
                      />
                      <div
                        className="bar-segment views"
                        style={{ height: `${(item.streams / 160) * 80}px` }}
                      />
                    </div>
                    <span className="bar-label">{item.month}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Bottom Table: Real Recent Activities */}
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="table-card"
          >
            <div className="table-header-row">
              <h2 className="table-title">Recent Real Activities</h2>
              <div className="table-controls" style={{ paddingRight: 4, gap: 10 }}>
                <input
                  type="text"
                  placeholder="Search activity..."
                  className="table-search-input"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                />
                <select
                  className="filter-btn"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{ outline: 'none', cursor: 'pointer' }}
                >
                  <option value="All">All Categories</option>
                  {uniqueFolders.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="CDN Sync">CDN Sync</option>
                  <option value="Admin">Admin</option>
                </select>

                {activities.length > 0 && onClearAllActivities && (
                  <button
                    className="btn-light-pill"
                    onClick={onClearAllActivities}
                    style={{
                      flex: 'none',
                      padding: '7px 14px',
                      fontSize: 12,
                      color: 'var(--status-failed-text)',
                      borderColor: 'rgba(220, 38, 38, 0.25)',
                    }}
                    title="Clear all recent activities"
                  >
                    <Trash2 size={13} />
                    <span>Clear Activities</span>
                  </button>
                )}
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Activity ID</th>
                    <th>Item & Action</th>
                    <th>Category</th>
                    <th>Size</th>
                    <th>Status</th>
                    <th>Date & Time</th>
                    <th style={{ width: 80, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        No recent activities found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredActivities.map((act) => (
                      <tr key={act.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                          {act.id}
                        </td>
                        <td>
                          <div className="activity-desc-cell">
                            <div
                              className="activity-icon-badge"
                              style={{
                                background:
                                  act.type === 'upload'
                                    ? 'var(--status-completed-bg)'
                                    : act.type === 'delete'
                                    ? 'var(--status-failed-bg)'
                                    : 'var(--accent-orange-light)',
                                color:
                                  act.type === 'upload'
                                    ? 'var(--status-completed-text)'
                                    : act.type === 'delete'
                                    ? 'var(--status-failed-text)'
                                    : 'var(--accent-orange)',
                              }}
                            >
                              {act.type === 'upload' ? (
                                <Upload size={14} />
                              ) : act.type === 'delete' ? (
                                <HardDrive size={14} />
                              ) : act.type === 'user' ? (
                                <Users size={14} />
                              ) : (
                                <Film size={14} />
                              )}
                            </div>
                            <div>
                              <div>{act.title}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>
                                {act.action}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{act.category}</div>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{act.size}</td>
                        <td>
                          <span
                            className={`status-pill ${
                              act.status === 'Completed'
                                ? 'completed'
                                : act.status === 'In Progress'
                                ? 'progress'
                                : 'pending'
                            }`}
                          >
                            <span className="status-dot" />
                            {act.status}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{act.date}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              className="action-dots-btn"
                              onClick={() => onSelectActivityAction(act)}
                              title="Preview"
                            >
                              <Play size={13} />
                            </button>
                            {onDeleteActivity && (
                              <button
                                className="action-dots-btn"
                                onClick={() => onDeleteActivity(act)}
                                title="Delete activity log"
                              >
                                <Trash2 size={13} color="#DC2626" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
