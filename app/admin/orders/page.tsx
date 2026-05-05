'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

interface OrderRow {
  id: string;
  gallery_id: string;
  status: 'pending' | 'paid' | 'fulfilled' | 'cancelled' | 'refunded';
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
  fulfilled_at: string | null;
  notes: string | null;
  gallery: { slug: string; couple_names: string } | null;
}

type StatusFilter = 'all' | 'paid' | 'fulfilled' | 'pending' | 'cancelled';

export default function OrdersDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('paid');

  useEffect(() => { fetchOrders(); }, []);

  async function fetchOrders() {
    const res = await fetch('/api/orders');
    const data = await res.json();
    if (Array.isArray(data)) setOrders(data);
    setLoading(false);
  }

  async function markFulfilled(orderId: string) {
    await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: orderId, status: 'fulfilled' }),
    });
    fetchOrders();
  }

  const filtered = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter(o => o.status === filter);
  }, [orders, filter]);

  const totals = useMemo(() => {
    const counts = { paid: 0, fulfilled: 0, pending: 0, cancelled: 0, refunded: 0 };
    let revenue = 0;
    for (const o of orders) {
      counts[o.status as keyof typeof counts] = (counts[o.status as keyof typeof counts] ?? 0) + 1;
      if (o.status === 'paid' || o.status === 'fulfilled') revenue += o.amount_cents;
    }
    return { counts, revenue };
  }, [orders]);

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); }
      `}</style>

      <header style={s.topbar}>
        <div style={s.topbarInner}>
          <button style={s.crumb} onClick={() => router.push('/admin')}>
            <span style={{ fontSize: '14px' }}>‹</span>
            <span>Galleries</span>
          </button>
          <h1 style={s.title}>Orders</h1>
          <div style={{ flex: 1 }} />
        </div>
      </header>

      <main style={s.main}>
        <div style={s.statsRow}>
          <Stat label="Paid" value={totals.counts.paid} />
          <Stat label="Fulfilled" value={totals.counts.fulfilled} />
          <Stat label="Pending" value={totals.counts.pending} />
          <Stat label="Revenue" value={`$${(totals.revenue / 100).toFixed(0)}`} highlight />
        </div>

        <div style={s.filterRow}>
          {(['paid', 'fulfilled', 'pending', 'cancelled', 'all'] as const).map(f => (
            <button
              key={f}
              style={{ ...s.filterBtn, ...(filter === f ? s.filterBtnActive : {}) }}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && totals.counts[f as keyof typeof totals.counts] != null
                ? ` · ${totals.counts[f as keyof typeof totals.counts]}`
                : ''}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={s.empty}>Loading…</p>
        ) : filtered.length === 0 ? (
          <p style={s.empty}>No orders {filter === 'all' ? 'yet' : `with status “${filter}”`}.</p>
        ) : (
          <div style={s.list}>
            {filtered.map(o => {
              const dollars = `$${(o.amount_cents / 100).toFixed(2)}`;
              const date = new Date(o.created_at).toLocaleString();
              const ship = [
                o.shipping_name,
                o.shipping_address_line1,
                o.shipping_address_line2,
                [o.shipping_city, o.shipping_state, o.shipping_postal_code].filter(Boolean).join(', '),
                o.shipping_country,
              ].filter(Boolean);
              return (
                <div key={o.id} style={s.row}>
                  <div style={s.rowHead}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{ ...s.statusPill, ...statusStyle(o.status) }}>{o.status}</span>
                      <span style={s.amount}>{dollars}</span>
                      {o.gallery && (
                        <button
                          type="button"
                          style={s.galleryLink}
                          onClick={() => router.push(`/admin/${o.gallery_id}`)}
                          title="Open gallery"
                        >
                          {o.gallery.couple_names}
                          <span style={s.galleryLinkSlug}>/g/{o.gallery.slug}</span>
                        </button>
                      )}
                    </div>
                    {o.status === 'paid' && (
                      <button style={s.fulfillBtn} onClick={() => markFulfilled(o.id)}>
                        Mark fulfilled
                      </button>
                    )}
                  </div>
                  <div style={s.rowBody}>
                    <div style={s.col}>
                      <div style={s.colLabel}>Placed</div>
                      <div style={s.colValue}>{date}</div>
                    </div>
                    {(o.customer_name || o.customer_email) && (
                      <div style={s.col}>
                        <div style={s.colLabel}>Customer</div>
                        <div style={s.colValue}>
                          {o.customer_name && <div>{o.customer_name}</div>}
                          {o.customer_email && <div style={{ color: 'var(--text-muted)' }}>{o.customer_email}</div>}
                        </div>
                      </div>
                    )}
                    {ship.length > 0 && (
                      <div style={s.col}>
                        <div style={s.colLabel}>Ship to</div>
                        <div style={s.colValue}>
                          {ship.map((l, i) => <div key={i}>{l}</div>)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number | string; highlight?: boolean }) {
  return (
    <div style={{ ...s.stat, ...(highlight ? s.statHighlight : {}) }}>
      <div style={s.statLabel}>{label}</div>
      <div style={s.statValue}>{value}</div>
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
    padding: '14px 32px',
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
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '18px',
    fontWeight: 500,
    color: 'var(--text)',
    letterSpacing: '0.5px',
    margin: 0,
  },
  main: {
    maxWidth: '1080px',
    margin: '0 auto',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '12px',
  },
  stat: {
    background: 'var(--surface)',
    border: '1px solid var(--border-soft)',
    borderRadius: '10px',
    padding: '18px 20px',
  },
  statHighlight: {
    background: 'var(--surface-2)',
    borderColor: 'var(--border)',
  },
  statLabel: {
    fontSize: '11px',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    fontWeight: 500,
    marginBottom: '6px',
  },
  statValue: {
    fontSize: '22px',
    color: 'var(--text)',
    fontWeight: 500,
  },
  filterRow: {
    display: 'inline-flex',
    background: 'var(--surface-2)',
    padding: '4px',
    borderRadius: '8px',
    gap: '2px',
    alignSelf: 'flex-start',
    flexWrap: 'wrap',
  },
  filterBtn: {
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
  filterBtnActive: {
    color: 'var(--text)',
    background: 'var(--surface)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  empty: {
    color: 'var(--text-muted)',
    fontSize: '14px',
    padding: '40px 0',
    textAlign: 'center',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  row: {
    background: 'var(--surface)',
    border: '1px solid var(--border-soft)',
    borderRadius: '10px',
    padding: '20px 22px',
    boxShadow: 'var(--shadow-sm)',
  },
  rowHead: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  rowBody: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    paddingTop: '14px',
    borderTop: '1px solid var(--border-soft)',
  },
  col: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  colLabel: {
    fontSize: '11px',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
  },
  colValue: {
    fontSize: '13px',
    color: 'var(--text)',
    lineHeight: 1.5,
  },
  statusPill: {
    fontSize: '11px',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    padding: '3px 10px',
    borderRadius: '999px',
    fontWeight: 500,
  },
  amount: {
    fontSize: '17px',
    fontWeight: 500,
    color: 'var(--text)',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  },
  galleryLink: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    fontSize: '13px',
    color: 'var(--text-2)',
    textAlign: 'left',
    fontFamily: "'DM Sans', sans-serif",
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
  },
  galleryLinkSlug: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  },
  fulfillBtn: {
    padding: '7px 14px',
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
};
