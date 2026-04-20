import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface ArticlePageProps {
  params: Promise<{ id: string }>
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { id } = await params
  const currentUser = getCurrentUser()
  
  try {
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },

      }
    })

    if (!article) {
      notFound()
    }

    // 权限检查：非发布状态的文章需要作者或管理员权限
    if (article.status !== 'PUBLISHED') {
      if (!currentUser) {
        notFound() // 游客看不到非发布文章
      }
      
      const isAuthor = currentUser.userId === article.author.id
      const isAdmin = currentUser.role === 'ADMIN'
      
      if (!isAuthor && !isAdmin) {
        notFound() // 非作者且非管理员看不到非发布文章
      }
    }

    // 状态映射
    const statusConfig = {
      DRAFT: { label: '草稿', color: 'bg-gray-100 text-gray-800' },
      PENDING_REVIEW: { label: '待审核', color: 'bg-yellow-100 text-yellow-800' },
      PUBLISHED: { label: '已发布', color: 'bg-green-100 text-green-800' },
      ARCHIVED: { label: '已归档', color: 'bg-red-100 text-red-800' }
    }

    // 只有已发布文章才增加浏览计数
    if (article.status === 'PUBLISHED') {
      await prisma.article.update({
        where: { id },
        data: { viewCount: { increment: 1 } }
      })
    }

    return (
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <article className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${statusConfig[article.status].color}`}>
                    {statusConfig[article.status].label}
                  </span>
                  <span className="text-gray-500 text-sm">
                    {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('zh-CN') : ''}
                  </span>
                </div>
                <div className="text-gray-500 text-sm">
                  {article.status === 'PUBLISHED' ? `浏览: ${article.viewCount + 1}` : '预览模式'}
                </div>
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {article.title}
              </h1>
              
              <div className="flex items-center space-x-4 text-gray-600">
                <div>
                  作者: <span className="font-medium">{article.author.name || article.author.email}</span>
                </div>
                <div>•</div>
                <div>
                  发布时间: {article.publishedAt ? new Date(article.publishedAt).toLocaleString('zh-CN') : '未发布'}
                </div>
              </div>
            </div>

            {article.summary && (
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <p className="text-lg text-gray-700 italic">{article.summary}</p>
              </div>
            )}

            <div className="prose prose-lg max-w-none">
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                {article.content}
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <a 
                href="/articles"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← 返回文章列表
              </a>
            </div>
          </article>
        </div>
      </div>
    )
  } catch (error) {
    console.error('加载文章错误:', error)
    
    let errorTitle = '加载文章失败'
    let errorMessage = '抱歉，加载文章时出现错误。请稍后再试。'
    
    if (error && typeof error === 'object' && 'digest' in error && error.digest === 'NEXT_NOT_FOUND') {
      errorTitle = '文章未找到'
      errorMessage = '抱歉，您请求的文章不存在或您没有权限查看。'
    } else if (error instanceof Error) {
      if (error.message.includes('notFound') || error.message.includes('NEXT_NOT_FOUND')) {
        errorTitle = '文章未找到'
        errorMessage = '抱歉，您请求的文章不存在或您没有权限查看。'
      }
    }
    
    return (
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-red-800 mb-4">{errorTitle}</h2>
            <p className="text-red-700">{errorMessage}</p>
            <a 
              href="/articles"
              className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium"
            >
              返回文章列表
            </a>
          </div>
        </div>
      </div>
    )
  }
}