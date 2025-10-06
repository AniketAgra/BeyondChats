import React from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext.jsx'
import SourceSelector from './pages/SourceSelector.jsx'
import PDFPage from './pages/PDFPage.jsx'
import QuizPage from './pages/QuizPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import Navbar from './components/Navbar/Navbar.jsx'

export default function App() {
  return (
    <ThemeProvider>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/library" />} />
        <Route path="/library" element={<SourceSelector />} />
        <Route path="/pdf/:id" element={<PDFPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="*" element={<div className="container">Not Found. <Link to="/library">Go to Library</Link></div>} />
      </Routes>
    </ThemeProvider>
  )
}
