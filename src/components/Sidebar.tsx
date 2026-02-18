import { useSettingsStore } from '../stores/useSettingsStore';
import { useReadingStore } from '../stores/useReadingStore';
import { Home, Library, FolderOpen, Activity, Settings, Zap, Film, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import clsx from 'clsx';

export const Sidebar = () => {
    const { 
        sidebarOpen, toggleSidebar, activeView, setActiveView,
        isSettingsOpen, toggleSettings
    } = useSettingsStore();

    const [isHovered, setIsHovered] = useState(false);
    // Intelligent open state: Open if locked open OR hovered
    const isOpen = sidebarOpen || isHovered;

    const navItems = [
        { icon: <Home size={20} />, label: 'Home', view: 'home' as const },
        { icon: <Library size={20} />, label: 'Library', view: 'library' as const },
        { icon: <Film size={20} />, label: 'Videos', view: 'videos' as const },
        { icon: <Clock size={20} />, label: 'History', view: 'history' as const },
        { icon: <Activity size={20} />, label: 'Analytics', view: 'analytics' as const },
    ];

    const handleQuickOpen = async () => {
        try {
            const path = await open({
                directory: true,
                multiple: false
            });

            if (path && typeof path === 'string') {
                const images: string[] = await invoke('read_folder', { path });
                if (images && images.length > 0) {
                    useReadingStore.getState().openFolder(path);
                }
            }
        } catch (err) {
            console.error("Quick open failed", err);
        }
    };

    return (
        <>
            {/* Desktop Intelligent Sidebar */}
            <motion.div 
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                initial={false}
                animate={{ 
                    width: isOpen ? 240 : 70,
                }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={clsx(
                    "hidden md:flex flex-col h-full z-40 relative group",
                    "border-r border-border-subtle bg-background/95 backdrop-blur-3xl"
                )}
            >
                {/* Logo / Header */}
                <div className="h-16 flex items-center px-4 mb-2 overflow-hidden flex-shrink-0">
                   <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 flex-shrink-0 relative z-10">
                            <Zap size={20} fill="currentColor" className="text-white" />
                       </div>
                       
                       <motion.div 
                           animate={{ opacity: isOpen ? 1 : 0, x: isOpen ? 0 : -20 }}
                           className="flex flex-col whitespace-nowrap"
                       >
                           <span className="font-bold text-base tracking-tight text-white leading-none">
                                FLOW<span className="text-indigo-400">MANGA</span>
                           </span>
                           <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-medium leading-none mt-1">
                                Media Engine
                           </span>
                       </motion.div>
                   </div>
                </div>

                {/* Navigation Items */}
                <div className="flex-1 flex flex-col gap-1 px-3">
                    <div className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider px-3 py-2 opacity-0 transition-opacity duration-300" style={{ opacity: isOpen ? 1 : 0 }}>
                        Menu
                    </div>

                    {navItems.map((item) => (
                        <NavButton 
                            key={item.view}
                            icon={item.icon} 
                            label={item.label} 
                            expanded={isOpen}
                            active={activeView === item.view} 
                            onClick={() => {
                                useReadingStore.getState().reset();
                                setActiveView(item.view);
                            }}
                        />
                    ))}

                    <div className="my-2 h-[1px] bg-white/5 mx-2" />

                    <NavButton 
                        icon={<FolderOpen size={20} />} 
                        label="Quick Open" 
                        expanded={isOpen}
                        onClick={handleQuickOpen}
                    />
                </div>

                {/* Bottom Actions */}
                <div className="p-3 mt-auto">
                    <NavButton 
                        icon={<Settings size={20} />} 
                        label="Settings" 
                        expanded={isOpen}
                        active={isSettingsOpen}
                        onClick={toggleSettings}
                    />
                    
                    {/* Toggle Lock - Only visible when hovered/expanded to allow locking open */}
                    <AnimatePresence>
                        {isOpen && (
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={toggleSidebar}
                                className={clsx(
                                    "mt-2 w-full flex items-center justify-center py-2 rounded-lg text-xs font-medium transition-colors",
                                    sidebarOpen 
                                        ? "text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20" 
                                        : "text-neutral-500 hover:text-neutral-300 hover:bg-white/5"
                                )}
                            >
                                {sidebarOpen ? "Sidebar Locked" : "Auto-Collapse"}
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </>
    );
};

const NavButton = ({ icon, label, active, onClick, expanded }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void, expanded: boolean }) => (
    <button 
        onClick={onClick}
        className={clsx(
            "group relative flex items-center h-11 w-full rounded-lg transition-all duration-200 outline-none",
            active 
              ? 'bg-surface-elevated text-white' 
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
        )}
    >
        {/* Active Indicator Strip (Vertical Pill) */}
        {active && (
            <motion.div 
                layoutId="activeStrip"
                className="absolute left-0 top-2 bottom-2 w-1 bg-accent rounded-r-full shadow-[0_0_12px_var(--color-accent-glow)]"
            />
        )}

        {/* Icon Container - consistently sized to ensure alignment */}
        <div className="w-[48px] flex items-center justify-center flex-shrink-0 z-10">
            {icon}
        </div>
        
        {/* Label - fades in/out based on expansion */}
        <motion.span 
            initial={false}
            animate={{ 
                opacity: expanded ? 1 : 0, 
                x: expanded ? 0 : -10,
                display: expanded ? 'block' : 'none'
            }}
            transition={{ duration: 0.2 }}
            className="font-medium text-sm whitespace-nowrap"
        >
            {label}
        </motion.span>
    </button>
);
