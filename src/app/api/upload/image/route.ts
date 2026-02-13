import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { optimizeCoverImage } from "@/lib/image-optimization";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const comicId = formData.get("comicId") as string;

    if (!file || !comicId) {
      return NextResponse.json(
        { error: "File and comicId are required" },
        { status: 400 }
      );
    }

    // Save temporary file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempPath = path.join(process.cwd(), "temp", `upload-${Date.now()}-${file.name}`);
    await writeFile(tempPath, buffer);

    // Optimize and save
    const optimizedUrl = await optimizeCoverImage(tempPath, comicId);

    // Clean up temp file
    const fs = await import("fs/promises");
    await fs.unlink(tempPath);

    return NextResponse.json({
      url: optimizedUrl,
      message: "Image uploaded and optimized successfully",
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
