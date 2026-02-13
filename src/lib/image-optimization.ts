import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

export interface ImageOptimizationOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: "webp" | "jpeg" | "png";
}

export async function optimizeImage(
  inputPath: string,
  outputPath: string,
  options: ImageOptimizationOptions = {}
): Promise<{ success: boolean; outputPath: string; originalSize: number; optimizedSize: number }> {
  const {
    quality = 80,
    maxWidth = 1920,
    maxHeight = 1920,
    format = "webp",
  } = options;

  try {
    // Get original file size
    const originalStats = await fs.stat(inputPath);
    const originalSize = originalStats.size;

    // Process image
    let pipeline = sharp(inputPath);

    // Resize if needed
    pipeline = pipeline.resize(maxWidth, maxHeight, {
      fit: "inside",
      withoutEnlargement: true,
    });

    // Convert to desired format
    switch (format) {
      case "webp":
        pipeline = pipeline.webp({ quality });
        break;
      case "jpeg":
        pipeline = pipeline.jpeg({ quality, mozjpeg: true });
        break;
      case "png":
        pipeline = pipeline.png({ quality, compressionLevel: 9 });
        break;
    }

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    // Save optimized image
    await pipeline.toFile(outputPath);

    // Get optimized file size
    const optimizedStats = await fs.stat(outputPath);
    const optimizedSize = optimizedStats.size;

    return {
      success: true,
      outputPath,
      originalSize,
      optimizedSize,
    };
  } catch (error) {
    console.error("Image optimization error:", error);
    throw new Error("Failed to optimize image");
  }
}

export async function optimizeCoverImage(
  inputPath: string,
  comicId: string
): Promise<string> {
  const outputDir = path.join(process.cwd(), "public", "covers");
  const outputFilename = `${comicId}.webp`;
  const outputPath = path.join(outputDir, outputFilename);

  await optimizeImage(inputPath, outputPath, {
    quality: 85,
    maxWidth: 800,
    maxHeight: 1200,
    format: "webp",
  });

  return `/covers/${outputFilename}`;
}

export async function optimizePageImage(
  inputPath: string,
  chapterId: string,
  pageNumber: number
): Promise<string> {
  const outputDir = path.join(process.cwd(), "public", "pages", chapterId);
  const outputFilename = `page-${pageNumber.toString().padStart(4, "0")}.webp`;
  const outputPath = path.join(outputDir, outputFilename);

  await optimizeImage(inputPath, outputPath, {
    quality: 90,
    maxWidth: 2048,
    maxHeight: 2048,
    format: "webp",
  });

  return `/pages/${chapterId}/${outputFilename}`;
}

export async function batchOptimizeImages(
  inputPaths: string[],
  outputDir: string,
  options: ImageOptimizationOptions = {}
): Promise<Array<{ input: string; output: string; success: boolean }>> {
  const results = [];

  for (const inputPath of inputPaths) {
    const filename = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(outputDir, `${filename}.${options.format || "webp"}`);

    try {
      await optimizeImage(inputPath, outputPath, options);
      results.push({ input: inputPath, output: outputPath, success: true });
    } catch (error) {
      console.error(`Failed to optimize ${inputPath}:`, error);
      results.push({ input: inputPath, output: "", success: false });
    }
  }

  return results;
}
