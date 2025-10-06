import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import styles from './Auth.module.css'

export default function SignupPage() {
  const nav = useNavigate()
  const { signup } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!name || !email || !password) { setError('All fields are required'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      await signup(name, email, password)
      nav('/library')
    } catch (e) {
      setError(e.response?.data?.error || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <form className={styles.card} onSubmit={onSubmit}>
        <h2>Create account</h2>
        {error && <div className={styles.error}>{error}</div>}
        <label>Name</label>
        <input type="text" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Jane Doe" required />
        <label>Email</label>
        <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" required />
        <label>Password</label>
        <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
        <label>Confirm Password</label>
        <input type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} placeholder="••••••••" required minLength={6} />
        <button disabled={loading} type="submit">{loading? 'Creating...':'Sign up'}</button>
        <p className={styles.alt}>Have an account? <Link to="/login">Sign in</Link></p>
      </form>
    </div>
  )
}
