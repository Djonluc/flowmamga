import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

// Rescan a library folder for new/missing comics
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { folderPath } = await req.json();

    if (!folderPath) {
      return NextResponse.json({ error: "Folder path is required" }, { status: 400 });
    }

    // Get existing comics from this folder
    const existingComics = await prisma.comic.findMany({
      where: {
        authorId: (session.user as any).id,
        // Assuming we store folder path somewhere
      },
    });

    const existingPaths = new Set(existingComics.map(c => c.slug)); // Using slug as proxy for path

    // Scan directory for comic files
    const files = await fs.readdir(folderPath, { withFileTypes: true });
    const comicFiles = files.filter(f => 
      f.isFile() && /\.(cbz|cbr|zip|rar|pdf)$/i.test(f.name)
    );

    const results = {
      added: 0,
      missing: 0,
      unchanged: 0,
    };

    // Check for new files
    for (const file of comicFiles) {
      const filePath = path.join(folderPath, file.name);
      const fileHash = await hashFile(filePath);

      // Check if this file exists in DB
      const existing = await prisma.comic.findFirst({
        where: {
          // We'd need to add a fileHash field to the schema
          slug: file.name, // Temporary - should use hash
        },
      });

      if (!existing) {
        // New file - add to library
        // TODO: Extract metadata and create comic entry
        results.added++;
      } else {
        results.unchanged++;
      }
    }

    // Check for missing files
    for (const comic of existingComics) {
      const expectedPath = path.join(folderPath, comic.slug); // Simplified
      try {
        await fs.access(expectedPath);
      } catch {
        // File is missing
        await prisma.comic.update({
          where: { id: comic.id },
          data: {
            // Mark as missing - we'd need to add this field
            description: `[MISSING] ${comic.description || ''}`,
          },
        });
        results.missing++;
      }
    }

    return NextResponse.json({
      message: "Rescan complete",
      results,
    });
  } catch (error) {
    console.error("Rescan error:", error);
    return NextResponse.json({ error: "Failed to rescan folder" }, { status: 500 });
  }
}

async function hashFile(filePath: string): Promise<string> {
  const fileBuffer = await fs.readFile(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}
