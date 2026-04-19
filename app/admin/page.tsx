'use client'

import { useState, useEffect } from 'react'

interface Article {
  id: string
  title: string
  summary?: string
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED'
  submittedAt?: string
  author: {
    name?: string
    email: string
  }

}

export default function AdminPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    fetchPendingArticles()
  }, [])

  const fetchPendingArticles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/articles?status=PENDING_REVIEW')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || '加载文章失败')
      }
      
      setArticles(data.articles)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载文章失败')
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (articleId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      setReviewingId(articleId)
      setError('')
      
      const response = await fetch(`/api/admin/articles?articleId=${articleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action,
          feedback: feedback || undefined
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || '审核操作失败')
      }
      
      setFeedback('')
      fetchPendingArticles()
    } catch (err) {
      setError(err instanceof Error ? err.message : '审核操作失败')
    } finally {
      setReviewingId(null)
    }
  }

  if (loading) {
    return (
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">加载中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">文章审核管理</h1>
          <p className="mt-2 text-gray-600">处理用户提交的文章审核请求</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">暂无待审核的文章</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {articles.map((article) => (
                <li key={article.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {article.title}
                        </h3>
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          待审核
                        </span>
                      </div>
                      
                      {article.summary && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {article.summary}
                        </p>
                      )}
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <div className="mr-4">
                          作者: <span className="font-medium">{article.author.name || article.author.email}</span>
                        </div>

                        <div>
                          提交时间: <span className="font-medium">
                            {article.submittedAt ? new Date(article.submittedAt).toLocaleString('zh-CN') : '未知'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-3">
                      <label htmlFor={`feedback-${article.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                        审核意见（可选）
                      </label>
                      <textarea
                        id={`feedback-${article.id}`}
                        rows={2}
                        value={reviewingId === article.id ? feedback : ''}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="请输入审核意见..."
                      />
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleReview(article.id, 'APPROVE')}
                        disabled={reviewingId === article.id}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {reviewingId === article.id ? '处理中...' : '审核通过'}
                      </button>
                      
                      <button
                        onClick={() => handleReview(article.id, 'REJECT')}
                        disabled={reviewingId === article.id}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {reviewingId === article.id ? '处理中...' : '驳回'}
                      </button>
                      
                      <a
                        href={`/articles/${article.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        查看文章
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}