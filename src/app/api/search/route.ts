import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const genre = searchParams.get("genre");
    const status = searchParams.get("status");
    const sort = searchParams.get("sort") || "trending";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isDraft: false,
      OR: [
        { publishAt: null },
        { publishAt: { lte: new Date() } }
      ]
    };

    // Add search filter
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { author: { name: { contains: query, mode: 'insensitive' } } }
      ];
    }

    // Add genre filter
    if (genre) {
      where.genres = {
        some: {
          genre: {
            name: genre
          }
        }
      };
    }

    // Add status filter
    if (status) {
      where.status = status.toUpperCase();
    }

    // Build orderBy
    let orderBy: any = {};
    switch (sort) {
      case "trending":
        orderBy = { trendingScore: "desc" };
        break;
      case "popular":
        orderBy = { views: { _count: "desc" } };
        break;
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "updated":
        orderBy = { lastUpdatedAt: "desc" };
        break;
      default:
        orderBy = { trendingScore: "desc" };
    }

    const [comics, total] = await Promise.all([
      prisma.comic.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, image: true }
          },
          _count: {
            select: { likes: true, views: true, comments: true, chapters: true }
          },
          genres: {
            include: {
              genre: true
            }
          }
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.comic.count({ where })
    ]);

    return NextResponse.json({
      comics,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search comics" },
      { status: 500 }
    );
  }
}
