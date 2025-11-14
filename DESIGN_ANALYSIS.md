# Tax Relief Experts - Design Analysis & Style Guide

## Overview
This document captures the complete design aesthetics, styling, theme, and UI elements from the Tax Relief Experts landing page to ensure seamless integration of new pages.

---

## Color Palette

### Primary Colors
- **Primary Blue**: `#0273c5` (main brand color)
- **Primary Blue Hover**: `#0264ac` (hover states)
- **Accent Yellow**: `#eac344` (highlights, links, borders)
- **Focus Ring**: `#0273C5` (focus states)

### Text Colors
- **Primary Text**: `#11181c` (dark charcoal)
- **Secondary Text**: `#494949` (medium gray)
- **Light Text**: `#888` (gray)
- **Input Text**: `#636363` (medium gray)
- **Disabled Text**: `#545454` (gray)

### Background Colors
- **White**: `#fff`
- **Light Gray Background**: `#f6f6f6` (main page background)
- **Section Background**: `#f5f5f5` (alternate sections)
- **Footer Background**: `#11181c` (dark charcoal)
- **Footer Border**: `#707070` (gray border)
- **Button Disabled**: `#bbb` (light gray)
- **Light Blue Background**: `#eef2ff` (back button background)

### Error Colors
- **Error Red**: `#ed1f24`

---

## Typography

### Font Family
- **Primary Font**: `Poppins` (Google Fonts)
- **Weights Available**: 300, 400, 500, 600, 700
- **Fallback**: `sans-serif`

### Font Sizes
- **H1/H2 (Hero Title)**: `5.8rem` (desktop), `2.4rem` (mobile)
- **H3/H4 (Section Titles)**: `2.4rem` (desktop), `1.6rem` (mobile)
- **H4 (Form Titles)**: `2rem` (desktop), `1.6rem` (mobile)
- **Body Text**: `1.6rem` (desktop), `1.4rem` (mobile)
- **Small Text**: `1.2rem` - `1.3rem`
- **Button Text**: `1.6rem` - `2.4rem` (varies by context)
- **Footer Text**: `1.2rem`

### Line Heights
- **Headings**: `1.3` - `1.6`
- **Body Text**: `1.4` - `1.7`
- **Form Labels**: `1.2` - `1.5`

### Font Weights
- **Bold/Strong**: `700`
- **Semi-Bold**: `600`
- **Medium**: `500`
- **Regular**: `400`
- **Light**: `300`

---

## Layout & Spacing

### Container Widths
- **Mobile**: Full width with padding
- **Tablet (550px+)**: `52rem` max-width
- **Desktop (1080px+)**: `104rem` - `120rem` max-width
- **Form Container**: `45rem` - `65rem` (desktop), `52rem` (tablet)

### Padding & Margins
- **Section Padding**: `2.5rem` - `5.5rem` (vertical)
- **Container Padding**: `1.5rem` - `4rem` (horizontal)
- **Form Padding**: `2rem` - `5rem`
- **Button Padding**: `1.2rem 1.5rem` - `1.5rem`
- **Input Padding**: `1.2rem` (all sides), `1.2rem 1.2rem 1.2rem 3.5rem` (with icon)

### Gaps & Spacing
- **Flex Gaps**: `1rem` - `6rem` (varies by context)
- **Form Element Gaps**: `1rem` - `2rem`
- **Section Gaps**: `2rem` - `5rem`

---

## Components

### Header
- **Background**: White (`#fff`)
- **Logo**: SVG image (`logo.svg`), `8rem` height × `18rem` width
- **Logo Container**: Centered on mobile, left-aligned on desktop
- **Call-to-Action**: 
  - Text color: `#1a3a42`
  - Link color: `#0273c5`
  - Font size: `1.7rem` - `2.2rem`
  - Font weight: `600` (text), `700` (link)
- **Layout**: Stacked on mobile, horizontal on desktop
- **Padding**: `1.5rem` - `2.5rem` (vertical)

### Buttons

