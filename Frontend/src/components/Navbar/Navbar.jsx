import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import ThemeToggle from '../ThemeToggle/ThemeToggle.jsx'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { pathname } = useLocation()
  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        <Link to="/library" className={styles.brand}>EduLearn</Link>
        <nav className={styles.nav}>
          <Link className={pathname.startsWith('/library')?styles.active:''} to="/library">Library</Link>
          <Link className={pathname.startsWith('/dashboard')?styles.active:''} to="/dashboard">Dashboard</Link>
        </nav>
      </div>
      <div className={styles.right}>
        <ThemeToggle />
      </div>
    </header>
  )
}
