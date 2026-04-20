import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const createCommentSchema = z.object({
  content: z.string().min(1).max(1000),
  articleId: z.string(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const articleId = searchParams.get('articleId')
    
    const comments = await prisma.comment.findMany({
      where: articleId ? { articleId } : undefined,
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
    console.error('获取评论列表错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: '需要登录后才能评论' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createCommentSchema.parse(body)

    const article = await prisma.article.findUnique({
      where: { id: validatedData.articleId },
      select: { status: true }
    })

    if (!article || article.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: '文章不存在或未发布' },
        { status: 400 }
      )
    }

    const comment = await prisma.comment.create({
      data: {
        content: validatedData.content,
        articleId: validatedData.articleId,
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