import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken, setAuthToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: '用户已存在' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(validatedData.password)

    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || ['2161604566@qq.com']
    const isAdmin = adminEmails.includes(validatedData.email)

    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: isAdmin ? '管理员' : (validatedData.name || validatedData.email.split('@')[0]),
        role: isAdmin ? 'ADMIN' : 'USER',
      }
    })

    const token = generateToken(user.id, user.role)
    await setAuthToken(token)

    return NextResponse.json(
      { 
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }, 
      { status: 201 }
    )

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '输入数据无效', details: error.errors },
        { status: 400 }
      )
    }

    console.error('注册错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}