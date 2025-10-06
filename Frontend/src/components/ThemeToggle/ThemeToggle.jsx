import React from 'react'
import { useTheme } from '../../context/ThemeContext.jsx'
import styles from './ThemeToggle.module.css'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button className={styles.toggle} onClick={toggle} title="Toggle theme">
      {theme === 'light' ? '🌞' : '🌙'}
    </button>
  )
}
import React from 'react'
import styles from './ThemeToggle.module.css'
import { useTheme } from '../../context/ThemeContext.jsx'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button className={styles.toggle} onClick={toggle} aria-label="Toggle theme">
      {theme === 'light' ? '🌞' : '🌙'}
    </button>
  )
}