#### Primary Button
- **Background**: `#0273c5`
- **Border**: `0.3rem solid #0273c5`
- **Color**: White (`#fff`)
- **Border Radius**: `0.5rem`
- **Font**: Poppins, `700` weight
- **Padding**: `1.2rem 1.5rem` - `1.5rem`
- **Font Size**: `1.6rem` - `2.4rem`
- **Hover State**: 
  - Background: `#0264ac`
  - Border: `#0264ac`
- **Transition**: `0.3s` duration
- **Text Transform**: None
- **Box Shadow**: None

#### Back Button
- **Background**: `#eef2ff`
- **Border**: `0.3rem solid #eef2ff`
- **Color**: `#888`
- **Padding**: `1.2rem 1.5rem` (left padding: `3rem` for icon)
- **Icon**: Font Awesome arrow-left (`\f053`) before text
- **Icon Position**: Left side, `1.5rem` from edge

#### Disabled Button
- **Background**: `#bbb`
- **Border**: `#bbb`
- **Color**: `rgba(255,255,255,0.8)`
- **Opacity**: `0.8`
- **Cursor**: `not-allowed`
- **Pointer Events**: None

#### Button with Arrow
- **Next/Submit buttons** have arrow icon (`\f054`) after text
- **Icon Position**: Right side, `1.5rem` from edge
- **Icon**: Font Awesome 5 Pro, `400` weight, `1.2rem` size

### Forms

#### Form Container
- **Background**: White (`#fff`)
- **Border**: `1px solid #eac344` (yellow accent)
- **Border Radius**: `1.5rem` (desktop), `6px` (mobile)
- **Padding**: `5rem 4rem` (desktop), `2.5rem 2rem` (mobile)
- **Width**: `45rem` - `65rem` (desktop), full width (mobile)

#### Form Inputs
- **Background**: White (`#fff`)
- **Border**: `1px solid #0273c5`
- **Border Radius**: `6px`
- **Padding**: `1.2rem` (standard), `1.2rem 1.2rem 1.2rem 3.5rem` (with icon)
- **Color**: `#636363`
- **Font Size**: Inherits from form
- **Focus State**: 
  - Outline: `0.3rem solid rgba(2,115,197,0.6)`
  - Outline Offset: `0.2rem`
- **Disabled State**:
  - Background: `rgba(17,24,28,0.08)`
  - Border: `rgba(17,24,28,0.15)`
  - Color: `#545454`
  - Cursor: `not-allowed`

#### Input Icons (Font Awesome)
- **User Icon** (`\f007`): First Name, Last Name fields
- **Phone Icon** (`\f879`): Phone Number field
- **Icon Color**: `#eac344` (yellow)
- **Icon Weight**: `700`
- **Position**: Left side, `1.2rem` padding

#### Select/Dropdown
- **Padding**: `1.2rem` (no left padding for icon)
- **Custom Styling**: Custom dropdown wrapper with `::before` pseudo-element

#### Form Labels
- **Color**: `#11181c`
- **Font Size**: `1.6rem`
- **Font Weight**: `400` - `500`
- **Margin Bottom**: `1rem`

#### Error Messages
- **Color**: `#ed1f24` (red)
- **Font Size**: `1.3rem`
- **Line Height**: `1.2`
- **Display**: Below input field

### Hero Section

#### Background
- **Color**: `#f6f6f6` (light gray)
- **Desktop Background Image**: `tre-hero-bg.png`
- **Background Position**: Bottom left
- **Background Size**: Cover
- **Gradient Overlay**: Linear gradient from transparent to `#f6f6f6` at 80%

#### Hero Title
- **Font Size**: `5.8rem` (desktop), `2.4rem` (mobile)
- **Font Weight**: `700`
- **Line Height**: `1.3`
- **Color**: `#11181c`
- **Text Highlight**: `#0273c5` (blue) with `700` weight
- **Margin Bottom**: `1rem` - `1.5rem`

#### Hero Description
- **Font Size**: `2.4rem` (desktop), `1.6rem` (mobile)
- **Line Height**: `1.5`
- **Color**: `#11181c`
- **Margin**: `0` or `1.5rem` bottom

### Features Section

#### Layout
- **Background**: White or light gray
- **Padding**: `4rem 1rem` - `5.5rem 1rem`
- **Display**: Flex, wrap
- **Gap**: `6rem` (mobile), `0` (desktop)
- **Justify Content**: Center

