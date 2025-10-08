# Chat on PDF - Visual Design Reference

## Interface Layout

```
┌─────────────────────────────────────────────────┐
│  🤖  AI Pdf Buddy                             │
│      Feel free to ask any question in your mind │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Empty State - First Time]                    │
│                                                 │
│              💭                                 │
│     Your Personal Study Assistant              │
│  Feel free to ask any question in your mind    │
│                                                 │
│  Try asking:                                   │
│  ┌─────────────────────────────────┐          │
│  │ 📝 Summarize key points          │          │
│  └─────────────────────────────────┘          │
│  ┌─────────────────────────────────┐          │
│  │ 💡 Explain concepts simply       │          │
│  └─────────────────────────────────┘          │
│  ┌─────────────────────────────────┐          │
│  │ 🎯 Main takeaways                │          │
│  └─────────────────────────────────┘          │
│  ┌─────────────────────────────────┐          │
│  │ 🤔 Need help understanding       │          │
│  └─────────────────────────────────┘          │
│                                                 │
├─────────────────────────────────────────────────┤
│  [Input field: "Feel free to ask anything..."]│
│                                            [→]  │
└─────────────────────────────────────────────────┘
```

## Active Conversation View

```
┌─────────────────────────────────────────────────┐
│  🤖  AI Pdf Buddy                             │
│      Feel free to ask any question in your mind │
├─────────────────────────────────────────────────┤
│                                                 │
│  🤖  Hi there! 👋 I'm your AI Pdf Buddy...   │
│                                                 │
│                     What are the key points? ┃ │
│                                                 │
│  🤖  Great question! 💡 I'm here to help...    │
│                                                 │
│                   Can you explain chapter 2? ┃ │
│                                                 │
│  🤖  ●●●  [Typing...]                          │
│                                                 │
├─────────────────────────────────────────────────┤
│  [Quick Actions]                               │
│  [📝 Summarize] [💡 Explain] [🎯 Study Guide] │
├─────────────────────────────────────────────────┤
│  [Input field: "Feel free to ask anything..."]│
│                                            [→]  │
└─────────────────────────────────────────────────┘
```

## Color Scheme

### AI Messages
- Background: `var(--card)` (Light card background)
- Border: `var(--border)` (Subtle border)
- Border Radius: `16px 16px 16px 2px` (Rounded with pointed corner)
- Hover: Border changes to accent color with subtle shadow

### User Messages
- Background: `linear-gradient(135deg, var(--accent) 0%, #a3d4c3 100%)`
- Color: `#0a3d33` (Dark green text)
- Border Radius: `16px 16px 2px 16px` (Opposite pointing corner)
- Shadow: `0 2px 8px rgba(145, 201, 182, 0.25)`

### Suggestion Chips
- Background: `var(--card)`
- Border: `1px solid var(--border)`
- Border Radius: `10px`
- Hover: Transform translateX(4px) with accent border

### Quick Actions
- Background: `var(--card)`
- Border: `1px solid var(--border)`
- Border Radius: `8px`
- Hover: Background changes to accent with lift effect

### Send Button
- Background: `var(--accent)` (Teal/green)
- Color: `#0a3d33` (Dark green)
- Border Radius: `10px`
- Hover: Gradient effect with translateY(-1px)
- Disabled: Opacity 0.4 with muted colors

## Animations

### Header Icon
```css
@keyframes wave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
}
```

### Empty State Icon
```css
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
```

### Typing Indicator
```css
@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}
```

## Interactive Elements

### Suggestion Chips (Empty State)
- Click to populate input field
- Smooth hover effect (translateX + shadow)
- Emoji prefix for visual appeal

### Quick Action Buttons
- Show after initial messages (< 4 messages)
- Disabled during AI response
- Hover effect with color change

### Input Field
- Focus: Border color changes to accent with subtle glow
- Placeholder: "Feel free to ask anything about this PDF..."
- Enter key to send (Shift+Enter for new line)

### Send Button
- Disabled when input is empty or AI is typing
- Arrow icon that shifts on hover
- Smooth color transition

## Responsive Design

### Desktop (Default)
- Full width chat panel
- Comfortable padding and spacing
- All features visible

### Tablet
- Maintains layout
- Slightly reduced padding
- Quick actions wrap if needed

### Mobile
- Stacked layout
- Reduced font sizes
- Touch-friendly targets (min 44px)

## Typography

### Header
- Title: 16px, weight 600
- Subtitle: 12px, muted color

### Messages
- AI/User: 13.5px, line-height 1.65
- Suggestions: 13px
- Quick Actions: 12px

### Empty State
- Title: 17px, weight 600
- Subtitle: 13.5px, weight 500
- Suggestion title: 12px

## Spacing

### Padding
- Header: 16px 18px
- Thread: 18px 16px
- Messages gap: 14px
- Input row: 14px 16px
- Quick actions: 12px 16px 8px

### Gaps
- AI message (avatar + content): 10px
- Quick actions buttons: 8px
- Suggestions: 10px

## States

### Normal
- Default colors and styles
- Standard cursor

### Hover
- Enhanced colors
- Subtle transforms
- Shadow effects
- Cursor: pointer

### Active/Focus
- Accent color prominence
- Shadow/glow effects
- No outline (custom focus states)

### Disabled
- Reduced opacity (0.4-0.5)
- Cursor: not-allowed
- No hover effects

### Loading (Typing)
- Animated dots
- Disabled send button
- Message appears in thread

## Accessibility Features

- **ARIA Labels**: Send button has aria-label
- **Keyboard Navigation**: Full keyboard support
- **Focus Indicators**: Custom focus states with shadows
- **Color Contrast**: High contrast for readability
- **Screen Readers**: Semantic HTML structure

## Theme Support

Uses CSS variables for easy theme switching:
- `--bg`: Background color
- `--card`: Card background
- `--border`: Border color
- `--text`: Text color
- `--muted`: Muted text color
- `--accent`: Accent/brand color

## Best Practices Applied

1. **Visual Hierarchy**: Clear distinction between elements
2. **Progressive Disclosure**: Quick actions appear when needed
3. **Feedback**: Immediate visual feedback on all interactions
4. **Consistency**: Uniform design language throughout
5. **Accessibility**: Keyboard and screen reader friendly
6. **Performance**: CSS animations for smooth experience
7. **Mobile-First**: Touch-friendly and responsive

## UI Copy

### Encouraging Phrases
- "Feel free to ask any question in your mind" (Main tagline)
- "Your Personal Study Assistant"
- "I'm here to help you understand better"
- "Ask me anything about this document"

### Action Labels
- Short, clear, emoji-prefixed
- Action-oriented verbs
- Friendly tone

### Error Messages
- Apologetic and helpful
- Suggest retry
- Maintain friendly tone
