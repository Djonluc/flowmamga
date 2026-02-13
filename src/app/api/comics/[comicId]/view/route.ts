import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import crypto from "crypto";

// Track a view
export async function POST(
  req: NextRequest,
  { params }: { params: { comicId: string } }
) {
  try {
    const { comicId } = params;
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex");

    // Check if this IP has viewed in the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingView = await prisma.comicView.findFirst({
      where: {
        comicId,
        ipHash,
        viewedAt: {
          gte: twentyFourHoursAgo,
        },
      },
    });

    if (!existingView) {
      // Record new view
      await prisma.comicView.create({
        data: {
          comicId,
          ipHash,
        },
      });

      // Update trending score (simple formula)
      const comic = await prisma.comic.findUnique({
        where: { id: comicId },
        include: {
          _count: {
            select: { views: true, likes: true, comments: true },
          },
        },
      });

      if (comic) {
        const daysSincePublish = (Date.now() - comic.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        const recencyMultiplier = Math.max(1, 30 - daysSincePublish) / 30;
        
        const trendingScore =
          (comic._count.views * 1 +
            comic._count.likes * 5 +
            comic._count.comments * 3) *
          recencyMultiplier;

        await prisma.comic.update({
          where: { id: comicId },
          data: { trendingScore },
        });
      }

      return NextResponse.json({ viewed: true, unique: true });
    }

    return NextResponse.json({ viewed: true, unique: false });
  } catch (error) {
    console.error("View tracking error:", error);
    return NextResponse.json({ error: "Failed to track view" }, { status: 500 });
  }
}
