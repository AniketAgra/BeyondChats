# Custom Dropdown - Visual Design Guide

## 🎨 Design Specifications

### Color Palette
```
Primary Accent: #91c9b6 (Teal/Mint)
Accent Strong: var(--accent-strong)
Background: rgba(255, 255, 255, 0.03)
Border: rgba(145, 201, 182, 0.2)
Text: var(--text)
Card: var(--card)
```

### Spacing
```
Padding: 14px 18px
Border Radius: 12px
Gap (icon/text): 12px
Dropdown Offset: 8px
```

### Typography
```
Font Size: 15px
Font Weight: 500 (normal), 600 (selected)
```

## 🎭 States & Interactions

### 1. Default State
```
Background: rgba(255, 255, 255, 0.03)
Border: 2px solid rgba(145, 201, 182, 0.2)
Arrow: Down, accent color
Dropdown: Hidden
```

### 2. Hover State
```
Background: rgba(145, 201, 182, 0.08)
Border: 2px solid var(--accent)
Transform: translateY(-1px)
Cursor: pointer
```

### 3. Open/Focus State
```
Background: rgba(145, 201, 182, 0.05)
Border: 2px solid var(--accent)
Shadow: 0 0 0 4px rgba(145, 201, 182, 0.15)
Arrow: Up (rotated 180deg)
Dropdown: Visible with slide-in animation
```

### 4. Option - Default
```
Background: transparent
Padding: 14px 18px
Border-bottom: Gradient separator
```

### 5. Option - Hover
```
Background: linear-gradient(90deg, 
  rgba(145, 201, 182, 0.15) 0%, 
  rgba(145, 201, 182, 0.08) 100%)
Color: var(--accent-strong)
Padding-left: 22px (slide effect)
```

### 6. Option - Selected
```
Background: linear-gradient(90deg, 
  rgba(145, 201, 182, 0.2) 0%, 
  rgba(145, 201, 182, 0.1) 100%)
Color: var(--accent-strong)
Font-weight: 600
Checkmark: ✓ (animated)
```

## 🎬 Animations

### Dropdown Menu
```css
Animation: dropdownSlideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)
From: opacity 0, translateY(-8px)
To: opacity 1, translateY(0)
```

### Arrow Rotation
```css
Transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)
Closed: rotate(0deg)
Open: rotate(180deg)
```

### Checkmark Pop
```css
Animation: checkmarkPop 0.3s cubic-bezier(0.4, 0, 0.2, 1)
0%: scale(0)
50%: scale(1.2)
100%: scale(1)
```

### Option Hover Slide
```css
Transition: padding-left 0.2s
Default: 18px
Hover: 22px
```

## 📐 Layout Structure

```
┌─────────────────────────────────────┐
│  😊  Easy               ▼          │ ← Button
└─────────────────────────────────────┘
         ↓ (8px gap)
┌─────────────────────────────────────┐
│  😊  Easy               ✓          │ ← Selected option
├─────────────────────────────────────┤ ← Gradient separator
│  🎯  Medium                         │ ← Option
├─────────────────────────────────────┤
│  🔥  Hard                           │ ← Option
└─────────────────────────────────────┘
         ↑ Dropdown Menu
```

## 🎯 Difficulty Level Icons

```
Easy: 😊 (Smiling face - friendly)
Medium: 🎯 (Target - focused)
Hard: 🔥 (Fire - challenging)
```

## 💡 Design Principles

1. **Consistency**: Matches overall website theme
2. **Feedback**: Every interaction has visual response
3. **Clarity**: Selected state is obvious
4. **Smoothness**: All transitions are smooth
5. **Depth**: Layered effects create hierarchy
6. **Modern**: Gradients, blur, and animations

## 📱 Responsive Design

```css
@media (max-width: 640px) {
  /* Enhanced shadow for better visibility */
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4),
              0 0 0 1px rgba(145, 201, 182, 0.15);
}
```

## 🔧 CSS Variables Used

```css
--text            /* Main text color */
--text-primary    /* Primary text color */
--accent          /* Primary accent color (#91c9b6) */
--accent-strong   /* Stronger accent shade */
--card            /* Card background */
--bg              /* Background color */
```

## ✨ Special Effects

### Backdrop Blur
```css
backdrop-filter: blur(10px);
```
Creates a frosted glass effect for the dropdown menu.

### Gradient Separators
```css
background: linear-gradient(90deg, 
  transparent 0%, 
  rgba(145, 201, 182, 0.1) 50%, 
  transparent 100%);
```
Subtle dividers between options that fade in/out.

### Double Border Effect
```css
border: 2px solid var(--accent);
box-shadow: 0 0 0 1px rgba(145, 201, 182, 0.1);
```
Creates depth with inner and outer borders.

## 🎨 Gradient Recipes

### Light Hover
```css
linear-gradient(90deg, 
  rgba(145, 201, 182, 0.15) 0%, 
  rgba(145, 201, 182, 0.08) 100%)
```

### Strong Selected
```css
linear-gradient(90deg, 
  rgba(145, 201, 182, 0.2) 0%, 
  rgba(145, 201, 182, 0.1) 100%)
```

### Stronger Hover (Selected)
```css
linear-gradient(90deg, 
  rgba(145, 201, 182, 0.25) 0%, 
  rgba(145, 201, 182, 0.15) 100%)
```

---
*Design Guide v1.0*
*October 8, 2025*
