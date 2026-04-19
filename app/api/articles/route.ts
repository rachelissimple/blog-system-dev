import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const createArticleSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  summary: z.string().max(500).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as 'PUBLISHED' | 'DRAFT' | 'PENDING_REVIEW' | undefined
    
    const articles = await prisma.article.findMany({
      where: {
        status: status || 'PUBLISHED',
      },
      include: {
        author: {
          select: {
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      }
    })

    return NextResponse.json({ articles })
    
  } catch (error) {
    console.error('获取文章列表错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createArticleSchema.parse(body)

    const article = await prisma.article.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        summary: validatedData.summary,
        status: 'DRAFT',
        authorId: currentUser.userId,

      },
      include: {
        author: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json({ article }, { status: 201 })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '输入数据无效', details: error.errors },
        { status: 400 }
      )
    }

    console.error('创建文章错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}