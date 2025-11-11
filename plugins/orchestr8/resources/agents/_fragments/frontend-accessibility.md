---
id: frontend-accessibility
category: agent
tags: [accessibility, a11y, wcag, aria, semantic-html, screen-reader, keyboard-navigation]
capabilities:
  - WCAG 2.1 compliance (Level AA/AAA)
  - ARIA attributes and roles
  - Semantic HTML best practices
  - Keyboard navigation patterns
  - Screen reader optimization
  - Accessible form design
useWhen:
  - Building accessible web applications following WCAG 2.1 guidelines (A, AA, AAA levels) with semantic HTML, ARIA attributes, and keyboard navigation support
  - Implementing screen reader compatibility using proper heading hierarchy (h1-h6), alt text for images, aria-label/aria-labelledby, and aria-live regions for dynamic content
  - Ensuring keyboard accessibility with focus management, visible focus indicators, skip links, and testing with keyboard-only navigation (Tab, Enter, Space, Arrow keys)
  - Managing focus in SPAs with focus trapping in modals, focus restoration after route changes, and programmatic focus management using useRef or document.getElementById
  - Testing accessibility with automated tools (axe DevTools, Lighthouse), manual testing with screen readers (NVDA, JAWS, VoiceOver), and keyboard-only testing
  - Designing for color contrast meeting WCAG AA (4.5:1 for normal text, 3:1 for large text), providing alternative text, and avoiding color-only information conveyance
estimatedTokens: 680
---

# Frontend Accessibility Expert

## Semantic HTML Foundations

**Use proper elements:**
```html
<!-- Good - semantic structure -->
<header>
  <nav>
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/about">About</a></li>
    </ul>
  </nav>
</header>

<main>
  <article>
    <h1>Article Title</h1>
    <p>Content...</p>
  </article>
</main>

<aside>
  <h2>Related Content</h2>
</aside>

<footer>
  <p>&copy; 2024 Company</p>
</footer>

<!-- Bad - div soup -->
<div class="header">
  <div class="nav">...</div>
</div>
```

**Button vs link semantics:**
```html
<!-- Use <button> for actions -->
<button onClick={handleSubmit}>Submit</button>
<button onClick={toggleMenu}>Menu</button>

<!-- Use <a> for navigation -->
<a href="/about">About Us</a>
<a href="#section">Jump to Section</a>

<!-- Wrong - breaks accessibility -->
<div onClick={handleClick}>Click me</div> <!-- No keyboard support -->
<a onClick={doSomething}>Do Action</a> <!-- Should be button -->
```

## ARIA Attributes

