import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Bookmark a comic
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

    // Check if already bookmarked
    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_comicId: {
          userId,
          comicId,
        },
      },
    });

    if (existing) {
      // Remove bookmark
      await prisma.bookmark.delete({
        where: {
          userId_comicId: {
            userId,
            comicId,
          },
        },
      });

      return NextResponse.json({ bookmarked: false });
    } else {
      // Add bookmark
      await prisma.bookmark.create({
        data: {
          userId,
          comicId,
        },
      });

      return NextResponse.json({ bookmarked: true });
    }
  } catch (error) {
    console.error("Bookmark error:", error);
    return NextResponse.json({ error: "Failed to toggle bookmark" }, { status: 500 });
  }
}

// Get bookmark status
export async function GET(
  req: NextRequest,
  { params }: { params: { comicId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ bookmarked: false });
    }

    const userId = (session.user as any).id;
    const { comicId } = params;

    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_comicId: {
          userId,
          comicId,
        },
      },
    });

    return NextResponse.json({ bookmarked: !!bookmark });
  } catch (error) {
    console.error("Bookmark check error:", error);
    return NextResponse.json({ bookmarked: false });
  }
}
