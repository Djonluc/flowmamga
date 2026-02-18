
export async function extractDominantColor(imageUrl: string): Promise<string | null> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageUrl;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(null);
                return;
            }

            // Resize for performance (50x50 is enough for dominant color)
            canvas.width = 50;
            canvas.height = 50;
            ctx.drawImage(img, 0, 0, 50, 50);

            const imageData = ctx.getImageData(0, 0, 50, 50).data;
            const colorCounts: Record<string, number> = {};
            let maxCount = 0;
            let dominantColor = null;

            for (let i = 0; i < imageData.length; i += 4) {
                const r = imageData[i];
                const g = imageData[i + 1];
                const b = imageData[i + 2];
                const a = imageData[i + 3];

                if (a < 128) continue; // Skip transparent

                // Skip dark/light/gray pixels to find "vibrant" colors
                const brightness = (r + g + b) / 3;
                if (brightness < 40 || brightness > 230) continue; // Too dark or too white
                
                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                if ((max - min) < 20) continue; // Too unstable/gray

                // Quantize to reduce noise (round to nearest 10)
                const qr = Math.round(r / 10) * 10;
                const qg = Math.round(g / 10) * 10;
                const qb = Math.round(b / 10) * 10;

                const key = `${qr},${qg},${qb}`;
                colorCounts[key] = (colorCounts[key] || 0) + 1;

                if (colorCounts[key] > maxCount) {
                    maxCount = colorCounts[key];
                    dominantColor = `rgb(${qr}, ${qg}, ${qb})`;
                }
            }

            resolve(dominantColor);
        };

        img.onerror = () => resolve(null);
    });
}
