import type { Database } from './supabase'

export type Chat = Database['public']['Tables']['chats']['Row']

export type ChatPayload = Database['public']['Tables']['chats']['Insert']

export type DocumentPayload = Database['public']['Tables']['documents']['Insert']

export type Message = Database['public']['Tables']['messages']['Row'] & {
  role: 'system' | 'user' | 'assistant'
}
