// app/api/auth/logout/route.js
import { NextResponse } from 'next/server'

export function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set({
    name: 'app_token',
    value: '',
    path: '/',
    maxAge: 0, // clear cookie
  })
  return res
}
