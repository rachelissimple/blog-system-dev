import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import SubmitReviewButton from '../components/SubmitReviewButton'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const userSession = await getCurrentUser()
  
  if (!userSession) {
    return (
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h2>
            <p className="text-gray-600 mb-6">登录后查看您的个人中心</p>
            <Link 
              href="/login"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              去登录
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: userSession.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      articles: {
        orderBy: {
          updatedAt: 'desc'
        },

      }
    }
  })

  if (!user) {
    return (
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">用户不存在</h2>
            <p className="text-gray-600 mb-6">无法找到您的用户信息</p>
          </div>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'PENDING_REVIEW': return 'bg-yellow-100 text-yellow-800'
      case 'PUBLISHED': return 'bg-green-100 text-green-800'
      case 'ARCHIVED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT': return '草稿'
      case 'PENDING_REVIEW': return '待审核'
      case 'PUBLISHED': return '已发布'
      case 'ARCHIVED': return '已下架'
      default: return status
    }
  }

  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">个人中心</h1>
          <p className="text-gray-600">欢迎回来，{user.name || user.email.split('@')[0]}</p>
          {user.role === 'ADMIN' && (
            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-md">
              <p className="text-sm text-purple-800">
                您拥有管理员权限。如果导航栏未显示&quot;管理员&quot;标签，请
                <a href="/api/auth/logout" className="font-medium underline hover:text-purple-900 ml-1">
                  重新登录
                </a>
                以更新权限信息。
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">个人信息</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">用户名:</span>
              <span className="font-medium">{user.name || user.email.split('@')[0]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">邮箱:</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">角色:</span>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                {user.role === 'ADMIN' ? '管理员' : '普通用户'}
              </span>
            </div>
            {user.role === 'ADMIN' && (
              <div className="flex justify-between items-center pt-3">
                <span className="text-gray-600">管理员功能:</span>
                <Link
                  href="/admin"
                  className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700"
                >
                  进入管理后台
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">我的文章</h2>
            <p className="text-gray-600 mt-1">共 {user.articles.length} 篇文章</p>
          </div>
          
          {user.articles.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">您还没有发布任何文章</p>
              <Link 
                href="/articles/new"
                className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                发布文章
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {user.articles.map((article) => (
                <div key={article.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        <Link href={`/articles/${article.id}`} className="hover:text-blue-600">
                          {article.title}
                        </Link>
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {article.summary || article.content.substring(0, 100)}...
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>
                          更新时间: {new Date(article.updatedAt).toLocaleString('zh-CN')}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-3">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(article.status)}`}>
                        {getStatusText(article.status)}
                      </span>
                      <div className="flex space-x-2">
                        <Link 
                          href={`/articles/edit/${article.id}`}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
                        >
                          编辑
                        </Link>
                        {article.status === 'DRAFT' && (
                          <SubmitReviewButton articleId={article.id} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}