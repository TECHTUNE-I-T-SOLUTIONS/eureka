import { useEffect } from "react"

export function usePushNotifications() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return

    const registerServiceWorker = async () => {
      try {
        // Just register the service worker without subscribing
        // Subscription happens when user enables it in settings
        await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        })
        console.log("[Push] Service Worker registered")
      } catch (error) {
        console.error("[Push] Service Worker registration failed:", error)
      }
    }

    registerServiceWorker()
  }, [])
}

export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/")

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}
