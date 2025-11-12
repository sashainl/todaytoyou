import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import Chat from './pages/Chat'
import Diary from './pages/Diary'
import Tarot from './pages/Tarot'
import Statistics from './pages/Statistics'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <ScrollToTop />
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/diary" element={<Diary />} />
              <Route path="/tarot" element={<Tarot />} />
              <Route path="/statistics" element={<Statistics />} />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App

