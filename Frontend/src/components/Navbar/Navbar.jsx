import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ThemeToggle from '../ThemeToggle/ThemeToggle.jsx'
import styles from './Navbar.module.css'
import { useAuth } from '../../context/AuthContext.jsx'

export default function Navbar() {
  const { pathname } = useLocation()
  const nav = useNavigate()
  const { user, logout } = useAuth()
  const doLogout = async () => { await logout(); nav('/login') }
  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        <Link to="/library" className={styles.brand}>EduLearn</Link>
        <nav className={styles.nav}>
          <Link className={pathname.startsWith('/library')?styles.active:''} to="/library">Library</Link>
          <Link className={pathname.startsWith('/dashboard')?styles.active:''} to="/dashboard">Dashboard</Link>
          <Link className={pathname.startsWith('/quizzes')?styles.active:''} to="/quizzes">Quizzes</Link>
        </nav>
      </div>
      <div className={styles.right}>
        <ThemeToggle />
        {user ? (
          <div className={styles.userArea}>
            <span className={styles.userName}>Hi, {user.name}</span>
            <button className={styles.logoutBtn} onClick={doLogout}>Logout</button>
          </div>
        ) : (
          <div className={styles.authLinks}>
            <Link to="/login">Login</Link>
            <Link to="/signup" className={styles.signup}>Sign up</Link>
          </div>
        )}
      </div>
    </header>
  )
}
