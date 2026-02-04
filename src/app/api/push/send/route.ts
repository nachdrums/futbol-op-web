import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'

// Configurar VAPID keys desde variables de entorno
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:futbolop@example.com'

// Solo configurar si las claves están disponibles
let vapidConfigured = false
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(
      VAPID_SUBJECT,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    )
    vapidConfigured = true
  } catch (error) {
    console.error('Error configuring VAPID:', error)
  }
}

// POST - Enviar notificación push a todos los suscriptores
export async function POST(request: NextRequest) {
  try {
    // Verificar que VAPID esté configurado
    if (!vapidConfigured) {
      return NextResponse.json({ 
        error: 'Push notifications not configured', 
        message: 'VAPID keys are missing' 
      }, { status: 503 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que el usuario sea admin u organizador
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'organizer'].includes(profile.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const { title, body, url } = await request.json()

    if (!title || !body) {
      return NextResponse.json({ error: 'Título y mensaje requeridos' }, { status: 400 })
    }

    // Obtener todas las suscripciones
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')

    if (subError) {
      console.error('Error fetching subscriptions:', subError)
      return NextResponse.json({ error: 'Error al obtener suscripciones' }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: 'No hay suscriptores', sent: 0 })
    }

    // Payload de la notificación
    const payload = JSON.stringify({
      title,
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      url: url || '/',
      timestamp: Date.now()
    })

    // Enviar notificaciones a todos los suscriptores
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        }

        try {
          await webpush.sendNotification(pushSubscription, payload)
          return { success: true, endpoint: sub.endpoint }
        } catch (error: unknown) {
          // Si la suscripción expiró o es inválida, eliminarla
          if (error && typeof error === 'object' && 'statusCode' in error) {
            const pushError = error as { statusCode: number }
            if (pushError.statusCode === 404 || pushError.statusCode === 410) {
              await supabase
                .from('push_subscriptions')
                .delete()
                .eq('endpoint', sub.endpoint)
            }
          }
          return { success: false, endpoint: sub.endpoint, error }
        }
      })
    )

    const sent = results.filter(r => r.status === 'fulfilled' && (r.value as { success: boolean }).success).length
    const failed = results.length - sent

    return NextResponse.json({ 
      message: `Notificaciones enviadas`, 
      sent, 
      failed,
      total: subscriptions.length
    })
  } catch (error) {
    console.error('Error sending push notifications:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
