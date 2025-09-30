export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)

  const isAuthRoute = url.pathname.startsWith('/auth/google')
  const isApiRoute = url.pathname.startsWith('/api')

  if (!isAuthRoute && isApiRoute) {
    const session = await getUserSession(event)
    if (!session.user) {
      throw createError({ status: 401, statusMessage: 'Unauthorized' })
    }

    event.headers.set('X-User-Id', session.user.id)
  }
})
