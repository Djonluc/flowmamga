<div align="center">

![DjonStNix Watermark](https://img.shields.io/badge/Created%20by-DjonStNix-5B8CFF?style=for-the-badge&logo=github&logoColor=white)

# FlowManga 🎨📚

**A Cinematic Manga Reading Experience**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Electron](https://img.shields.io/badge/Electron-40.4-47848F?style=flat-square&logo=electron)](https://www.electronjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

*Transform your local manga collection into an immersive, cinematic reading experience with FlowManga.*

[Features](#-features) • [Installation](#-installation) • [Tech Stack](#-tech-stack) • [Roadmap](#-roadmap)

</div>

---

## ✨ Features

### 🎯 Core Reading Experience
- **Multiple Reading Modes**: Vertical scroll, horizontal page flip, single-page, and slideshow
- **Auto-Scroll**: Hands-free reading with adjustable speed
- **Smart Image Loading**: Optimized performance with lazy loading and caching
- **Zoom Controls**: Pinch-to-zoom and fit-to-width/height modes
- **Progress Tracking**: Automatic bookmark and reading history

### 📚 Library Management
- **Local & Web Sources**: Import from folders or web sources (MangaDex, Webtoons, nHentai, etc.)
- **3D Shelf View**: Beautiful, interactive library with realistic book spines
- **Series Organization**: Automatic grouping by series with metadata parsing
- **Smart Covers**: Intelligent cover detection and fallback system
- **Drag & Drop**: Quick import by dragging folders into the app

### 🎨 Immersive UI/UX
- **Adaptive Colors**: UI adapts to the colors of the current page
- **Ambient Sounds**: Optional background audio (Rain, Lo-Fi, Nature)
- **Fullscreen Mode**: Distraction-free reading
- **Custom Themes**: Dark mode with customizable accents
- **Keyboard Shortcuts**: Complete keyboard navigation support

### 📊 Analytics & Gamification
- **Reading Stats**: Track pages read, time spent, and reading streaks
- **Achievements**: Unlock milestones for reading goals
- **Session History**: View detailed reading sessions
- **Trending Insights**: See your most-read series

---

## 🚀 Tech Stack

### Frontend
- **React 19** - Modern UI library with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations and transitions
- **Zustand** - Lightweight state management

### Desktop
- **Electron 40** - Cross-platform desktop application
- **Custom Protocol** - Secure local file access via `media://`
- **File Watcher** - Real-time library updates with Chokidar

### Web Integration
- **Web Scrapers** - Support for popular manga sites
- **Metadata Parsing** - Automatic series/chapter detection
- **Image Optimization** - WebP conversion and caching

---

## 📦 Installation

### Prerequisites
- **Node.js 18+** and npm
- **Windows/macOS/Linux** (Electron supports all platforms)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Djonluc/flowmamga.git
   cd flowmamga
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

The app will launch automatically in development mode. In production, the built executable will be in the `dist` folder.

---

## 📁 Project Structure

```
flowmamga/
├── electron/                  # Electron main process
│   ├── main.ts               # App initialization
│   ├── preload.ts            # IPC bridge
│   └── modules/
│       └── FileLoader.ts     # Library scanning logic
├── src/
│   ├── components/           # React components
│   │   ├── readers/          # Reading mode implementations
│   │   ├── library/          # Library views (ShelfView, etc.)
│   │   └── branding/         # DjonStNix signature components
│   ├── stores/               # Zustand state stores
│   │   ├── useLibraryStore.ts
│   │   ├── useReadingStore.ts
│   │   ├── useSettingsStore.ts
│   │   └── useAnalyticsStore.ts
│   ├── utils/                # Utilities
│   │   └── webScrapers.ts    # Web manga fetchers
│   └── hooks/                # Custom React hooks
└── public/                   # Static assets
```

---

## 🎯 Roadmap

### ✅ Phase 1: Foundation (Complete)
- [x] Electron app setup with custom protocol
- [x] Multiple reading modes
- [x] Local library scanning
- [x] 3D shelf visualization

### ✅ Phase 2: Enhanced UX (Complete)
- [x] Adaptive color theming
- [x] Ambient sound player
- [x] Analytics dashboard
- [x] Web manga integration

### 🚧 Phase 3: Smart Library Intelligence (In Progress)
- [ ] AI-powered metadata extraction
- [ ] Fuzzy search engine
- [ ] Auto volume grouping
- [ ] Reading recommendations

### 📅 Phase 4: Gamification Layer
- [ ] Achievement system
- [ ] Streak leaderboards
- [ ] Unlockable UI themes
- [ ] Social reading features

### 🔮 Phase 5: Ecosystem Expansion
- [ ] Cloud sync
- [ ] Multi-device progress
- [ ] Plugin system
- [ ] Mobile companion app

---

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
# App Configuration
VITE_APP_NAME=FlowManga
VITE_APP_VERSION=2.0.0

# Optional: Web Scraper Settings
VITE_ENABLE_WEB_SOURCES=true
```

### Keyboard Shortcuts
| Action | Shortcut |
|--------|----------|
| Next Page | `→` or `Space` |
| Previous Page | `←` or `Shift+Space` |
| Toggle Fullscreen | `F11` |
| Open Library | `Ctrl+L` |
| Toggle Auto-Scroll | `Ctrl+A` |
| Zoom In | `Ctrl++` |
| Zoom Out | `Ctrl+-` |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with modern web technologies and best practices
- Inspired by the manga reading community
- Special thanks to all contributors and testers

---

<div align="center">

### 👨‍💻 Created by **Djon StNix**

[![GitHub](https://img.shields.io/badge/GitHub-Djonluc-5B8CFF?style=flat-square&logo=github)](https://github.com/Djonluc)
[![YouTube](https://img.shields.io/badge/YouTube-@Djonluc-FF0000?style=flat-square&logo=youtube)](https://www.youtube.com/@Djonluc)
[![Email](https://img.shields.io/badge/Email-djonstnix@gmail.com-5B8CFF?style=flat-square&logo=gmail)](mailto:djonstnix@gmail.com)

**Software Developer & Digital Creator**

*FlowManga is crafted with passion for the manga community.*

---

**Status**: Production Ready 🚀 | **Version**: 2.0.0

</div>
