import { useEffect, useState } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import type { AppTheme } from '../../shared/app-config'
import AppFrame from './components/AppFrame'
import Home from './pages/Home'
import Transcribe from './pages/Transcribe'
import TranscriptionLibrary from './pages/TranscriptionLibrary'

function App(): React.JSX.Element {
  const [theme, setTheme] = useState<AppTheme>('dark')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
  }, [theme])

  useEffect(() => {
    void window.appConfig.getConfig().then((config) => setTheme(config.theme))

    return window.appConfig.onConfigUpdated((config) => {
      setTheme(config.theme)
    })
  }, [])

  const toggleTheme = (): void => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    void window.appConfig.setConfig({ theme: nextTheme }).catch(() => {
      setTheme(theme)
    })
  }

  return (
    <HashRouter>
      <AppFrame>
        <Routes>
          <Route path="/" element={<Home theme={theme} onToggleTheme={toggleTheme} />} />
          <Route
            path="/transcribe"
            element={<Transcribe theme={theme} onToggleTheme={toggleTheme} />}
          />
          <Route
            path="/transcriptions"
            element={<TranscriptionLibrary theme={theme} onToggleTheme={toggleTheme} />}
          />
          <Route path="*" element={<Home theme={theme} onToggleTheme={toggleTheme} />} />
        </Routes>
      </AppFrame>
    </HashRouter>
  )
}

export default App
