'use client'

import { useState } from 'react'

interface SubmitReviewButtonProps {
  articleId: string
}

export default function SubmitReviewButton({ articleId }: SubmitReviewButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmitReview = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PENDING_REVIEW' }),
      })
      
      if (response.ok) {
        window.location.reload()
      } else {
        const errorData = await response.json()
        alert(errorData.error || '提交审核失败')
      }
    } catch (error) {
      console.error('提交审核失败:', error)
      alert('提交审核失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleSubmitReview}
      disabled={isLoading}
      className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? '提交中...' : '提交审核'}
    </button>
  )
}