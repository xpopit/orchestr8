---
id: mobile-react-native
category: agent
tags: [react-native, mobile, ios, android, cross-platform, expo, native-modules]
capabilities:
  - React Native cross-platform development
  - Native module integration (iOS/Android)
  - Performance optimization for mobile
  - Platform-specific code patterns
  - Navigation and routing (React Navigation)
  - State management for mobile apps
useWhen:
  - Building cross-platform mobile apps with React Native using functional components, hooks, and native modules for platform-specific functionality (iOS/Android)
  - Implementing navigation with React Navigation including stack, tab, and drawer navigators, deep linking, and navigation state persistence
  - Managing mobile state with Redux, Context API, or Zustand, handling offline scenarios with AsyncStorage, and syncing with backend when online
  - Optimizing React Native performance with FlatList for large lists, Image optimization, reducing bridge calls, and using Hermes JavaScript engine
  - Accessing native APIs using expo modules (camera, location, notifications), react-native-permissions for runtime permissions, and integrating native code when needed
  - Building and deploying React Native apps with EAS Build, over-the-air updates using CodePush, and publishing to App Store/Play Store
estimatedTokens: 700
---

# React Native Expert

## Core Components & APIs

**Essential components:**
```typescript
import {
  View, Text, Image, ScrollView, FlatList,
  TouchableOpacity, TextInput, Modal, SafeAreaView
} from 'react-native'

// SafeAreaView for notch/home indicator
<SafeAreaView style={{ flex: 1 }}>
  <View style={styles.container}>
    <Text style={styles.title}>Hello</Text>
  </View>
</SafeAreaView>

// FlatList for performant lists
<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <ItemRow item={item} />}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  windowSize={10}
  maxToRenderPerBatch={10}
  removeClippedSubviews
/>

// Pressable (modern TouchableOpacity alternative)
import { Pressable } from 'react-native'

<Pressable
  onPress={handlePress}
  style={({ pressed }) => [
    styles.button,
    pressed && styles.pressed
  ]}
>
  <Text>Press Me</Text>
</Pressable>
```

**Platform-specific code:**
```typescript
import { Platform, StyleSheet } from 'react-native'

// Platform.select
const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: { paddingTop: 20 },
      android: { paddingTop: 10 },
      default: { paddingTop: 0 }
    })
  }
})

// Platform.OS check
if (Platform.OS === 'ios') {
  // iOS-specific code
} else if (Platform.OS === 'android') {
  // Android-specific code
}

// Platform-specific files
// Button.ios.tsx
// Button.android.tsx
import Button from './Button' // Auto-selects correct file

// Platform.Version
if (Platform.OS === 'android' && Platform.Version >= 21) {
  // Android API level 21+
}
```

## Navigation

**React Navigation patterns:**
```typescript
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

// Type-safe navigation
type RootStackParamList = {
  Home: undefined
  Profile: { userId: string }
  Settings: { section?: string }
}

const Stack = createNativeStackNavigator<RootStackParamList>()

function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#f4511e' },
          headerTintColor: '#fff'
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Home' }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={({ route }) => ({
            title: `User ${route.params.userId}`
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

// Using navigation in components
import { NativeStackScreenProps } from '@react-navigation/native-stack'

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>

function HomeScreen({ navigation, route }: Props) {
  return (
    <Button
      title="Go to Profile"
      onPress={() =>
        navigation.navigate('Profile', { userId: '123' })
      }
    />
  )
}

// Tab navigation
const Tab = createBottomTabNavigator()

<Tab.Navigator>
  <Tab.Screen
    name="Home"
    component={HomeScreen}
    options={{
      tabBarIcon: ({ color, size }) => (
        <Icon name="home" color={color} size={size} />
      )
    }}
  />
</Tab.Navigator>
```

## Styling

**StyleSheet best practices:**
```typescript
import { StyleSheet, Dimensions } from 'react-native'

const { width, height } = Dimensions.get('window')

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16
  },
  // Flexbox is default layout
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  // Percentage-based widths
  half: {
    width: '50%'
  },
  // Absolute positioning
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)'
  }
})

// Dynamic styles
const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.background,
    color: theme.text
  }
})

// Responsive design
const isTablet = width >= 768
const fontSize = isTablet ? 18 : 14
```

## Performance Optimization

**React optimization:**
```typescript
import { memo, useCallback, useMemo } from 'react'
import { FlatList } from 'react-native'

// Memoize components
const ItemRow = memo(({ item, onPress }) => (
  <TouchableOpacity onPress={() => onPress(item.id)}>
    <Text>{item.name}</Text>
  </TouchableOpacity>
), (prev, next) => prev.item.id === next.item.id)

// Stable callbacks
const handlePress = useCallback((id: string) => {
  navigation.navigate('Detail', { id })
}, [navigation])

// FlatList optimization
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={keyExtractor}
  // Performance props
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={10}
  removeClippedSubviews
  // Separate item layout calculation
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index
  })}
/>
```

