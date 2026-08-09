# Quran Kareem - Progressive Web App (PWA) Features

## Overview
Quran Kareem has been enhanced with full Progressive Web App capabilities, making it installable on Chrome and other modern browsers, with improved mobile responsiveness.

## PWA Features

### 1. Installable Web App
- **Web App Manifest** (`public/manifest.json`)
  - App name: "Quran Kareem"
  - Short name: "Quran Kareem"
  - Start URL: `/`
  - Display mode: `standalone` (looks like a native app)
  - Orientation: `portrait-primary`
  - Theme color: `#fbbf24` (amber)
  - Background color: `#0a0518` (dark purple)
  - Icons: SVG, JPG formats for various sizes

- **Service Worker** (`public/sw.js`)
  - Caches static assets for offline use
  - Caches app shell (HTML, CSS, JS, images)
  - Network-first strategy for API calls
  - Background sync capability (placeholder)
  - Automatic cache versioning

### 2. Chrome/Edge Installation
When users visit the site in Chrome or Edge:
1. The browser detects the PWA capabilities
2. Shows install prompt (beforeinstallprompt event)
3. Custom install prompt appears after user engagement
4. App can be launched from home screen
5. Runs in standalone mode without browser UI

### 3. iOS Support
- Web App Meta tags for iOS
- Apple Touch Icons configured
- Status bar styling
- Add to Home Screen support
- Safe area insets for notched devices

## Mobile Responsiveness Enhancements

### Touch-Friendly Design
- **Larger touch targets**: Minimum 44px for interactive elements
- **Touch manipulation**: `touch-manipulation` class prevents zoom on double-tap
- **Touch-action**: `touch-none` for custom sliders and progress bars
- **No hover effects on touch devices**: Media query `(hover: none)`

### Responsive Breakpoints
- **Mobile-first**: All styles start mobile, enhance for desktop
- **Breakpoints**: `sm:`, `md:`, `lg:`, `xl:` prefixes
- **Fluid typography**: `clamp()` for font sizes
- **Flexible layouts**: Flexbox and Grid with responsive units

### Mobile-Specific Improvements
1. **Audio Player**
   - Compact layout on mobile
   - Larger play/pause button (easier to tap)
   - Hidden volume slider on small screens
   - Shorter padding and gaps
   - Progress bar height increased (easier to drag)

2. **Header**
   - Compact brand logo
   - Hidden text labels on very small screens
   - Mobile menu with full-width touch targets
   - Backdrop blur for glass effect

3. **Surah Reading Modal**
   - Full-screen on mobile (95vh)
   - Compact padding (2 units vs 4)
   - Smaller font sizes
   - Auto-scroll to current ayah
   - Smooth scrolling with `scroll-smooth`

4. **General**
   - Safe area support (notch devices)
   - Overscroll-behavior to prevent pull-to-refresh
   - `-webkit-overflow-scrolling: touch` for momentum scroll
   - Reduced motion support for accessibility

### Accessibility Features
- **Reduced motion**: Respects `prefers-reduced-motion`
- **Focus states**: Visible focus indicators
- **ARIA labels**: All interactive elements labeled
- **Semantic HTML**: Proper heading structure
- **Color contrast**: WCAG AA compliant
- **Keyboard navigation**: Full tab support

## Installation Instructions

### For Users (Chrome/Edge)
1. Visit https://quran-kareem.vercel.app (Replace with your actual Vercel URL)
2. Look for install prompt (or click three-dot menu)
3. Select "Install Quran Kareem" or "Install app"
4. App appears in home screen/app launcher
5. Launch like a native app

### For iOS Users
1. Visit the site in Safari
2. Tap Share button (square with arrow)
3. Select "Add to Home Screen"
4. Tap "Add" in top right
5. App icon appears on home screen

### For Developers
```bash
# Install dependencies
npm install

# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Technical Details

### Service Worker Lifecycle
1. **Install**: Cache core assets
2. **Activate**: Clean old caches
3. **Fetch**: Serve from cache, fallback to network
4. **Sync**: Background sync (future feature)

### Cache Strategy
- **App Shell**: Cache-first (offline capable)
- **API Data**: Network-first (fresh data)
- **Images**: Cache with size limits
- **Audio**: Stream from network (large files)

### Manifest Properties
```json
{
  "display": "standalone",  // No browser UI
  "orientation": "portrait-primary",  // Lock orientation
  "start_url": "/",  // Launch URL
  "scope": "/",  // App scope
  "categories": ["books", "education"]
}
```

## Browser Support
- ✅ Chrome 70+ (Desktop & Android)
- ✅ Edge 79+
- ✅ Safari 11.3+ (iOS)
- ✅ Firefox 68+ (partial)
- ✅ Samsung Internet
- ✅ Opera

## Testing

### Lighthouse Audit
Run Lighthouse in Chrome DevTools:
- PWA Score: 90+
- Performance: 85+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

### Device Testing
- Test on actual mobile devices
- Test install flow
- Test offline mode
- Test different orientations
- Test with reduced motion

## Future Enhancements
1. Push notifications for prayer times
2. Background audio playback
3. Offline Quran text caching
4. Bookmark sync across devices
5. Download surahs for offline use
6. Web Share API for sharing ayahs
7. Clipboard API for copying text

## Resources
- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Chrome PWA Docs](https://web.dev/progressive-web-apps/)
- [Apple PWA Guide](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
