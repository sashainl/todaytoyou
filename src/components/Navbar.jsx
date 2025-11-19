import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { signOutUser } from '../services/authService'
import { useEffect, useState } from 'react'
import AuthModal from './AuthModal'

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()
  const [showAuthModal, setShowAuthModal] = useState(false)

  const isActive = (path) => location.pathname === path

  // 모바일에서 메뉴 항목 클릭 시 드롭다운 자동 닫기
  const closeNavbar = () => {
    const navbarCollapse = document.getElementById('navbarNav')
    if (navbarCollapse && window.bootstrap) {
      const bsCollapse = window.bootstrap.Collapse.getInstance(navbarCollapse)
      if (bsCollapse) {
        bsCollapse.hide()
      }
    }
  }

  // 라우트 변경 시 드롭다운 자동 닫기
  useEffect(() => {
    closeNavbar()
  }, [location.pathname])

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm fixed-top">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <i className="bi bi-heart-fill text-primary"></i>
          <span className="ms-2 fw-bold">오늘의 너에게</span>
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/') ? 'active' : ''}`} to="/" onClick={closeNavbar}>홈</Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/chat') ? 'active' : ''}`} to="/chat" onClick={closeNavbar}>감정 대화</Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/diary') ? 'active' : ''}`} to="/diary" onClick={closeNavbar}>감정 일기</Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/statistics') ? 'active' : ''}`} to="/statistics" onClick={closeNavbar}>통계</Link>
            </li>
            <li className="nav-item ms-2">
              <button className="theme-toggle" onClick={toggleTheme} aria-label="테마 전환">
                <i className={`bi ${theme === 'dark' ? 'bi-sun-fill' : 'bi-moon-fill'}`}></i>
              </button>
            </li>
            <li className="nav-item ms-2">
              {isAuthenticated ? (
                <div className="dropdown">
                  <button
                    className="btn btn-outline-primary btn-sm dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                  >
                    <i className="bi bi-person-circle me-1"></i>
                    {user?.displayName || user?.email?.split('@')[0] || '사용자'}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li>
                      <span className="dropdown-item-text text-muted small">
                        {user?.email}
                      </span>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={async () => {
                          try {
                            await signOutUser()
                          } catch (error) {
                            console.error('로그아웃 오류:', error)
                          }
                        }}
                      >
                        <i className="bi bi-box-arrow-right me-2"></i>
                        로그아웃
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowAuthModal(true)}
                >
                  <i className="bi bi-box-arrow-in-right me-1"></i>
                  로그인
                </button>
              )}
            </li>
          </ul>
        </div>
      </div>
      <AuthModal
        show={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </nav>
  )
}

