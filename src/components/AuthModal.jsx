import { useState } from 'react'
import { signUpWithEmail, signInWithEmail, signInWithGoogle } from '../services/authService'

export default function AuthModal({ show, onClose }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        await signInWithEmail(email, password)
      } else {
        await signUpWithEmail(email, password, displayName)
      }
      onClose()
      // 폼 초기화
      setEmail('')
      setPassword('')
      setDisplayName('')
    } catch (error) {
      setError(error.message || '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)

    try {
      await signInWithGoogle()
      onClose()
    } catch (error) {
      setError(error.message || 'Google 로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (!show) return null

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {isLogin ? '로그인' : '회원가입'}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="mb-3">
                  <label htmlFor="displayName" className="form-label">
                    이름
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              )}

              <div className="mb-3">
                <label htmlFor="email" className="form-label">
                  이메일
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="password" className="form-label">
                  비밀번호
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>

              <div className="d-grid gap-2">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? '처리 중...' : isLogin ? '로그인' : '회원가입'}
                </button>
              </div>
            </form>

            <div className="text-center my-3">
              <span className="text-muted">또는</span>
            </div>

            <div className="d-grid gap-2">
              <button
                type="button"
                className="btn btn-outline-success"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <i className="bi bi-google me-2"></i>
                Google로 로그인
              </button>
            </div>

            <div className="text-center mt-3">
              <button
                type="button"
                className="btn btn-link"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError('')
                }}
                disabled={loading}
              >
                {isLogin
                  ? '계정이 없으신가요? 회원가입'
                  : '이미 계정이 있으신가요? 로그인'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

