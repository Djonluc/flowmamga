import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Get all tags
export async function GET(req: NextRequest) {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { comics: true }
        }
      }
    });

    return NextResponse.json({ tags });
  } catch (error) {
    console.error("Tags fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}

// Create a new tag
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Tag name is required" }, { status: 400 });
    }

    // Check if tag already exists
    const existing = await prisma.tag.findUnique({
      where: { name: name.toLowerCase() }
    });

    if (existing) {
      return NextResponse.json({ tag: existing });
    }

    const tag = await prisma.tag.create({
      data: {
        name: name.toLowerCase(),
      },
    });

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    console.error("Tag creation error:", error);
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  }
}
