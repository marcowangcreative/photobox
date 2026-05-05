'use client';

export default function Home() {
  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      <div style={s.content}>
        <img src="/photokase-logo.png" alt="Photokase" style={s.logo} />
        <p style={s.sub}>
          Wedding sneak peeks delivered as a curated keepsake — a tactile box of hand-picked prints, with the option to order the real thing.
        </p>

        <div style={s.actions}>
          <a href="/g/chloeandjett" style={s.btn}>View Demo</a>
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
    background: '#f3eee9',
  },
  content: {
    textAlign: 'center' as const,
    padding: '40px',
    maxWidth: '640px',
  },
  logo: {
    width: 'min(420px, 70vw)',
    height: 'auto',
    marginBottom: '24px',
  },
  sub: {
    fontSize: '16px',
    lineHeight: 1.5,
    fontWeight: 300,
    color: '#6b6155',
    marginBottom: '40px',
    letterSpacing: '0.5px',
  },
  actions: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
  },
  btn: {
    padding: '14px 32px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#f3eee9',
    background: '#1a1613',
    border: '1px solid #1a1613',
    borderRadius: '4px',
    textDecoration: 'none',
    letterSpacing: '1px',
  },
  btnOutline: {
    padding: '14px 32px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#1a1613',
    background: 'transparent',
    border: '1px solid #1a1613',
    borderRadius: '4px',
    textDecoration: 'none',
    letterSpacing: '1px',
  },
};
