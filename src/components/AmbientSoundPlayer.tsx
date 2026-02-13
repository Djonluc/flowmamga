import { useRef, useEffect } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';

// Placeholder sounds (Creative Commons or Free use where possible, or generated noise)
// For now, we use online samples. In production, these should be local assets.
const SOUNDS: Record<string, string> = {
    rain: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg',
    cafe: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
    wind: 'https://actions.google.com/sounds/v1/weather/wind_blowing.ogg',
    space: 'https://actions.google.com/sounds/v1/science_fiction/space_station_ambience.ogg',
    paper: 'https://actions.google.com/sounds/v1/foley/page_turning.ogg' // Just a placeholder, ideally continuous paper noise
};

export const AmbientSoundPlayer = () => {
    const { theme, ambientVolume } = useSettingsStore();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Map theme to sound
        let soundUrl = '';
        switch (theme) {
            case 'dark':
            case 'cyberpunk':
                soundUrl = SOUNDS.rain;
                break;
            case 'paper':
                soundUrl = SOUNDS.cafe; // Read in a cafe vibe
                break;
            case 'oled':
                soundUrl = SOUNDS.space; // Deep space silence/hum
                break;
            case 'light':
                soundUrl = SOUNDS.wind;
                break;
            default:
                soundUrl = '';
        }

        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.loop = true;
        }

        const audio = audioRef.current;

        if (soundUrl) {
            if (audio.src !== soundUrl) {
                audio.src = soundUrl;
                audio.play().catch(e => console.warn("Audio autoplay blocked", e));
            }
        } else {
            audio.pause();
            audio.src = '';
        }

        return () => {
            audio.pause();
        };
    }, [theme]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = ambientVolume;
        }
    }, [ambientVolume]);

    return null; // Invisible component
};
