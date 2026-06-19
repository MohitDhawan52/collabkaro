import { createClient } from '@/lib/supabase'

export async function notify({
  userId,
  title,
  message,
  type = 'info',
}: {
  userId: string
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
}) {
  const supabase = createClient()
  await supabase.from('notifications').insert({ user_id: userId, title, message, type, read: false })
}
