import { useSettingsStore } from '../stores/useSettingsStore';
import { motion } from 'framer-motion';

export const AmbientBackground = () => {
    const { theme, accentColor } = useSettingsStore();

    // Define ambient gradients for each theme
    const gradients: Record<string, string> = {
        dark: `radial-gradient(circle at 50% 50%, ${accentColor}33, transparent 70%)`,
        light: `radial-gradient(circle at 50% 50%, ${accentColor}22, transparent 70%)`,
        oled: 'none', // Deep black, no ambient light
        paper: 'radial-gradient(circle at 50% 50%, rgba(139, 69, 19, 0.1), transparent 70%)',
        cyberpunk: 'radial-gradient(circle at 50% 50%, rgba(0, 255, 255, 0.1), transparent 60%), radial-gradient(circle at 80% 20%, rgba(255, 0, 255, 0.1), transparent 50%)',
    };

    return (
        <motion.div 
            className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
        >
            <motion.div 
                className="w-full h-full absolute inset-0"
                animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 1, -1, 0],
                }}
                transition={{ 
                    duration: 20, 
                    ease: "easeInOut", 
                    repeat: Infinity,
                    repeatType: "reverse" 
                }}
                style={{ 
                    background: gradients[theme] || gradients.dark,
                    transition: 'background 1s ease-in-out' // Smooth theme switch
                }}
            />
            {/* Overlay texture for paper theme */}
            {theme === 'paper' && (
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] mix-blend-multiply pointer-events-none" />
            )}
             {/* Subtle noise grain for texture (optional) */}
             <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
        </motion.div>
    );
};
