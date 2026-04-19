'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Article {
  id: string
  title: string
  content: string
  summary?: string
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED'
  authorId: string
}

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState<string>('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [summary, setSummary] = useState('')
  const [status, setStatus] = useState<Article['status']>('DRAFT')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const { id: articleId } = await params
        setId(articleId)
        
        const response = await fetch(`/api/articles/${articleId}`)
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || '加载文章失败')
        }
        
        const article: Article = data.article
        setTitle(article.title)
        setContent(article.content)
        setSummary(article.summary || '')
        setStatus(article.status)
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载文章失败')
      } finally {
        setLoading(false)
      }
    }
    
    fetchArticle()
  }, [params])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          content, 
          summary: summary || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '保存文章失败')
      }

      router.push('/articles')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存文章失败')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitReview = async () => {
    setError('')
    setSaving(true)

    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PENDING_REVIEW' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '提交审核失败')
      }

      router.push('/articles')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交审核失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除这篇文章吗？此操作不可恢复。')) {
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '删除文章失败')
      }

      router.push('/articles')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除文章失败')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">加载中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">编辑文章</h1>
          <p className="mt-2 text-gray-600">当前状态: <span className="font-medium">{status}</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              标题 *
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-2">
              摘要（可选）
            </label>
            <textarea
              id="summary"
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              内容 *
            </label>
            <textarea
              id="content"
              required
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <div>
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                删除文章
              </button>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                取消
              </button>
              
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '保存中...' : '保存修改'}
              </button>
              
              {status === 'DRAFT' && (
                <button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={saving}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? '提交中...' : '提交审核'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}