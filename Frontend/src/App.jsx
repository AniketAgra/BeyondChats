import React from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext.jsx'
import SourceSelector from './pages/SourceSelector.jsx'
import LibraryPage from './pages/LibraryPage.jsx'
import PDFPage from './pages/PDFPage.jsx'
import QuizPage from './pages/QuizPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import Navbar from './components/Navbar/Navbar.jsx'
import FloatingAIBuddy from './components/AIBuddy/FloatingAIBuddy.jsx'
import AIBuddyPage from './pages/AIBuddyPage.jsx'

export default function App() {
  return (
    <ThemeProvider>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/library" />} />
  <Route path="/library" element={<LibraryPage />} />
        <Route path="/pdf/:id" element={<PDFPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/aibuddy" element={<AIBuddyPage />} />
        <Route path="*" element={<div className="container">Not Found. <Link to="/library">Go to Library</Link></div>} />
      </Routes>
      <FloatingAIBuddy />
    </ThemeProvider>
  )
}
