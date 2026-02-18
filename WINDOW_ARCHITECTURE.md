# Window & Title Bar Architecture - FlowManga

This document explains the structural design of the FlowManga desktop application, specifically focusing on the use of native window decorations combined with the "Window within a Window" aesthetic.

## 1. Native Window Decorations

To ensure maximum stability and compatibility across operating systems, FlowManga uses native OS window decorations.

- **`tauri.conf.json`**: `"decorations": true`
- **Benefits**:
    - Reliable minimize, maximize, and close buttons.
    - Native window snapping (Windows 11) and resizing.
    - Consistent look and feel with the user's operating system.
    - Simplified security model (no custom API permissions needed for window controls).

---

## 2. The "Window within a Window" Aesthetic

Despite using native decorations, the application preserves its premium, floating look by nesting the main interface within a stylized container.

### **Root Level (`App.tsx`)**
The root layer covers the entire window space provided by the OS.
- **AmbientBackground**: Dynamic visual effects that sit behind the main content.
- **AmbientSoundPlayer**: Invisible audio management.

### **Floating Content Container**
The actual interface is hosted in a glassmorphic container that "floats" within the OS window.
- **Normal Mode**: Styled with margins (`m-4`), rounded corners (`rounded-2xl`), a border, and heavy background blur (`backdrop-blur-xl`).
- **Immersive Mode (Fullscreen)**: When toggled, the margins and rounding are removed, allowing the content to fill the OS window completely.

---

## 3. Visual Stacking Hierarchy (Z-Index)

1. **Background Layer (Z-Auto)**: Ambient Background and effects.
2. **Native Layer**: The OS-provided title bar and borders.
3. **Floating UI (Z-10)**: The glass container housing the sidebar and main content.
4. **Overlay Layer (Z-50)**: Toasts, signatures, and modal guides.

---

## 4. Summary Diagram

```text
[ OS WINDOW (Primary Layer) ]
|   (Native Title Bar & Controls)
|
+--- [ Ambient Background / Audio ]
|
+--- [ Floating UI Container ]
     |    - Styled with m-4 / rounded-2xl
     |    - glass effect / blur
     |
     +--- [ Main Content Area ]
          |
          +--- [ Sidebar ]
          +--- [ Reader / Library / Analytics ]
```
