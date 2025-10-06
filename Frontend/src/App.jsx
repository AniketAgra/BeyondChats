import React from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { useAuth } from './context/AuthContext.jsx'
import SourceSelector from './pages/SourceSelector.jsx'
import LibraryPage from './pages/LibraryPage.jsx'
import PDFPage from './pages/PDFPage.jsx'
import QuizPage from './pages/QuizPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import Navbar from './components/Navbar/Navbar.jsx'
import FloatingAIBuddy from './components/AIBuddy/FloatingAIBuddy.jsx'
import AIBuddyPage from './pages/AIBuddyPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <ThemeProvider>
      <Navbar />
      <Routes>
  <Route path="/" element={<Navigate to="/library" />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/signup" element={<SignupPage />} />
  <Route path="/library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
  <Route path="/pdf/:id" element={<ProtectedRoute><PDFPage /></ProtectedRoute>} />
  <Route path="/quiz" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
  <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
  <Route path="/aibuddy" element={<ProtectedRoute><AIBuddyPage /></ProtectedRoute>} />
        <Route path="*" element={<div className="container">Not Found. <Link to="/library">Go to Library</Link></div>} />
      </Routes>
      <FloatingAIBuddy />
    </ThemeProvider>
  )
}
