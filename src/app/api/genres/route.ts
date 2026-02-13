import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Get all genres
export async function GET(req: NextRequest) {
  try {
    const genres = await prisma.genre.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { comics: true }
        }
      }
    });

    return NextResponse.json({ genres });
  } catch (error) {
    console.error("Genres fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch genres" }, { status: 500 });
  }
}

// Create a new genre (admin only)
export async function POST(req: NextRequest) {
  try {
    const { name, description } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Genre name is required" }, { status: 400 });
    }

    const genre = await prisma.genre.create({
      data: {
        name,
        description: description || null,
      },
    });

    return NextResponse.json({ genre }, { status: 201 });
  } catch (error) {
    console.error("Genre creation error:", error);
    return NextResponse.json({ error: "Failed to create genre" }, { status: 500 });
  }
}