**ARIA roles (when semantic HTML isn't enough):**
```html
<!-- Dialog/Modal -->
<div role="dialog" aria-labelledby="dialog-title" aria-modal="true">
  <h2 id="dialog-title">Confirm Action</h2>
  <p>Are you sure?</p>
  <button>Confirm</button>
  <button>Cancel</button>
</div>

<!-- Alert -->
<div role="alert" aria-live="assertive">
  Form submitted successfully!
</div>

<!-- Tab panel -->
<div role="tablist" aria-label="Settings">
  <button role="tab" aria-selected="true" aria-controls="panel1">General</button>
  <button role="tab" aria-selected="false" aria-controls="panel2">Privacy</button>
</div>
<div role="tabpanel" id="panel1" aria-labelledby="tab1">...</div>

<!-- Search landmark -->
<form role="search">
  <input type="search" aria-label="Search site">
</form>
```

**ARIA states and properties:**
```html
<!-- Expanded/collapsed -->
<button aria-expanded="false" aria-controls="menu">
  Menu
</button>
<div id="menu" hidden>...</div>

<!-- Checked state (custom checkbox) -->
<div
  role="checkbox"
  aria-checked="false"
  tabindex="0"
  onKeyDown={handleSpace}
  onClick={toggle}
>
  Option
</div>

<!-- Current item in list -->
<li>
  <a href="/home" aria-current="page">Home</a>
</li>

<!-- Disabled state -->
<button aria-disabled="true" disabled>
  Submit
</button>

<!-- Required field -->
<input
  type="text"
  aria-required="true"
  required
  aria-invalid="false"
  aria-describedby="email-error"
/>
<span id="email-error" role="alert"></span>
```

**ARIA live regions:**
```html
<!-- Polite - wait for pause -->
<div aria-live="polite" aria-atomic="true">
  3 new messages
</div>

<!-- Assertive - interrupt immediately -->
<div role="alert" aria-live="assertive">
  Error: Connection lost
</div>

<!-- Status updates -->
<div role="status" aria-live="polite">
  Saving... <!-- then --> Saved!
</div>
```

## Keyboard Navigation

**Focus management:**
```typescript
// React focus management
import { useRef, useEffect } from 'react'

function Modal({ isOpen, onClose }) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      // Store previous focus
      previousFocus.current = document.activeElement as HTMLElement

      // Focus modal
      modalRef.current?.focus()

      return () => {
        // Restore focus on close
        previousFocus.current?.focus()
      }
    }
  }, [isOpen])

  // Trap focus inside modal
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }

    if (e.key === 'Tab') {
      const focusableElements = modalRef.current?.querySelectorAll(
        'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
      )
      const first = focusableElements?.[0] as HTMLElement
      const last = focusableElements?.[focusableElements.length - 1] as HTMLElement

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last?.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }
  }

  return (
    <div
      ref={modalRef}
      role="dialog"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      aria-modal="true"
    >
      {/* Modal content */}
    </div>
  )
}
```

**Keyboard shortcuts:**
```typescript
// Skip to main content
<a href="#main" className="skip-link">
  Skip to main content
</a>

<main id="main" tabIndex={-1}>
  {/* Content */}
</main>

// Custom keyboard handlers
const handleKeyDown = (e: KeyboardEvent) => {
  // Arrow navigation in list
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    focusNextItem()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    focusPreviousItem()
  }
  // Home/End for first/last
  else if (e.key === 'Home') {
    e.preventDefault()
    focusFirstItem()
  } else if (e.key === 'End') {
    e.preventDefault()
    focusLastItem()
  }
  // Enter/Space to activate
  else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    activateItem()
  }
}
```

**Focus indicators:**
```css
/* Never remove focus outline without replacement */
/* Bad */
*:focus { outline: none; }

/* Good - enhanced focus indicator */
*:focus {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

/* Focus visible (keyboard only) */
*:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

*:focus:not(:focus-visible) {
  outline: none;
}
```

## Accessible Forms

**Labels and descriptions:**
```html
<!-- Always label inputs -->
<label for="email">Email Address</label>
<input
  id="email"
  type="email"
  required
  aria-describedby="email-hint email-error"
/>
<span id="email-hint">We'll never share your email</span>
<span id="email-error" role="alert"></span>

<!-- Fieldset for grouped inputs -->
<fieldset>
  <legend>Shipping Address</legend>
  <label for="street">Street</label>
  <input id="street" type="text" />

  <label for="city">City</label>
  <input id="city" type="text" />
</fieldset>

<!-- Radio buttons -->
<fieldset>
  <legend>Choose payment method</legend>
  <label>
    <input type="radio" name="payment" value="card" />
    Credit Card
  </label>
  <label>
    <input type="radio" name="payment" value="paypal" />
    PayPal
  </label>
</fieldset>
```

**Error handling:**
```tsx
function EmailInput({ value, onChange }) {
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)

  const validate = (email: string) => {
    if (!email) return 'Email is required'
    if (!email.includes('@')) return 'Invalid email format'
    return ''
  }

  const handleBlur = () => {
    setTouched(true)
    setError(validate(value))
  }

  return (
    <div>
      <label htmlFor="email">Email Address *</label>
      <input
        id="email"
        type="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        aria-required="true"
        aria-invalid={touched && !!error}
        aria-describedby={error ? 'email-error' : undefined}
      />
      {touched && error && (
        <span id="email-error" role="alert" className="error">
          {error}
        </span>
      )}
    </div>
  )
}
```

## Screen Reader Optimization

**Descriptive text:**
```html
<!-- Icon buttons need labels -->
<button aria-label="Close modal">
  <XIcon />
</button>

<!-- Images need alt text -->
<img src="chart.png" alt="Sales increased 25% in Q3" />

<!-- Decorative images -->
<img src="divider.png" alt="" role="presentation" />

<!-- Hidden but available to screen readers -->
<span className="sr-only">
  New notifications: 3
</span>

<!-- CSS for sr-only -->
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

**Announcements:**
```typescript
// Announce dynamic content changes
function useAnnouncement() {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div')
    announcement.setAttribute('role', 'status')
    announcement.setAttribute('aria-live', priority)
    announcement.className = 'sr-only'
    announcement.textContent = message

    document.body.appendChild(announcement)

    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  return announce
}

// Usage
const announce = useAnnouncement()
announce('Item added to cart', 'polite')
announce('Error: Payment failed', 'assertive')
```

## Color and Contrast

**WCAG contrast requirements:**
```css
/* Level AA: 4.5:1 for normal text, 3:1 for large text */
/* Level AAA: 7:1 for normal text, 4.5:1 for large text */

/* Good contrast */
.text {
  color: #333;
  background: #fff;
  /* Contrast ratio: 12.6:1 */
}

/* Large text (18pt+ or 14pt+ bold) */
.heading {
  color: #666;
  background: #fff;
  font-size: 24px;
  /* Contrast ratio: 5.7:1 - OK for large text */
}

/* Never rely on color alone */
/* Bad */
.error { color: red; }

/* Good - use icon + color */
.error {
  color: #d32f2f;
}
.error::before {
  content: "⚠ ";
}
```

## Testing Tools

```typescript
// Automated testing with jest-axe
import { axe, toHaveNoViolations } from 'jest-axe'
expect.extend(toHaveNoViolations)

test('component is accessible', async () => {
  const { container } = render(<MyComponent />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})

// Manual testing checklist:
// 1. Navigate with keyboard only (Tab, Shift+Tab, Enter, Space, Arrows)
// 2. Test with screen reader (NVDA, JAWS, VoiceOver)
// 3. Check color contrast (browser DevTools)
// 4. Test at 200% zoom
// 5. Use browser accessibility inspector
```