#### Feature Items
- **Max Width**: `19rem` (mobile), `17rem` (desktop)
- **Layout**: Flex column, centered
- **Text Align**: Center
- **Icons**: SVG images (`icon-feature-1.svg`, `icon-feature-2.svg`, `icon-feature-3.svg`)

#### Feature Titles
- **Font Size**: `2.6rem` (desktop), `1.6rem` (mobile)
- **Color**: `#11181c`
- **Font Weight**: `700`

### Progress Indicator
- **Text**: "STEP X OF 6" format
- **Color**: `#888`
- **Font Size**: `1.2rem`
- **Font Weight**: `700`
- **Text Transform**: Uppercase
- **Line Height**: `1.5`
- **Display**: Flex, centered

### Footer
- **Background**: `#11181c` (dark charcoal)
- **Border Top**: `0.1rem solid #707070`
- **Color**: White (`#fff`)
- **Font Size**: `1.2rem`
- **Line Height**: `1.7`
- **Padding**: `3.5rem 0` (mobile), `4.5rem 0` (desktop)

#### Footer Links
- **Color**: White (`#fff`)
- **Text Decoration**: None (underline on hover)
- **Layout**: Two columns (Terms/Privacy/CA Privacy, then others)

---

## Responsive Breakpoints

### Mobile First Approach
- **Base**: Mobile styles (default)
- **550px+**: Tablet adjustments
- **800px+**: Larger tablet adjustments
- **1080px+**: Desktop styles
- **1240px+**: Large desktop adjustments

### Key Responsive Changes

#### Header (550px+)
- Logo moves to left
- CTA moves to right, stacked vertically
- Font sizes increase

#### Header (1080px+)
- Full horizontal layout
- Logo: `2.5rem` vertical padding
- CTA: Larger font sizes (`1.9rem` - `2.2rem`)

#### Hero Section (1080px+)
- Two-column layout (text left, form right)
- Background image appears
- Larger font sizes
- Form becomes fixed width (`45rem` - `65rem`)

#### Forms (550px+)
- Centered layout
- Fixed width: `52rem`
- Increased padding

---

## UI Patterns

### Multi-Step Form
- **Steps**: 6 total steps
- **Navigation**: Back/Next buttons
- **Progress**: "STEP X OF 6" indicator
- **Form Fields**: Hidden until active step
- **Validation**: Real-time error messages
- **Submit**: Final step has "Agree & Submit" button

### Form Field Structure
```
<div class="question-block">
  <label>Field Label</label>
  <div class="input-wrapper">
    <input type="text" />
  </div>
  <div class="error-message">
    <p>Error text</p>
  </div>
</div>
```

### Button Groups
- **Layout**: Flex row, no wrap
- **Gap**: `1rem`
- **Back Button**: `14rem` width (desktop), full width (mobile)
- **Next Button**: Full width
- **Padding**: `0.75rem 0 1.5rem`

### Agreement/Consent Checkboxes
- **Text Color**: `#494949`
- **Font Size**: `1rem`
- **Font Weight**: `400`
- **Links**: `#0273c5` with underline
- **Display**: Inline/inline-block

---

## Icons & Graphics

### Icon Library
- **Font Awesome 5 Pro**: Used for form icons and button arrows
- **SVG Icons**: Custom SVG files for features
  - `icon-feature-1.svg`
  - `icon-feature-2.svg`
  - `icon-feature-3.svg`
- **Logo**: `logo.svg`

### Icon Usage
- **Form Inputs**: Font Awesome icons positioned before text
- **Buttons**: Font Awesome arrows (left/right)
- **Features**: Custom SVG graphics

---

## Visual Effects

### Transitions
- **Duration**: `0.3s`
- **Properties**: Background-color, border-color, color, box-shadow
- **Easing**: Default (ease)

### Shadows
- **Buttons**: None (flat design)
- **Forms**: None (flat design)
- **Focus States**: Outline instead of shadow

### Borders
- **Form Container**: `1px solid #eac344` (yellow)
- **Inputs**: `1px solid #0273c5` (blue)
- **Buttons**: `0.3rem solid` (matches background)
- **Footer**: `0.1rem solid #707070` (top border)

