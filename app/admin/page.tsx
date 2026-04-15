'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Gallery {
  id: string;
  slug: string;
  couple_names: string;
  is_published: boolean;
  created_at: string;
  photos: { count: number }[];
}

export default function AdminPage() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [newCouple, setNewCouple] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchGalleries();
  }, []);

  async function fetchGalleries() {
    const res = await fetch('/api/galleries');
    const data = await res.json();
    setGalleries(data);
    setLoading(false);
  }

  async function createGallery() {
    if (!newCouple.trim()) return;
    const res = await fetch('/api/galleries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ couple_names: newCouple }),
    });
    const gallery = await res.json();
    setNewCouple('');
    router.push(`/admin/${gallery.id}`);
  }

  async function togglePublish(gallery: Gallery) {
    await fetch('/api/galleries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: gallery.id, is_published: !gallery.is_published }),
    });
    fetchGalleries();
  }

  async function deleteGallery(id: string) {
    if (!confirm('Delete this gallery and all its photos?')) return;
    await fetch('/api/galleries', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchGalleries();
  }

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f3f0; }
      `}</style>

      <div style={s.container}>
        <h1 style={s.heading}>Galleries</h1>

        {/* Create new */}
        <div style={s.createRow}>
          <input
            style={s.input}
            placeholder="Couple names (e.g. Chloe & Jett)"
            value={newCouple}
            onChange={e => setNewCouple(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createGallery()}
          />
          <button style={s.btn} onClick={createGallery}>Create</button>
        </div>

        {/* Gallery list */}
        {loading ? (
          <p style={s.empty}>Loading...</p>
        ) : galleries.length === 0 ? (
          <p style={s.empty}>No galleries yet</p>
        ) : (
          <div style={s.list}>
            {galleries.map(g => (
              <div key={g.id} style={s.card}>
                <div style={s.cardMain}>
                  <h2 style={s.cardTitle}>{g.couple_names}</h2>
                  <p style={s.cardMeta}>
                    {g.photos?.[0]?.count || 0} photos · /g/{g.slug}
                  </p>
                </div>
                <div style={s.cardActions}>
                  <button
                    style={{ ...s.btnSmall, background: g.is_published ? '#5a8a5e' : '#8a7d6e' }}
                    onClick={() => togglePublish(g)}
                  >
                    {g.is_published ? 'Live' : 'Draft'}
                  </button>
                  <button
                    style={s.btnSmall}
                    onClick={() => router.push(`/admin/${g.id}`)}
                  >
                    Edit
                  </button>
                  <button
                    style={{ ...s.btnSmall, background: '#8a5a5a' }}
                    onClick={() => deleteGallery(g.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
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
    maxWidth: '640px',
    margin: '0 auto',
  },
  heading: {
    fontSize: '28px',
    fontWeight: 400,
    color: '#3a3530',
    marginBottom: '32px',
    letterSpacing: '1px',
  },
  createRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '40px',
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    fontSize: '15px',
    border: '1px solid #d0ccc6',
    borderRadius: '4px',
    background: '#fff',
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
  },
  btn: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#fff',
    background: '#5a5248',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: '1px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  card: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    background: '#fff',
    border: '1px solid #e8e4de',
    borderRadius: '6px',
  },
  cardMain: {},
  cardTitle: {
    fontSize: '17px',
    fontWeight: 400,
    color: '#3a3530',
    marginBottom: '4px',
  },
  cardMeta: {
    fontSize: '13px',
    color: '#8a8078',
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
  },
  btnSmall: {
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: 500,
    color: '#fff',
    background: '#8a7d6e',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: '0.5px',
  },
  empty: {
    color: '#8a8078',
    fontSize: '14px',
  },
};
