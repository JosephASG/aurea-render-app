import { useEffect, useState } from 'react'

type AppFrameProps = {
  children: React.ReactNode
}

export default function AppFrame({ children }: AppFrameProps): React.JSX.Element {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    void window.windowControls.isMaximized().then(setIsMaximized)
    return window.windowControls.onMaximizedChanged(setIsMaximized)
  }, [])

  const toggleMaximize = async (): Promise<void> => {
    setIsMaximized(await window.windowControls.toggleMaximize())
  }

  return (
    <div className="app-frame theme-transition">
      <header className="window-titlebar flex h-11 items-center justify-between border-b">
        <div className="window-drag-region min-w-0 flex-1 self-stretch" />

        <div className="window-controls flex h-full shrink-0 items-stretch">
          <button
            type="button"
            aria-label="Minimizar ventana"
            onClick={() => {
              void window.windowControls.minimize()
            }}
            className="window-control window-control-minimize"
          >
            <span aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={isMaximized ? 'Restaurar ventana' : 'Maximizar ventana'}
            onClick={() => {
              void toggleMaximize()
            }}
            className={`window-control ${isMaximized ? 'window-control-restore' : 'window-control-maximize'}`}
          >
            <span aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Cerrar ventana"
            onClick={() => {
              void window.windowControls.close()
            }}
            className="window-control window-control-close"
          >
            <span aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="app-content">{children}</div>
    </div>
  )
}
