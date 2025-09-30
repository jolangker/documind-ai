import { serverSupabaseUser } from '../utils/supabase'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)

  const url = getRequestURL(event)

  const isApiRoute = url.pathname.startsWith('/api')
  if (isApiRoute && !user) {
    createError({ status: 401, statusMessage: 'Unauthorized' })
  }
})
