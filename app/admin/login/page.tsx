'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-browser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Invalid email or password');
      setLoading(false);
      return;
    }

    router.push('/admin');
    router.refresh();
  }

  return (
    <div style={styles.container}>
      <form onSubmit={handleLogin} style={styles.form}>
        <img src="/photokase-logo.png" alt="Photokase" style={styles.logo} />
        <p style={styles.subtitle}>admin login</p>

        {error && <p style={styles.error}>{error}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          required
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          required
          autoComplete="current-password"
        />
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    fontFamily: "'DM Sans', sans-serif",
    padding: '20px',
  },
  form: {
    background: 'var(--surface)',
    padding: '40px 32px',
    borderRadius: '12px',
    boxShadow: 'var(--shadow-card)',
    border: '1px solid var(--border-soft)',
    width: '100%',
    maxWidth: '360px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  logo: {
    width: '180px',
    height: 'auto',
    margin: '0 auto 4px',
    filter: 'invert(var(--logo-invert))',
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    textAlign: 'center',
    margin: '-8px 0 8px',
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
  },
  error: {
    color: 'var(--danger)',
    fontSize: '13px',
    textAlign: 'center',
    margin: 0,
    padding: '8px 12px',
    background: 'var(--danger-bg)',
    borderRadius: '6px',
  },
  input: {
    padding: '12px 14px',
    fontSize: '15px',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    background: 'var(--input-bg)',
    color: 'var(--text)',
    outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
  },
  button: {
    padding: '12px',
    fontSize: '15px',
    fontWeight: 500,
    border: 'none',
    borderRadius: '8px',
    background: 'var(--accent)',
    color: 'var(--accent-fg)',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    marginTop: '4px',
  },
};
