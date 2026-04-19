import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const createCommentSchema = z.object({
  content: z.string().min(1).max(1000),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const comments = await prisma.comment.findMany({
      where: { articleId: id },
      include: {
        author: {
          select: {
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ comments })
    
  } catch (error) {
    console.error('获取文章评论错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: '需要登录后才能评论' },
        { status: 401 }
      )
    }

    const article = await prisma.article.findUnique({
      where: { id },
      select: { status: true }
    })

    if (!article || article.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: '文章不存在或未发布' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = createCommentSchema.parse(body)

    const comment = await prisma.comment.create({
      data: {
        content: validatedData.content,
        articleId: id,
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

    return NextResponse.json({ comment }, { status: 201 })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '输入数据无效', details: error.errors },
        { status: 400 }
      )
    }

    console.error('创建评论错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}