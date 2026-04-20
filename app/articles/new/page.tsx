'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function NewArticlePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [summary, setSummary] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          content, 
          summary: summary || undefined,

        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '创建文章失败')
      }

      router.push('/articles')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建文章失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">创建新文章</h1>
          <p className="mt-2 text-gray-600">撰写您的文章内容，保存为草稿后可提交审核。</p>
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
              placeholder="请输入文章标题"
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
              placeholder="文章摘要，最多500字"
            />
            <p className="mt-1 text-sm text-gray-500">留空将自动生成摘要</p>
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
              placeholder="请输入文章内容，支持Markdown格式"
            />
          </div>



          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '创建中...' : '保存为草稿'}
            </button>
            <button
              type="button"
              onClick={async () => {
                // 先保存为草稿，然后提交审核
                setLoading(true)
                try {
                  const saveResponse = await fetch('/api/articles', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      title, 
                      content, 
                      summary: summary || undefined,
                    }),
                  })
                  
                  const saveData = await saveResponse.json()
                  
                  if (!saveResponse.ok) {
                    throw new Error(saveData.error || '保存失败')
                  }
                  
                  // 提交审核
                  const submitResponse = await fetch(`/api/articles/${saveData.article.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'PENDING_REVIEW' }),
                  })
                  
                  if (!submitResponse.ok) {
                    throw new Error('提交审核失败')
                  }
                  
                  router.push('/articles')
                  router.refresh()
                } catch (err) {
                  setError(err instanceof Error ? err.message : '操作失败')
                } finally {
                  setLoading(false)
                }
              }}
              disabled={loading || !title || !content}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              提交审核
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}