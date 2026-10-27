import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder,
  FolderPlus,
  Upload,
  Trash2,
  Edit3,
  Play,
  Copy,
  Check,
  Search,
  Filter,
  Film,
  HardDrive,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  FileVideo,
  ExternalLink,
  Sparkles,
  LayoutGrid,
  List,
} from 'lucide-react';
import { formatBytes } from '../services/catalogService';

export default function BucketManager({
  wallpapers = [],
  initialFolder = null,
  onOpenUpload,
  onOpenVideoPreview,
  onTriggerConfirmation,
  onRefresh,
  showToast,
  onUpdateWallpapers,
}) {
  const [currentFolder, setCurrentFolder] = useState(initialFolder);
  const [folderSearch, setFolderSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // View Mode: 'grid' or 'list' (inside folders)
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('auraloop_bucket_view_mode') || 'grid';
  });

  // Pagination state (for folder contents)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  // Synchronize when initialFolder changes
  useEffect(() => {
    setCurrentFolder(initialFolder ?? null);
    setCurrentPage(1);
    setFolderSearch('');
  }, [initialFolder]);

  // Format FPS cleanly (e.g. 60 fps or 30 fps instead of 59.9799919128418 fps)
  const formatFps = (val) => {
    if (!val) return '60 fps';
    const num = Number(val);
    if (isNaN(num)) return '60 fps';
    const rounded = Math.round(num);
    if (rounded >= 58 && rounded <= 62) return '60 fps';
    if (rounded >= 28 && rounded <= 32) return '30 fps';
    if (rounded >= 118 && rounded <= 122) return '120 fps';
    if (rounded >= 23 && rounded <= 25) return `${rounded} fps`;
    return `${rounded} fps`;
  };

  // Format Duration cleanly without multi-decimal fractions (e.g. 24s or 8.1s)
  const formatDuration = (val) => {
    if (!val) return '15s';
    const num = Number(val);
    if (isNaN(num)) return '15s';
    const rounded = Math.round(num * 10) / 10;
    return `${rounded}s`;
  };

  // Persist view mode preference
  const handleToggleViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('auraloop_bucket_view_mode', mode);
  };

  // Reset pagination on search or folder change
  useEffect(() => {
    setCurrentPage(1);
  }, [folderSearch, currentFolder]);

  // Group wallpapers by folder/category
  const folders = useMemo(() => {
    const map = {};
    for (const w of wallpapers) {
      const cat = w.category || 'General';
      if (!map[cat]) {
        map[cat] = {
          name: cat,
          count: 0,
          sizeBytes: 0,
          items: [],
        };
      }
      map[cat].count += 1;
      map[cat].sizeBytes += (w.sizeBytes || 0);
      map[cat].items.push(w);
    }
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [wallpapers]);

  const searchLower = (folderSearch || '').toLowerCase().trim();

  // Root filtered folders
  const filteredFolders = folders.filter((f) =>
    (f.name || '').toLowerCase().includes(searchLower)
  );

  // Current folder data
  const currentFolderData = currentFolder
    ? folders.find((f) => f.name === currentFolder) || {
        name: currentFolder,
        items: [],
        count: 0,
        sizeBytes: 0,
      }
    : null;

  // Items inside current folder matching search
  const filteredItems = currentFolderData
    ? currentFolderData.items.filter((item) =>
        (item.title || '').toLowerCase().includes(searchLower)
      )
    : [];

  // Paginated items
  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const handleCopyUrl = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    showToast('CDN URL copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Folder View Mode: 'grid' or 'list' (root folders)
  const [folderViewMode, setFolderViewMode] = useState(() => {
    return localStorage.getItem('auraloop_root_folder_view_mode') || 'grid';
  });

  // Handle root folder view mode
  const handleToggleFolderViewMode = (mode) => {
    setFolderViewMode(mode);
    localStorage.setItem('auraloop_root_folder_view_mode', mode);
  };

  // Custom In-App New Folder Modal State
  const [newFolderModal, setNewFolderModal] = useState({
    isOpen: false,
    folderName: '',
  });

  // Open New Folder Modal
  const handleOpenNewFolder = () => {
    setNewFolderModal({ isOpen: true, folderName: '' });
  };

  // Confirm Create New Folder
  const handleConfirmNewFolder = () => {
    if (!newFolderModal.folderName.trim()) return;
    const trimmed = newFolderModal.folderName.trim();

    const newFolderObj = {
      id: `new_${Date.now()}`,
      title: `Welcome to ${trimmed}`,
      category: trimmed,
      width: 3840,
      height: 2160,
      fps: 60,
      duration: 15,
      sizeBytes: 15400000,
      video: `https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/${trimmed}/demo_4k.mov`,
      thumbnail: `https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/${trimmed}/demo_thumb.jpg`,
      publishedAt: new Date().toISOString(),
    };
    const updated = [newFolderObj, ...wallpapers];
    onUpdateWallpapers(updated, {
      title: `${trimmed}/`,
      action: 'Created R2 Folder',
      category: trimmed,
      type: 'folder',
    });
    showToast(`Folder "${trimmed}" created in R2 bucket!`);
    setCurrentFolder(trimmed);
    setNewFolderModal({ isOpen: false, folderName: '' });
  };

  // Delete Entire Folder
  const handleDeleteFolder = (folderName, e) => {
    e.stopPropagation();
    onTriggerConfirmation({
      title: 'Delete Entire Folder',
      message: `CAUTION: You are about to permanently delete folder "${folderName}" and all wallpapers inside it from Cloudflare R2. This cannot be undone!`,
      targetName: folderName,
      actionType: 'danger',
      confirmText: 'Delete Folder',
      onConfirm: () => {
        const remaining = wallpapers.filter((w) => w.category !== folderName);
        onUpdateWallpapers(remaining, {
          title: `${folderName}/`,
          action: 'Deleted R2 Folder',
          category: folderName,
          type: 'delete',
        });
        if (currentFolder === folderName) setCurrentFolder(null);
        showToast(`Folder "${folderName}" deleted from R2.`);
      },
    });
  };

  // Rename Modal State
  const [renameModal, setRenameModal] = useState({
    isOpen: false,
    item: null,
    title: '',
  });

  // Open Rename Modal
  const handleOpenRename = (item, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setRenameModal({
      isOpen: true,
      item,
      title: item.title,
    });
  };

  // Submit Rename Modal
  const handleConfirmRename = () => {
    if (!renameModal.item || !renameModal.title.trim()) return;
    const trimmed = renameModal.title.trim();
    const item = renameModal.item;

    if (trimmed === item.title) {
      setRenameModal({ isOpen: false, item: null, title: '' });
      return;
    }

    const updated = wallpapers.map((w) =>
      w.id === item.id ? { ...w, title: trimmed } : w
    );
    onUpdateWallpapers(updated, {
      title: trimmed,
      action: `Renamed from "${item.title}"`,
      category: item.category,
      type: 'rename',
    });
    showToast(`Wallpaper renamed to "${trimmed}"!`);
    setRenameModal({ isOpen: false, item: null, title: '' });
  };

  // Delete Wallpaper
  const handleDeleteWallpaper = (item, e) => {
    e.stopPropagation();
    onTriggerConfirmation({
      title: 'Delete Wallpaper',
      message: `Are you sure you want to delete this wallpaper from your library?`,
      targetName: item.title,
      actionType: 'danger',
      confirmText: 'Delete',
      onConfirm: () => {
        const updated = wallpapers.filter((w) => w.id !== item.id);
        onUpdateWallpapers(updated, {
          title: item.title,
          action: 'Deleted Video from R2',
          category: item.category,
          type: 'delete',
        });
        showToast(`Wallpaper "${item.title}" deleted.`);
      },
    });
  };

  // Drag & Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  // Drag & Drop Drop Handler
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const items = e.dataTransfer.items;
    if (!items || items.length === 0) return;

    // Scan dropped items
    const filesFound = [];
    const foldersFound = [];

    const scanEntry = async (entry, path = '') => {
      if (entry.isFile) {
        const file = await new Promise((res) => entry.file(res));
        filesFound.push({ file, path: path + file.name });
      } else if (entry.isDirectory) {
        foldersFound.push(entry.name);
        const dirReader = entry.createReader();
        const entries = await new Promise((res) => dirReader.readEntries(res));
        for (const sub of entries) {
          await scanEntry(sub, `${path}${entry.name}/`);
        }
      }
    };

    for (let i = 0; i < items.length; i++) {
      const entry = items[i].webkitGetAsEntry ? items[i].webkitGetAsEntry() : null;
      if (entry) {
        await scanEntry(entry);
      } else if (items[i].kind === 'file') {
        const f = items[i].getAsFile();
        if (f) filesFound.push({ file: f, path: f.name });
      }
    }

    // ROOT DIRECTORY LOGIC: FOLDERS ONLY
    if (!currentFolder) {
      if (foldersFound.length === 0 && filesFound.length > 0) {
        showToast('At Root Directory: Please drop or upload entire folders only.');
        return;
      }

      const folderName = foldersFound[0] || 'Imported Category';
      onTriggerConfirmation({
        title: 'Upload Category Folder',
        message: `Create category folder "${folderName}/" with ${filesFound.length} file(s) in Cloudflare R2 bucket?`,
        targetName: `auraloop-wallpapers/${folderName}/`,
        actionType: 'primary',
        confirmText: `Upload Folder (${filesFound.length} items)`,
        onConfirm: () => {
          const newEntries = filesFound.map((f, idx) => ({
            id: `drop_${Date.now()}_${idx}`,
            title: f.file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
            category: folderName,
            width: 3840,
            height: 2160,
            fps: 60,
            duration: 20,
            sizeBytes: f.file.size || 25000000,
            video: `https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/${folderName}/${f.file.name}`,
            thumbnail: `https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/${folderName}/thumb_${f.file.name}.jpg`,
            publishedAt: new Date().toISOString(),
          }));

          const updated = [...newEntries, ...wallpapers];
          onUpdateWallpapers(updated, {
            title: `${folderName}/`,
            action: `Uploaded Category Folder (${filesFound.length} items)`,
            category: folderName,
            type: 'upload',
          });
          showToast(`Uploaded folder "${folderName}" with ${filesFound.length} wallpaper(s)!`);
          setCurrentFolder(folderName);
        },
      });
      return;
    }

    // INSIDE FOLDER LOGIC: INDIVIDUAL VIDEO FILES ONLY
    if (filesFound.length > 0) {
      onTriggerConfirmation({
        title: `Upload 4K Wallpapers to ${currentFolder}/`,
        message: `Confirm uploading ${filesFound.length} file(s) into category "${currentFolder}/"?`,
        targetName: filesFound.slice(0, 3).map((f) => f.file.name).join(', ') + (filesFound.length > 3 ? ` ... (+${filesFound.length - 3} more)` : ''),
        actionType: 'primary',
        confirmText: `Upload ${filesFound.length} Video(s)`,
        onConfirm: () => {
          const newEntries = filesFound.map((f, idx) => ({
            id: `drop_${Date.now()}_${idx}`,
            title: f.file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
            category: currentFolder,
            width: 3840,
            height: 2160,
            fps: 60,
            duration: 15,
            sizeBytes: f.file.size || 35000000,
            video: `https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/${currentFolder}/${f.file.name}`,
            thumbnail: `https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/${currentFolder}/thumb_${f.file.name}.jpg`,
            publishedAt: new Date().toISOString(),
          }));

          const updated = [...newEntries, ...wallpapers];
          onUpdateWallpapers(updated, {
            title: `Uploaded ${filesFound.length} loop(s)`,
            action: `Batch Upload to ${currentFolder}/`,
            category: currentFolder,
            type: 'upload',
          });
          showToast(`Uploaded ${filesFound.length} wallpaper(s) to ${currentFolder}/!`);
        },
      });
    }
  };

  // Folder Selected at Root
  const handleRootFolderSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Detect folder name from webkitRelativePath
    const samplePath = files[0].webkitRelativePath || '';
    const folderName = samplePath.split('/')[0] || 'Imported Category';

    onTriggerConfirmation({
      title: 'Upload Category Folder',
      message: `Upload folder "${folderName}/" containing ${files.length} wallpaper(s) to Cloudflare R2 bucket?`,
      targetName: `auraloop-wallpapers/${folderName}/`,
      actionType: 'primary',
      confirmText: `Upload Folder (${files.length} items)`,
      onConfirm: () => {
        const newEntries = files.map((f, idx) => ({
          id: `folder_upload_${Date.now()}_${idx}`,
          title: f.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
          category: folderName,
          width: 3840,
          height: 2160,
          fps: 60,
          duration: 15,
          sizeBytes: f.size || 25000000,
          video: `https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/${folderName}/${f.name}`,
          thumbnail: `https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/${folderName}/thumb_${f.name}.jpg`,
          publishedAt: new Date().toISOString(),
        }));

        const updated = [...newEntries, ...wallpapers];
        onUpdateWallpapers(updated, {
          title: `${folderName}/`,
          action: `Uploaded Category Folder (${files.length} items)`,
          category: folderName,
          type: 'upload',
        });
        showToast(`Uploaded folder "${folderName}" with ${files.length} items!`);
        setCurrentFolder(folderName);
      },
    });
  };

  // Video Files Selected inside Folder
  const handleVideoFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !currentFolder) return;

    onTriggerConfirmation({
      title: `Upload 4K Videos to ${currentFolder}/`,
      message: `Confirm uploading ${files.length} video(s) into category "${currentFolder}/"?`,
      targetName: files.slice(0, 3).map((f) => f.name).join(', ') + (files.length > 3 ? ` ... (+${files.length - 3} more)` : ''),
      actionType: 'primary',
      confirmText: `Upload ${files.length} Video(s)`,
      onConfirm: () => {
        const newEntries = files.map((f, idx) => ({
          id: `file_upload_${Date.now()}_${idx}`,
          title: f.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
          category: currentFolder,
          width: 3840,
          height: 2160,
          fps: 60,
          duration: 15,
          sizeBytes: f.size || 25000000,
          video: `https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/${currentFolder}/${f.name}`,
          thumbnail: `https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/${currentFolder}/thumb_${f.name}.jpg`,
          publishedAt: new Date().toISOString(),
        }));

        const updated = [...newEntries, ...wallpapers];
        onUpdateWallpapers(updated, {
          title: `Uploaded ${files.length} videos`,
          action: `Added to ${currentFolder}/`,
          category: currentFolder,
          type: 'upload',
        });
        showToast(`Uploaded ${files.length} video(s) to ${currentFolder}/!`);
      },
    });
  };

  return (
    <div className="bucket-manager-page">
      {/* Hidden Global File Inputs (Triggered anywhere inside the Dropzone) */}
      <input
        ref={folderInputRef}
        type="file"
        webkitdirectory=""
        directory=""
        style={{ display: 'none' }}
        onChange={handleRootFolderSelected}
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/*"
        style={{ display: 'none' }}
        onChange={handleVideoFilesSelected}
      />

      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 22,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: -0.4,
              margin: 0,
            }}
          >
            Manage Wallpapers
          </h2>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {!currentFolder ? (
            <button className="btn-light-pill" onClick={handleOpenNewFolder} style={{ flex: 'none', padding: '9px 18px', fontSize: 13 }}>
              <span>New Folder</span>
            </button>
          ) : (
            <button
              className="primary-cta-btn"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              style={{ cursor: 'pointer', margin: 0 }}
            >
              <Upload size={15} />
              <span>Upload Videos</span>
            </button>
          )}
        </div>
      </div>

      {/* HERO DRAG & DROP ZONE - FULLY CLICKABLE, SPACIOUS & CENTERED */}
      <motion.div
        whileHover={{ scale: 1.002, borderColor: 'var(--accent-orange)' }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!currentFolder) {
            folderInputRef.current && folderInputRef.current.click();
          } else {
            fileInputRef.current && fileInputRef.current.click();
          }
        }}
        style={{
          border: `1.5px dashed ${isDragOver ? 'var(--accent-orange)' : 'var(--border-color)'}`,
          background: isDragOver
            ? 'linear-gradient(135deg, rgba(228, 87, 46, 0.12) 0%, rgba(228, 87, 46, 0.03) 100%)'
            : 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '48px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: 24,
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: isDragOver ? '0 12px 28px -4px rgba(228, 87, 46, 0.25)' : 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'var(--accent-orange-light)',
            border: '1.5px solid rgba(228, 87, 46, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-orange)',
            marginBottom: 16,
          }}
        >
          {!currentFolder ? <Folder size={28} fill="currentColor" /> : <Upload size={28} />}
        </div>

        <h4 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0, marginBottom: 6 }}>
          {!currentFolder
            ? 'Drop Entire Category Folders Here'
            : `Drop Videos to upload into ${currentFolder}`}
        </h4>

        <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: 0, marginBottom: 18, maxWidth: 540 }}>
          {!currentFolder
            ? 'Upload nested directories to create new wallpaper categories in your library, or click anywhere to select a folder.'
            : 'Upload single or multiple video loops directly into this folder, or click anywhere to select files.'}
        </p>

        <span
          className={!currentFolder ? 'btn-light-pill' : 'btn-dark-pill'}
          style={{
            display: 'inline-flex',
            pointerEvents: 'none',
            padding: '9px 24px',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {!currentFolder ? 'Select Category Folder' : 'Select Video Files'}
        </span>
      </motion.div>

      {/* Breadcrumb Navigation when inside a folder - ENLARGED & STRUCTURED (NO TRAILING SLASH) */}
      {currentFolder && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 20,
            background: 'var(--bg-card)',
            padding: '12px 20px',
            minHeight: 52,
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <button
            className="btn-light-pill"
            style={{ padding: '7px 15px', fontSize: 12.5, fontWeight: 600, flex: 'none' }}
            onClick={() => setCurrentFolder(null)}
          >
            <ArrowLeft size={14} />
            <span>All Folders</span>
          </button>
          <ChevronRight size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Folder size={18} color="var(--accent-orange)" fill="var(--accent-orange)" />
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              {currentFolder}
            </span>
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 'auto', fontWeight: 500 }}>
            {currentFolderData.count} Wallpapers ({formatBytes(currentFolderData.sizeBytes)})
          </span>
        </div>
      )}

      {/* Search, View Switcher & Filter Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 18,
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="search-box" style={{ width: 310, height: 44, padding: '0 14px' }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              className="search-input"
              style={{ fontSize: 13.5 }}
              placeholder={currentFolder ? `Search in ${currentFolder}...` : 'Search folders...'}
              value={folderSearch}
              onChange={(e) => setFolderSearch(e.target.value)}
            />
          </div>

          {/* Grid vs List View Mode Toggle (Available BOTH at root and inside folder) */}
          <div className="view-mode-toggle" style={{ height: 40, padding: 3 }}>
            <button
              className={`view-mode-btn ${(currentFolder ? viewMode : folderViewMode) === 'grid' ? 'active' : ''}`}
              style={{ width: 34, height: 34 }}
              onClick={() => {
                if (currentFolder) handleToggleViewMode('grid');
                else handleToggleFolderViewMode('grid');
              }}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              className={`view-mode-btn ${(currentFolder ? viewMode : folderViewMode) === 'list' ? 'active' : ''}`}
              style={{ width: 34, height: 34 }}
              onClick={() => {
                if (currentFolder) handleToggleViewMode('list');
                else handleToggleFolderViewMode('list');
              }}
              title="List View"
            >
              <List size={16} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {currentFolder
              ? `Showing ${Math.min((currentPage - 1) * pageSize + 1, totalItems)}–${Math.min(currentPage * pageSize, totalItems)} of ${totalItems} wallpapers`
              : `Showing ${filteredFolders.length} folders`}
          </span>

          {currentFolder && (
            <div style={{ position: 'relative' }}>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <option value={12}>12 / page</option>
                <option value={24}>24 / page</option>
                <option value={48}>48 / page</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* VIEW 1: ROOT FOLDERS (GRID OR LIST VIEW) */}
      {!currentFolder && (
        <>
          {folderViewMode === 'grid' ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
                gap: 16,
              }}
            >
              {filteredFolders.map((f) => (
                <div
                  key={f.name}
                  className="admin-card"
                  onClick={() => setCurrentFolder(f.name)}
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '20px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-orange)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--accent-orange-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-orange)',
                      }}
                    >
                      <Folder size={24} fill="currentColor" />
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="action-dots-btn"
                        onClick={(e) => handleDeleteFolder(f.name, e)}
                        title={`Delete folder "${f.name}"`}
                      >
                        <Trash2 size={15} color="#DC2626" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                      {f.name}
                    </h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                      <span>{f.count} Wallpapers</span>
                      <span>{formatBytes(f.sizeBytes)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 44 }}></th>
                    <th>Folder Name</th>
                    <th>Wallpapers Count</th>
                    <th>Total Size</th>
                    <th style={{ width: 80, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFolders.map((f) => (
                    <tr
                      key={f.name}
                      onClick={() => setCurrentFolder(f.name)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--accent-orange-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--accent-orange)',
                          }}
                        >
                          <Folder size={18} fill="currentColor" />
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>
                          {f.name}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {f.count} Wallpapers
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {formatBytes(f.sizeBytes)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="action-dots-btn"
                          onClick={(e) => handleDeleteFolder(f.name, e)}
                          title={`Delete folder "${f.name}"`}
                        >
                          <Trash2 size={14} color="#DC2626" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* VIEW 2: INSIDE A FOLDER (PAGINATED GRID OR LIST) */}
      {currentFolder && (
        <>
          {/* OPTION A: GRID VIEW (5 COLUMNS, CLEAN CARDS - ONLY THUMBNAIL, TITLE & ACTIONS) */}
          {viewMode === 'grid' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(215px, 1fr))',
                gap: 16,
              }}
            >
              {paginatedItems.map((item) => (
                <div
                  key={item.id}
                  className="admin-card"
                  style={{
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  {/* Media Thumbnail Container */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '16 / 9',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      background: '#0F1115',
                      cursor: 'pointer',
                    }}
                    onClick={() => onOpenVideoPreview(item)}
                  >
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.2s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = 0)}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: 'rgba(255, 91, 38, 0.95)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        }}
                      >
                        <Play size={18} fill="white" />
                      </div>
                    </div>
                  </div>

                  {/* Clean Title Only */}
                  <div>
                    <h5
                      style={{
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        margin: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={item.title}
                    >
                      {item.title}
                    </h5>
                  </div>

                  {/* Action Buttons */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: 8,
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                  >
                    <button
                      className="btn-light-pill"
                      style={{ padding: '5px 10px', fontSize: 11.5 }}
                      onClick={() => handleCopyUrl(item.video, item.id)}
                      title="Copy CDN URL"
                    >
                      {copiedId === item.id ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                      <span>{copiedId === item.id ? 'Copied' : 'CDN URL'}</span>
                    </button>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="action-dots-btn"
                        onClick={(e) => handleOpenRename(item, e)}
                        title="Rename wallpaper"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        className="action-dots-btn"
                        onClick={(e) => handleDeleteWallpaper(item, e)}
                        title="Delete wallpaper"
                      >
                        <Trash2 size={13} color="#DC2626" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* OPTION B: LIST VIEW (TABLE) */}
          {viewMode === 'list' && (
            <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>Preview</th>
                    <th>Wallpaper Title</th>
                    <th>Resolution</th>
                    <th>FPS / Duration</th>
                    <th>Size</th>
                    <th>CDN URL</th>
                    <th style={{ width: 90, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div
                          style={{
                            width: 52,
                            height: 32,
                            borderRadius: 4,
                            overflow: 'hidden',
                            background: '#000',
                            position: 'relative',
                            cursor: 'pointer',
                          }}
                          onClick={() => onOpenVideoPreview(item)}
                          title="Click to preview video"
                        >
                          <img
                            src={item.thumbnail}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'rgba(0,0,0,0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Play size={10} fill="#FFF" color="#FFF" />
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {new Date(item.publishedAt || Date.now()).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <span className="card-badge-pill" style={{ fontSize: 10.5, padding: '2px 7px' }}>
                          {item.width && item.height ? `${item.width}x${item.height}` : '4K UHD'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                        {formatFps(item.fps)} • {formatDuration(item.duration)}
                      </td>
                      <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                        {formatBytes(item.sizeBytes)}
                      </td>
                      <td>
                        <button
                          className="btn-light-pill"
                          style={{ padding: '4px 10px', fontSize: 11 }}
                          onClick={() => handleCopyUrl(item.video, item.id)}
                        >
                          {copiedId === item.id ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                          <span>{copiedId === item.id ? 'Copied' : 'Copy CDN'}</span>
                        </button>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            className="action-dots-btn"
                            onClick={(e) => handleOpenRename(item, e)}
                            title="Rename"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            className="action-dots-btn"
                            onClick={(e) => handleDeleteWallpaper(item, e)}
                            title="Delete"
                          >
                            <Trash2 size={13} color="#DC2626" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINATION CONTROLS BAR */}
          {totalPages > 1 && (
            <div className="pagination-bar">
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Page {currentPage} of {totalPages}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  className="pagination-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  title="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Page Number Buttons */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    // Show first, last, and window around current
                    return p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1;
                  })
                  .map((p, idx, arr) => {
                    const prevP = arr[idx - 1];
                    const hasGap = prevP && p - prevP > 1;

                    return (
                      <React.Fragment key={p}>
                        {hasGap && <span style={{ color: 'var(--text-muted)', padding: '0 4px' }}>...</span>}
                        <button
                          className={`pagination-btn ${p === currentPage ? 'active' : ''}`}
                          onClick={() => setCurrentPage(p)}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  className="pagination-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  title="Next Page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* CUSTOM IN-APP RENAME MODAL */}
      {renameModal.isOpen && (
        <div
          className="modal-overlay"
          onClick={() => setRenameModal({ isOpen: false, item: null, title: '' })}
        >
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
                Rename Wallpaper
              </h3>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: 8,
                }}
              >
                Wallpaper Title
              </label>
              <input
                type="text"
                autoFocus
                value={renameModal.title}
                onChange={(e) =>
                  setRenameModal((prev) => ({ ...prev, title: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmRename();
                  if (e.key === 'Escape')
                    setRenameModal({ isOpen: false, item: null, title: '' });
                }}
                placeholder="Enter wallpaper title..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: 14,
                  borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--accent-orange)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                className="btn-secondary"
                onClick={() =>
                  setRenameModal({ isOpen: false, item: null, title: '' })
                }
                style={{
                  padding: '8px 16px',
                  fontSize: 13,
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleConfirmRename}
                disabled={!renameModal.title.trim()}
                style={{
                  padding: '8px 18px',
                  fontSize: 13,
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM IN-APP NEW FOLDER MODAL */}
      {newFolderModal.isOpen && (
        <div
          className="modal-overlay"
          onClick={() => setNewFolderModal({ isOpen: false, folderName: '' })}
        >
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
                Create New Folder
              </h3>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: 8,
                }}
              >
                Folder Name
              </label>
              <input
                type="text"
                autoFocus
                value={newFolderModal.folderName}
                onChange={(e) =>
                  setNewFolderModal((prev) => ({ ...prev, folderName: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmNewFolder();
                  if (e.key === 'Escape')
                    setNewFolderModal({ isOpen: false, folderName: '' });
                }}
                placeholder="e.g. Cyberpunk, 3D Renders, Nature..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: 14,
                  borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--accent-orange)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                className="btn-secondary"
                onClick={() =>
                  setNewFolderModal({ isOpen: false, folderName: '' })
                }
                style={{
                  padding: '8px 16px',
                  fontSize: 13,
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleConfirmNewFolder}
                disabled={!newFolderModal.folderName.trim()}
                style={{
                  padding: '8px 18px',
                  fontSize: 13,
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
