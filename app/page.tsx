import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const articles = await prisma.article.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      author: {
        select: {
          name: true,
          email: true,
        }
      },

    },
    orderBy: {
      publishedAt: 'desc'
    }
  })

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">欢迎来到个人博客</h1>
          <p className="text-lg text-gray-600">分享知识，记录生活，探索无限可能</p>
        </div>
        
        {articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">暂无已发布的文章</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900">最新文章</h2>
              <p className="text-gray-600 mt-1">浏览所有已发布的文章</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <div key={article.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-500">
                        {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('zh-CN') : ''}
                      </span>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                      {article.title}
                    </h2>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {article.summary || article.content.substring(0, 150)}...
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500">
                          作者: {article.author.name || article.author.email}
                        </span>
                      </div>
                      <a 
                        href={`/articles/${article.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        阅读全文 →
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}