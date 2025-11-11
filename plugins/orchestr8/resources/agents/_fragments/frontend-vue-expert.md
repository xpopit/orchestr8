---
id: frontend-vue-expert
category: agent
tags: [vue, vue3, composition-api, reactivity, pinia, vite]
capabilities:
  - Composition API patterns and composables
  - Reactivity system deep understanding
  - Pinia state management
  - TypeScript integration with Vue
  - Performance optimization techniques
useWhen:
  - Building Vue 3 applications with Composition API using setup(), ref/reactive for state, computed properties, and composables for reusable logic
  - Implementing Vue state management with Pinia for stores, getters, actions, and replacing Vuex with simpler API and better TypeScript support
  - Optimizing Vue performance with v-memo for expensive renders, keep-alive for component caching, and async components with defineAsyncComponent for code splitting
  - Handling Vue forms with v-model two-way binding, custom v-model implementation, validation with Vee-Validate, and form submission handling
  - Implementing Vue Router with navigation guards (beforeEach, beforeEnter), dynamic routing, nested routes, and lazy loading routes for performance
  - Testing Vue components with Vue Test Utils and Jest using mount/shallowMount, testing user interactions with fireEvent, and testing composables in isolation
estimatedTokens: 650
---

# Vue.js Expert

## Composition API Patterns

**Core composables:**
```typescript
import { ref, reactive, computed, watch, watchEffect } from 'vue'

// ref for primitives, reactive for objects
const count = ref(0)
const state = reactive({
  user: null as User | null,
  loading: false
})

// Computed properties
const doubled = computed(() => count.value * 2)
const userName = computed(() => state.user?.name ?? 'Guest')

// Watchers
watch(count, (newVal, oldVal) => {
  console.log(`Count changed from ${oldVal} to ${newVal}`)
})

// Watch multiple sources
watch([count, () => state.loading], ([newCount, newLoading]) => {
  // Triggered when either changes
})

// Immediate side effects
watchEffect(() => {
  // Automatically tracks dependencies
  console.log(`Count is ${count.value}`)
})

// Cleanup in watchEffect
watchEffect((onCleanup) => {
  const controller = new AbortController()
  fetchData(controller.signal)
  onCleanup(() => controller.abort())
})
```

**Custom composables:**
```typescript
import { ref, onMounted, onUnmounted } from 'vue'

// Data fetching composable
export function useFetch<T>(url: Ref<string> | string) {
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)
  const loading = ref(false)

  const fetchData = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(unref(url))
      data.value = await response.json()
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  }

  watch(() => unref(url), fetchData, { immediate: true })

  return { data, error, loading, refetch: fetchData }
}

// Mouse position composable
export function useMouse() {
  const x = ref(0)
  const y = ref(0)

  const update = (event: MouseEvent) => {
    x.value = event.clientX
    y.value = event.clientY
  }

  onMounted(() => window.addEventListener('mousemove', update))
  onUnmounted(() => window.removeEventListener('mousemove', update))

  return { x, y }
}

// Local storage composable with reactivity
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const stored = localStorage.getItem(key)
  const value = ref<T>(stored ? JSON.parse(stored) : defaultValue)

  watch(value, (newVal) => {
    localStorage.setItem(key, JSON.stringify(newVal))
  }, { deep: true })

  return value
}

// Debounced ref
export function useDebounce<T>(value: Ref<T>, delay: number) {
  const debounced = ref(value.value) as Ref<T>

  watch(value, (newVal) => {
    const timer = setTimeout(() => {
      debounced.value = newVal
    }, delay)
    return () => clearTimeout(timer)
  })

  return debounced
}
```

## Reactivity Deep Dive

**Understanding ref vs reactive:**
```typescript
// ref - works for primitives and objects, needs .value
const count = ref(0)
count.value++

const user = ref({ name: 'Alice' })
user.value.name = 'Bob' // Reactive
user.value = { name: 'Charlie' } // Replacement is reactive

// reactive - only for objects, no .value needed
const state = reactive({ count: 0, user: { name: 'Alice' } })
state.count++
state.user.name = 'Bob' // Reactive
state = { count: 1 } // ERROR - can't reassign reactive object

// toRefs - convert reactive to refs (useful for destructuring)
import { toRefs } from 'vue'
const { count, user } = toRefs(state)
// Now count and user are refs
```

