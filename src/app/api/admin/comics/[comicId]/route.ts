import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Feature a comic
export async function POST(
  req: NextRequest,
  { params }: { params: { comicId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { comicId } = params;
    const { slot } = await req.json(); // e.g., "SPOTLIGHT", "BANNER", "TRENDING"

    // TODO: Implement featured content tracking
    // For now, we'll just boost the trending score significantly
    await prisma.comic.update({
      where: { id: comicId },
      data: {
        trendingScore: { increment: 10000 },
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        adminId: (session.user as any).id,
        action: `FEATURED_COMIC_${slot}`,
        targetType: "Comic",
        targetId: comicId,
      },
    });

    // Notify the comic author
    const comic = await prisma.comic.findUnique({
      where: { id: comicId },
      select: { authorId: true },
    });

    if (comic) {
      await prisma.notification.create({
        data: {
          userId: comic.authorId,
          type: "SYSTEM",
          referenceId: comicId,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Comic feature error:", error);
    return NextResponse.json({ error: "Failed to feature comic" }, { status: 500 });
  }
}

// Delete a comic (admin override)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { comicId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { comicId } = params;

    // TODO: Delete associated S3 images before deleting DB record
    await prisma.comic.delete({
      where: { id: comicId },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        adminId: (session.user as any).id,
        action: "DELETED_COMIC",
        targetType: "Comic",
        targetId: comicId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Comic deletion error:", error);
    return NextResponse.json({ error: "Failed to delete comic" }, { status: 500 });
  }
}
