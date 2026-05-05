'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

function shadeHex(hex: string, amount: number): string {
  const m = /^#?([a-f\d]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  let r = (n >> 16) & 0xff;
  let g = (n >> 8) & 0xff;
  let b = n & 0xff;
  const adj = (c: number) => amount < 0
    ? Math.round(c * (1 + amount))
    : Math.round(c + (255 - c) * amount);
  r = Math.max(0, Math.min(255, adj(r)));
  g = Math.max(0, Math.min(255, adj(g)));
  b = Math.max(0, Math.min(255, adj(b)));
  const h = (c: number) => c.toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

function ColorRow({ label, value, placeholder, onChange }: {
  label: string;
  value: string | null;
  placeholder: string;
  onChange: (v: string | null) => void;
}) {
  const display = value || placeholder;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
      <label style={{ position: 'relative', width: '36px', height: '28px', flexShrink: 0, cursor: 'pointer' }}>
        <input
          type="color"
          value={display}
          onChange={e => onChange(e.target.value)}
          style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
        />
        <div style={{
          width: '100%', height: '100%', borderRadius: '4px',
          background: display,
          border: '1px solid var(--border)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
        }} />
      </label>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12px', color: 'var(--text-2)', marginBottom: '2px' }}>{label}</div>
        <input
          value={value || ''}
          placeholder={placeholder}
          onChange={e => {
            const v = e.target.value.trim();
            onChange(v || null);
          }}
          style={{
            width: '100%', maxWidth: '120px', padding: '4px 8px',
            fontSize: '12px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            border: '1px solid var(--border)', borderRadius: '3px',
            background: 'var(--surface)', color: 'var(--text-muted)',
            outline: 'none',
          }}
        />
      </div>
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: '11px', padding: '4px',
          }}
          title="Reset to default"
        >
          ✕
        </button>
      )}
    </div>
  );
}

function SliderRow({ label, value, isCustom, min, max, step, format, onChange, onReset }: {
  label: string;
  value: number;
  isCustom: boolean;
  min: number;
  max: number;
  step: number;
  format: (n: number) => string;
  onChange: (n: number) => void;
  onReset: () => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
      <div style={{
        width: '36px', height: '28px', flexShrink: 0,
        borderRadius: '4px', border: '1px solid var(--border)',
        background: `rgba(0,0,0,${(1 - value).toFixed(2)})`,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12px', color: 'var(--text-2)', marginBottom: '2px' }}>
          {label} <span style={{ color: 'var(--text-muted)', fontFamily: 'ui-monospace, monospace', fontSize: '11px' }}>{format(value)}</span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{ width: '100%', maxWidth: '160px', accentColor: 'var(--accent)' }}
        />
      </div>
      {isCustom && (
        <button
          type="button"
          onClick={onReset}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: '11px', padding: '4px',
          }}
          title="Reset to default"
        >
          ✕
        </button>
      )}
    </div>
  );
}

