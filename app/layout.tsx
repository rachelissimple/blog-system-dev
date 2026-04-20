import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Navbar from './components/Navbar'

export const dynamic = 'force-dynamic'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '个人博客系统',
  description: '一个简单的个人博客系统',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let currentUser = null
  try {
    const userSession = getCurrentUser()
    if (userSession) {
      currentUser = await prisma.user.findUnique({
        where: { id: userSession.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        }
      })
    }
  } catch (error) {
    console.error('获取用户信息错误:', error)
  }

  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <Navbar currentUser={currentUser} />
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}