import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Image from "next/image";
import { Twitter, Instagram, Globe, Calendar, BookOpen, Eye } from "lucide-react";

export default async function CreatorProfilePage({
  params,
}: {
  params: { username: string };
}) {
  // In a real app, we would search by username. For now, using ID as placeholder.
  const user = await prisma.user.findFirst({
    where: { name: params.username },
    include: {
        _count: {
            select: { comics: true }
        },
        comics: {
            where: { isDraft: false },
            take: 12,
            orderBy: { lastUpdatedAt: 'desc' }
        }
    }
  });

  if (!user) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Profile Sidebar */}
        <div className="w-full md:w-80 space-y-6">
          <div className="bg-neutral-900 rounded-2xl p-6 border border-white/5 space-y-4">
            <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-blue-500/20">
              <Image
                src={user.image || "/default-avatar.png"}
                alt={user.name || "Creator"}
                fill
                className="object-cover"
              />
            </div>
            
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-sm text-neutral-400">@{user.name?.toLowerCase().replace(/\s+/g, '')}</p>
            </div>

            {user.bio && (
              <p className="text-sm text-neutral-300 leading-relaxed text-center italic">
                "{user.bio}"
              </p>
            )}

            <div className="flex justify-center gap-4 pt-4 border-t border-white/5">
              {user.twitterUrl && <a href={user.twitterUrl} className="text-neutral-400 hover:text-blue-400 transition-colors"><Twitter size={20} /></a>}
              {user.instagramUrl && <a href={user.instagramUrl} className="text-neutral-400 hover:text-pink-400 transition-colors"><Instagram size={20} /></a>}
              {user.websiteUrl && <a href={user.websiteUrl} className="text-neutral-400 hover:text-white transition-colors"><Globe size={20} /></a>}
            </div>
          </div>

          <div className="bg-neutral-900 rounded-2xl p-6 border border-white/5 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Creator Stats</h2>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-neutral-400">
                        <BookOpen size={16} />
                        <span className="text-sm">Total Comics</span>
                    </div>
                    <span className="font-bold">{user._count.comics}</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-neutral-400">
                        <Calendar size={16} />
                        <span className="text-sm">Joined</span>
                    </div>
                    <span className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-2xl font-bold">Published Comics</h2>
                <div className="text-sm text-neutral-400">Showing {user.comics.length} titles</div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {user.comics.map((comic) => (
                    <div key={comic.id} className="group cursor-pointer space-y-3">
                        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-neutral-900 border border-white/5 transition-transform group-hover:-translate-y-2">
                            {comic.coverImage ? (
                                <Image src={comic.coverImage} alt={comic.title} fill className="object-cover" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs opacity-30 select-none">No Cover</div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold truncate group-hover:text-blue-400 transition-colors">{comic.title}</h3>
                            <div className="flex items-center gap-3 text-[10px] text-neutral-500 font-medium uppercase tracking-wider">
                                <span className="flex items-center gap-1"><Eye size={12} /> 12.5k</span>
                                <span className="flex items-center gap-1 border-l border-white/10 pl-3">Updated 2d ago</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {user.comics.length === 0 && (
                <div className="h-64 flex flex-col items-center justify-center text-neutral-500 bg-neutral-900/50 rounded-2xl border border-dashed border-white/10 italic">
                    This creator hasn't published any comics yet.
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
