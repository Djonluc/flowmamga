import { useSettingsStore } from '../stores/useSettingsStore';
import { useReadingStore } from '../stores/useReadingStore';
import { Home, Library, FolderOpen, Activity, Settings, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export const Sidebar = () => {
    const { 
        sidebarOpen, theme, isHudVisible, activeView, setActiveView,
        isSettingsOpen, toggleSettings 
    } = useSettingsStore();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // If sidebar is globally closed via setting, don't show. 
    // If HUD is hidden (immersive mode), hide temporarily.
    const isVisible = sidebarOpen && isHudVisible;

    const navItems = [
        { icon: <Home size={24} />, label: 'Home', view: 'home' as const },
        { icon: <Library size={24} />, label: 'Full Library', view: 'library' as const },
        { icon: <Activity size={24} />, label: 'Stats', view: 'analytics' as const },
    ];

    const handleQuickOpen = async () => {
        if (window.electron) {
            try {
                const path = await window.electron.openFolder();
                if (path) {
                    const images = await window.electron.readFolder(path);
                    if (images && images.length > 0) {
                        console.log('[Sidebar] Quick opening folder:', path);
                        useReadingStore.getState().openFolder(path, images);
                        setMobileMenuOpen(false);
                    } else {
                        alert("No images found in this folder.");
                    }
                }
            } catch (err) {
                console.error("Quick open failed", err);
            }
        }
    };

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden fixed top-4 left-4 z-50 p-3 bg-black/80 backdrop-blur-md rounded-full border border-white/10 hover:bg-black/90 transition-colors"
            >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileMenuOpen(false)}
                            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            initial={{ x: -300 }}
                            animate={{ x: 0 }}
                            exit={{ x: -300 }}
                            transition={{ type: 'spring', damping: 25 }}
                            className="md:hidden fixed left-0 top-0 bottom-0 w-64 bg-neutral-900 border-r border-white/10 z-50 flex flex-col pt-20 px-4 gap-4"
                        >
                            {navItems.map((item) => (
                                <button
                                    key={item.view}
                                    onClick={() => {
                                        setActiveView(item.view);
                                        setMobileMenuOpen(false);
                                    }}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                        activeView === item.view
                                            ? 'bg-white/10 text-white'
                                            : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                                    }`}
                                >
                                    {item.icon}
                                    <span className="font-medium">{item.label}</span>
                                </button>
                            ))}
                            
                            <button
                                onClick={handleQuickOpen}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white transition-colors"
                            >
                                <FolderOpen size={24} />
                                <span className="font-medium">Quick Open Folder</span>
                            </button>

                            <div className="mt-auto pb-8">
                                <button
                                    onClick={() => {
                                        toggleSettings();
                                        setMobileMenuOpen(false);
                                    }}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full ${
                                        isSettingsOpen
                                            ? 'bg-white/10 text-white'
                                            : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                                    }`}
                                >
                                    <Settings size={24} />
                                    <span className="font-medium">Settings</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <motion.div 
                initial={{ x: -80, opacity: 0 }}
                animate={{ x: isVisible ? 0 : -80, opacity: isVisible ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className={`
                    hidden md:flex flex-col w-20 h-full border-r border-white/10 pt-20 items-center gap-8 z-40
                    ${theme === 'oled' ? 'bg-black' : 'bg-black/20 backdrop-blur-md'}
                `}
            >
                <NavIcon 
                    icon={<Home size={24} />} 
                    active={activeView === 'home'} 
                    onClick={() => setActiveView('home')}
                    label="Home"
                />
                <NavIcon 
                    icon={<Library size={24} />} 
                    active={activeView === 'library'} 
                    onClick={() => setActiveView('library')}
                    label="Full Library"
                />
                <NavIcon 
                    icon={<FolderOpen size={24} />} 
                    onClick={handleQuickOpen}
                    label="Quick Open Folder"
                />
                <NavIcon 
                    icon={<Activity size={24} />} 
                    active={activeView === 'analytics'} 
                    onClick={() => setActiveView('analytics')}
                    label="Stats"
                />
                
                <div className="mt-auto pb-8">
                    <NavIcon 
                        icon={<Settings size={24} />} 
                        active={isSettingsOpen}
                        onClick={toggleSettings}
                        label="Settings"
                    />
                </div>
            </motion.div>
        </>
    );
};

const NavIcon = ({ icon, active, onClick, label }: { icon: React.ReactNode, active?: boolean, onClick?: () => void, label?: string }) => (
    <button 
        onClick={onClick}
        title={label}
        className={`
            relative p-4 rounded-xl transition-all duration-200 group
            ${active ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-white hover:bg-white/5'}
        `}
    >
        {icon}
        {active && (
            <motion.div 
                layoutId="activeIndicator"
                className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"
            />
        )}
        <span className="absolute left-full ml-4 px-3 py-2 bg-black/90 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {label}
        </span>
    </button>
);
