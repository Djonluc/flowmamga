import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Get analytics for a creator
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "30"; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get user's comics
    const comics = await prisma.comic.findMany({
      where: { authorId: userId },
      include: {
        _count: {
          select: { views: true, likes: true, comments: true, chapters: true }
        }
      }
    });

    // Get views over time
    const viewsOverTime = await prisma.comicView.groupBy({
      by: ['viewedAt'],
      where: {
        comic: {
          authorId: userId
        },
        viewedAt: {
          gte: startDate
        }
      },
      _count: true,
      orderBy: {
        viewedAt: 'asc'
      }
    });

    // Get likes over time
    const likesOverTime = await prisma.like.groupBy({
      by: ['createdAt'],
      where: {
        comic: {
          authorId: userId
        },
        createdAt: {
          gte: startDate
        }
      },
      _count: true,
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Calculate totals
    const totalViews = comics.reduce((sum, comic) => sum + comic._count.views, 0);
    const totalLikes = comics.reduce((sum, comic) => sum + comic._count.likes, 0);
    const totalComments = comics.reduce((sum, comic) => sum + comic._count.comments, 0);
    const totalChapters = comics.reduce((sum, comic) => sum + comic._count.chapters, 0);

    // Top performing comics
    const topComics = comics
      .sort((a, b) => b._count.views - a._count.views)
      .slice(0, 5)
      .map(comic => ({
        id: comic.id,
        title: comic.title,
        views: comic._count.views,
        likes: comic._count.likes,
        comments: comic._count.comments,
      }));

    return NextResponse.json({
      summary: {
        totalComics: comics.length,
        totalViews,
        totalLikes,
        totalComments,
        totalChapters,
        engagementRate: totalViews > 0 ? ((totalLikes + totalComments) / totalViews * 100).toFixed(2) : 0,
      },
      viewsOverTime,
      likesOverTime,
      topComics,
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
