# FlowManga — Features & Functional Behavior

## 1️⃣ Library Management

**Purpose:** Allow users to organize, access, and manage comics safely.

### Features & Behavior

#### Add Folder
- User can select a folder from local filesystem
- All comics inside folder are indexed
- DB stores path, folder ID, and last scanned timestamp
- **Linked library:** Files remain in place; app only indexes
- **Managed library:** Files copied into `flowmamga_library`; app owns them
- Duplicate detection runs automatically on import

#### Remove Folder
Shows modal:
```
Remove Folder?
[ Remove from Library Only ] [ Cancel ]
```
- Removes folder index from DB
- Files remain untouched if linked
- All comics from that folder disappear from UI

#### Rescan Folder
- Detect new comics → add
- Detect missing comics → mark as missing
- Detect renamed files → re-link if hash matches
- Update `lastScanned` timestamp

#### Delete Comic
- **Soft Delete (user):** Sets `isDeleted = true`. Hides comic from UI; file untouched
- **Hard Delete (admin):** Deletes comic, chapters, pages, and cover files. Cascades through DB. S3 files deleted if applicable

Confirmation modal required:
```
Delete Comic?
[ Remove from Library Only ] [ Delete File From Disk ] [ Cancel ]
```

#### Rename Comic / Folder Alias
- User can rename display title
- Does not rename original file unless managed library

#### Drag & Drop Support
- Users can drag folder/comics into app
- Auto-imports or opens for reading
- Shows conflict modal if duplicates detected

---

## 2️⃣ Reading Engine

**Purpose:** Provide immersive reading experience across formats.

### Vertical Mode (V)
- Continuous vertical scroll (like Webtoons)
- Auto-scroll (A) with adjustable speed
- Scroll pause on manual interaction
- Lazy loads images (preload next 2 pages)
- Tracks exact scroll position for resume

### Page Mode (P)
- Traditional page flipping
- Supports LTR and RTL reading
- Preload next page before animation
- Width/height auto-fit options
- Page snapping ensures no partial pages

### Slideshow Mode (S)
- Auto-advance with adjustable interval
- Pauses on key press or mouse movement
- Resumes only manually
- Transition animations (fade, slide optional)

### Common Features
- **Fullscreen mode (F):** Hides UI, borders, title bar
- **HUD toggle (H):** Show/hide control panel
- **Ambient background sound:** Lo-Fi, Rain, Nature
- **Adaptive background color:** Matches dominant page colors
- Keyboard controls fully operational

---

## 3️⃣ Comic Metadata

**Purpose:** Provide structured data for tracking and searching.

- Title, author, series, volume, chapter, description
- Genres (multi-select)
- Tags (optional, user-defined for search/discovery)
- Cover image auto-extracted if missing
- Last page read tracked per chapter
- View count: unique per IP per 24h
- Likes and bookmarks stored per user
- Status: ongoing / completed / draft
- Publish date and scheduled publish (optional)

---

## 4️⃣ Chapters & Pages

### Chapters
- Add, edit title, delete (soft delete for users, hard delete for admin)
- Supports draft status

### Pages
- Upload multiple images (JPG, PNG, WebP)
- Enforce sequential order
- Drag & drop page reordering
- Automatic lazy loading during reading

### Edge Cases
- Corrupt image → show fallback placeholder
- Missing image → alert user, skip gracefully

---

## 5️⃣ Stats & Analytics

### Per User
- Pages read
- Total time spent reading
- Reading streak
- Favorites / bookmarked comics

### Per Comic
- Views (unique per IP)
- Likes count
- Comments count
- Last updated timestamp

### Optional
- Creator dashboard with graphs: engagement over time, top chapters, total views

---

## 6️⃣ User & Creator Features

- Account registration/login (email, optional Google OAuth)
- Creator profile pages:
  - Bio, social links, avatar
  - Total comics uploaded
  - Total views, likes, bookmarks
- Notifications:
  - Someone comments, replies, likes, comic featured
  - Mark read/unread

---

## 7️⃣ Commenting System

- Nested comments (max 3 levels)
- Soft delete for users
- Admin can hard delete
- Pagination for long threads
- Like/unlike comments optional

---

## 8️⃣ Search & Discovery

### Full-text search:
- Title
- Description
- Author
- Tags

### Filters:
- Genre
- Status
- Recently updated

### Sorting:
- Newest, most popular, trending

### Trending algorithm:
- Views + likes + comments + recency multiplier

---

## 9️⃣ Notifications & Emails

- Notification table: `userId`, `type`, `referenceId`, `isRead`
- Email triggers:
  - Password reset
  - Scheduled publishing
  - Comic featured
  - Comment notifications
- Real-time (optional WebSocket) + email fallback

---

## 🔟 Admin & Moderation

- Soft/hard delete for any content
- Suspend user accounts (with expiration & reason)
- Audit logs: tracks admin actions
- Review user reports:
  - Content flagged
  - Spam
  - Copyright violation
- Feature/unfeature comics on homepage or trending slots

---

## 1️⃣1️⃣ Settings & Personalization

### Reading preferences:
- Reading mode
- Auto-scroll speed
- Theme (dark/light/OLED/custom)
- Image quality

### Dashboard settings:
- Default library view (grid/shelf)
- Notifications on/off
- Local backup/restore of user preferences

---

## 1️⃣2️⃣ Edge Case Handling

- Corrupt/missing files → fallback placeholder, error message
- Duplicate detection on import
- Permission errors → alert user
- Database corruption → auto-backup restore
- File deletion → confirm modals
- Concurrent access → safe transactions

---

## 1️⃣3️⃣ Optional Advanced Features

- Discord integration:
  - Webhook on new comic or featured comic
  - Optional login via Discord OAuth
- Creator drafts & scheduled publish
- Trending algorithm recalculated periodically
- Analytics graphs (charts per user/comic)
- AI-powered recommendations (future)

---

## ✅ Functional Principle

**Every action must be reversible where safe, explicit for destructive actions, and logged for tracking.**

This ensures:
- Users cannot lose files accidentally
- Admins can audit everything
- AI or developers know exactly how a feature should behave
