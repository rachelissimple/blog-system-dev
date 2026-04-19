import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const reviewActionSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  feedback: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED' | undefined
    
    const articles = await prisma.article.findMany({
      where: {
        status: status || 'PENDING_REVIEW',
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
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ articles })
    
  } catch (error) {
    console.error('获取管理文章列表错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = reviewActionSchema.parse(body)

    const { searchParams } = new URL(request.url)
    const articleId = searchParams.get('articleId')

    if (!articleId) {
      return NextResponse.json(
        { error: '缺少文章ID' },
        { status: 400 }
      )
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { status: true }
    })

    if (!article) {
      return NextResponse.json(
        { error: '文章不存在' },
        { status: 404 }
      )
    }

    const updateData: {
      status?: 'PUBLISHED' | 'DRAFT'
      publishedAt?: Date
      reviewedAt?: Date
      reviewFeedback?: string
    } = {}
    
    if (validatedData.action === 'APPROVE') {
      updateData.status = 'PUBLISHED'
      updateData.publishedAt = new Date()
      updateData.reviewedAt = new Date()
      if (validatedData.feedback) {
        updateData.reviewFeedback = validatedData.feedback
      }
    } else if (validatedData.action === 'REJECT') {
      updateData.status = 'DRAFT'
      updateData.reviewedAt = new Date()
      if (validatedData.feedback) {
        updateData.reviewFeedback = validatedData.feedback
      }
    }

    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: updateData,
      include: {
        author: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json({ 
      message: `文章已${validatedData.action === 'APPROVE' ? '审核通过' : '驳回'}`,
      article: updatedArticle 
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '输入数据无效', details: error.errors },
        { status: 400 }
      )
    }

    console.error('审核文章错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}