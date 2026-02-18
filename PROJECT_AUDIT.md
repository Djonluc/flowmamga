# FlowManga Project Audit Report
**Date**: February 13, 2026  
**Status**: Development Phase - 75% Complete

---

## 🔴 Critical Issues

### 1. **Broken Hook - useLibraryEvents.ts**
**Location**: `src/hooks/useLibraryEvents.ts`  
**Issue**: References non-existent properties
```typescript
const { libraryPath, setBooks } = useLibraryStore();
```
**Problem**: `useLibraryStore` doesn't have `libraryPath` or `setBooks` properties.  
**Impact**: Hook will fail at runtime, breaking library file watching.  
**Fix Required**: Update to use `libraryPaths` (array) and `setSeries` instead.

---

## 🟡 Missing Features (High Priority)

### 2. **Progress Tracking System**
**Status**: ❌ Not Implemented  
**Required Components**:
- [ ] Progress state in `useLibraryStore` (currentPage, totalPages, lastRead)
- [ ] `updateProgress()` action
- [ ] Progress bar overlay in `ShelfView`
- [ ] Auto-save progress in readers
- [ ] "Continue Reading" indicators

### 3. **Search & Filter Functionality**
**Status**: ❌ Not Implemented  
**Required Components**:
- [ ] Search input component
- [ ] Filter dropdown (Source: Local/Web, Status: Reading/Completed)
- [ ] Search logic in `LibraryGrid`
- [ ] Fuzzy search algorithm
- [ ] Filter state management

### 4. **Offline Caching for Web Manga**
**Status**: ❌ Not Implemented  
**Required Components**:
- [ ] Cache manager in Electron backend
- [ ] IPC handlers: `cacheImage()`, `checkCache()`
- [ ] Cache directory structure
- [ ] Cache expiration logic
- [ ] Download progress UI
- [ ] "Download for Offline" button

### 5. **Web Scrapers - Incomplete Implementation**
**Status**: ⚠️ Partially Implemented  
**Issues**:
- MangaKawaii: Returns empty chapters array
- Webtoons: Returns placeholder data
- MangaMirai: Returns empty chapters array
- Hitomi: Incomplete implementation
- Only nHentai has working implementation

**Fix Required**: Implement actual HTML parsing and API calls for each source.

### 6. **Video Playback System (New Core Feature)**
**Status**: 🚧 In Progress  
**Description**: Full media ecosystem transformation. Supports local video folders, database tracking, and advanced playback.  
**Required Components**:
- [ ] **Database**: `Video` and `VideoFolder` models in Prisma
- [ ] **Backend**: ffmpeg integration for thumbnails & metadata
- [ ] **State**: `useVideoStore` with queue, shuffle (Fisher-Yates), and resume logic
- [ ] **UI/Player**: 
    - Custom controls (Speed 0.5x-2x, Skip, Seek)
    - Gapless playback (Auto-next)
    - Shuffle/Repeat modes (Folder/One/Off)
- [ ] **Library**: Folder sorting, drag & drop import, "New" badges

---

## 🟠 Medium Priority Issues

### 6. **TypeScript Errors**
**Location**: `src/components/LibraryGrid.tsx:65`  
**Issue**: `@ts-ignore` comment used
```typescript
// @ts-ignore
const droppedPath = file.path;
```
**Fix**: Properly type the File object or create type assertion.

### 7. **Lint Errors**
**Status**: 1 error found  
**Location**: `src/utils/webScrapers.ts:227`  
**Issue**: `'outputPath' is defined but never used`  
**Fix**: Remove unused variable or implement the download functionality.

### 8. **Mixed Architecture**
**Issue**: Project contains both:
- Electron desktop app files (`electron/`, `src/components/`)
- Next.js web app files (`src/app/`, `prisma/`, auth configs)

**Problem**: Unclear if this is meant to be:
1. Desktop-only app (Electron)
2. Web-only app (Next.js)
3. Hybrid app (both)

**Impact**: Confusion, unused dependencies, larger bundle size.

---

## 🟢 Incomplete Features (Low Priority)

### 9. **File Upload System**
**Locations with TODOs**:
- `src/app/dashboard/upload/page.tsx:34` - "Implement actual upload logic with S3/Supabase"
- `src/app/api/comics/route.ts:21` - "Handle actual file upload to S3/Supabase"
- `src/app/api/comics/route.ts:43` - "Add after implementing S3"

**Status**: Placeholder UI exists, no backend implementation.

### 10. **Admin Features**
**Locations with TODOs**:
- `src/app/api/admin/comics/[comicId]/route.ts:21` - "Implement featured content tracking"
- `src/app/api/admin/comics/[comicId]/route.ts:77` - "Delete associated S3 images before deleting DB record"

**Status**: Admin routes exist but incomplete.

### 11. **Library Rescan Feature**
**Location**: `src/app/api/library/rescan/route.ts:61`  
**Issue**: "TODO: Extract metadata and create comic entry"  
**Status**: Skeleton code only.

---

## 📊 Dependency Analysis

