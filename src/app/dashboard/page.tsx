import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { BookOpen, Eye, Heart, TrendingUp, Plus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function CreatorDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    include: {
      comics: {
        include: {
          _count: {
            select: { likes: true, views: true, chapters: true }
          }
        },
        orderBy: { lastUpdatedAt: 'desc' }
      }
    }
  });

  if (!user) {
    redirect("/auth/signin");
  }

  const totalViews = user.comics.reduce((sum, comic) => sum + comic._count.views, 0);
  const totalLikes = user.comics.reduce((sum, comic) => sum + comic._count.likes, 0);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Creator Dashboard</h1>
            <p className="text-neutral-400 mt-2">Manage your comics and track performance</p>
          </div>
          <Link
            href="/dashboard/upload"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            <Plus size={20} />
            Upload Comic
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-neutral-900 rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <BookOpen className="text-blue-400" size={24} />
              </div>
              <span className="text-sm text-neutral-400 font-medium">Total Comics</span>
            </div>
            <p className="text-3xl font-bold">{user.comics.length}</p>
          </div>

          <div className="bg-neutral-900 rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Eye className="text-purple-400" size={24} />
              </div>
              <span className="text-sm text-neutral-400 font-medium">Total Views</span>
            </div>
            <p className="text-3xl font-bold">{totalViews.toLocaleString()}</p>
          </div>

          <div className="bg-neutral-900 rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-pink-500/10 rounded-lg">
                <Heart className="text-pink-400" size={24} />
              </div>
              <span className="text-sm text-neutral-400 font-medium">Total Likes</span>
            </div>
            <p className="text-3xl font-bold">{totalLikes.toLocaleString()}</p>
          </div>

          <div className="bg-neutral-900 rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="text-green-400" size={24} />
              </div>
              <span className="text-sm text-neutral-400 font-medium">Engagement</span>
            </div>
            <p className="text-3xl font-bold">{totalViews > 0 ? ((totalLikes / totalViews) * 100).toFixed(1) : 0}%</p>
          </div>
        </div>

        {/* Comics List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-2xl font-bold">Your Comics</h2>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm transition-colors">All</button>
              <button className="px-4 py-2 hover:bg-neutral-800 rounded-lg text-sm transition-colors text-neutral-400">Published</button>
              <button className="px-4 py-2 hover:bg-neutral-800 rounded-lg text-sm transition-colors text-neutral-400">Drafts</button>
            </div>
          </div>

          {user.comics.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-neutral-500 bg-neutral-900/50 rounded-2xl border border-dashed border-white/10">
              <BookOpen size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-medium">No comics yet</p>
              <p className="text-sm mt-1">Upload your first comic to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {user.comics.map((comic) => (
                <div
                  key={comic.id}
                  className="bg-neutral-900 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-24 rounded-lg overflow-hidden bg-neutral-800 flex-shrink-0">
                      {comic.coverImage ? (
                        <Image src={comic.coverImage} alt={comic.title} fill className="object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] opacity-20">No Cover</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg truncate group-hover:text-blue-400 transition-colors">{comic.title}</h3>
                          <p className="text-sm text-neutral-400 line-clamp-1">{comic.description || "No description"}</p>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-neutral-400">
                          <div className="flex items-center gap-1">
                            <Eye size={16} />
                            <span>{comic._count.views.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart size={16} />
                            <span>{comic._count.likes.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen size={16} />
                            <span>{comic._count.chapters} chapters</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        {comic.isDraft && (
                          <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 text-xs font-medium rounded">Draft</span>
                        )}
                        {comic.publishAt && new Date(comic.publishAt) > new Date() && (
                          <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs font-medium rounded">
                            Scheduled: {new Date(comic.publishAt).toLocaleDateString()}
                          </span>
                        )}
                        <span className="text-xs text-neutral-500">
                          Updated {new Date(comic.lastUpdatedAt).toLocaleDateString()}
                        </span>
                        <div className="ml-auto flex gap-2">
                          <Link
                            href={`/dashboard/comic/${comic.slug}/edit`}
                            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs font-medium transition-colors"
                          >
                            Edit
                          </Link>
                          <Link
                            href={`/comic/${comic.slug}`}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-medium transition-colors"
                          >
                            View
                          </Link>
                        </div>
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
  );
}
