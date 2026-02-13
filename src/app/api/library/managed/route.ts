import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

// Copy files to managed library
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sourcePath, comicId } = await req.json();

    if (!sourcePath || !comicId) {
      return NextResponse.json(
        { error: "Source path and comic ID are required" },
        { status: 400 }
      );
    }

    // Define managed library path
    const managedLibraryPath = path.join(
      process.cwd(),
      "flowmanga_library",
      (session.user as any).id
    );

    // Create user's managed library directory
    await fs.mkdir(managedLibraryPath, { recursive: true });

    // Get file name
    const fileName = path.basename(sourcePath);
    const destinationPath = path.join(managedLibraryPath, fileName);

    // Copy file
    await fs.copyFile(sourcePath, destinationPath);

    // Update comic record with new path
    await prisma.comic.update({
      where: { id: comicId },
      data: {
        // Add a field to track if it's managed
        description: `[MANAGED] ${destinationPath}`,
      },
    });

    return NextResponse.json({
      success: true,
      newPath: destinationPath,
      message: "File copied to managed library",
    });
  } catch (error) {
    console.error("Managed library copy error:", error);
    return NextResponse.json(
      { error: "Failed to copy to managed library" },
      { status: 500 }
    );
  }
}

// Get managed library stats
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const managedLibraryPath = path.join(
      process.cwd(),
      "flowmanga_library",
      (session.user as any).id
    );

    try {
      const files = await fs.readdir(managedLibraryPath);
      let totalSize = 0;

      for (const file of files) {
        const filePath = path.join(managedLibraryPath, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }

      return NextResponse.json({
        fileCount: files.length,
        totalSize,
        path: managedLibraryPath,
      });
    } catch {
      // Directory doesn't exist yet
      return NextResponse.json({
        fileCount: 0,
        totalSize: 0,
        path: managedLibraryPath,
      });
    }
  } catch (error) {
    console.error("Managed library stats error:", error);
    return NextResponse.json(
      { error: "Failed to get library stats" },
      { status: 500 }
    );
  }
}
