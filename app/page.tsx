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
    background: `
      radial-gradient(ellipse at 25% 40%, var(--bg-landing-1) 0%, transparent 55%),
      radial-gradient(ellipse at 75% 70%, var(--bg-landing-2) 0%, transparent 50%),
      linear-gradient(160deg, var(--bg-landing-grad-1) 0%, var(--bg-landing-grad-2) 30%, var(--bg-landing-grad-3) 60%, var(--bg-landing-grad-4) 100%)
    `,
  },
  content: {
    textAlign: 'center' as const,
    padding: '40px',
  },
  logo: {
    width: 'min(420px, 70vw)',
    height: 'auto',
    marginBottom: '20px',
    filter: 'invert(var(--logo-invert))',
  },
  sub: {
    fontSize: '16px',
    fontWeight: 300,
    color: 'var(--text-muted-2)',
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
    color: 'var(--accent-fg)',
    background: 'var(--accent)',
    border: 'none',
    borderRadius: '4px',
    textDecoration: 'none',
    letterSpacing: '1px',
  },
  btnOutline: {
    padding: '14px 32px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text)',
    background: 'transparent',
    border: '1px solid var(--text-subtle)',
    borderRadius: '4px',
    textDecoration: 'none',
    letterSpacing: '1px',
  },
};