**Reactivity utilities:**
```typescript
import { unref, toRef, toRefs, isRef, isReactive, readonly, shallowRef } from 'vue'

// unref - get value whether ref or not
const value = unref(maybeRef) // Same as: isRef(maybeRef) ? maybeRef.value : maybeRef

// toRef - create ref to reactive property
const props = reactive({ count: 0 })
const count = toRef(props, 'count') // Linked to props.count

// readonly - create readonly proxy
const original = reactive({ count: 0 })
const copy = readonly(original)
// copy.count = 1 // ERROR in development

// shallowRef - only .value is reactive
const state = shallowRef({ count: 0 })
state.value.count++ // NOT reactive
state.value = { count: 1 } // Reactive
```

## Pinia State Management

**Store definition:**
```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Setup store (Composition API style)
export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)
  const userName = computed(() => user.value?.name ?? 'Guest')

  async function login(credentials: Credentials) {
    const response = await api.login(credentials)
    user.value = response.user
    token.value = response.token
  }

  function logout() {
    user.value = null
    token.value = null
  }

  return { user, token, isAuthenticated, userName, login, logout }
})

// Options store (Options API style)
export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0, items: [] as Item[] }),

  getters: {
    doubled: (state) => state.count * 2,
    itemCount: (state) => state.items.length
  },

  actions: {
    increment() { this.count++ },
    async fetchItems() {
      this.items = await api.fetchItems()
    }
  }
})

// Usage in components
const userStore = useUserStore()
userStore.login({ email, password })
console.log(userStore.userName)
```

**Store composition:**
```typescript
// One store using another
export const useCartStore = defineStore('cart', () => {
  const userStore = useUserStore()
  const items = ref<CartItem[]>([])

  const canCheckout = computed(() =>
    userStore.isAuthenticated && items.value.length > 0
  )

  return { items, canCheckout }
})
```

## TypeScript Integration

**Component props and emits:**
```typescript
<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title: string
  count?: number
  items: Item[]
}

interface Emits {
  (e: 'update:count', value: number): void
  (e: 'select', item: Item): void
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
})

const emit = defineEmits<Emits>()

const doubled = computed(() => props.count * 2)

function handleClick(item: Item) {
  emit('select', item)
  emit('update:count', props.count + 1)
}
</script>
```

**Template refs with types:**
```typescript
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const inputRef = ref<HTMLInputElement | null>(null)
const componentRef = ref<InstanceType<typeof MyComponent> | null>(null)

onMounted(() => {
  inputRef.value?.focus()
  componentRef.value?.someMethod()
})
</script>

<template>
  <input ref="inputRef" />
  <MyComponent ref="componentRef" />
</template>
```

## Performance Optimization

**Component lazy loading:**
```typescript
import { defineAsyncComponent } from 'vue'

const AsyncComponent = defineAsyncComponent({
  loader: () => import('./HeavyComponent.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorDisplay,
  delay: 200,
  timeout: 3000
})
```

**v-once and v-memo:**
```vue
<!-- Render once, never update -->
<div v-once>{{ expensiveComputation }}</div>

<!-- Conditional memoization (Vue 3.2+) -->
<div v-memo="[item.id, item.status]">
  <!-- Only re-render if item.id or item.status changes -->
  {{ item.name }} - {{ item.status }}
</div>
```

**Shallow reactivity for large objects:**
```typescript
import { shallowReactive, shallowRef } from 'vue'

// Only top-level properties are reactive
const state = shallowReactive({
  user: { name: 'Alice', profile: { age: 30 } }
})
state.user = { name: 'Bob' } // Reactive
state.user.name = 'Charlie' // NOT reactive
```

## Common Pitfalls

**Losing reactivity:**
```typescript
// Wrong - destructuring loses reactivity
const { count } = reactive({ count: 0 })
count++ // Not reactive

// Right - use toRefs
const { count } = toRefs(reactive({ count: 0 }))
count.value++ // Reactive
```

**Array mutation:**
```typescript
// Reactive array methods
const items = ref([1, 2, 3])
items.value.push(4) // Reactive
items.value[0] = 10 // Reactive
items.value.length = 0 // Reactive
```

**Watch timing:**
```typescript
// Wrong - accessing DOM before update
watch(count, () => {
  console.log(divRef.value?.textContent) // Old value
})

// Right - use nextTick
import { nextTick } from 'vue'
watch(count, async () => {
  await nextTick()
  console.log(divRef.value?.textContent) // New value
})
```
