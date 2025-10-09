# PDF Viewer - Responsive Design Visual Guide

## Layout Overview

### Desktop View (>1024px)
```
┌──────────────────────────────────────────────────────────────────┐
│  Navbar                                                          │
├──────────┬──────────────────────────────────────┬───────────────┤
│          │                                      │   Chats       │
│  Key     │         PDF Viewer                   │ ┌───────────┐ │
│  Points  │    ┌──────────────────────┐         │ │ AI Buddy  │ │
│          │    │  [<] 1/28 [>] [⛶] ✨ │         │ │ 🤖        │ │
│  1. ...  │    ├──────────────────────┤         │ │           │ │
│  2. ...  │    │                      │         │ │ Messages  │ │
│  3. ...  │    │   PDF Content        │         │ │           │ │
│  4. ...  │    │                      │         │ └───────────┘ │
│  5. ...  │    │                      │         │               │
│          │    └──────────────────────┘         │   Notes       │
│ [Quiz]   │    📺 YouTube Videos                │ ┌───────────┐ │
│          │    [====================]           │ │ Your      │ │
│          │                                      │ │ Notes...  │ │
│          │    📝 Summary                       │ └───────────┘ │
│          │    [====================]           │               │
└──────────┴──────────────────────────────────────┴───────────────┘
   260px              Flexible (1fr)                   360px
```

### Tablet/Mobile View (<1024px)
```
┌──────────────────────────────────┐
│  Navbar                          │
├──────────────────────────────────┤
│                                 ◐│ ← Toggle Button (right edge)
│     PDF Viewer                   │
│  ┌────────────────────────┐     │
│  │ [<] 1/28 [>] [⛶] ✨    │     │
│  ├────────────────────────┤     │
│  │                        │     │
│  │   PDF Content          │     │
│  │                        │     │
│  │                        │     │
│  └────────────────────────┘     │
│                                  │
│  📺 YouTube Videos              │
│  ┌──────────────────────────┐  │
│  │                          │  │
│  └──────────────────────────┘  │
│                                  │
│  📝 Summary                     │
│  ┌──────────────────────────┐  │
│  │ Generated summary...     │  │
│  └──────────────────────────┘  │
│                                  │
│  🤖 (AI Buddy - bottom left)   │
└──────────────────────────────────┘
```

### Mobile with Panel Open
```
┌──────────────────────────────────┐
│  Navbar                          │
├──────────────────────────────────┤
│                                  │
│  [Backdrop Overlay - Blurred]   │
│                                  │
│         ┌────────────────────────┤
│         │ [X] Chats│Notes│Key   │
│         ├────────────────────────┤
│         │                        │
│         │  🤖 AI Pdf Buddy      │
│         │  ○ Connecting...      │
│         │                        │
│         │  👋 Hi there!         │
│         │                        │
│         │  ┌──────────────────┐ │
│         │  │ Ask anything... │ │
│         │  └──────────────────┘ │
│         │                        │
│         └────────────────────────┘
│  🤖 (AI Buddy)                  │
└──────────────────────────────────┘
```

## Component Hierarchy

```
PDFPage
├── Sidebar (Left)
│   ├── Key Points List
│   └── Generate Quiz Button
│   └── (Hidden on mobile <1024px)
│
├── Main Content Area
│   ├── PDFViewer
│   │   ├── Toolbar (Sticky)
│   │   │   ├── Navigation [<] 1/28 [>]
│   │   │   ├── Fullscreen Toggle
│   │   │   └── Summarize Button
│   │   ├── PDF Document
│   │   ├── YouTube Suggestions
│   │   └── Summary Section
│   │
│   ├── FloatingAIBuddy
│   │   └── Position: bottom-left (mobile: bottom: 80px)
│   │
│   └── Toggle Button (Mobile Only)
│       └── Position: fixed right edge, 50% vertical
│
└── RightPanel
    ├── Backdrop (Mobile Only)
    ├── Close Button (Mobile Only)
    ├── Tabs Header
    │   ├── Chats Tab
    │   ├── Notes Tab
    │   └── Key Points Tab
    │
    └── Tab Content
        ├── ChatPanel (AI Chat Interface)
        ├── NotesPanel (User Notes)
        └── KeyPointsList (Extracted Points)
```

## Toggle Button Design

### Desktop (Hidden)
```
No button visible - panel always shown
```

### Mobile (Visible)
```
     Screen Edge
         │
    ┌────┤
    │ ◐  │ ← Semi-circle toggle
    └────┤
         │
```

**Specifications:**
- Width: 56px (desktop) → 48px (mobile) → 40px (small mobile)
- Height: 56px → 48px → 40px
- Border-radius: 50% 0 0 50% (rounded left, flat right)
- Color: var(--accent) with #083344 icon
- Position: fixed, right: 0, top: 50%
- Z-index: 998 (below panel but above content)
- Animation: Slides out 4px on hover

