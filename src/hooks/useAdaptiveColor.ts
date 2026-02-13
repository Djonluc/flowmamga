
import { useEffect } from 'react';
import { useReadingStore } from '../stores/useReadingStore';
import { useSettingsStore } from '../stores/useSettingsStore';

export const useAdaptiveColor = () => {
    const { images, currentIndex } = useReadingStore();
    const { setAccentColor, theme } = useSettingsStore();

    useEffect(() => {
        if (images.length === 0 || theme === 'oled') {
            if (theme === 'oled') setAccentColor('#000000');
            return;
        }

        const currentImage = images[currentIndex];
        const imgUrl = currentImage.startsWith('http') ? currentImage : `media:///${currentImage}`;

        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imgUrl;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Downscale for performance
            canvas.width = 50;
            canvas.height = 50;
            ctx.drawImage(img, 0, 0, 50, 50);

            const imageData = ctx.getImageData(0, 0, 50, 50).data;
            let r = 0, g = 0, b = 0;
            let count = 0;

            for (let i = 0; i < imageData.length; i += 4) {
                // Ignore too dark or too light pixels for better vibrancy
                const brightness = (imageData[i] + imageData[i+1] + imageData[i+2]) / 3;
                if (brightness > 30 && brightness < 220) {
                    r += imageData[i];
                    g += imageData[i+1];
                    b += imageData[i+2];
                    count++;
                }
            }

            if (count > 0) {
                r = Math.floor(r / count);
                g = Math.floor(g / count);
                b = Math.floor(b / count);
                setAccentColor(`rgb(${r}, ${g}, ${b})`);
            }
        };
    }, [images, currentIndex, setAccentColor, theme]);
};
