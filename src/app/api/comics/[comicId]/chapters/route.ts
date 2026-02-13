import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Get chapters for a comic
export async function GET(
  req: NextRequest,
  { params }: { params: { comicId: string } }
) {
  try {
    const { comicId } = params;

    const chapters = await prisma.chapter.findMany({
      where: { comicId },
      orderBy: { chapterNumber: "asc" },
      include: {
        _count: {
          select: { pages: true }
        }
      }
    });

    return NextResponse.json({ chapters });
  } catch (error) {
    console.error("Chapters fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch chapters" }, { status: 500 });
  }
}

// Create a new chapter
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
    const { title, chapterNumber, isDraft } = await req.json();

    // Verify user owns this comic
    const comic = await prisma.comic.findUnique({
      where: { id: comicId },
      select: { authorId: true }
    });

    if (!comic || comic.authorId !== (session.user as any).id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const chapter = await prisma.chapter.create({
      data: {
        title,
        chapterNumber,
        comicId,
        isDraft: isDraft || false,
      },
    });

    return NextResponse.json({ chapter }, { status: 201 });
  } catch (error) {
    console.error("Chapter creation error:", error);
    return NextResponse.json({ error: "Failed to create chapter" }, { status: 500 });
  }
}
