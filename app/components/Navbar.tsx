'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface NavbarProps {
  currentUser: {
    id: string
    name: string | null
    email: string
    role: string
  } | null
}

export default function Navbar({ currentUser }: NavbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = async () => {
    try {
      const abortController = new AbortController()
      const timeoutId = setTimeout(() => abortController.abort(), 5000)
      
      const response = await fetch('/api/auth/logout', { 
        method: 'POST',
        signal: abortController.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        window.location.replace('/')
      } else {
        console.error('登出失败，状态码:', response.status)
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('登出请求超时')
      } else {
        console.error('登出错误:', error)
      }
    }
  }

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-800 hover:text-gray-900">
              个人博客系统
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900">首页</Link>
            <Link href="/articles" className="text-gray-600 hover:text-gray-900">文章</Link>
            {currentUser ? (
              <div className="flex items-center space-x-4">
                <Link href="/articles/new" className="text-gray-600 hover:text-gray-900">发布文章</Link>
                {currentUser.role === 'ADMIN' && (
                  <Link href="/admin" className="text-gray-600 hover:text-gray-900">管理后台</Link>
                )}
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
                  >
                    <span>
                      {currentUser.name || currentUser.email.split('@')[0]}
                      {currentUser.role === 'ADMIN' && ' (管理员)'}
                    </span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                      <a 
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsDropdownOpen(false);
                          window.location.href = '/profile';
                        }}
                      >
                        个人中心
                      </a>
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        登出
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-gray-900">登录</Link>
                <Link href="/register" className="text-gray-600 hover:text-gray-900">注册</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}