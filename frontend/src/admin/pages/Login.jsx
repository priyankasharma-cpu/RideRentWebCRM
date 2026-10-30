import { useApp } from '../../hooks/useApp.js';
import { useState } from 'react';
import { Logo } from '../../components/common/Logo.jsx';
import { ThemeToggle } from '../../components/common/ThemeToggle.jsx';
import { KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';
import { ErrorBox } from '../../components/common/ErrorBox.jsx';
import { Link } from 'react-router-dom';
import './Login.css';
export function AdminLogin() {
  const { login } = useApp(),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(Object.fromEntries(new FormData(e.currentTarget)));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="admin-login">
      <div className="login-brand">
        <Logo />
        <ThemeToggle />
      </div>
      <div className="login-card rr-panel">
        <span className="login-icon">
          <KeyRound size={28} />
        </span>
        <div className="eyebrow">YOUR RENTAL WORKSPACE</div>
        <h1>
          Welcome <em>back.</em>
        </h1>
        <p>A clear view of your fleet. A better day for your team.</p>
        <form onSubmit={submit}>
          <label>
            Email address
            <input
              name="email"
              type="email"
              autoComplete="username"
              placeholder="admin@riderent.local"
              required
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Your administrator password"
            />
          </label>
          <ErrorBox>{error}</ErrorBox>
          <button className="rr-button full-width" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign In to Workspace'} <ArrowRight size={16} />
          </button>
        </form>
        <p className="form-note">Local demo credentials are in the project’s .env file.</p>
        <Link className="back-link" to="/">
          ← Back to the rental website
        </Link>
      </div>
      <p className="login-footnote">
        <ShieldCheck size={14} /> Protected staff access · Secure session cookies
      </p>
    </div>
  );
}
