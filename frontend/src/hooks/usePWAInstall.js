import { useCallback, useEffect, useState } from 'react'

/**
 * Drives the "install app" affordance.
 *
 * Chromium fires `beforeinstallprompt` and lets us call `prompt()` later, but
 * only from a user gesture and only once — so we stash the event. Safari (iOS
 * and macOS) has no such API: installing is a manual Share > Add to Home
 * Screen, so we detect it and surface instructions instead of a dead button.
 */

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.matchMedia('(display-mode: minimal-ui)').matches ||
  window.navigator.standalone === true // iOS Safari

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) // iPadOS reports as Mac

export default function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installed, setInstalled] = useState(isStandalone)

  useEffect(() => {
    const onBeforeInstallPrompt = (e) => {
      // Suppress Chrome's own mini-infobar; we drive the prompt from our button
      e.preventDefault()
      setDeferredPrompt(e)
    }

    const onInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
    }

    // Launching from the home screen icon changes display-mode without a reload
    const displayModeQuery = window.matchMedia('(display-mode: standalone)')
    const onDisplayModeChange = (e) => e.matches && setInstalled(true)

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)
    displayModeQuery.addEventListener?.('change', onDisplayModeChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      displayModeQuery.removeEventListener?.('change', onDisplayModeChange)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return null
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    // The event is single-use regardless of the answer
    setDeferredPrompt(null)
    return outcome // 'accepted' | 'dismissed'
  }, [deferredPrompt])

  const needsManualInstall = !deferredPrompt && !installed && isIOS()

  return {
    /** Show the button at all? */
    canInstall: (!!deferredPrompt || needsManualInstall) && !installed,
    /** Already running as an installed app */
    installed,
    /** Safari: no programmatic prompt, show Share-sheet instructions */
    needsManualInstall,
    promptInstall,
  }
}
