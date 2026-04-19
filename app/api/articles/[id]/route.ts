import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const updateArticleSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  summary: z.string().max(500).optional(),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED']).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()
    
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    if (!article) {
      return NextResponse.json(
        { error: '文章不存在' },
        { status: 404 }
      )
    }

    if (article.status !== 'PUBLISHED' && (!currentUser || (currentUser.userId !== article.authorId && currentUser.role !== 'ADMIN'))) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 403 }
      )
    }

    return NextResponse.json({ article })
    
  } catch (error) {
    console.error('获取文章错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const article = await prisma.article.findUnique({
      where: { id },
      select: { authorId: true, status: true }
    })

    if (!article) {
      return NextResponse.json(
        { error: '文章不存在' },
        { status: 404 }
      )
    }

    if (currentUser.userId !== article.authorId && currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '无权修改此文章' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateArticleSchema.parse(body)

    const updateData: any = { ...validatedData }
    
    if (validatedData.status === 'PENDING_REVIEW') {
      updateData.submittedAt = new Date()
    }
    
    if (validatedData.status === 'PUBLISHED' && currentUser.role === 'ADMIN') {
      updateData.publishedAt = new Date()
    }

    const updatedArticle = await prisma.article.update({
      where: { id },
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

    return NextResponse.json({ article: updatedArticle })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '输入数据无效', details: error.errors },
        { status: 400 }
      )
    }

    console.error('更新文章错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const article = await prisma.article.findUnique({
      where: { id },
      select: { authorId: true }
    })

    if (!article) {
      return NextResponse.json(
        { error: '文章不存在' },
        { status: 404 }
      )
    }

    if (currentUser.userId !== article.authorId && currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '无权删除此文章' },
        { status: 403 }
      )
    }

    await prisma.article.delete({
      where: { id }
    })

    return NextResponse.json({ message: '文章删除成功' })
    
  } catch (error) {
    console.error('删除文章错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}