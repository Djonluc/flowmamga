import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Track reading session
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { comicId, chapterId, duration, pagesRead } = await req.json();

    const userId = (session.user as any).id;

    // Create reading session
    await prisma.readingSession.create({
      data: {
        userId,
        comicId,
        chapterId: chapterId || null,
        duration, // in seconds
        pagesRead: pagesRead || 0,
      },
    });

    // Update user's total reading time
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalReadingTime: {
          increment: duration
        }
      }
    });

    // Check and update reading streak
    await updateReadingStreak(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reading tracking error:", error);
    return NextResponse.json({ error: "Failed to track reading" }, { status: 500 });
  }
}

// Get user's reading stats
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalReadingTime: true,
        currentStreak: true,
        longestStreak: true,
        lastReadAt: true,
      }
    });

    const totalSessions = await prisma.readingSession.count({
      where: { userId }
    });

    const totalPages = await prisma.readingSession.aggregate({
      where: { userId },
      _sum: {
        pagesRead: true
      }
    });

    return NextResponse.json({
      totalReadingTime: user?.totalReadingTime || 0,
      currentStreak: user?.currentStreak || 0,
      longestStreak: user?.longestStreak || 0,
      lastReadAt: user?.lastReadAt,
      totalSessions,
      totalPagesRead: totalPages._sum.pagesRead || 0,
    });
  } catch (error) {
    console.error("Reading stats fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}

async function updateReadingStreak(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastReadAt: true, currentStreak: true, longestStreak: true }
  });

  if (!user) return;

  const now = new Date();
  const lastRead = user.lastReadAt;

  if (!lastRead) {
    // First time reading
    await prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak: 1,
        longestStreak: 1,
        lastReadAt: now,
      }
    });
    return;
  }

  const daysSinceLastRead = Math.floor(
    (now.getTime() - lastRead.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceLastRead === 0) {
    // Same day, just update timestamp
    await prisma.user.update({
      where: { id: userId },
      data: { lastReadAt: now }
    });
  } else if (daysSinceLastRead === 1) {
    // Consecutive day, increment streak
    const newStreak = (user.currentStreak || 0) + 1;
    await prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, user.longestStreak || 0),
        lastReadAt: now,
      }
    });
  } else {
    // Streak broken, reset to 1
    await prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak: 1,
        lastReadAt: now,
      }
    });
  }
}
