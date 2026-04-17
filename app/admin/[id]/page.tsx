'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Photo {
  id: string;
  storage_path: string;
  filename: string;
  is_landscape: boolean;
  sort_order: number;
  created_at: string;
  url: string;
}

interface Gallery {
  id: string;
  slug: string;
  couple_names: string;
  sneak_peek_label: string;
  is_published: boolean;
  grid_style: 'stacked' | 'clean';
}

export default function GalleryEditor() {
  const { id } = useParams();
  const router = useRouter();
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadCurrent, setUploadCurrent] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [uploadFailed, setUploadFailed] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);
  const [sortMode, setSortMode] = useState<'custom' | 'name-asc' | 'name-desc' | 'time-asc' | 'time-desc'>('custom');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    fetchGallery();
    fetchPhotos();
  }, [id]);

  async function fetchGallery() {
    const res = await fetch('/api/galleries');
    const galleries = await res.json();
    const g = galleries.find((g: Gallery) => g.id === id);
    if (!g) return router.push('/admin');
    setGallery(g);
  }

  async function fetchPhotos() {
    const res = await fetch(`/api/upload?gallery_id=${id}`);
    const data = await res.json();
    if (Array.isArray(data)) setPhotos(data);
  }

  async function uploadFiles(files: FileList | File[]) {
    if (!gallery) return;
    const fileArray = Array.from(files);
    if (!fileArray.length) return;

    setUploading(true);
    setUploadTotal(fileArray.length);
    setUploadCurrent(0);
    setUploadFailed([]);
    abortRef.current = false;

    // Get current max sort order
    const startOrder = photos.length;

    for (let i = 0; i < fileArray.length; i++) {
      if (abortRef.current) break;

      setUploadCurrent(i + 1);
      const file = fileArray[i];

      const formData = new FormData();
      formData.append('gallery_id', gallery.id);
      formData.append('file', file);
      formData.append('sort_order', String(startOrder + i));

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();

        if (data.error) {
          setUploadFailed(prev => [...prev, file.name]);
        } else {
          // Add to grid immediately
          setPhotos(prev => [...prev, data]);
        }
      } catch {
        setUploadFailed(prev => [...prev, file.name]);
      }
    }

    setUploading(false);
  }

  async function deletePhoto(photoId: string) {
    await fetch('/api/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo_id: photoId }),
    });
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  }

  async function saveOrder(newPhotos: Photo[]) {
    setSaving(true);
    await fetch('/api/upload', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo_ids: newPhotos.map(p => p.id) }),
    });
    setSaving(false);
  }

  async function updateGallery(updates: Partial<Gallery>) {
    if (!gallery) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    setGallery({ ...gallery, ...updates });
    saveTimeout.current = setTimeout(async () => {
      await fetch('/api/galleries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: gallery.id, ...updates }),
      });
    }, 500);
  }

  function applySortMode(mode: typeof sortMode) {
    setSortMode(mode);
    if (mode === 'custom') {
      // Re-fetch from server to get saved custom order
      fetchPhotos();
      return;
    }
    const sorted = [...photos].sort((a, b) => {
      switch (mode) {
        case 'name-asc': return a.filename.localeCompare(b.filename, undefined, { numeric: true });
        case 'name-desc': return b.filename.localeCompare(a.filename, undefined, { numeric: true });
        case 'time-asc': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'time-desc': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default: return 0;
      }
    });
    setPhotos(sorted);
    saveOrder(sorted);
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  }

  function handleDragStart(idx: number) { setDragIdx(idx); }
  function handleDragOver(e: React.DragEvent, idx: number) { e.preventDefault(); setDropIdx(idx); }
  function handleDropReorder(idx: number) {
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDropIdx(null); return; }
    const updated = [...photos];
    const [moved] = updated.splice(dragIdx, 1);
    updated.splice(idx, 0, moved);
    setPhotos(updated);
    setDragIdx(null);
    setDropIdx(null);
    saveOrder(updated);
  }

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const uploadPct = uploadTotal > 0 ? Math.round((uploadCurrent / uploadTotal) * 100) : 0;

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #15120f; }
      `}</style>

      <div style={s.container}>
        <button style={s.backBtn} onClick={() => router.push('/admin')}>← Back</button>

        {gallery && (
          <>
            <div style={s.topRow}>
              <div style={s.fields}>
                <label style={s.label}>Couple Names</label>
                <input
                  style={s.input}
                  value={gallery.couple_names}
                  onChange={e => updateGallery({ couple_names: e.target.value })}
                />
                <label style={{ ...s.label, marginTop: '12px' }}>Lid Label</label>
                <input
                  style={s.input}
                  value={gallery.sneak_peek_label}
                  onChange={e => updateGallery({ sneak_peek_label: e.target.value })}
                />
                <label style={{ ...s.label, marginTop: '12px' }}>URL Slug</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ ...s.label, marginTop: 0, color: '#a0958a' }}>/g/</span>
                  <input
                    style={s.input}
                    value={gallery.slug}
                    onChange={e => updateGallery({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
                  />
                </div>
                <label style={{ ...s.label, marginTop: '12px' }}>Grid Style</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { key: 'stacked', label: 'Stacked' },
                    { key: 'clean', label: 'Clean Grid' },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      style={{
                        ...s.sortBtn,
                        ...(gallery.grid_style === opt.key ? s.sortBtnActive : {}),
                      }}
                      onClick={() => updateGallery({ grid_style: opt.key as Gallery['grid_style'] })}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={s.sidebar}>
                <div style={s.linkBox}>
                  <span style={s.linkLabel}>Gallery link</span>
                  <a style={s.link} href={`/g/${gallery.slug}`} target="_blank" rel="noopener noreferrer">
                    /g/{gallery.slug}
                  </a>
                </div>
                <button
                  style={{
                    ...s.btn,
                    background: gallery.is_published ? '#9bc49f' : '#ece3d1',
                    color: '#1a1613',
                    width: '100%',
                  }}
                  onClick={() => updateGallery({ is_published: !gallery.is_published })}
                >
                  {gallery.is_published ? '● Live' : 'Publish'}
                </button>
                <div style={s.photoCount}>
                  {photos.length} photo{photos.length !== 1 ? 's' : ''}
                  {saving && <span style={s.savingBadge}> saving...</span>}
                </div>
              </div>
            </div>

            {/* Upload zone */}
            <div
              style={{
                ...s.dropZone,
                borderColor: dragOver ? '#ece3d1' : '#3a342d',
                background: dragOver ? 'rgba(236,227,209,0.04)' : 'transparent',
              }}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={e => e.target.files && uploadFiles(e.target.files)}
              />
              {uploading ? (
                <div>
                  <p style={s.dropText}>{uploadCurrent} of {uploadTotal}</p>
                  <div style={s.progressBar}>
                    <div style={{ ...s.progressFill, width: `${uploadPct}%` }} />
                  </div>
                  {uploadFailed.length > 0 && (
                    <p style={s.failedText}>{uploadFailed.length} failed</p>
                  )}
                  <button
                    style={{ ...s.btnSmall, marginTop: '12px' }}
                    onClick={(e) => { e.stopPropagation(); abortRef.current = true; }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <p style={s.dropText}>Drop photos here or click to upload</p>
                  <p style={s.dropSub}>JPEG, PNG, WebP — handles 100+ photos, uploaded one at a time</p>
                </>
              )}
            </div>

            {/* Thumbnail grid */}
            {photos.length > 0 && (
              <>
                <div style={s.sortBar}>
                  <span style={s.sortLabel}>Sort by</span>
                  <div style={s.sortOptions}>
                    {[
                      { key: 'custom', label: 'Custom' },
                      { key: 'name-asc', label: 'Name A→Z' },
                      { key: 'name-desc', label: 'Name Z→A' },
                      { key: 'time-asc', label: 'Oldest first' },
                      { key: 'time-desc', label: 'Newest first' },
                    ].map(opt => (
                      <button
                        key={opt.key}
                        style={{
                          ...s.sortBtn,
                          ...(sortMode === opt.key ? s.sortBtnActive : {}),
                        }}
                        onClick={() => applySortMode(opt.key as typeof sortMode)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                {sortMode === 'custom' && (
                  <p style={s.reorderHint}>Drag to reorder. First photo shows on top of the stack.</p>
                )}
                <div style={s.photoGrid}>
                  {photos.map((photo, idx) => (
                    <div
                      key={photo.id}
                      style={{
                        ...s.photoCard,
                        opacity: dragIdx === idx ? 0.4 : 1,
                        outline: dropIdx === idx ? '2px solid #ece3d1' : 'none',
                        cursor: sortMode === 'custom' ? 'grab' : 'default',
                      }}
                      draggable={sortMode === 'custom'}
                      onDragStart={() => sortMode === 'custom' && handleDragStart(idx)}
                      onDragOver={e => sortMode === 'custom' && handleDragOver(e, idx)}
                      onDrop={() => sortMode === 'custom' && handleDropReorder(idx)}
                      onDragEnd={() => { setDragIdx(null); setDropIdx(null); }}
                    >
                      <img src={photo.url} alt={photo.filename} style={s.photoThumb} />
                      <div style={s.photoOverlay}>
                        <span style={s.photoTag}>
                          {idx + 1} · {photo.is_landscape ? 'L' : 'P'}
                        </span>
                        <button
                          style={s.deleteBtn}
                          onClick={(e) => { e.stopPropagation(); deletePhoto(photo.id); }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    fontFamily: "'DM Sans', sans-serif",
    padding: '40px 20px 100px',
    color: '#e8e1d4',
  },
  container: {
    maxWidth: '780px',
    margin: '0 auto',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    fontSize: '14px',
    color: '#a0958a',
    cursor: 'pointer',
    marginBottom: '24px',
    fontFamily: "'DM Sans', sans-serif",
  },
  topRow: {
    display: 'flex',
    gap: '24px',
    marginBottom: '28px',
    flexWrap: 'wrap' as const,
  },
  fields: { flex: 1, minWidth: '260px' },
  sidebar: {
    width: '200px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 500,
    color: '#a0958a',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    marginBottom: '4px',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '15px',
    border: '1px solid #3a342d',
    borderRadius: '4px',
    background: '#1e1a15',
    color: '#ece3d1',
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
  },
  linkBox: {
    padding: '10px 12px',
    background: '#1e1a15',
    border: '1px solid #2a241e',
    borderRadius: '4px',
  },
  linkLabel: {
    display: 'block',
    fontSize: '10px',
    color: '#a0958a',
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
    marginBottom: '4px',
  },
  link: {
    fontSize: '13px',
    color: '#ece3d1',
    textDecoration: 'none',
    wordBreak: 'break-all' as const,
  },
  btn: {
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#1a1613',
    background: '#ece3d1',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  btnSmall: {
    padding: '6px 14px',
    fontSize: '12px',
    color: '#ece3d1',
    background: 'transparent',
    border: '1px solid #3a342d',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  photoCount: {
    fontSize: '13px',
    color: '#a0958a',
    textAlign: 'center' as const,
  },
  savingBadge: {
    color: '#9bc49f',
    fontSize: '11px',
  },
  dropZone: {
    border: '2px dashed #3a342d',
    borderRadius: '6px',
    padding: '36px 24px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    marginBottom: '24px',
    transition: 'all 0.15s ease',
  },
  dropText: {
    fontSize: '14px',
    color: '#ece3d1',
    marginBottom: '8px',
  },
  dropSub: {
    fontSize: '12px',
    color: '#a0958a',
  },
  progressBar: {
    width: '100%',
    maxWidth: '300px',
    height: '4px',
    background: '#2a241e',
    borderRadius: '2px',
    margin: '0 auto',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: '#ece3d1',
    borderRadius: '2px',
    transition: 'width 0.3s ease',
  },
  failedText: {
    fontSize: '12px',
    color: '#e88',
    marginTop: '8px',
  },
  reorderHint: {
    fontSize: '12px',
    color: '#a0958a',
    marginBottom: '12px',
  },
  sortBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '14px',
    flexWrap: 'wrap' as const,
  },
  sortLabel: {
    fontSize: '11px',
    fontWeight: 500,
    color: '#a0958a',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
  },
  sortOptions: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap' as const,
  },
  sortBtn: {
    padding: '5px 12px',
    fontSize: '12px',
    color: '#a0958a',
    background: '#1e1a15',
    border: '1px solid #3a342d',
    borderRadius: '20px',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'all 0.15s ease',
  },
  sortBtnActive: {
    color: '#1a1613',
    background: '#ece3d1',
    borderColor: '#ece3d1',
  },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '8px',
  },
  photoCard: {
    position: 'relative' as const,
    aspectRatio: '2/3',
    borderRadius: '3px',
    overflow: 'hidden',
    cursor: 'grab',
    transition: 'opacity 0.15s ease',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    display: 'block',
  },
  photoOverlay: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    padding: '4px 6px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'linear-gradient(transparent, rgba(0,0,0,0.5))',
  },
  photoTag: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: '0.5px',
  },
  deleteBtn: {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: '#fff',
    fontSize: '16px',
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },
};
