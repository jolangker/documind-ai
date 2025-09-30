import { createClient } from '@supabase/supabase-js'
import type { Database } from '~~/shared/types/supabase'

const supabaseURL = process.env.SUPABASE_URL
if (!supabaseURL) {
  throw createError({ status: 500, statusMessage: 'Supabase URL not provided' })
}

const supabaseKey = process.env.SUPABASE_KEY
if (!supabaseKey) {
  throw createError({ status: 500, statusMessage: 'Supabase Key not provided' })
}

export const supabase = createClient<Database>(supabaseURL, supabaseKey)