function BoxPreview({ boxColor, feltColor, textColor, sneakPeekColor, titleColor, paperColor, printBrightness, coupleNames, sneakPeekLabel, hasFeltOverride, fontSerif, fontSans }: {
  boxColor: string;
  feltColor: string;
  textColor: string;
  sneakPeekColor: string;
  titleColor: string;
  paperColor: string;
  printBrightness: number;
  coupleNames: string;
  sneakPeekLabel: string;
  hasFeltOverride: boolean;
  fontSerif: string;
  fontSans: string;
}) {
  const grad1 = shadeHex(feltColor, -0.4);
  const grad2 = shadeHex(feltColor, -0.2);
  const grad3 = feltColor;
  const W = 120;
  const H = 180;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>
        Preview
      </div>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        {/* Closed box — lid view */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: `${W}px`, height: `${H}px`, borderRadius: '1px',
            background: boxColor,
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.05),' +
              '0 3px 12px rgba(0,0,0,0.4),' +
              '0 8px 24px rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            <div style={{ textAlign: 'center', marginTop: '-15%', padding: '0 12px' }}>
              <div style={{
                fontFamily: fontSans,
                fontSize: '11px', fontWeight: 400,
                color: textColor, letterSpacing: '2px',
                textTransform: 'uppercase', marginBottom: '2px',
                lineHeight: 1.2,
                wordBreak: 'break-word',
              }}>
                {coupleNames}
              </div>
              <div style={{
                fontFamily: fontSerif,
                fontSize: '9px', fontStyle: 'italic',
                color: sneakPeekColor, letterSpacing: '0.5px',
              }}>
                {sneakPeekLabel}
              </div>
            </div>
          </div>
          <div style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>closed</div>
        </div>

        {/* Open box — interior + top print */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: `${W}px`, height: `${H}px`, borderRadius: '1px',
            background: boxColor, padding: '4px',
            boxShadow:
              'inset 0 0 0 1px rgba(255,255,255,0.05),' +
              '0 3px 12px rgba(0,0,0,0.4),' +
              '0 8px 24px rgba(0,0,0,0.3)',
          }}>
            <div style={{
              width: '100%', height: '100%', position: 'relative',
              background: hasFeltOverride
                ? `linear-gradient(180deg, ${grad1} 0%, ${grad2} 30%, ${grad3} 70%, ${grad1} 100%)`
                : `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.15) 100%),` +
                  `linear-gradient(180deg, ${grad1} 0%, ${grad2} 30%, ${grad3} 70%, ${grad1} 100%)`,
              boxShadow:
                'inset 0 3px 7px rgba(0,0,0,0.7),' +
                'inset 0 -2px 5px rgba(0,0,0,0.5),' +
                'inset 2px 0 5px rgba(0,0,0,0.4),' +
                'inset -2px 0 5px rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {/* Top print sample */}
              <div style={{
                width: '70%', aspectRatio: '2/3',
                background: paperColor, padding: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
                transform: 'rotate(-1deg)',
                boxSizing: 'content-box',
                display: 'flex',
              }}>
                <div style={{
                  width: '100%', height: '100%',
                  background: 'linear-gradient(135deg, #b8a890 0%, #8a7a64 100%)',
                  filter: `brightness(${printBrightness})`,
                }} />
              </div>
            </div>
          </div>
          <div style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>open</div>
        </div>
      </div>

      {/* Grid title sample */}
      <div style={{
        width: `${W * 2 + 16}px`, padding: '10px 8px', borderRadius: '3px',
        background: 'var(--surface)', textAlign: 'center',
      }}>
        <div style={{ fontSize: '8px', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
          Grid title
        </div>
        <div style={{
          fontFamily: fontSerif,
          fontStyle: 'italic', fontSize: '14px',
          color: titleColor, letterSpacing: '1.5px',
        }}>
          {coupleNames}
        </div>
      </div>
    </div>
  );
}

const CLIENT_MAX_LONG_EDGE = 2400;
const CLIENT_JPEG_QUALITY = 0.85;
const SKIP_RESIZE_BELOW_BYTES = 1_500_000;

async function downscaleImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (file.size < SKIP_RESIZE_BELOW_BYTES) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return file;
  }

  const longEdge = Math.max(bitmap.width, bitmap.height);
  if (longEdge <= CLIENT_MAX_LONG_EDGE) {
    bitmap.close();
    return file;
  }

  const scale = CLIENT_MAX_LONG_EDGE / longEdge;
  const targetW = Math.round(bitmap.width * scale);
  const targetH = Math.round(bitmap.height * scale);

  let curW = bitmap.width;
  let curH = bitmap.height;
  let src: CanvasImageSource = bitmap;

  while (curW * 0.5 > targetW) {
    const nextW = Math.round(curW * 0.5);
    const nextH = Math.round(curH * 0.5);
    const step = document.createElement('canvas');
    step.width = nextW;
    step.height = nextH;
    const sctx = step.getContext('2d');
    if (!sctx) { bitmap.close(); return file; }
    sctx.imageSmoothingEnabled = true;
    sctx.imageSmoothingQuality = 'high';
    sctx.drawImage(src, 0, 0, nextW, nextH);
    src = step;
    curW = nextW;
    curH = nextH;
  }

  const final = document.createElement('canvas');
  final.width = targetW;
  final.height = targetH;
  const fctx = final.getContext('2d');
  if (!fctx) { bitmap.close(); return file; }
  fctx.imageSmoothingEnabled = true;
  fctx.imageSmoothingQuality = 'high';
  fctx.drawImage(src, 0, 0, targetW, targetH);
  bitmap.close();

  const blob: Blob | null = await new Promise(resolve =>
    final.toBlob(resolve, 'image/jpeg', CLIENT_JPEG_QUALITY)
  );
  if (!blob) return file;
  if (blob.size >= file.size) return file;

  const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
  return new File([blob], newName, { type: 'image/jpeg', lastModified: Date.now() });
}

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
  box_color: string | null;
  text_color: string | null;
  sneak_peek_color: string | null;
  felt_color: string | null;
  title_color: string | null;
  print_brightness: number | null;
  font_preset: 'editorial' | 'romantic' | 'modern' | null;
  price_cents: number;
}

