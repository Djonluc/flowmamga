import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Update chapter
export async function PATCH(
  req: NextRequest,
  { params }: { params: { comicId: string; chapterId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { comicId, chapterId } = params;
    const { title, chapterNumber, isDraft } = await req.json();

    // Verify ownership
    const comic = await prisma.comic.findUnique({
      where: { id: comicId },
      select: { authorId: true }
    });

    if (!comic || comic.authorId !== (session.user as any).id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const chapter = await prisma.chapter.update({
      where: { id: chapterId },
      data: {
        ...(title && { title }),
        ...(chapterNumber !== undefined && { chapterNumber }),
        ...(isDraft !== undefined && { isDraft }),
      },
    });

    return NextResponse.json({ chapter });
  } catch (error) {
    console.error("Chapter update error:", error);
    return NextResponse.json({ error: "Failed to update chapter" }, { status: 500 });
  }
}

// Delete chapter
export async function DELETE(
  req: NextRequest,
  { params }: { params: { comicId: string; chapterId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { comicId, chapterId } = params;
    const userRole = (session.user as any).role;

    // Verify ownership or admin
    const comic = await prisma.comic.findUnique({
      where: { id: comicId },
      select: { authorId: true }
    });

    const isOwner = comic && comic.authorId === (session.user as any).id;
    const isAdmin = userRole === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (isAdmin && !isOwner) {
      // Hard delete for admin
      await prisma.chapter.delete({
        where: { id: chapterId },
      });

      // Log admin action
      await prisma.auditLog.create({
        data: {
          adminId: (session.user as any).id,
          action: "DELETED_CHAPTER",
          targetType: "Chapter",
          targetId: chapterId,
        },
      });
    } else {
      // Soft delete for owner
      await prisma.chapter.update({
        where: { id: chapterId },
        data: { isDraft: true }, // Mark as draft instead of deleting
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Chapter deletion error:", error);
    return NextResponse.json({ error: "Failed to delete chapter" }, { status: 500 });
  }
}
