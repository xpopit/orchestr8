---
id: frontend-performance
category: agent
tags: [performance, optimization, bundle-size, lazy-loading, rendering, web-vitals]
capabilities:
  - Bundle size optimization and code splitting
  - Lazy loading strategies (images, components, routes)
  - Rendering performance optimization
  - Web Vitals measurement and improvement
  - Network performance patterns
useWhen:
  - Optimizing frontend performance with lazy loading images (loading="lazy"), code splitting with dynamic imports, and tree shaking to eliminate dead code
  - Implementing efficient rendering strategies using virtualization for long lists (react-window, vue-virtual-scroller), memoization, and avoiding unnecessary re-renders
  - Optimizing asset delivery with image optimization (WebP, AVIF), minification/compression (gzip, brotli), and CDN integration for static assets
  - Measuring performance using Core Web Vitals (LCP, FID, CLS), Lighthouse audits, and real user monitoring (RUM) with tools like Sentry or Datadog
  - Implementing caching strategies including service workers for offline support, HTTP caching headers (Cache-Control, ETag), and localStorage/IndexedDB for client-side data
  - Optimizing JavaScript bundle size by analyzing with webpack-bundle-analyzer, removing unused dependencies, and using modern ES modules for better tree shaking
estimatedTokens: 700
---

# Frontend Performance Expert

## Bundle Size Optimization

**Code splitting strategies:**
```typescript
// Route-based splitting (React)
import { lazy, Suspense } from 'react'
const Dashboard = lazy(() => import('./Dashboard'))

// Route-based splitting (Vue)
import { defineAsyncComponent } from 'vue'
const routes = [
  { path: '/dashboard', component: () => import('./Dashboard.vue') }
]

// Component-based splitting
const HeavyChart = lazy(() => import('./HeavyChart'))
<Suspense fallback={<Spinner />}>
  <HeavyChart data={data} />
</Suspense>

// Library splitting with dynamic imports
const loadLodash = async () => {
  const _ = await import('lodash-es')
  return _.debounce
}

// Preload on interaction
const preloadDashboard = () => import('./Dashboard')
<Link to="/dashboard" onMouseEnter={preloadDashboard}>
```

**Webpack/Vite optimization:**
```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['@mui/material', '@emotion/react'],
          'vendor-utils': ['lodash-es', 'date-fns']
        }
      }
    },
    chunkSizeWarningLimit: 500,
    // Enable tree-shaking
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
}

// Analyze bundle
import { visualizer } from 'rollup-plugin-visualizer'
plugins: [visualizer({ open: true })]
```

**Tree-shaking optimization:**
```typescript
// Wrong - imports entire library
import _ from 'lodash'
const result = _.debounce(fn)

// Right - import specific function
import debounce from 'lodash-es/debounce'
const result = debounce(fn)

// Wrong - imports all icons
import * as Icons from '@mui/icons-material'
<Icons.Search />

// Right - import specific icon
import SearchIcon from '@mui/icons-material/Search'
<SearchIcon />
```

## Lazy Loading Assets

**Image lazy loading:**
```tsx
// Native lazy loading
<img src="hero.jpg" loading="lazy" alt="Hero" />

// Progressive image loading
function ProgressiveImage({ placeholder, src, alt }) {
  const [imgSrc, setImgSrc] = useState(placeholder)
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    const img = new Image()
    img.src = src
    img.onload = () => {
      setImgSrc(src)
      setLoading(false)
    }
  }, [src])

  return (
    <img
      src={imgSrc}
      alt={alt}
      style={{ filter: isLoading ? 'blur(10px)' : 'none' }}
    />
  )
}

// Intersection Observer for custom lazy loading
function useLazyLoad() {
  const ref = useRef<HTMLImageElement>(null)
  const [isVisible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '50px' }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return [ref, isVisible] as const
}

// Usage
const [ref, isVisible] = useLazyLoad()
<img ref={ref} src={isVisible ? actualSrc : placeholder} />
```

**Font optimization:**
```css
/* Preload critical fonts */
<link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin>

/* Font display strategy */
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  font-display: swap; /* Shows fallback immediately, swaps when loaded */
}

/* Subset fonts to reduce size */
/* Include only needed characters/languages */
```

## Rendering Performance

**Virtualization for long lists:**
```typescript
// React Window
import { FixedSizeList as List } from 'react-window'

const VirtualList = ({ items }) => (
  <List
    height={600}
    itemCount={items.length}
    itemSize={50}
    width="100%"
  >
    {({ index, style }) => (
      <div style={style}>
        {items[index].name}
      </div>
    )}
  </List>
)

// Vue Virtual Scroller
import { RecycleScroller } from 'vue-virtual-scroller'

<RecycleScroller
  :items="items"
  :item-size="50"
  key-field="id"
  v-slot="{ item }"
>
  <div>{{ item.name }}</div>
</RecycleScroller>
```