interface OrderRow {
  id: string;
  status: string;
  amount_cents: number;
  customer_name: string | null;
  customer_email: string | null;
  shipping_name: string | null;
  shipping_address_line1: string | null;
  shipping_address_line2: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;
  created_at: string;
  paid_at: string | null;
}

const FONT_PRESET_LIST = [
  { key: 'editorial', label: 'Editorial', serif: "'Playfair Display', serif", sans: "'DM Sans', sans-serif" },
  { key: 'romantic',  label: 'Romantic',  serif: "'Cormorant Garamond', serif", sans: "'Lato', sans-serif" },
  { key: 'modern',    label: 'Modern',    serif: "'Fraunces', serif", sans: "'Inter', sans-serif" },
] as const;

export default function GalleryEditor() {
  const { id } = useParams();
  const router = useRouter();
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [tab, setTab] = useState<'details' | 'design' | 'photos' | 'orders'>('details');
  const [orders, setOrders] = useState<OrderRow[]>([]);
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
    fetchOrders();
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

  async function fetchOrders() {
    const res = await fetch(`/api/orders?gallery_id=${id}`);
    const data = await res.json();
    if (Array.isArray(data)) setOrders(data);
  }

  async function markOrderFulfilled(orderId: string) {
    await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: orderId, status: 'fulfilled' }),
    });
    fetchOrders();
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
      const original = fileArray[i];

      let file: File;
      try {
        file = await downscaleImage(original);
      } catch {
        file = original;
      }

      const formData = new FormData();
      formData.append('gallery_id', gallery.id);
      formData.append('file', file);
      formData.append('sort_order', String(startOrder + i));

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();

        if (data.error) {
          setUploadFailed(prev => [...prev, original.name]);
        } else {
          // Add to grid immediately
          setPhotos(prev => [...prev, data]);
        }
      } catch {
        setUploadFailed(prev => [...prev, original.name]);
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

  const uploadPct = uploadTotal > 0 ? Math.round((uploadCurrent / uploadTotal) * 100) : 0;
  const activePreset = FONT_PRESET_LIST.find(p => p.key === (gallery?.font_preset || 'editorial'))!;

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Lato:wght@300;400;700&family=Fraunces:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); }
        input:focus, textarea:focus { border-color: var(--accent) !important; }
      `}</style>

      {gallery && (
        <>
          {/* Sticky topbar */}
          <header style={s.topbar}>
            <div style={s.topbarInner}>
              <button style={s.crumb} onClick={() => router.push('/admin')}>
                <span style={{ fontSize: '14px' }}>‹</span>
                <span>All galleries</span>
              </button>
              <div style={s.topbarTitleWrap}>
                <h1 style={s.topbarTitle}>{gallery.couple_names || 'Untitled gallery'}</h1>
                <div style={s.topbarMeta}>
                  <span style={s.slugPill}>/g/{gallery.slug}</span>
                  {saving && <span style={s.savingDot}>saving…</span>}
                </div>
              </div>
              <div style={s.topbarActions}>
                <a
                  href={`/g/${gallery.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={s.ghostBtn}
                >
                  View live ↗
                </a>
                <button
                  style={{
                    ...s.primaryBtn,
                    ...(gallery.is_published ? s.primaryBtnLive : {}),
                  }}
                  onClick={() => updateGallery({ is_published: !gallery.is_published })}
                >
                  {gallery.is_published ? '● Live' : 'Publish'}
                </button>
              </div>
            </div>
            <nav style={s.tabsRow}>
              {[
                { key: 'details', label: 'Details' },
                { key: 'design',  label: 'Design' },
                { key: 'photos',  label: `Photos${photos.length ? ` · ${photos.length}` : ''}` },
                { key: 'orders',  label: `Orders${orders.length ? ` · ${orders.length}` : ''}` },
              ].map(t => (
                <button
                  key={t.key}
                  style={{ ...s.tab, ...(tab === t.key ? s.tabActive : {}) }}
                  onClick={() => setTab(t.key as typeof tab)}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </header>

          <main style={s.main}>
            {tab === 'details' && (
              <>
                <div style={s.card}>
                  <div style={s.cardHead}>
                    <div style={s.cardEyebrow}>Identity</div>
                    <div style={s.cardTitle}>How this gallery is named</div>
                  </div>
                  <div style={s.field}>
                    <label style={s.fieldLabel}>Couple names</label>
                    <input
                      style={s.input}
                      value={gallery.couple_names}
                      onChange={e => updateGallery({ couple_names: e.target.value })}
                    />
                    <p style={s.fieldHelp}>Shown on the box lid and as the gallery title.</p>
                  </div>
                  <div style={s.field}>
                    <label style={s.fieldLabel}>Lid label</label>
                    <input
                      style={s.input}
                      value={gallery.sneak_peek_label}
                      onChange={e => updateGallery({ sneak_peek_label: e.target.value })}
                    />
                    <p style={s.fieldHelp}>The line under the names on the box lid (e.g. "sneak peeks", "first looks").</p>
                  </div>
                </div>

                <div style={s.card}>
                  <div style={s.cardHead}>
                    <div style={s.cardEyebrow}>Link</div>
                    <div style={s.cardTitle}>Gallery URL</div>
                  </div>
                  <div style={s.field}>
                    <div style={s.slugInputRow}>
                      <span style={s.slugPrefix}>/g/</span>
                      <input
                        style={{ ...s.input, ...s.slugInput }}
                        value={gallery.slug}
                        onChange={e => updateGallery({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
                      />
                    </div>
                    <p style={s.fieldHelp}>Lowercase letters and numbers only. Changing this breaks any links you've already shared.</p>
                  </div>
                </div>

                <div style={s.card}>
                  <div style={s.cardHead}>
                    <div style={s.cardEyebrow}>Layout</div>
                    <div style={s.cardTitle}>Grid style</div>
                  </div>
                  <div style={s.segGroup}>
                    {[
                      { key: 'stacked', label: 'Stacked' },
                      { key: 'clean', label: 'Clean grid' },
                    ].map(opt => (
                      <button
                        key={opt.key}
                        style={{
                          ...s.segBtn,
                          ...(gallery.grid_style === opt.key ? s.segBtnActive : {}),
                        }}
                        onClick={() => updateGallery({ grid_style: opt.key as Gallery['grid_style'] })}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={s.card}>
                  <div style={s.cardHead}>
                    <div style={s.cardEyebrow}>Pricing</div>
                    <div style={s.cardTitle}>Box price</div>
                    <p style={s.cardHelp}>What couples (and their parents, friends) pay to order one curated print box of this gallery.</p>
                  </div>
                  <div style={s.field}>
                    <label style={s.fieldLabel}>USD</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ ...s.slugPrefix, borderRadius: '6px', border: '1px solid var(--border)' }}>$</span>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        style={{ ...s.input, maxWidth: '160px' }}
                        value={(gallery.price_cents ?? 54900) / 100}
                        onChange={e => {
                          const dollars = parseFloat(e.target.value);
                          if (!isNaN(dollars) && dollars >= 0) {
                            updateGallery({ price_cents: Math.round(dollars * 100) });
                          }
                        }}
                      />
                    </div>
                    <p style={s.fieldHelp}>Default is $549. Make sure this covers prints + box + shipping + Stripe fee with margin.</p>
                  </div>
                </div>
              </>
            )}

            {tab === 'design' && (
              <div style={s.card}>
                <div style={s.cardHead}>
                  <div style={s.cardEyebrow}>Theme</div>
                  <div style={s.cardTitle}>Box, type, and prints</div>
                  <p style={s.cardHelp}>Tweak each color and watch the preview update. Reset (✕) returns any control to the platform default.</p>
                </div>
                <div style={s.themePanelV2}>
                  <div style={s.themeRows}>
                    <ColorRow label="Box exterior" value={gallery.box_color} placeholder="#2a241e"
                      onChange={v => updateGallery({ box_color: v })} />
                    <ColorRow label="Box interior (felt)" value={gallery.felt_color} placeholder="#0a0806"
                      onChange={v => updateGallery({ felt_color: v })} />
                    <ColorRow label="Couple names (lid)" value={gallery.text_color} placeholder="#ece3d1"
                      onChange={v => updateGallery({ text_color: v })} />
                    <ColorRow label="Sneak-peek label (lid)" value={gallery.sneak_peek_color} placeholder="#a0958a"
                      onChange={v => updateGallery({ sneak_peek_color: v })} />
                    <ColorRow label="Grid title" value={gallery.title_color} placeholder="#1a1613"
                      onChange={v => updateGallery({ title_color: v })} />
                    <SliderRow label="Top photo darken"
                      value={gallery.print_brightness ?? 0.92}
                      isCustom={gallery.print_brightness != null}
                      min={0.85} max={1.0} step={0.01}
                      format={n => `${Math.round((1 - n) * 100)}%`}
                      onChange={n => updateGallery({ print_brightness: n })}
                      onReset={() => updateGallery({ print_brightness: null })}
                    />
                    <div style={s.subSection}>
                      <div style={s.subSectionLabel}>Font pairing</div>
                      <div style={s.fontPresetRow}>
                        {FONT_PRESET_LIST.map(p => {
                          const active = (gallery.font_preset || 'editorial') === p.key;
                          return (
                            <button
                              key={p.key}
                              type="button"
                              onClick={() => updateGallery({ font_preset: p.key })}
                              style={{
                                ...s.fontPresetBtn,
                                ...(active ? s.fontPresetBtnActive : {}),
                              }}
                            >
                              <span style={s.fontPresetLabel}>{p.label}</span>
                              <span style={{ fontFamily: p.serif, fontStyle: 'italic', fontSize: '15px', lineHeight: 1 }}>Aa</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <BoxPreview
                    boxColor={gallery.box_color || 'var(--tray-outer)'}
                    feltColor={gallery.felt_color || '#100c08'}
                    textColor={gallery.text_color || 'var(--text)'}
                    sneakPeekColor={gallery.sneak_peek_color || 'var(--text-muted)'}
                    titleColor={gallery.title_color || 'var(--title)'}
                    paperColor="var(--print-bg)"
                    printBrightness={gallery.print_brightness ?? 0.92}
                    hasFeltOverride={!!gallery.felt_color}
                    fontSerif={activePreset.serif}
                    fontSans={activePreset.sans}
                    coupleNames={gallery.couple_names}
                    sneakPeekLabel={gallery.sneak_peek_label}
                  />
                </div>
              </div>
            )}

            {tab === 'photos' && (
              <>
                <div style={s.card}>
                  <div style={s.cardHead}>
                    <div style={s.cardEyebrow}>Upload</div>
                    <div style={s.cardTitle}>Add photos</div>
                  </div>
                  <div
                    style={{
                      ...s.dropZone,
                      borderColor: dragOver ? 'var(--accent)' : 'var(--border)',
                      background: dragOver ? 'var(--toggle-bg)' : 'transparent',
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
                        <p style={s.dropSub}>JPEG, PNG, WebP. Handles 100+ photos, uploaded one at a time.</p>
                      </>
                    )}
                  </div>
                </div>

                {photos.length > 0 && (
                  <div style={s.card}>
                    <div style={s.cardHead}>
                      <div style={s.cardEyebrow}>Order</div>
                      <div style={s.cardTitle}>Arrange your prints</div>
                      <p style={s.cardHelp}>
                        {sortMode === 'custom'
                          ? 'Drag to reorder. The first photo sits on top of the stack.'
                          : 'Pick a preset sort, or switch to Custom to drag prints around.'}
                      </p>
                    </div>
                    <div style={s.sortBarV2}>
                      {[
                        { key: 'custom', label: 'Custom' },
                        { key: 'name-asc', label: 'Name A→Z' },
                        { key: 'name-desc', label: 'Name Z→A' },
                        { key: 'time-asc', label: 'Oldest' },
                        { key: 'time-desc', label: 'Newest' },
                      ].map(opt => (
                        <button
                          key={opt.key}
                          style={{
                            ...s.segBtn,
                            ...(sortMode === opt.key ? s.segBtnActive : {}),
                          }}
                          onClick={() => applySortMode(opt.key as typeof sortMode)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <div style={s.photoGrid}>
                      {photos.map((photo, idx) => (
                        <div
                          key={photo.id}
                          style={{
                            ...s.photoCard,
                            opacity: dragIdx === idx ? 0.4 : 1,
                            outline: dropIdx === idx ? '2px solid var(--accent)' : 'none',
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
                  </div>
                )}
              </>
            )}

            {tab === 'orders' && (
              <div style={s.card}>
                <div style={s.cardHead}>
                  <div style={s.cardEyebrow}>Orders</div>
                  <div style={s.cardTitle}>
                    {orders.length === 0
                      ? 'No orders yet'
                      : `${orders.length} order${orders.length === 1 ? '' : 's'} placed`}
                  </div>
                  <p style={s.cardHelp}>
                    Customers see the &quot;Order ${(gallery.price_cents / 100).toFixed(0)}&quot; pill on the gallery.
                    Paid orders show below with full shipping details. Mark fulfilled when you've shipped the box.
                  </p>
                </div>
                {orders.length > 0 && (
                  <div style={s.orderList}>
                    {orders.map(o => {
                      const dollars = `$${(o.amount_cents / 100).toFixed(2)}`;
                      const date = new Date(o.created_at).toLocaleString();
                      const shipLines = [
                        o.shipping_name,
                        o.shipping_address_line1,
                        o.shipping_address_line2,
                        [o.shipping_city, o.shipping_state, o.shipping_postal_code].filter(Boolean).join(', '),
                        o.shipping_country,
                      ].filter(Boolean);
                      return (
                        <div key={o.id} style={s.orderItem}>
                          <div style={s.orderItemHead}>
                            <div>
                              <div style={s.orderItemTop}>
                                <span style={{ ...s.orderStatus, ...statusStyle(o.status) }}>{o.status}</span>
                                <span style={s.orderAmount}>{dollars}</span>
                              </div>
                              <div style={s.orderDate}>{date}</div>
                            </div>
                            {o.status === 'paid' && (
                              <button
                                type="button"
                                style={s.markFulfilledBtn}
                                onClick={() => markOrderFulfilled(o.id)}
                              >
                                Mark fulfilled
                              </button>
                            )}
                          </div>
                          {(o.customer_name || o.customer_email) && (
                            <div style={s.orderField}>
                              <div style={s.orderFieldLabel}>Customer</div>
                              <div style={s.orderFieldValue}>
                                {o.customer_name}
                                {o.customer_email && <div style={{ color: 'var(--text-muted)' }}>{o.customer_email}</div>}
                              </div>
                            </div>
                          )}
                          {shipLines.length > 0 && (
                            <div style={s.orderField}>
                              <div style={s.orderFieldLabel}>Ship to</div>
                              <div style={s.orderFieldValue}>
                                {shipLines.map((l, i) => <div key={i}>{l}</div>)}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
}

function statusStyle(status: string): React.CSSProperties {
  switch (status) {
    case 'paid': return { background: 'var(--success)', color: '#1a1613' };
    case 'fulfilled': return { background: 'var(--surface-elevated)', color: 'var(--text)' };
    case 'pending': return { background: 'var(--surface-2)', color: 'var(--text-muted)' };
    case 'cancelled':
    case 'refunded': return { background: 'var(--danger-bg)', color: 'var(--danger)' };
    default: return { background: 'var(--surface-2)', color: 'var(--text-muted)' };
  }
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    fontFamily: "'DM Sans', sans-serif",
    color: 'var(--text-2)',
    paddingBottom: '120px',
  },
  topbar: {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    background: 'var(--bg)',
    borderBottom: '1px solid var(--border-soft)',
    backdropFilter: 'saturate(180%) blur(8px)',
    WebkitBackdropFilter: 'saturate(180%) blur(8px)',
  },
  topbarInner: {
    maxWidth: '1080px',
    margin: '0 auto',
    padding: '14px 32px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
  },
  crumb: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '13px',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 8px',
    marginLeft: '-8px',
    borderRadius: '4px',
  },
  topbarTitleWrap: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  topbarTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '18px',
    fontWeight: 500,
    color: 'var(--text)',
    letterSpacing: '0.5px',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  topbarMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  slugPill: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: '11px',
    padding: '2px 8px',
    border: '1px solid var(--border-soft)',
    borderRadius: '999px',
    color: 'var(--text-muted)',
  },
  savingDot: {
    fontStyle: 'italic',
    color: 'var(--text-muted)',
  },
  topbarActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  ghostBtn: {
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-2)',
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
  },
  primaryBtn: {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--accent-fg)',
    background: 'var(--accent)',
    border: '1px solid var(--accent)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  primaryBtnLive: {
    color: '#1a1613',
    background: 'var(--success)',
    border: '1px solid var(--success)',
  },
  tabsRow: {
    maxWidth: '1080px',
    margin: '0 auto',
    padding: '0 32px',
    display: 'flex',
    gap: '4px',
  },
  tab: {
    padding: '12px 14px',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-muted)',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    marginBottom: '-1px',
  },
  tabActive: {
    color: 'var(--text)',
    borderBottom: '2px solid var(--accent)',
  },
  main: {
    maxWidth: '1080px',
    margin: '0 auto',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border-soft)',
    borderRadius: '10px',
    padding: '28px',
    boxShadow: 'var(--shadow-sm)',
  },
  cardHead: {
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  cardEyebrow: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    letterSpacing: '1.5px',
    textTransform: 'uppercase' as const,
    fontWeight: 500,
  },
  cardTitle: {
    fontSize: '17px',
    color: 'var(--text)',
    fontWeight: 500,
  },
  cardHelp: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    lineHeight: 1.5,
    marginTop: '4px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    marginBottom: '20px',
  },
  fieldLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text-2)',
    letterSpacing: '0.3px',
  },
  fieldHelp: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    lineHeight: 1.4,
    marginTop: '2px',
  },
  slugInputRow: {
    display: 'flex',
    alignItems: 'stretch',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  slugPrefix: {
    padding: '10px 12px',
    background: 'var(--surface-2)',
    color: 'var(--text-muted)',
    fontSize: '13px',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    display: 'flex',
    alignItems: 'center',
    borderRight: '1px solid var(--border)',
  },
  slugInput: {
    border: 'none',
    borderRadius: 0,
    flex: 1,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  },
  segGroup: {
    display: 'inline-flex',
    background: 'var(--surface-2)',
    padding: '4px',
    borderRadius: '8px',
    gap: '2px',
  },
  segBtn: {
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-muted)',
    background: 'transparent',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  segBtnActive: {
    color: 'var(--text)',
    background: 'var(--surface)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  themePanelV2: {
    display: 'flex',
    gap: '32px',
    flexWrap: 'wrap' as const,
    alignItems: 'flex-start',
  },
  themeRows: {
    flex: 1,
    minWidth: '260px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  subSection: {
    padding: '14px 0 4px',
    borderTop: '1px solid var(--border-soft)',
    marginTop: '12px',
  },
  subSectionLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text-2)',
    marginBottom: '10px',
    letterSpacing: '0.3px',
  },
  fontPresetRow: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap' as const,
  },
  fontPresetBtn: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
    padding: '8px 14px',
    minWidth: '84px',
    background: 'var(--surface-2)',
    border: '1px solid transparent',
    borderRadius: '6px',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  fontPresetBtnActive: {
    color: 'var(--text)',
    background: 'var(--surface)',
    border: '1px solid var(--accent)',
  },
  fontPresetLabel: {
    fontSize: '11px',
    letterSpacing: '0.5px',
  },
  sortBarV2: {
    display: 'inline-flex',
    background: 'var(--surface-2)',
    padding: '4px',
    borderRadius: '8px',
    gap: '2px',
    marginBottom: '20px',
    flexWrap: 'wrap' as const,
  },
  orderList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
  },
  orderItem: {
    border: '1px solid var(--border-soft)',
    borderRadius: '8px',
    padding: '18px 20px',
    background: 'var(--input-bg)',
  },
  orderItemHead: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '14px',
  },
  orderItemTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '4px',
  },
  orderStatus: {
    fontSize: '11px',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    padding: '3px 8px',
    borderRadius: '999px',
    fontWeight: 500,
  },
  orderAmount: {
    fontSize: '15px',
    fontWeight: 500,
    color: 'var(--text)',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  },
  orderDate: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  markFulfilledBtn: {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text-2)',
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    flexShrink: 0,
  },
  orderField: {
    display: 'flex',
    gap: '14px',
    fontSize: '13px',
    paddingTop: '8px',
    borderTop: '1px solid var(--border-soft)',
    marginTop: '8px',
  },
  orderFieldLabel: {
    width: '80px',
    color: 'var(--text-muted)',
    fontSize: '11px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
    flexShrink: 0,
    paddingTop: '2px',
  },
  orderFieldValue: {
    color: 'var(--text)',
    lineHeight: 1.5,
    flex: 1,
  },
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
    color: 'var(--text-muted)',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    marginBottom: '4px',
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    fontSize: '14px',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    background: 'var(--input-bg)',
    color: 'var(--text)',
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    transition: 'border-color 0.15s ease',
  },
  linkBox: {
    padding: '10px 12px',
    background: 'var(--surface)',
    border: '1px solid var(--border-soft)',
    borderRadius: '4px',
  },
  linkLabel: {
    display: 'block',
    fontSize: '10px',
    color: 'var(--text-muted)',
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
    marginBottom: '4px',
  },
  link: {
    fontSize: '13px',
    color: 'var(--text)',
    textDecoration: 'none',
    wordBreak: 'break-all' as const,
  },
  btn: {
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--accent-fg)',
    background: 'var(--accent)',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  btnSmall: {
    padding: '6px 14px',
    fontSize: '12px',
    color: 'var(--text)',
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  photoCount: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    textAlign: 'center' as const,
  },
  savingBadge: {
    color: 'var(--success)',
    fontSize: '11px',
  },
  dropZone: {
    border: '2px dashed var(--border)',
    borderRadius: '6px',
    padding: '36px 24px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    marginBottom: '24px',
    transition: 'all 0.15s ease',
  },
  dropText: {
    fontSize: '14px',
    color: 'var(--text)',
    marginBottom: '8px',
  },
  dropSub: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  progressBar: {
    width: '100%',
    maxWidth: '300px',
    height: '4px',
    background: 'var(--surface-2)',
    borderRadius: '2px',
    margin: '0 auto',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'var(--accent)',
    borderRadius: '2px',
    transition: 'width 0.3s ease',
  },
  failedText: {
    fontSize: '12px',
    color: 'var(--danger)',
    marginTop: '8px',
  },
  reorderHint: {
    fontSize: '12px',
    color: 'var(--text-muted)',
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
    color: 'var(--text-muted)',
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
    color: 'var(--text-muted)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '20px',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'all 0.15s ease',
  },
  sortBtnActive: {
    color: 'var(--accent-fg)',
    background: 'var(--accent)',
    borderColor: 'var(--accent)',
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
