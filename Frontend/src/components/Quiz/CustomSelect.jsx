import React, { useState, useRef, useEffect } from 'react'
import styles from './CustomSelect.module.css'

export default function CustomSelect({ value, onChange, options, label }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (optionValue) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div className={styles.customSelect} ref={dropdownRef}>
      <button
        type="button"
        className={`${styles.selectButton} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles.selectedValue}>
          {selectedOption?.icon && <span className={styles.optionIcon}>{selectedOption.icon}</span>}
          {selectedOption?.label || label}
        </span>
        <span className={`${styles.arrow} ${isOpen ? styles.arrowUp : ''}`}>
          <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
            <path d="M1 1L7 7L13 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.option} ${option.value === value ? styles.selected : ''}`}
              onClick={() => handleSelect(option.value)}
            >
              {option.icon && <span className={styles.optionIcon}>{option.icon}</span>}
              <span className={styles.optionLabel}>{option.label}</span>
              {option.value === value && (
                <span className={styles.checkmark}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
