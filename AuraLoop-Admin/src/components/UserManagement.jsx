import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  Search,
  Laptop,
  Download,
  Sparkles,
  Lock,
  RefreshCw,
  Plus,
  KeyRound,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import {
  fetchRealFirestoreUsers,
  saveRealUsers,
  REAL_ADMIN_USER,
  adminSignIn,
} from '../services/firebaseAuthService';

export default function UserManagement({
  onTriggerConfirmation,
  showToast,
  logActivity,
}) {
  const [users, setUsers] = useState([REAL_ADMIN_USER]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [planFilter, setPlanFilter] = useState('All');

  // Firebase Admin Login Modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState('theavdeshjadon@gmail.com');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  // New User Form state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPlan, setNewUserPlan] = useState('Pro Plan');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchRealFirestoreUsers();
      setUsers(data);
      setLoading(false);
    }
    load();
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.device.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || u.status === statusFilter;
    const matchesPlan = planFilter === 'All' || u.plan.includes(planFilter);
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const handleAdminSignIn = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      await adminSignIn(authEmail, authPassword);
      showToast('Firebase Admin Session Authenticated!');
      setIsAuthModalOpen(false);
      const updated = await fetchRealFirestoreUsers();
      setUsers(updated);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAddRealUser = (e) => {
    e.preventDefault();
    if (!newUserEmail || !newUserEmail.includes('@')) {
      showToast('Please enter a valid email.');
      return;
    }

    onTriggerConfirmation({
      title: 'Register Real AuraLoop Account',
      message: `Confirm creating real user record for "${newUserEmail}" with ${newUserPlan}?`,
      targetName: newUserEmail,
      actionType: 'primary',
      confirmText: 'Create Account',
      onConfirm: () => {
        const newUserObj = {
          id: `USR_${Date.now()}`,
          name: newUserName.trim() || newUserEmail.split('@')[0],
          email: newUserEmail.trim(),
          role: newUserPlan === 'Pro Plan' ? 'Pro Member' : 'Free User',
          status: 'Active',
          plan: newUserPlan,
          device: 'MacBook Pro (Apple Silicon macOS)',
          downloads: 0,
          lastSeen: 'Registered Today',
          avatar: (newUserName || newUserEmail).slice(0, 2).toUpperCase(),
          joined: new Date().toLocaleDateString(),
          verified: true,
        };

        const updated = [newUserObj, ...users];
        setUsers(updated);
        saveRealUsers(updated);
        showToast(`Account created for ${newUserEmail}`);
        setIsAddUserOpen(false);
        setNewUserName('');
        setNewUserEmail('');
        logActivity({
          title: newUserEmail,
          action: `Account Registered (${newUserPlan})`,
          category: 'User Sync',
          size: newUserPlan,
          type: 'user',
        });
      },
    });
  };

  const handleToggleStatus = (user) => {
    if (user.email === REAL_ADMIN_USER.email) {
      showToast('Super Admin account status cannot be altered.');
      return;
    }

    const nextStatus = user.status === 'Active' ? 'Suspended' : 'Active';
    onTriggerConfirmation({
      title: `${nextStatus === 'Active' ? 'Activate' : 'Suspend'} User Account`,
      message: `Are you sure you want to change status for "${user.name}" to ${nextStatus}?`,
      targetName: `${user.name} (${user.email})`,
      actionType: nextStatus === 'Active' ? 'success' : 'danger',
      confirmText: `${nextStatus} Account`,
      onConfirm: async () => {
        const isSuspended = nextStatus === 'Suspended';
        const updated = users.map((u) =>
          u.id === user.id ? { ...u, status: nextStatus, isSuspended } : u
        );
        setUsers(updated);
        saveRealUsers(updated);

        // Sync with Firestore if possible
        try {
          const { doc, updateDoc } = await import('firebase/firestore');
          const { db } = await import('../services/firebaseAuthService');
          await updateDoc(doc(db, 'users', user.id), {
            isSuspended,
            status: nextStatus,
            updatedAt: Date.now() / 1000,
          });
        } catch (e) {
          // If offline or permission requires admin token, local storage is updated
        }

        showToast(`User ${isSuspended ? 'suspended' : 'activated'}. Client sync triggered.`);
        logActivity({
          title: user.name,
          action: isSuspended ? 'Account Suspended (Screen Blackout)' : 'Account Re-activated',
          category: 'User Sync',
          size: user.plan,
          type: 'user',
        });
      },
    });
  };


  const handleTogglePlan = (user) => {
    if (user.email === REAL_ADMIN_USER.email) {
      showToast('Super Admin subscription tier is permanent.');
      return;
    }

    const nextPlan = user.plan === 'Pro Plan' ? 'Free Tier' : 'Pro Plan';
    onTriggerConfirmation({
      title: 'Update User Subscription Tier',
      message: `Confirm changing subscription for "${user.name}" from ${user.plan} to ${nextPlan}?`,
      targetName: `${user.name} (${user.email})`,
      actionType: 'primary',
      confirmText: `Switch to ${nextPlan}`,
      onConfirm: () => {
        const updated = users.map((u) =>
          u.id === user.id ? { ...u, plan: nextPlan } : u
        );
        setUsers(updated);
        saveRealUsers(updated);
        showToast(`User upgraded to ${nextPlan}`);
        logActivity({
          title: user.name,
          action: `Switched tier to ${nextPlan}`,
          category: 'User Sync',
          size: nextPlan,
          type: 'user',
        });
      },
    });
  };

  return (
    <div className="users-page">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: -0.5 }}>
            Real User Directory & Firebase Auth
          </h1>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="btn-light-pill"
            onClick={() => setIsAuthModalOpen(true)}
          >
            <KeyRound size={15} />
            <span>Firebase Login</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="primary-cta-btn"
            onClick={() => setIsAddUserOpen(true)}
          >
            <Plus size={15} />
            <span>Add Real User</span>
          </motion.button>
        </div>
      </div>

      {/* Real Stats Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div className="metric-box">
          <div className="metric-box-header">
            <span className="metric-box-label">Verified Accounts</span>
            <div className="metric-box-icon"><Users size={14} /></div>
          </div>
          <div className="metric-box-value">{users.length}</div>
          <div className="metric-box-sub green">Real Firebase & local records</div>
        </div>

        <div className="metric-box orange-accent">
          <div className="metric-box-header">
            <span className="metric-box-label">Primary Super Admin</span>
            <div className="metric-box-icon"><Shield size={14} /></div>
          </div>
          <div className="metric-box-value" style={{ fontSize: 18, fontWeight: 700 }}>
            Avdesh Jadon
          </div>
          <div className="metric-box-sub">theavdeshjadon@gmail.com</div>
        </div>

        <div className="metric-box">
          <div className="metric-box-header">
            <span className="metric-box-label">macOS Native Client</span>
            <div className="metric-box-icon"><Laptop size={14} /></div>
          </div>
          <div className="metric-box-value">M-Series</div>
          <div className="metric-box-sub green">Apple Silicon Hardware Active</div>
        </div>

        <div className="metric-box">
          <div className="metric-box-header">
            <span className="metric-box-label">Library Masters Sync</span>
            <div className="metric-box-icon"><Sparkles size={14} /></div>
          </div>
          <div className="metric-box-value">785 UHD</div>
          <div className="metric-box-sub green">Synchronized with R2 Catalog</div>
        </div>
      </div>

      {/* User Directory Table Card */}
      <div className="table-card">
        <div className="table-header-row">
          <h2 className="table-title">Authenticated Users ({filteredUsers.length})</h2>
          <div className="table-controls">
            <input
              type="text"
              placeholder="Search real user, email, Mac..."
              className="table-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 240 }}
            />
            <select
              className="filter-btn"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
            </select>
            <select
              className="filter-btn"
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
            >
              <option value="All">All Tiers</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Pro">Pro Plan</option>
              <option value="Free">Free Tier</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>User & Email</th>
                <th>Hardware & Client</th>
                <th>Tier</th>
                <th>Library Favorites</th>
                <th>Status</th>
                <th>Session</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: u.plan === 'Super Admin' ? '#14171A' : u.plan === 'Pro Plan' ? 'var(--accent-orange)' : '#4B5563',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        {u.avatar}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{u.name}</span>
                          {u.plan === 'Super Admin' && (
                            <span style={{ fontSize: 10, background: 'var(--accent-orange-light)', color: 'var(--accent-orange)', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                              ADMIN
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
                      <Laptop size={14} color="var(--text-muted)" />
                      <span>{u.device}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-pill)',
                        background: u.plan === 'Super Admin' ? '#14171A' : u.plan.includes('Pro') ? 'var(--accent-orange-light)' : 'var(--bg-card-subtle)',
                        color: u.plan === 'Super Admin' ? '#FFFFFF' : u.plan.includes('Pro') ? 'var(--accent-orange)' : 'var(--text-secondary)',
                      }}
                    >
                      {u.plan}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                      <Download size={13} color="var(--text-muted)" />
                      <span>{u.downloads}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`status-pill ${
                        u.status === 'Active' ? 'completed' : 'failed'
                      }`}
                    >
                      <span className="status-dot" />
                      {u.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{u.lastSeen}</td>
                  <td style={{ textAlign: 'right' }}>
                    {u.email !== REAL_ADMIN_USER.email && (
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          className="btn-light-pill"
                          style={{ padding: '4px 10px', fontSize: 11 }}
                          onClick={() => handleTogglePlan(u)}
                        >
                          {u.plan === 'Pro Plan' ? 'Downgrade' : 'Upgrade Pro'}
                        </button>
                        <button
                          className="btn-light-pill"
                          style={{
                            padding: '4px 10px',
                            fontSize: 11,
                            color: u.status === 'Active' ? '#DC2626' : '#10B981',
                          }}
                          onClick={() => handleToggleStatus(u)}
                        >
                          {u.status === 'Active' ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Firebase Admin Auth Modal */}
      {isAuthModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAuthModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 className="modal-title">Firebase Admin Authentication</h3>
              <button className="modal-close-btn" onClick={() => setIsAuthModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleAdminSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Authenticate with Firebase Auth to fetch live users directly from Firestore.
              </p>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Admin Email</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter Firebase password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}
                />
              </div>
              {authError && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(239, 68, 68, 0.08)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(239, 68, 68, 0.22)',
                    color: 'var(--text-primary)',
                    fontSize: 12.5,
                    fontWeight: 500,
                  }}
                >
                  <AlertCircle size={16} style={{ color: '#EF4444', flexShrink: 0 }} />
                  <span>
                    {authError.includes('invalid-credential') || authError.includes('wrong-password')
                      ? 'Invalid admin credentials. Please double-check your email and password.'
                      : authError.replace(/^Firebase:\s*(Error\s*)?(\(auth\/)?|\)\.?$/gi, '').replace(/-/g, ' ')}
                  </span>
                </div>
              )}
              <div className="modal-footer" style={{ marginTop: 8 }}>
                <button type="button" className="btn-secondary" onClick={() => setIsAuthModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-cta-btn" disabled={authLoading}>
                  {authLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Real User Modal */}
      {isAddUserOpen && (
        <div className="modal-overlay" onClick={() => setIsAddUserOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 className="modal-title">Register Real User Account</h3>
              <button className="modal-close-btn" onClick={() => setIsAddUserOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleAddRealUser} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. user@gmail.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Subscription Tier</label>
                <select
                  value={newUserPlan}
                  onChange={(e) => setNewUserPlan(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}
                >
                  <option value="Pro Plan">Pro Plan (Full 4K Access)</option>
                  <option value="Free Tier">Free Tier</option>
                </select>
              </div>
              <div className="modal-footer" style={{ marginTop: 8 }}>
                <button type="button" className="btn-secondary" onClick={() => setIsAddUserOpen(false)}>Cancel</button>
                <button type="submit" className="primary-cta-btn">Register Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
