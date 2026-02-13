import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Add tags to a comic
export async function POST(
  req: NextRequest,
  { params }: { params: { comicId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { comicId } = params;
    const { tagIds } = await req.json();

    // Verify ownership
    const comic = await prisma.comic.findUnique({
      where: { id: comicId },
      select: { authorId: true }
    });

    if (!comic || comic.authorId !== (session.user as any).id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Add tags
    await prisma.comic.update({
      where: { id: comicId },
      data: {
        tags: {
          create: tagIds.map((tagId: string) => ({
            tag: {
              connect: { id: tagId }
            }
          }))
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tag assignment error:", error);
    return NextResponse.json({ error: "Failed to add tags" }, { status: 500 });
  }
}

// Remove tag from comic
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
    const { tagId } = await req.json();

    // Verify ownership
    const comic = await prisma.comic.findUnique({
      where: { id: comicId },
      select: { authorId: true }
    });

    if (!comic || comic.authorId !== (session.user as any).id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.comicTag.deleteMany({
      where: {
        comicId,
        tagId,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tag removal error:", error);
    return NextResponse.json({ error: "Failed to remove tag" }, { status: 500 });
  }
}
