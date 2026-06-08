// Convierte la clave pública de VAPID a Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Solicitar permiso y suscribirse a notificaciones push
export async function subscribeToPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications no soportadas')
    return null
  }

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.log('Permiso de notificación denegado')
      return null
    }

    const registration = await navigator.serviceWorker.ready
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      // Clave pública VAPID (la generaremos en el backend)
      const vapidPublicKey = 'BPUd_okwZoyEwTG3PKmH2Eg_Cg9OjTHAGQB6aAuhakHbrD3NafJFJ5xJcSSCaxSbX6_BgAvZKncf56CgFP8EXs0'
      
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      })
    }

    console.log('Suscripción push:', subscription)
    return subscription
  } catch (error) {
    console.error('Error al suscribirse a notificaciones:', error)
    return null
  }
}

// Enviar suscripción al backend
export async function saveSubscription(subscription) {
  const token = localStorage.getItem('token')
  if (!token) return

  try {
    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(subscription)
    })
    return response.ok
  } catch (error) {
    console.error('Error al guardar suscripción:', error)
    return false
  }
}