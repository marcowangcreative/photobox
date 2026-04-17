'use client';

export default function Home() {
  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      <div style={s.content}>
        <h1 style={s.title}>Photobox</h1>
        <p style={s.sub}>
          Wedding galleries that feel like opening a box of prints.
        </p>

        <div style={s.actions}>
          <a href="/g/demo" style={s.btn}>View Demo</a>
          <a href="/admin" style={s.btnOutline}>Admin</a>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'DM Sans', sans-serif",
    background: `
      radial-gradient(ellipse at 25% 40%, rgba(90,80,65,0.35) 0%, transparent 55%),
      radial-gradient(ellipse at 75% 70%, rgba(60,52,44,0.3) 0%, transparent 50%),
      linear-gradient(160deg, #1a1613 0%, #1f1a15 30%, #18140f 60%, #1c1814 100%)
    `,
  },
  content: {
    textAlign: 'center' as const,
    padding: '40px',
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '48px',
    fontWeight: 400,
    color: '#ece3d1',
    letterSpacing: '4px',
    marginBottom: '12px',
  },
  sub: {
    fontSize: '16px',
    fontWeight: 300,
    color: '#9a8e7e',
    marginBottom: '40px',
    letterSpacing: '1px',
  },
  actions: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
  },
  btn: {
    padding: '14px 32px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#1a1613',
    background: '#ece3d1',
    border: 'none',
    borderRadius: '4px',
    textDecoration: 'none',
    letterSpacing: '1px',
  },
  btnOutline: {
    padding: '14px 32px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#ece3d1',
    background: 'transparent',
    border: '1px solid #6b6155',
    borderRadius: '4px',
    textDecoration: 'none',
    letterSpacing: '1px',
  },
};
