import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ThemeToggle from '../ThemeToggle/ThemeToggle.jsx'
import styles from './Navbar.module.css'
import { useAuth } from '../../context/AuthContext.jsx'
import { FaBars, FaTimes } from 'react-icons/fa'

export default function Navbar() {
  const { pathname } = useLocation()
  const nav = useNavigate()
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const doLogout = async () => { 
    await logout()
    setMobileMenuOpen(false)
    nav('/login')
  }

  const handleNavClick = () => {
    setMobileMenuOpen(false)
  }

  return (
    <header className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.navbarContent}>
          <Link to="/library" className={styles.brand}>EduLearn</Link>
          
          {/* Mobile Toggle Button */}
          <button 
            className={styles.mobileToggle}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>

          {/* Desktop Navigation */}
          <nav className={`${styles.nav} ${mobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
            <div className={styles.navLinks}>
              <Link 
                className={pathname.startsWith('/library') ? styles.active : ''} 
                to="/library"
                onClick={handleNavClick}
              >
                Library
              </Link>
              <Link 
                className={pathname.startsWith('/dashboard') ? styles.active : ''} 
                to="/dashboard"
                onClick={handleNavClick}
              >
                Dashboard
              </Link>
              <Link 
                className={pathname.startsWith('/quizzes') ? styles.active : ''} 
                to="/quizzes"
                onClick={handleNavClick}
              >
                Quizzes
              </Link>
            </div>

            <div className={styles.userArea}>
              <ThemeToggle />
              {user ? (
                <>
                  <span className={styles.userName}>Hi, {user.name}</span>
                  <button className={styles.logoutBtn} onClick={doLogout}>Logout</button>
                </>
              ) : (
                <Link to="/login">Login</Link>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className={styles.backdrop}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </header>
  )
}
