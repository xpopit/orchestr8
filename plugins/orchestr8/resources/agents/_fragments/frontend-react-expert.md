---
id: frontend-react-expert
category: agent
tags: [react, hooks, jsx, performance, state-management, context, refs]
capabilities:
  - React hooks patterns and custom hooks
  - Performance optimization techniques
  - State management with Context API and reducers
  - Ref patterns and DOM manipulation
  - Component composition and prop drilling solutions
useWhen:
  - Building React applications with functional components, hooks (useState, useEffect, useContext, useReducer), and custom hooks for reusable logic
  - Implementing state management using Context API for simple cases, Redux Toolkit for complex state with immer, or Zustand/Jotai for lightweight alternatives
  - Optimizing React performance with React.memo for component memoization, useMemo/useCallback for expensive calculations, and code splitting with React.lazy
  - Handling React forms with controlled components, validation libraries (React Hook Form, Formik), and error handling with error boundaries
  - Implementing React routing with React Router including nested routes, protected routes with authentication guards, and lazy loading routes for code splitting
  - Testing React components with React Testing Library using user-centric queries (getByRole, getByLabelText), fireEvent for interactions, and async utilities (waitFor, findBy)
estimatedTokens: 680
---

# React Expert

## Hooks Patterns

**Core hooks mastery:**
```typescript
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

// useState with functional updates
const [count, setCount] = useState(0)
setCount(c => c + 1) // Avoids stale closure

// useEffect cleanup and dependencies
useEffect(() => {
  const controller = new AbortController()
  fetchData(controller.signal)
  return () => controller.abort() // Cleanup
}, [query]) // Dependency array

// useCallback for stable references
const handleClick = useCallback((id: string) => {
  setItems(prev => prev.filter(item => item.id !== id))
}, []) // Empty deps - function never changes

// useMemo for expensive computations
const sorted = useMemo(
  () => items.sort((a, b) => a.value - b.value),
  [items]
)

// useRef for DOM and mutable values
const inputRef = useRef<HTMLInputElement>(null)
const renderCount = useRef(0)
renderCount.current++ // Doesn't trigger re-render
```

**Custom hooks patterns:**
```typescript
// Data fetching hook
function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    fetch(url, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (!cancelled) {
          setData(data)
          setLoading(false)
        }
      })
      .catch(err => !cancelled && setError(err))

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [url])

  return { data, loading, error }
}

// Debounced input hook
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

// Previous value hook
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>()
  useEffect(() => { ref.current = value }, [value])
  return ref.current
}

// Intersection observer hook
function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      options
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [options])

  return [ref, inView] as const
}
```

## Performance Optimization

**Memoization strategies:**
```typescript
import { memo, useMemo, useCallback } from 'react'

// Memoize component
const ExpensiveList = memo(({ items, onSelect }) => (
  <>{items.map(item => <Item key={item.id} {...item} onSelect={onSelect} />)}</>
), (prev, next) => {
  // Custom comparison - only re-render if items changed
  return prev.items === next.items
})

// Avoid inline objects/arrays in props
// Bad - creates new object every render
<Component style={{ margin: 10 }} />

// Good - define outside or use useMemo
const style = useMemo(() => ({ margin: 10 }), [])
<Component style={style} />

// Virtualization for long lists
import { FixedSizeList } from 'react-window'

const VirtualList = ({ items }) => (
  <FixedSizeList
    height={600}
    itemCount={items.length}
    itemSize={50}
    width="100%"
  >
    {({ index, style }) => (
      <div style={style}>{items[index].name}</div>
    )}
  </FixedSizeList>
)
```

**Code splitting:**
```typescript
import { lazy, Suspense } from 'react'

// Lazy load components
const Dashboard = lazy(() => import('./Dashboard'))
const Settings = lazy(() => import('./Settings'))

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  )
}

// Preload on hover
const preloadDashboard = () => import('./Dashboard')
<Link to="/dashboard" onMouseEnter={preloadDashboard}>Dashboard</Link>
```

## State Management

**Context + useReducer pattern:**
```typescript
import { createContext, useContext, useReducer, ReactNode } from 'react'

type State = { count: number; items: Item[] }
type Action =
  | { type: 'INCREMENT' }
  | { type: 'ADD_ITEM'; item: Item }
  | { type: 'REMOVE_ITEM'; id: string }

const StateContext = createContext<State | null>(null)
const DispatchContext = createContext<React.Dispatch<Action> | null>(null)

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INCREMENT':
      return { ...state, count: state.count + 1 }
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.item] }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.id !== action.id) }
  }
}

function Provider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { count: 0, items: [] })

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  )
}

// Custom hooks for consuming context
function useState() {
  const state = useContext(StateContext)
  if (!state) throw new Error('useState must be used within Provider')
  return state
}

function useDispatch() {
  const dispatch = useContext(DispatchContext)
  if (!dispatch) throw new Error('useDispatch must be used within Provider')
  return dispatch
}
```

## Ref Patterns

**DOM manipulation and imperative APIs:**
```typescript
import { useRef, useImperativeHandle, forwardRef } from 'react'

// Expose imperative methods
interface InputHandle {
  focus: () => void
  clear: () => void
}

const FancyInput = forwardRef<InputHandle, Props>((props, ref) => {
  const inputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    clear: () => { if (inputRef.current) inputRef.current.value = '' }
  }))

  return <input ref={inputRef} {...props} />
})

// Parent usage
const Parent = () => {
  const inputRef = useRef<InputHandle>(null)
  return (
    <>
      <FancyInput ref={inputRef} />
      <button onClick={() => inputRef.current?.focus()}>Focus</button>
    </>
  )
}
```

## Common Pitfalls

**Stale closures:**
```typescript
// Wrong - event handler captures old state
const [count, setCount] = useState(0)
useEffect(() => {
  const interval = setInterval(() => console.log(count), 1000)
  return () => clearInterval(interval)
}, []) // Always logs 0

// Right - use ref or functional update
const countRef = useRef(count)
useEffect(() => { countRef.current = count }, [count])
```

**Unnecessary re-renders:**
```typescript
// Wrong - new object every render
const value = { user, theme }
<Context.Provider value={value}>

// Right - memoize
const value = useMemo(() => ({ user, theme }), [user, theme])
```

**Effect dependencies:**
```typescript
// Wrong - missing dependency
useEffect(() => {
  fetchData(userId)
}, []) // Should include userId

// Right - include all dependencies or use callback
useEffect(() => {
  fetchData(userId)
}, [userId])
```
