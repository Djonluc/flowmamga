import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateUniqueSlug } from "@/lib/slugify";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const isDraft = formData.get("isDraft") === "true";
    const publishAtStr = formData.get("publishAt") as string | null;
    
    // TODO: Handle actual file upload to S3/Supabase
    // const coverFile = formData.get("cover") as File;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(title, async (slug) => {
      const existing = await prisma.comic.findUnique({ where: { slug } });
      return !!existing;
    });

    // Create comic
    const comic = await prisma.comic.create({
      data: {
        title,
        slug,
        description: description || null,
        authorId: (session.user as any).id,
        isDraft,
        publishAt: publishAtStr ? new Date(publishAtStr) : null,
        // coverImage: uploadedCoverUrl, // TODO: Add after implementing S3
      },
    });

    return NextResponse.json({ comic }, { status: 201 });
  } catch (error) {
    console.error("Comic creation error:", error);
    return NextResponse.json(
      { error: "Failed to create comic" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const comics = await prisma.comic.findMany({
      where: {
        isDraft: false,
        OR: [
          { publishAt: null },
          { publishAt: { lte: new Date() } }
        ]
      },
      include: {
        author: {
          select: { id: true, name: true, image: true }
        },
        _count: {
          select: { likes: true, views: true, chapters: true }
        }
      },
      orderBy: { lastUpdatedAt: 'desc' },
      skip,
      take: limit,
    });

    return NextResponse.json({ comics });
  } catch (error) {
    console.error("Comics fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch comics" },
      { status: 500 }
    );
  }
}
