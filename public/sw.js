// Service Worker for Push Notifications

self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...")
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...")
  event.waitUntil(clients.claim())
})

self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push notification received")

  if (!event.data) {
    console.log("[Service Worker] No data in push notification")
    return
  }

  let notificationData = {}

  try {
    notificationData = event.data.json()
  } catch (e) {
    notificationData = {
      title: "Eureka",
      body: event.data.text(),
    }
  }

  const { title, body, icon, badge, tag, data } = notificationData

  const options = {
    body: body || "New notification from Eureka",
    icon: icon || "/Eureka-01.png",
    badge: badge || "/favicon-32x32.png",
    tag: tag || "notification",
    data: data || {},
    requireInteraction: false,
    vibrate: [200, 100, 200],
  }

  event.waitUntil(
    self.registration.showNotification(title || "Eureka", options)
  )
})

self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification clicked")
  event.notification.close()

  const urlToOpen = `/dashboard`

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    }).then((clientList) => {
      // Check if there's already a window/tab open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus()
        }
      }
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

self.addEventListener("notificationclose", (event) => {
  console.log("[Service Worker] Notification closed")
})