### Unused Dependencies (Likely)
These are installed but may not be used in the Electron app:
- `@auth/prisma-adapter` - For Next.js auth
- `@next-auth/prisma-adapter` - For Next.js auth
- `@prisma/client` - Database (not used in Electron app)
- `@react-email/components` - Email templates
- `@upstash/ratelimit` - Rate limiting
- `bcryptjs` - Password hashing
- `next` - Next.js framework
- `next-auth` - Authentication
- `resend` - Email service
- `sharp` - Image optimization (may be used)

### Missing Dependencies
- No HTML parser for web scrapers (e.g., `cheerio`, `jsdom`)
- No HTTP client library (using native `fetch`)

---

## 🏗️ Architecture Issues

### 12. **Dual Project Structure**
The project appears to be two apps merged:

**Electron Desktop App**:
- `electron/` - Main process
- `src/components/` - UI components
- `src/stores/` - Zustand state
- Uses `media://` protocol for local files

**Next.js Web App**:
- `src/app/` - Next.js app router
- `prisma/` - Database schema
- `src/lib/` - Server utilities
- Uses PostgreSQL + Prisma

**Recommendation**: Decide on primary architecture and remove unused code.

---

## ✅ Working Features

### Core Functionality
- ✅ Electron app initialization
- ✅ Custom `media://` protocol for local files
- ✅ File system scanning (FileLoader.ts)
- ✅ Multiple reading modes (Vertical, Horizontal, Single, Slideshow)
- ✅ Library grid with 3D shelf view
- ✅ Series organization and metadata parsing
- ✅ Drag & drop folder import
- ✅ Fullscreen mode
- ✅ Keyboard shortcuts
- ✅ Analytics dashboard
- ✅ Ambient sound player
- ✅ Adaptive color theming
- ✅ DjonStNix branding integration

### State Management
- ✅ `useLibraryStore` - Library paths, series, web links
- ✅ `useReadingStore` - Current reading state
- ✅ `useSettingsStore` - App settings
- ✅ `useAnalyticsStore` - Reading analytics
- ✅ `useMetadataStore` - Web manga metadata

---

## 🎯 Recommended Action Plan

### Phase 1: Critical Fixes (Immediate)
1. **Fix `useLibraryEvents` hook** - Update to use correct store properties
2. **Remove `@ts-ignore`** - Properly type the File object
3. **Fix lint errors** - Clean up unused variables
4. **Decide on architecture** - Desktop-only or hybrid?

### Phase 2: High Priority Features (1-2 weeks)
1. **Implement Progress Tracking**
   - Add progress state to store
   - Create progress bar component
   - Auto-save on page turn
2. **Implement Search & Filter**
   - Create search bar component
   - Add filtering logic
   - Implement fuzzy search
3. **Complete Web Scrapers**
   - Add HTML parser dependency
   - Implement MangaDex scraper
   - Implement Webtoons scraper
   - Test all sources

### Phase 3: Medium Priority (2-4 weeks)
1. **Offline Caching System**
   - Create cache manager
   - Add IPC handlers
   - Build download UI
2. **Clean Up Architecture**
   - Remove unused Next.js code OR
   - Fully integrate Next.js backend
3. **Remove Unused Dependencies**
   - Audit package.json
   - Remove unused packages

### Phase 4: Polish (4+ weeks)
1. Complete admin features
2. Implement file upload system
3. Add error boundaries
4. Performance optimization
5. Testing suite

---

## 📈 Completion Metrics

| Category | Status | Percentage |
|----------|--------|------------|
| Core Reading | ✅ Complete | 95% |
| Library Management | ⚠️ Partial | 80% |
| Web Integration | ⚠️ Partial | 40% |
| Progress Tracking | ❌ Missing | 0% |
| Search & Filter | ❌ Missing | 0% |
| Offline Caching | ❌ Missing | 0% |
| Branding | ✅ Complete | 100% |
| Documentation | ✅ Complete | 100% |

**Overall Completion**: ~75%

---

## 🚨 Breaking Issues

### Runtime Errors (Likely)
1. `useLibraryEvents` will crash when called
2. Web manga scrapers will fail (except nHentai)
3. File upload will fail (no backend)

### Build Warnings
1. Lint errors in webScrapers.ts
2. TypeScript ignore in LibraryGrid.tsx
3. Module type warnings in package.json

---

## 💡 Recommendations

### Immediate Actions
1. **Fix the broken hook** - This will cause crashes
2. **Choose architecture** - Desktop or Web or Both?
3. **Complete web scrapers** - Current implementation is misleading

### Strategic Decisions Needed
1. **Is this a desktop app or web app?**
   - If desktop: Remove Next.js, Prisma, auth code
   - If web: Remove Electron code
   - If hybrid: Clarify separation of concerns

2. **Web scraping approach**
   - Legal considerations for scraping
   - Rate limiting to avoid bans
   - Consider using official APIs where available

3. **Storage strategy**
   - Local files only?
   - Cloud storage (S3)?
   - Hybrid approach?

---

**Report Generated**: February 13, 2026  
**Next Review**: After Phase 1 fixes completed
