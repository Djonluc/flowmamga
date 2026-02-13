import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import fs from "fs/promises";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { comicId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { comicId } = params;
    const { deleteType } = await req.json(); // "soft" or "hard"

    const comic = await prisma.comic.findUnique({
      where: { id: comicId },
      include: {
        chapters: {
          include: {
            pages: true
          }
        }
      }
    });

    if (!comic) {
      return NextResponse.json({ error: "Comic not found" }, { status: 404 });
    }

    const isOwner = comic.authorId === (session.user as any).id;
    const isAdmin = (session.user as any).role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (deleteType === "soft") {
      // Soft delete - just mark as deleted
      await prisma.comic.update({
        where: { id: comicId },
        data: { isDraft: true }, // Use draft status as soft delete
      });

      return NextResponse.json({
        success: true,
        message: "Comic removed from library",
      });
    } else if (deleteType === "hard") {
      // Hard delete - remove from DB and optionally delete files
      
      // Delete cover image if it exists
      if (comic.coverImage && comic.coverImage.startsWith('/')) {
        try {
          const coverPath = `public${comic.coverImage}`;
          await fs.unlink(coverPath);
        } catch (err) {
          console.error("Failed to delete cover:", err);
        }
      }

      // Delete all page images
      for (const chapter of comic.chapters) {
        for (const page of chapter.pages) {
          if (page.imageUrl && page.imageUrl.startsWith('/')) {
            try {
              const pagePath = `public${page.imageUrl}`;
              await fs.unlink(pagePath);
            } catch (err) {
              console.error("Failed to delete page:", err);
            }
          }
        }
      }

      // Delete from database (cascades to chapters, pages, etc.)
      await prisma.comic.delete({
        where: { id: comicId },
      });

      // Log admin action if admin deleted
      if (isAdmin && !isOwner) {
        await prisma.auditLog.create({
          data: {
            adminId: (session.user as any).id,
            action: "HARD_DELETED_COMIC",
            targetType: "Comic",
            targetId: comicId,
            details: `Deleted comic: ${comic.title}`,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Comic permanently deleted",
      });
    } else {
      return NextResponse.json(
        { error: "Invalid delete type" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Comic deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete comic" },
      { status: 500 }
    );
  }
}