**Image optimization:**
```typescript
import { Image } from 'react-native'
import FastImage from 'react-native-fast-image' // Better performance

// Use FastImage for remote images
<FastImage
  source={{
    uri: 'https://example.com/image.jpg',
    priority: FastImage.priority.high,
    cache: FastImage.cacheControl.immutable
  }}
  resizeMode={FastImage.resizeMode.cover}
  style={{ width: 200, height: 200 }}
/>

// Optimize image sizes
// Use appropriate resolutions (1x, 2x, 3x)
import logo from './logo.png' // Includes logo@2x.png, logo@3x.png

<Image
  source={logo}
  style={{ width: 100, height: 100 }}
  resizeMode="contain"
/>
```

## Native Modules

**Bridging native code:**
```typescript
// JavaScript side
import { NativeModules } from 'react-native'

const { CalendarModule } = NativeModules

interface CalendarModuleInterface {
  createEvent: (name: string, location: string) => Promise<string>
}

const Calendar = NativeModules.CalendarModule as CalendarModuleInterface

// Usage
async function createCalendarEvent() {
  try {
    const eventId = await Calendar.createEvent('Birthday', 'Home')
    console.log(`Created event with id ${eventId}`)
  } catch (e) {
    console.error(e)
  }
}
```

**iOS native module (Swift):**
```swift
// CalendarModule.swift
@objc(CalendarModule)
class CalendarModule: NSObject {
  @objc
  func createEvent(_ name: String, location: String,
                   resolver: @escaping RCTPromiseResolveBlock,
                   rejecter: @escaping RCTPromiseRejectBlock) {
    // Native implementation
    let eventId = UUID().uuidString
    resolver(eventId)
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}

// CalendarModule.m
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(CalendarModule, NSObject)
RCT_EXTERN_METHOD(createEvent:(NSString *)name
                  location:(NSString *)location
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
@end
```

**Android native module (Kotlin):**
```kotlin
// CalendarModule.kt
class CalendarModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "CalendarModule"

  @ReactMethod
  fun createEvent(name: String, location: String, promise: Promise) {
    try {
      val eventId = UUID.randomUUID().toString()
      promise.resolve(eventId)
    } catch (e: Exception) {
      promise.reject("CREATE_EVENT_ERROR", e)
    }
  }
}

// CalendarPackage.kt
class CalendarPackage : ReactPackage {
  override fun createNativeModules(
    reactContext: ReactApplicationContext
  ): List<NativeModule> {
    return listOf(CalendarModule(reactContext))
  }

  override fun createViewManagers(
    reactContext: ReactApplicationContext
  ): List<ViewManager<*, *>> {
    return emptyList()
  }
}
```

## State Management

**Context + useReducer:**
```typescript
import { createContext, useContext, useReducer } from 'react'

type State = {
  user: User | null
  theme: 'light' | 'dark'
}

type Action =
  | { type: 'SET_USER'; user: User }
  | { type: 'TOGGLE_THEME' }

const AppContext = createContext<{
  state: State
  dispatch: React.Dispatch<Action>
} | null>(null)

function appReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.user }
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' }
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, {
    user: null,
    theme: 'light'
  })

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be within AppProvider')
  return context
}
```

## Async Storage

**Persisting data:**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage'

// Store data
const storeData = async (key: string, value: any) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('Failed to save data', e)
  }
}

// Retrieve data
const getData = async (key: string) => {
  try {
    const value = await AsyncStorage.getItem(key)
    return value ? JSON.parse(value) : null
  } catch (e) {
    console.error('Failed to fetch data', e)
  }
}

// Remove data
const removeData = async (key: string) => {
  try {
    await AsyncStorage.removeItem(key)
  } catch (e) {
    console.error('Failed to remove data', e)
  }
}
```

## Debugging

**React Native Debugger:**
```typescript
// Enable debugging
import { LogBox } from 'react-native'

// Ignore specific warnings
LogBox.ignoreLogs(['Warning: ...'])

// Performance monitoring
import { InteractionManager } from 'react-native'

InteractionManager.runAfterInteractions(() => {
  // Heavy task after animations complete
  processData()
})

// Network inspection
import { XMLHttpRequest } from 'react-native'
global.XMLHttpRequest = global.originalXMLHttpRequest || XMLHttpRequest

// Flipper integration (iOS/Android)
// View network requests, AsyncStorage, Redux state, etc.
```

## Common Pitfalls

**Avoid inline functions in render:**
```typescript
// Bad - creates new function every render
<FlatList renderItem={(item) => <Item {...item} />} />

// Good - stable reference
const renderItem = useCallback(({ item }) => <Item {...item} />, [])
<FlatList renderItem={renderItem} />
```

**Handle keyboard properly:**
```typescript
import { KeyboardAvoidingView, Platform } from 'react-native'

<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={{ flex: 1 }}
>
  <TextInput />
</KeyboardAvoidingView>
```
