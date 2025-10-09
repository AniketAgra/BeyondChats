# AI Buddy - Layout Visual Guide 🎨

## Layout Structure

```
┌───────────────────────────────────────────────┐
│  📱 Page Container (100vh, no scroll)         │
│  ┌─────────────────────────────────────────┐  │
│  │  🎯 Chat Container (flex column)        │  │
│  │  ┌───────────────────────────────────┐  │  │
│  │  │  ⬆️  HEADER (flex-shrink: 0)      │  │  │
│  │  │  • Logo + Title                   │  │  │
│  │  │  • Fixed height, never changes    │  │  │
│  │  │  • Padding: 16px                  │  │  │
│  │  └───────────────────────────────────┘  │  │
│  │  ┌───────────────────────────────────┐  │  │
│  │  │  📜 MESSAGES (flex: 1)            │  │  │
│  │  │  • Takes all available space      │  │  │
│  │  │  • Scrollable (overflow-y: auto)  │  │  │
│  │  │  • Empty state or message list    │  │  │
│  │  │  ┌─────────────────────────────┐  │  │  │
│  │  │  │ Empty State / Messages      │  │  │  │
│  │  │  │ [Scroll area]               │  │  │  │
│  │  │  │ ↕                           │  │  │  │
│  │  │  └─────────────────────────────┘  │  │  │
│  │  └───────────────────────────────────┘  │  │
│  │  ┌───────────────────────────────────┐  │  │
│  │  │  ⬇️  INPUT (flex-shrink: 0)       │  │  │
│  │  │  • ALWAYS stuck to bottom         │  │  │
│  │  │  • Never moves or scrolls         │  │  │
│  │  │  • Fixed height                   │  │  │
│  │  │  • z-index: 10                    │  │  │
│  │  └───────────────────────────────────┘  │  │
│  └─────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

## Key CSS Properties

### 🏗️ Container Hierarchy

```css
/* Level 1: Page Container */
.pageContainer {
  height: 100vh;           /* Full viewport */
  display: flex;
  overflow: hidden;        /* No page scroll */
}

/* Level 2: Chat Container */
.chatContainer {
  flex: 1;
  display: flex;
  flex-direction: column;  /* Stack children vertically */
  overflow: hidden;        /* Control child scrolling */
}

/* Level 3a: Header (Top) */
.header {
  flex-shrink: 0;         /* Don't shrink */
  flex-grow: 0;           /* Don't grow */
}

/* Level 3b: Messages (Middle - Grows) */
.messagesContainer {
  flex: 1;                /* Take available space */
  overflow-y: auto;       /* Scroll if needed */
  min-height: 0;          /* Critical for flex */
}

/* Level 3c: Input (Bottom) */
.inputContainer {
  flex-shrink: 0;         /* DON'T SHRINK! */
  flex-grow: 0;           /* DON'T GROW! */
  z-index: 10;            /* Above content */
}
```

## Component Sizing

### Desktop (> 768px)

```
Header:
├─ Height: ~60px
├─ Logo: 40x40px
├─ Title: 20px
└─ Padding: 16px 24px

Messages:
├─ Flexible height (grows)
├─ Padding: 20px 24px
├─ Avatar: 34x34px
└─ Font: 14px

Input:
├─ Height: ~80px
├─ Padding: 16px 24px
├─ Button: 34x34px
└─ Font: 14px
```

### Mobile (≤ 768px)

```
Header:
├─ Height: ~54px
├─ Logo: 36x36px
├─ Title: 18px
└─ Padding: 12px 16px

Messages:
├─ Flexible height (grows)
├─ Padding: 14px 16px
├─ Avatar: 30x30px
└─ Font: 13px

Input:
├─ Height: ~70px
├─ Padding: 12px 16px
├─ Button: 32x32px
└─ Font: 14px
```

## Color System

```css
--primary: Main brand color (buttons, accents)
--accent: Hover states, highlights
--card-bg: Card backgrounds
--background: Page background
--border: Dividers, borders
--text: Primary text
--text-muted: Secondary text
```

## Spacing Scale

```
XS:  6px  - Tight spacing
SM:  10-12px - Small gaps
MD:  14-16px - Medium gaps
LG:  20-24px - Large gaps
XL:  32px+ - Section spacing
```

## Border Radius

```
SM:  6-8px  - Small elements
MD:  10-12px - Cards, buttons
LG:  14-16px - Large cards
Circle: 50% - Avatars
```

## Z-Index Layers

```
Base:     0  - Normal content
Header:  10  - Fixed header
Input:   10  - Sticky input
Modal:  100  - Overlays
```

## Flex Behavior

```
┌────────────────────────────────┐
│ Header (flex-shrink: 0)        │ ← Fixed size
├────────────────────────────────┤
│                                │
│ Messages (flex: 1)             │ ← Grows to fill
│ ↕ Scrollable                   │
│                                │
├────────────────────────────────┤
│ Input (flex-shrink: 0)         │ ← Fixed size
└────────────────────────────────┘
```

## Scroll Behavior

```
✅ Messages scroll: overflow-y: auto
❌ Page scroll: overflow: hidden
❌ Header scroll: fixed
❌ Input scroll: fixed (sticky bottom)
```

## Animation Timing

```css
/* Fast interactions */
transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);

/* Smooth fades */
animation: fadeIn 0.3s ease;

/* Bouncy buttons */
transform: scale(1.05);
transition: all 0.2s;
```

## Critical Rules

### ✅ DO

- Use `flex-shrink: 0` on header and input
- Use `flex: 1` on messages container
- Set `min-height: 0` for flex scrolling
- Use `overflow: hidden` on page container
- Set `z-index` for stacking order

### ❌ DON'T

- Add fixed heights to messages container
- Use `position: absolute` on input
- Allow page-level scrolling
- Forget mobile responsive rules
- Override flex properties accidentally

## Common Issues & Solutions

### Issue: Input not sticking
```css
/* Solution */
.inputContainer {
  flex-shrink: 0;  /* Add this! */
  flex-grow: 0;    /* Add this! */
}
```

### Issue: Messages not scrolling
```css
/* Solution */
.messagesContainer {
  flex: 1;
  min-height: 0;   /* Critical! */
  overflow-y: auto;
}
```

### Issue: Page scrolling
```css
/* Solution */
.pageContainer {
  height: 100vh;
  overflow: hidden;  /* Prevent page scroll */
}
```

## Testing Checklist

- [ ] Input stays at bottom on all screens
- [ ] Messages scroll smoothly
- [ ] No page scrolling
- [ ] Works on mobile (< 768px)
- [ ] Works on tablet (768px - 1024px)
- [ ] Works on desktop (> 1024px)
- [ ] Empty state displays correctly
- [ ] Suggested prompts fit properly
- [ ] Typing indicator works
- [ ] Animations smooth

## Browser Support

✅ Chrome/Edge (Chromium)
✅ Firefox
✅ Safari
✅ Mobile browsers
✅ All modern browsers

## Performance Tips

1. **Hardware acceleration**: Use `transform` for animations
2. **Efficient scroll**: Only messages container scrolls
3. **Fixed positioning**: Reduces repaints
4. **CSS containment**: Better rendering performance

---

**Result:** A professional, ChatGPT-like chat interface with input ALWAYS at the bottom! 🎉
