export default defineOAuthGoogleEventHandler({
  async onSuccess(event, { user: googleUser }) {
    const session = await getUserSession(event)

    let { data: user } = await supabase.from('profiles')
      .select('*')
      .eq('provider', 'google')
      .eq('providerId', googleUser.sub)
      .single()

    if (!user) {
      const { data } = await supabase.from('profiles').insert({
        id: session.id,
        email: googleUser.email,
        name: googleUser.name,
        provider: 'google',
        providerId: googleUser.sub
      }).single()
      user = data
    }
    // supabase.auth.get
    await setUserSession(event, { user })

    return sendRedirect(event, '/')
  }
})
