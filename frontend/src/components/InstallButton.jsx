import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Download, X, Share, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import usePWAInstall from '../hooks/usePWAInstall'

/**
 * Icon-only "install this app" button. Renders nothing unless the browser
 * says installation is actually possible (or it's iOS Safari, where we show
 * the manual Add-to-Home-Screen steps instead).
 */
export default function InstallButton({ className = '' }) {
  const { canInstall, needsManualInstall, promptInstall } = usePWAInstall()
  const [showIOSHelp, setShowIOSHelp] = useState(false)

  if (!canInstall) return null

  const handleClick = async () => {
    if (needsManualInstall) {
      setShowIOSHelp(true)
      return
    }

    const outcome = await promptInstall()
    if (outcome === 'accepted') toast.success('Installing AI Study Buddy…')
  }

  return (
    <>
      <button
        onClick={handleClick}
        title="Install app"
        aria-label="Install app"
        className={`p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-light transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${className}`}
      >
        <Download className="h-5 w-5" />
      </button>

      {showIOSHelp &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-[9999]"
            onClick={() => setShowIOSHelp(false)}
          >
            <div
              className="bg-surface rounded-lg sm:rounded-xl max-w-sm w-full modal-panel overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-surface-light">
                <h3 className="text-base sm:text-lg font-semibold text-text-primary">
                  Install AI Study Buddy
                </h3>
                <button
                  onClick={() => setShowIOSHelp(false)}
                  aria-label="Close"
                  className="p-1 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-light"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4">
                <p className="text-sm text-text-secondary">
                  Add it to your home screen for a full-screen, offline-capable app.
                </p>
                <ol className="space-y-3">
                  <li className="flex items-center gap-3 text-sm text-text-primary">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-light">
                      <Share className="h-4 w-4 text-primary" />
                    </span>
                    Tap the <span className="font-medium">Share</span> button in Safari
                  </li>
                  <li className="flex items-center gap-3 text-sm text-text-primary">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-light">
                      <Plus className="h-4 w-4 text-primary" />
                    </span>
                    Choose <span className="font-medium">Add to Home Screen</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