### Border Radius
- **Buttons**: `0.5rem`
- **Form Container**: `1.5rem` (desktop), `6px` (mobile)
- **Inputs**: `6px`

---

## Accessibility Features

### Focus States
- **Focus Ring Color**: `#0273C5`
- **Focus Outline**: `0.3rem solid rgba(2,115,197,0.6)`
- **Outline Offset**: `0.2rem`

### Form Labels
- Proper label associations
- Required field indicators
- Error message associations

### Semantic HTML
- Proper heading hierarchy (h2, h3, h4)
- Form elements properly labeled
- Navigation structure

---

## JavaScript Libraries & Dependencies

### Core Libraries
- **jQuery**: `3.2.1`
- **jQuery UI**: Custom build
- **Moment.js**: Date/time handling
- **Font Awesome Pro**: `5.12.1` (icons)

### Form Libraries
- **Range Slider**: Custom slider component
- **HTML Minifier**: Form optimization
- **TCPA Capture**: Form capture/validation
- **html2canvas**: Screenshot generation

### Analytics & Tracking
- **Google Tag Manager**: `GTM-N26MM8WK`
- **Google Analytics**: `G-F71FKS4NCJ`
- **Facebook Pixel**: `2947213858800794`
- **TrustedForm**: Form validation/certification

---

## CSS Architecture

### CSS Files
1. **Global Styles**: `/css/global/style.min.css`
2. **Brand Styles**: `/css/brands/taxreliefexperts/style.min.css`
3. **Font Awesome**: `/libs/fontawesome-pro-5.12.1-web/css/all.min.css`

### CSS Methodology
- **Utility Classes**: `.flex-block`, `.text-center`, `.bold-text`, etc.
- **BEM-like Naming**: `.header__logo`, `.site-form__input`, etc.
- **Component-based**: Forms, buttons, headers as separate components
- **Responsive**: Mobile-first with breakpoint overrides

### Key Utility Classes
- `.flex-block`: Flexbox container
- `.flex-block--row`: Row direction
- `.flex-block--col`: Column direction
- `.flex-block--aic`: Align items center
- `.flex-block--jcc`: Justify content center
- `.text-center`: Center align text
- `.bold-text`: Font weight 700
- `.no-padding`: Remove padding
- `.no-margin`: Remove margin

---

## Form Structure

### Step-by-Step Flow
1. **Step 1**: "How much do you owe?" (Dropdown)
2. **Step 2**: "What type of tax debt?" (Dropdown)
3. **Step 3**: "What state do you live in?" (Dropdown)
4. **Step 4**: "Are you Missing any Returns?" (Yes/No)
5. **Step 5**: "Are you currently Employed?" (Yes/No)
6. **Step 6**: Contact Information (First Name, Last Name, Email, Phone)

### Form Validation
- **Required Fields**: All fields required
- **Email Validation**: Standard email format
- **Phone Validation**: 10-digit phone number
- **Name Validation**: Minimum 2 characters
- **Error Display**: Red text below field

### Form Submission
- **Final Button**: "Agree & Submit"
- **Consent Checkboxes**: Required for submission
- **Privacy Links**: Links to Privacy Policy, Terms & Conditions, CA Privacy Notice

---

## Page Sections

### 1. Header
- Logo (left)
- Call-to-Action (right): "Call Now" + Phone number
- Responsive: Stacks on mobile

### 2. Hero Section
- **Background**: Light gray (`#f6f6f6`)
- **Content**: 
  - Title with highlighted text
  - Description paragraph
  - Multi-step form
- **Layout**: Two-column on desktop, stacked on mobile

### 3. Features Section
- **Title**: "Reduce Your Tax Debt" (and similar)
- **Three Features**: 
  - Reduce Your Tax Debt
  - May Reduce Penalties & Interest
  - Audit Defense
- **Icons**: Custom SVG graphics
- **Layout**: Three columns (desktop), stacked (mobile)

### 4. Footer
- **Background**: Dark (`#11181c`)
- **Content**: 
  - Disclaimer text
  - Navigation links (two columns)
  - Copyright notice
