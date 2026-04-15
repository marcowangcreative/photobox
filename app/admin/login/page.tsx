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
        <h1 style={styles.title}>photobox</h1>
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
    background: '#e8e2d8',
    fontFamily: "'DM Sans', sans-serif",
    padding: '20px',
  },
  form: {
    background: '#f5f0e8',
    padding: '40px 32px',
    borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    width: '100%',
    maxWidth: '360px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '28px',
    fontWeight: 600,
    color: '#3a3530',
    textAlign: 'center',
    margin: 0,
  },
  subtitle: {
    fontSize: '13px',
    color: '#8a8078',
    textAlign: 'center',
    margin: '-8px 0 8px',
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
  },
  error: {
    color: '#c44',
    fontSize: '13px',
    textAlign: 'center',
    margin: 0,
    padding: '8px 12px',
    background: 'rgba(204,68,68,0.08)',
    borderRadius: '6px',
  },
  input: {
    padding: '12px 14px',
    fontSize: '15px',
    border: '1px solid #d5cfc5',
    borderRadius: '8px',
    background: '#fff',
    color: '#3a3530',
    outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
  },
  button: {
    padding: '12px',
    fontSize: '15px',
    fontWeight: 500,
    border: 'none',
    borderRadius: '8px',
    background: '#3a3530',
    color: '#f5f0e8',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    marginTop: '4px',
  },
};
