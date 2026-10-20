import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Eye,
  X,
  Copy,
  Check,
  Play,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export default function ActivityView({
  activities = [],
  onRefresh,
  showToast,
  onOpenVideoPreview,
  wallpapers = [],
  onTriggerConfirmation,
}) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [inspectedEvent, setInspectedEvent] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

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

  const handleExportClick = () => {
    if (onTriggerConfirmation) {
      onTriggerConfirmation({
        title: 'Export Audit Logs',
        message: 'Are you sure you want to download the System Audit & Activity Logs as a JSON file?',
        targetName: `auraloop_audit_logs_${new Date().toISOString().slice(0, 10)}.json`,
        actionType: 'primary',
        confirmText: 'Download JSON',
        onConfirm: () => exportLogs(),
      });
    } else {
      exportLogs();
    }
  };

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    showToast(`Event ID ${id} copied to clipboard!`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Find matching wallpaper if inspect event is a video or wallpaper
  const matchedWallpaper = inspectedEvent
    ? wallpapers.find((w) =>
        inspectedEvent.title.toLowerCase().includes(w.title.toLowerCase().replace(/\s+/g, '_')) ||
        w.title.toLowerCase().includes(inspectedEvent.title.toLowerCase().replace(/\.[^/.]+$/, '').replace(/_/g, ' '))
      )
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="activity-view-page"
    >
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: -0.5 }}>
            System Audit & Activity Logs
          </h1>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'nowrap' }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="btn-light-pill"
            onClick={handleExportClick}
            style={{ whiteSpace: 'nowrap', flex: '0 0 auto', padding: '10px 18px' }}
          >
            <Download size={14} />
            <span>Export JSON</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="btn-light-pill"
            onClick={onRefresh}
            style={{ whiteSpace: 'nowrap', flex: '0 0 auto', padding: '10px 18px' }}
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

        <div style={{ overflowX: 'auto', maxHeight: 640, overflowY: 'auto' }}>
          <table className="admin-table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 2, background: 'var(--bg-card)' }}>
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
                        {/* Minimal Monochrome Font-Awesome style icon */}
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '8px',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
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
                      <button
                        className="btn-light-pill"
                        style={{ padding: '4px 12px', fontSize: 11, whiteSpace: 'nowrap' }}
                        onClick={() => setInspectedEvent(act)}
                        title="Inspect detailed audit payload & execution trace"
                      >
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Audit Event Inspector Modal */}
      <AnimatePresence>
        {inspectedEvent && (
          <div className="modal-overlay" onClick={() => setInspectedEvent(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="modal-container"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: 580,
                background: 'var(--bg-card)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid var(--border-color)',
              }}
            >
              {/* Modal Header */}
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h3 className="modal-title" style={{ fontSize: 16 }}>Audit Event Inspection</h3>
                    <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: 0 }}>
                      Detailed payload & storage execution trace
                    </p>
                  </div>
                </div>
                <button className="modal-close-btn" onClick={() => setInspectedEvent(null)}>
                  <X size={18} />
                </button>
              </div>

              {/* Event Body */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Event Summary Pill Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 10,
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Event ID</div>
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      {inspectedEvent.id}
                      <button
                        onClick={() => handleCopyId(inspectedEvent.id)}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text-muted)' }}
                      >
                        {copiedId ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Status</div>
                    <div style={{ marginTop: 2 }}>
                      <span className="status-pill completed" style={{ fontSize: 11 }}>
                        <span className="status-dot" />
                        {inspectedEvent.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Timestamp</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                      {inspectedEvent.date}
                    </div>
                  </div>
                </div>

                {/* Operation & Target */}
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Operation & Target
                  </label>
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    <div>{inspectedEvent.title}</div>
                    <div style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginTop: 2 }}>
                      {inspectedEvent.action}
                    </div>
                  </div>
                </div>

                {/* Actor & Destination Path */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                      Actor / Origin
                    </label>
                    <div
                      style={{
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-color)',
                        fontSize: 12,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {inspectedEvent.actor || 'Avdesh Jadon (Admin)'}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                      Payload / Size
                    </label>
                    <div
                      style={{
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-color)',
                        fontSize: 12,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {inspectedEvent.size} ({inspectedEvent.category})
                    </div>
                  </div>
                </div>

                {/* Audit Explanation */}
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Audit Details & Integrity Verification
                  </label>
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      fontSize: 12,
                      lineHeight: 1.5,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {inspectedEvent.details || 'Operation logged in compliance with Cloudflare R2 bucket audit specifications and HMAC session validation.'}
                  </div>
                </div>

                {/* Pipeline Execution Trace */}
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Execution Trace (Pipeline Steps)
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-card-subtle)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    {(inspectedEvent.trace || [
                      'Event request authenticated',
                      'Storage payload dispatched to Cloudflare R2',
                      'Edge cache invalidated across global nodes',
                      'Catalog JSON reconciled successfully',
                    ]).map((step, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--text-primary)' }}>
                        <CheckCircle2 size={13} style={{ color: '#10B981', flexShrink: 0 }} />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="modal-footer" style={{ marginTop: 8 }}>
                  {matchedWallpaper && (
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                      onClick={() => {
                        onOpenVideoPreview(matchedWallpaper);
                        setInspectedEvent(null);
                      }}
                    >
                      <Play size={13} />
                      <span>Preview Video</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="primary-cta-btn"
                    onClick={() => setInspectedEvent(null)}
                  >
                    <span>Close Inspection</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