**Debouncing and throttling:**
```typescript
// Debounce - wait for pause in events
function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  const timeoutRef = useRef<number>()

  return useCallback((...args: Parameters<T>) => {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => fn(...args), delay)
  }, [fn, delay]) as T
}

// Throttle - limit execution rate
function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  const lastRun = useRef(Date.now())

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastRun.current >= delay) {
      fn(...args)
      lastRun.current = now
    }
  }, [fn, delay]) as T
}

// Usage
const handleSearch = useDebounce((query) => fetchResults(query), 300)
const handleScroll = useThrottle((e) => updateScrollPos(e), 100)
```

**Avoid layout thrashing:**
```typescript
// Wrong - causes multiple reflows
elements.forEach(el => {
  const width = el.offsetWidth // Read
  el.style.width = `${width + 10}px` // Write
})

// Right - batch reads and writes
const widths = elements.map(el => el.offsetWidth) // Read all
elements.forEach((el, i) => {
  el.style.width = `${widths[i] + 10}px` // Write all
})

// Use requestAnimationFrame for visual updates
function smoothUpdate() {
  requestAnimationFrame(() => {
    element.style.transform = `translateX(${x}px)`
  })
}
```

## Web Vitals Optimization

**Largest Contentful Paint (LCP):**
```html
<!-- Preload critical resources -->
<link rel="preload" as="image" href="hero.jpg">
<link rel="preconnect" href="https://api.example.com">

<!-- Optimize images -->
<picture>
  <source srcset="hero.webp" type="image/webp">
  <source srcset="hero.jpg" type="image/jpeg">
  <img src="hero.jpg" alt="Hero" width="1200" height="600">
</picture>

<!-- Use CDN for static assets -->
<!-- Implement server-side rendering for initial paint -->
```

**First Input Delay (FID):**
```typescript
// Break up long tasks
async function processLargeData(items: Item[]) {
  const chunks = chunkArray(items, 100)

  for (const chunk of chunks) {
    await new Promise(resolve => setTimeout(resolve, 0)) // Yield to browser
    processChunk(chunk)
  }
}

// Use web workers for heavy computation
const worker = new Worker('/worker.js')
worker.postMessage({ data: largeDataset })
worker.onmessage = (e) => {
  const result = e.data
  updateUI(result)
}

// Defer non-critical scripts
<script src="analytics.js" defer></script>
```

**Cumulative Layout Shift (CLS):**
```css
/* Always specify dimensions for images/videos */
img, video {
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
}

/* Reserve space for dynamic content */
.skeleton {
  min-height: 200px;
}

/* Use transform instead of layout properties */
/* Good */
.element { transform: translateY(10px); }
/* Bad */
.element { margin-top: 10px; }

/* Preload fonts to avoid FOIT/FOUT */
@font-face {
  font-display: optional; /* Don't swap if not loaded quickly */
}
```

## Network Performance

**Resource hints:**
```html
<!-- DNS prefetch - resolve domain early -->
<link rel="dns-prefetch" href="https://api.example.com">

<!-- Preconnect - establish connection early -->
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>

<!-- Prefetch - load for next navigation -->
<link rel="prefetch" href="/next-page-bundle.js">

<!-- Preload - load for current page -->
<link rel="preload" href="/critical.css" as="style">
```

**Caching strategies:**
```typescript
// Service worker caching
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response

      return fetch(event.request).then((response) => {
        const cloned = response.clone()
        caches.open('v1').then((cache) => {
          cache.put(event.request, cloned)
        })
        return response
      })
    })
  )
})

// HTTP cache headers
Cache-Control: public, max-age=31536000, immutable  // Static assets
Cache-Control: no-cache  // HTML
Cache-Control: private, max-age=3600  // User-specific data
```

**Request optimization:**
```typescript
// Batch API requests
const batchedFetch = debounce(async (ids: string[]) => {
  const response = await fetch(`/api/items?ids=${ids.join(',')}`)
  return response.json()
}, 50)

// Use HTTP/2 multiplexing (multiple requests over one connection)
// Avoid domain sharding with HTTP/2

// Compress responses (enable gzip/brotli on server)
// Use HTTPS (required for HTTP/2)
```

## Monitoring Tools

```typescript
// Web Vitals library
import { getCLS, getFID, getLCP } from 'web-vitals'

getCLS(console.log)
getFID(console.log)
getLCP(console.log)

// Performance Observer
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(entry.name, entry.duration)
  }
})
observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] })

// Custom performance marks
performance.mark('start-render')
// ... rendering logic
performance.mark('end-render')
performance.measure('render-time', 'start-render', 'end-render')
```
