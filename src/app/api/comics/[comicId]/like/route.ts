import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Like a comic
export async function POST(
  req: NextRequest,
  { params }: { params: { comicId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { comicId } = params;

    // Check if already liked
    const existing = await prisma.like.findUnique({
      where: {
        userId_comicId: {
          userId,
          comicId,
        },
      },
    });

    if (existing) {
      // Unlike
      await prisma.like.delete({
        where: {
          userId_comicId: {
            userId,
            comicId,
          },
        },
      });

      return NextResponse.json({ liked: false });
    } else {
      // Like
      await prisma.like.create({
        data: {
          userId,
          comicId,
        },
      });

      // Create notification for comic author
      const comic = await prisma.comic.findUnique({
        where: { id: comicId },
        select: { authorId: true },
      });

      if (comic && comic.authorId !== userId) {
        await prisma.notification.create({
          data: {
            userId: comic.authorId,
            type: "LIKE",
            referenceId: comicId,
          },
        });
      }

      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("Like error:", error);
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
  }
}

// Get like status
export async function GET(
  req: NextRequest,
  { params }: { params: { comicId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ liked: false });
    }

    const userId = (session.user as any).id;
    const { comicId } = params;

    const like = await prisma.like.findUnique({
      where: {
        userId_comicId: {
          userId,
          comicId,
        },
      },
    });

    return NextResponse.json({ liked: !!like });
  } catch (error) {
    console.error("Like check error:", error);
    return NextResponse.json({ liked: false });
  }
}
