import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Search,
  Filter,
  Upload,
  HardDrive,
  Users,
  Film,
  Download,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export default function ActivityView({
  activities = [],
  onRefresh,
  showToast,
  onOpenVideoPreview,
  wallpapers = [],
}) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = activities.filter((act) => {
    const matchesSearch =
      act.title.toLowerCase().includes(search.toLowerCase()) ||
      act.action.toLowerCase().includes(search.toLowerCase()) ||
      act.id.toLowerCase().includes(search.toLowerCase()) ||
      act.category.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'All' || act.type === typeFilter;
    const matchesStatus = statusFilter === 'All' || act.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const exportLogs = () => {
    const blob = new Blob([JSON.stringify(activities, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auraloop_audit_logs_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Activity logs exported successfully!');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="activity-view-page"
    >
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: -0.5 }}>
            System Audit & Activity Logs
          </h1>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="btn-light-pill"
            onClick={exportLogs}
          >
            <Download size={14} />
            <span>Export JSON</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="btn-light-pill"
            onClick={onRefresh}
          >
            <RefreshCw size={14} />
            <span>Refresh Audit</span>
          </motion.button>
        </div>
      </div>

      {/* Activity Filter & Table Card */}
      <div className="table-card">
        <div className="table-header-row">
          <div>
            <h2 className="table-title">Activity Trail ({filtered.length})</h2>
          </div>

          <div className="table-controls">
            <input
              type="text"
              placeholder="Search logs by file, action, ID..."
              className="table-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 240 }}
            />
            <select
              className="filter-btn"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All">All Operations</option>
              <option value="upload">Uploads</option>
              <option value="delete">Deletions</option>
              <option value="folder">Folders</option>
              <option value="thumbnail">Thumbnails</option>
              <option value="sync">CDN Sync</option>
              <option value="user">User Events</option>
            </select>
            <select
              className="filter-btn"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Operation & Target</th>
                <th>Category</th>
                <th>Payload / Size</th>
                <th>Status</th>
                <th>Timestamp</th>
                <th style={{ textAlign: 'right' }}>Preview</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No audit logs found matching your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((act) => (
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
                                : act.type === 'user'
                                ? 'var(--status-pending-bg)'
                                : 'var(--accent-orange-light)',
                            color:
                              act.type === 'upload'
                                ? 'var(--status-completed-text)'
                                : act.type === 'delete'
                                ? 'var(--status-failed-text)'
                                : act.type === 'user'
                                ? 'var(--status-pending-text)'
                                : 'var(--accent-orange)',
                          }}
                        >
                          {act.type === 'upload' ? (
                            <Upload size={14} />
                          ) : act.type === 'delete' ? (
                            <Trash2 size={14} />
                          ) : act.type === 'user' ? (
                            <Users size={14} />
                          ) : (
                            <Film size={14} />
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{act.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{act.action}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-pill)',
                          background: 'var(--bg-card-subtle)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        {act.category}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{act.size}</td>
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
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{act.date}</td>
                    <td style={{ textAlign: 'right' }}>
                      {act.type === 'upload' || act.type === 'thumbnail' ? (
                        <button
                          className="btn-light-pill"
                          style={{ padding: '4px 10px', fontSize: 11 }}
                          onClick={() => {
                            const matched = wallpapers.find((w) => w.title.includes(act.title.replace(/\.[^/.]+$/, '')));
                            if (matched) onOpenVideoPreview(matched);
                            else showToast(`Viewing event: ${act.title}`);
                          }}
                        >
                          Inspect
                        </button>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Logged</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
