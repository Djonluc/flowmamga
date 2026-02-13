import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Get comments for a comic
export async function GET(
  req: NextRequest,
  { params }: { params: { comicId: string } }
) {
  try {
    const { comicId } = params;

    const comments = await prisma.comment.findMany({
      where: {
        comicId,
        parentId: null, // Only top-level comments
        isDeleted: false,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        replies: {
          where: { isDeleted: false },
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
            replies: {
              where: { isDeleted: false },
              include: {
                user: {
                  select: { id: true, name: true, image: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Comments fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

// Post a comment
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
    const { text, parentId } = await req.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Comment text is required" }, { status: 400 });
    }

    // Check nesting depth if replying
    if (parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: parentId },
        include: {
          parent: {
            include: {
              parent: true,
            },
          },
        },
      });

      // Max 3 levels deep
      if (parent?.parent?.parent) {
        return NextResponse.json(
          { error: "Maximum comment nesting depth reached" },
          { status: 400 }
        );
      }
    }

    const comment = await prisma.comment.create({
      data: {
        text,
        userId,
        comicId,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    // Create notification for comic author or parent comment author
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { userId: true },
      });

      if (parentComment && parentComment.userId !== userId) {
        await prisma.notification.create({
          data: {
            userId: parentComment.userId,
            type: "REPLY",
            referenceId: comment.id,
          },
        });
      }
    } else {
      const comic = await prisma.comic.findUnique({
        where: { id: comicId },
        select: { authorId: true },
      });

      if (comic && comic.authorId !== userId) {
        await prisma.notification.create({
          data: {
            userId: comic.authorId,
            type: "COMMENT",
            referenceId: comment.id,
          },
        });
      }
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Comment creation error:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