## Key Points Tab Design

```
┌─────────────────────────────┐
│  Key Points                 │
├─────────────────────────────┤
│  ┌─────────────────────────┐│
│  │ ① This is a key point   ││
│  │   about the topic...    ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │ ② Another important     ││
│  │   concept explained...  ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │ ③ More details about    ││
│  │   the subject matter... ││
│  └─────────────────────────┘│
└─────────────────────────────┘
```

**Features:**
- Numbered badge (circular, accent color)
- Card layout with border
- Hover effect: translate + shadow + border color change
- Scrollable list
- Empty state with icon when no points

## Responsive Breakpoints Summary

| Breakpoint | Width | Changes |
|------------|-------|---------|
| Desktop | >1024px | Full 3-column layout, no toggle |
| Tablet | ≤1024px | Hide left sidebar, show toggle, panel slides in |
| Mobile | ≤768px | Smaller buttons, compact spacing |
| Small Mobile | ≤480px | Minimal padding, smallest sizes |

## Animation Timings

- Panel slide: 0.3s ease
- Toggle button: 0.3s ease
- Backdrop fade: 0.3s ease
- Hover effects: 0.2s ease
- Tab switching: instant (CSS display)

## Color Palette

```css
--accent: #91C9B6 (Teal/Mint)
--accent-strong: #00BCD4 (Bright Teal)
--bg: Background color (theme-dependent)
--card: Card background
--border: Border color
--text: Primary text
--muted: Secondary text
#083344: Dark teal (button text on accent bg)
```

## Touch Targets (Mobile)

All interactive elements meet WCAG guidelines:
- Minimum size: 44x44px
- Comfortable spacing: 8px+ between elements
- Visual feedback on tap
- No overlapping targets

## Accessibility Features

✅ Keyboard Navigation
- Tab through all interactive elements
- Enter/Space to activate buttons
- Escape to close panel (with backdrop)

✅ Screen Readers
- ARIA labels on buttons
- Semantic HTML structure
- Clear heading hierarchy

✅ Visual Indicators
- Focus rings on keyboard nav
- Active/hover states
- Loading states with text + animation

## Performance Optimizations

1. **CSS Transforms**: Use `transform` and `opacity` for animations (GPU-accelerated)
2. **Will-change**: Applied to frequently animated elements
3. **Containment**: Layout containment for panel to prevent reflows
4. **Lazy Loading**: YouTube embeds only load when clicked
5. **Efficient Selectors**: Minimal specificity, avoid expensive selectors
6. **Minimal Re-renders**: React memo where appropriate

## Z-Index Stack

```
1001: Right Panel (when open on mobile)
1000: Modal overlays (video player)
999:  Backdrop overlay
998:  Toggle button
100:  AI Buddy button on PDF page
10:   Close button in panel
2:    Toolbar sticky positioning
1:    Normal content flow
```

## State Management

```javascript
// PDFPage.jsx
const [isRightPanelOpen, setIsRightPanelOpen] = useState(false)
const [isFullscreen, setIsFullscreen] = useState(false)
const [keyPoints, setKeyPoints] = useState([])

// RightPanel.jsx
const [tab, setTab] = useState('chat') // 'chat' | 'notes' | 'keypoints'
```

## Event Handlers

```javascript
// Toggle right panel
onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}

// Close panel (backdrop click)
onClick={onClose}

// Prevent backdrop close on panel click
onClick={(e) => e.stopPropagation()}

// Tab switching
onClick={() => setTab('keypoints')}
```

## CSS Classes

### PDFPage
- `.pdfPageLayout` - Grid container
- `.rightPanelToggle` - Toggle button

### RightPanel
- `.panel` - Main container
- `.panel.open` - Slide-in state
- `.panel.collapsed` - Fullscreen mode
- `.backdrop` - Overlay
- `.closeBtn` - Close button
- `.tabs` - Tab container
- `.tabBtn` - Individual tab
- `.tabActive` - Active tab state
- `.keyPointsList` - Points container
- `.keyPointItem` - Individual point
- `.keyPointNumber` - Numbered badge
- `.emptyState` - Empty state message

## Common Issues & Solutions

### Issue: Panel doesn't slide in on mobile
**Solution**: Check `.panel.open` class is applied and `right: 0` in CSS

### Issue: Toggle button hidden on desktop
**Solution**: Verify media query `@media (max-width: 1024px)` shows `display: flex`

### Issue: AI Buddy overlaps toggle
**Solution**: AI Buddy positioned at `bottom: 80px` on mobile (below toggle)

### Issue: PDF too small on mobile
**Solution**: PDFViewer responsive padding adjusted, check `.pageContainer` sizing

### Issue: YouTube videos overflow
**Solution**: Grid changed to `1fr` on mobile, cards are full-width
