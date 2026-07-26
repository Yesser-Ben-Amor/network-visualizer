import './LoginPage.css'
import { useState } from 'react'
import type { FormEvent } from 'react'

interface LoginPageProps {
  onLoginSuccess: () => void
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [view, setView] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [passwordRepeat, setPasswordRepeat] = useState('')
  const [acceptPolicy, setAcceptPolicy] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error('Login fehlgeschlagen')
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error('Ungültige Zugangsdaten')
      }

      if (rememberMe) {
        window.localStorage.setItem('nn_logged_in', 'true')
      }

      onLoginSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler beim Login')
    } finally {
      setLoading(false)
    }
  }

  const handleGuestLogin = () => {
    onLoginSuccess()
  }

  const handleSignupSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== passwordRepeat) {
      setError('Passwörter stimmen nicht überein.')
      return
    }

    if (!acceptPolicy) {
      setError('Bitte akzeptiere die Privacy Policy.')
      return
    }

    // Dummy-Signup: direkt einloggen
    onLoginSuccess()
  }

  return (
    <div className={view === 'signup' ? 'login-root signup-mode' : 'login-root'}>
      <div className="login-topbar">
        {view === 'login' ? (
          <>
            <span className="login-topbar-text">Not a Network Ninja User?</span>
            <button
              type="button"
              className="login-topbar-button"
              onClick={() => setView('signup')}
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            <span className="login-topbar-text">Already a Network Ninja User?</span>
            <button
              type="button"
              className="login-topbar-button"
              onClick={() => setView('login')}
            >
              Login
            </button>
          </>
        )}
      </div>

      <div className="login-logo-area">
        <div className="login-logo-wrapper">
          <img
            src={view === 'signup' ? 'ninja2.webp' : 'network-ninja-logo.webp'}
            alt="Network Ninja Logo"
            className="login-logo-image"
          />
        </div>
      </div>

      <div className="login-card-wrapper">
        <div className="login-card">
          {view === 'login' ? (
            <>
              <h1 className="login-title">Log in</h1>

              <form onSubmit={handleSubmit} className="login-form">
                <label className="login-label">
                  <span>Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </label>

                <label className="login-label">
                  <span>Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </label>

                <label className="login-remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>

                {error && <div className="login-error">{error}</div>}

                <button type="submit" className="login-primary-btn" disabled={loading}>
                  {loading ? 'Logging in…' : 'Login'}
                </button>

                <button
                  type="button"
                  className="login-guest-btn"
                  onClick={handleGuestLogin}
                  disabled={loading}
                >
                  Guest Login
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="login-title">Sign up</h1>

              <form onSubmit={handleSignupSubmit} className="login-form">
                <label className="login-label">
                  <span>Username</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </label>

                <label className="login-label">
                  <span>Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </label>

                <label className="login-label">
                  <span>Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </label>

                <label className="login-label">
                  <span>Verify Password</span>
                  <input
                    type="password"
                    value={passwordRepeat}
                    onChange={(e) => setPasswordRepeat(e.target.value)}
                    required
                  />
                </label>

                <label className="login-remember">
                  <input
                    type="checkbox"
                    checked={acceptPolicy}
                    onChange={(e) => setAcceptPolicy(e.target.checked)}
                  />
                  <span>
                    I accept the <span className="login-link-text">Privacy Policy</span>
                  </span>
                </label>

                {error && <div className="login-error">{error}</div>}

                <button type="submit" className="login-primary-btn">
                  Sign up
                </button>
              </form>
            </>
          )}

          <div className="login-footer-links">
            <button type="button" className="login-footer-link-btn">
              Privacy Policy
            </button>
            <button type="button" className="login-footer-link-btn">
              Legal Notice
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
