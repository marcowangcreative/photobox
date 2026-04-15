'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Photo {
  id: string;
  storage_path: string;
  filename: string;
  is_landscape: boolean;
  sort_order: number;
  url?: string;
}

interface Gallery {
  id: string;
  slug: string;
  couple_names: string;
  sneak_peek_label: string;
  is_published: boolean;
}

export default function GalleryEditor() {
  const { id } = useParams();
  const router = useRouter();
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchGallery();
  }, [id]);

  async function fetchGallery() {
    // Fetch gallery details and photos
    const res = await fetch(`/api/galleries`);
    const galleries = await res.json();
    const g = galleries.find((g: Gallery) => g.id === id);
    if (!g) return router.push('/admin');
    setGallery(g);

    // Fetch photos via Supabase client
    const photosRes = await fetch(`/api/upload?gallery_id=${id}`);
    // For simplicity, we'll load photos through the gallery endpoint
    // In production, add a GET handler to the upload route
  }

  async function uploadFiles(files: FileList | File[]) {
    if (!gallery) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('gallery_id', gallery.id);

    const fileArray = Array.from(files);
    setUploadProgress(`Uploading ${fileArray.length} photos...`);

    // Upload in batches of 5
    const batchSize = 5;
    for (let i = 0; i < fileArray.length; i += batchSize) {
      const batch = fileArray.slice(i, i + batchSize);
      const batchForm = new FormData();
      batchForm.append('gallery_id', gallery.id);
      batch.forEach(f => batchForm.append('files', f));

      setUploadProgress(`Uploading ${i + 1}-${Math.min(i + batchSize, fileArray.length)} of ${fileArray.length}...`);

      await fetch('/api/upload', {
        method: 'POST',
        body: batchForm,
      });
    }

    setUploading(false);
    setUploadProgress('');
    fetchGallery();
  }

  async function deletePhoto(photoId: string) {
    await fetch('/api/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo_id: photoId }),
    });
    setPhotos(photos.filter(p => p.id !== photoId));
  }

  async function updateGallery(updates: Partial<Gallery>) {
    await fetch('/api/galleries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: gallery!.id, ...updates }),
    });
    setGallery({ ...gallery!, ...updates });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) {
      uploadFiles(e.dataTransfer.files);
    }
  }

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f3f0; }
      `}</style>

      <div style={s.container}>
        <button style={s.backBtn} onClick={() => router.push('/admin')}>← Back</button>

        {gallery && (
          <>
            {/* Gallery settings */}
            <div style={s.section}>
              <label style={s.label}>Couple Names</label>
              <input
                style={s.input}
                value={gallery.couple_names}
                onChange={e => updateGallery({ couple_names: e.target.value })}
              />

              <label style={{ ...s.label, marginTop: '16px' }}>Lid Label</label>
              <input
                style={s.input}
                value={gallery.sneak_peek_label}
                onChange={e => updateGallery({ sneak_peek_label: e.target.value })}
              />

              <div style={s.linkRow}>
                <span style={s.linkLabel}>Gallery URL:</span>
                <a
                  style={s.link}
                  href={`/g/${gallery.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {siteUrl}/g/{gallery.slug}
                </a>
              </div>

              <div style={s.publishRow}>
                <button
                  style={{
                    ...s.btn,
                    background: gallery.is_published ? '#5a8a5e' : '#5a5248',
                  }}
                  onClick={() => updateGallery({ is_published: !gallery.is_published })}
                >
                  {gallery.is_published ? 'Published — Click to Unpublish' : 'Publish Gallery'}
                </button>
              </div>
            </div>

            {/* Upload zone */}
            <div
              style={{
                ...s.dropZone,
                borderColor: dragOver ? '#5a5248' : '#ccc8c2',
                background: dragOver ? 'rgba(90,82,72,0.04)' : 'transparent',
              }}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
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
                <p style={s.dropText}>{uploadProgress}</p>
              ) : (
                <>
                  <p style={s.dropText}>Drop photos here or click to upload</p>
                  <p style={s.dropSub}>JPEG, PNG, WebP — auto-resized to 2400px</p>
                </>
              )}
            </div>

            {/* Photo grid */}
            <div style={s.photoGrid}>
              {photos.map(photo => (
                <div key={photo.id} style={s.photoCard}>
                  <img src={photo.url} alt="" style={s.photoThumb} />
                  <div style={s.photoOverlay}>
                    <span style={s.photoTag}>
                      {photo.is_landscape ? 'Landscape' : 'Portrait'}
                    </span>
                    <button
                      style={s.deleteBtn}
                      onClick={() => deletePhoto(photo.id)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
    padding: '40px 20px',
  },
  container: {
    maxWidth: '720px',
    margin: '0 auto',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    fontSize: '14px',
    color: '#8a7d6e',
    cursor: 'pointer',
    marginBottom: '24px',
    fontFamily: "'DM Sans', sans-serif",
  },
  section: {
    marginBottom: '32px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 500,
    color: '#8a7d6e',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    border: '1px solid #d0ccc6',
    borderRadius: '4px',
    background: '#fff',
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
  },
  linkRow: {
    marginTop: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  linkLabel: {
    fontSize: '13px',
    color: '#8a8078',
  },
  link: {
    fontSize: '13px',
    color: '#5a5248',
    textDecoration: 'underline',
  },
  publishRow: {
    marginTop: '20px',
  },
  btn: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#fff',
    background: '#5a5248',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  dropZone: {
    border: '2px dashed #ccc8c2',
    borderRadius: '8px',
    padding: '48px 24px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    marginBottom: '32px',
    transition: 'all 0.15s ease',
  },
  dropText: {
    fontSize: '15px',
    color: '#5a5248',
    marginBottom: '4px',
  },
  dropSub: {
    fontSize: '12px',
    color: '#8a8078',
  },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
  },
  photoCard: {
    position: 'relative' as const,
    aspectRatio: '2/3',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  photoOverlay: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    padding: '6px 8px',
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
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
