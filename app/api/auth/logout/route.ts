import { NextResponse } from 'next/server'
import { clearAuthToken } from '@/lib/auth'

export async function POST() {
  await clearAuthToken()
  return NextResponse.json({ message: '登出成功' })
}

export async function GET() {
  await clearAuthToken()
  return NextResponse.json({ message: '登出成功' })
}