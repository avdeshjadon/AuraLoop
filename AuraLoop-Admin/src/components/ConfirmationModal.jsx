import React, { useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';

export default function ConfirmationModal({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  targetName = '',
  actionType = 'danger', // 'danger' | 'warning' | 'primary' | 'success'
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen || loading) return;
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel, loading]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={loading ? undefined : onCancel}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 420,
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-dropdown)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <h3
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            {title}
          </h3>
          <button
            className="modal-close-btn"
            onClick={onCancel}
            disabled={loading}
            style={{ padding: 4 }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <p
            style={{
              fontSize: 13.5,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              margin: 0,
              marginBottom: targetName ? 10 : 0,
            }}
          >
            {message}
          </p>
          {targetName && (
            <div
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-primary)',
                wordBreak: 'break-word',
              }}
            >
              {targetName}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
          }}
        >
          <button
            className="btn-secondary"
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {cancelText}
          </button>
          <button
            className={actionType === 'danger' ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
            disabled={loading}
            style={{
              minWidth: 90,
              padding: '8px 18px',
              fontSize: 13,
              borderRadius: 'var(--radius-sm)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {loading ? (
              <>
                <RefreshCw size={13} className="spin-animation" />
                <span>Deleting...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
