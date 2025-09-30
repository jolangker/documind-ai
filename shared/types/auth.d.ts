// auth.d.ts
declare module '#auth-utils' {
  interface User {
    id: string
    name: string
    email: string
    provider: 'google'
    providerId: number
  }
}

export { }