- **Links**: White text, underline on hover

---

## Design Principles

### Visual Hierarchy
1. **Primary**: Hero title and CTA buttons
2. **Secondary**: Form fields and section titles
3. **Tertiary**: Body text and descriptions

### Color Usage
- **Blue** (`#0273c5`): Primary actions, links, borders
- **Yellow** (`#eac344`): Accents, form borders, highlights
- **Dark** (`#11181c`): Headings, primary text
- **Gray** (`#f6f6f6`): Backgrounds, sections

### Typography Hierarchy
- **Large**: Hero titles (`5.8rem`)
- **Medium**: Section titles (`2.4rem` - `2.6rem`)
- **Regular**: Body text (`1.6rem` - `2.4rem`)
- **Small**: Footer, labels (`1.2rem` - `1.3rem`)

### Spacing System
- **Small**: `1rem` - `1.5rem`
- **Medium**: `2rem` - `2.5rem`
- **Large**: `4rem` - `5.5rem`
- **Extra Large**: `5rem` - `6rem`

---

## Interactive Elements

### Hover States
- **Links**: Underline on hover
- **Buttons**: Darker blue (`#0264ac`)
- **Transitions**: `0.3s` smooth transition

### Focus States
- **Inputs**: Blue outline ring
- **Buttons**: Blue outline
- **Accessibility**: High contrast focus indicators

### Disabled States
- **Buttons**: Gray background, reduced opacity
- **Inputs**: Light gray background, gray text
- **Cursor**: `not-allowed`

---

## Brand Elements

### Logo
- **Format**: SVG
- **Location**: `/img/brands/taxreliefexperts/logo.svg`
- **Size**: `8rem` height × `18rem` width
- **Usage**: Header, links to homepage

### Color Scheme
- **Professional**: Blue conveys trust and professionalism
- **Energetic**: Yellow adds energy and highlights
- **Clean**: White and light gray backgrounds
- **Trustworthy**: Dark text for readability

### Tone
- **Professional**: Clean, modern design
- **Approachable**: Friendly typography (Poppins)
- **Trustworthy**: Clear hierarchy and structure
- **Action-oriented**: Prominent CTAs

---

## Technical Specifications

### CSS Variables
```css
:root {
  --focus-ring-clr: #0273C5;
}
```

### Font Loading
- **Google Fonts**: Poppins (300, 400, 500, 600, 700)
- **Font Display**: Optimized loading

### Image Optimization
- **Format**: SVG for logos/icons
- **Background Images**: PNG with gradients
- **Lazy Loading**: Not explicitly implemented

### Performance
- **Minified CSS**: All stylesheets minified
- **Versioned Assets**: Timestamp query strings for cache busting
- **CDN**: Fonts from Google Fonts CDN

---

## Integration Guidelines

### For New Pages

1. **Use Same Color Palette**
   - Primary blue: `#0273c5`
   - Accent yellow: `#eac344`
   - Text colors: `#11181c`, `#494949`, `#888`

2. **Match Typography**
   - Font family: Poppins
   - Use established font sizes and weights
   - Maintain line height ratios

3. **Consistent Spacing**
   - Use same padding/margin system
   - Match container widths
   - Follow responsive breakpoints

4. **Component Reuse**
   - Use same button styles
   - Match form input styling
   - Follow header/footer patterns

5. **Responsive Design**
   - Mobile-first approach
   - Breakpoints: 550px, 800px, 1080px, 1240px
   - Test at all breakpoints

6. **Accessibility**
   - Maintain focus states
   - Proper semantic HTML
   - ARIA labels where needed

---

## Notes

- The design uses a clean, professional aesthetic
- Yellow accent color (`#eac344`) is used sparingly but effectively
- Blue (`#0273c5`) is the dominant brand color
- Forms are the primary interaction point
- Multi-step form pattern is central to the user experience
- Trust indicators (disclaimers, privacy links) are prominent
- Mobile-first responsive design
- Flat design with minimal shadows
- Strong typographic hierarchy
- Clear call-to-action buttons

---

## Screenshot Reference
A full-page screenshot has been saved as `page-2025-11-13T23-26-44-330Z.png` for visual reference.

