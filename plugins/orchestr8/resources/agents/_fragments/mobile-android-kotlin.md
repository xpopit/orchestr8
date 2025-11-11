---
id: mobile-android-kotlin
category: agent
tags: [android, kotlin, jetpack-compose, room, coroutines, viewmodel, material-design]
capabilities:
  - Jetpack Compose declarative UI
  - Room database and persistence
  - Kotlin coroutines and Flow
  - Android ViewModel and lifecycle
  - Material Design 3 implementation
  - Android app architecture (MVVM, MVI)
useWhen:
  - Building Android applications with Kotlin using Jetpack Compose for declarative UI or XML layouts with ViewBinding, and ViewModel for lifecycle-aware state
  - Implementing Android navigation with Navigation Component, Fragment transactions, and deep links with intent filters for app linking
  - Managing Android app state with ViewModel + LiveData/StateFlow, Room database for local persistence, and SharedPreferences for key-value storage
  - Integrating Android APIs including Retrofit for networking, Coroutines for async operations, WorkManager for background tasks, and Firebase Cloud Messaging for push
  - Optimizing Android performance with RecyclerView for efficient lists, image loading with Glide/Coil, ProGuard/R8 for code shrinking, and profiling with Android Profiler
  - Testing Android apps with JUnit for unit tests, Espresso for UI tests, and CI/CD integration with GitHub Actions or Bitrise for automated builds
estimatedTokens: 700
---

# Android/Kotlin Expert

## Jetpack Compose Fundamentals

**Declarative UI patterns:**
```kotlin
import androidx.compose.runtime.*
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*

@Composable
fun CounterScreen() {
    var count by remember { mutableStateOf(0) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Count: $count",
            style = MaterialTheme.typography.headlineLarge
        )

        Spacer(modifier = Modifier.height(16.dp))

        Button(onClick = { count++ }) {
            Text("Increment")
        }
    }
}

// State hoisting
@Composable
fun CounterScreen(viewModel: CounterViewModel = viewModel()) {
    val count by viewModel.count.collectAsState()

    CounterContent(
        count = count,
        onIncrement = viewModel::increment
    )
}

@Composable
fun CounterContent(
    count: Int,
    onIncrement: () -> Unit
) {
    Button(onClick = onIncrement) {
        Text("Count: $count")
    }
}

// LazyColumn for lists
@Composable
fun UserList(users: List<User>) {
    LazyColumn {
        items(users, key = { it.id }) { user ->
            UserItem(user)
        }
    }
}

@Composable
fun UserItem(user: User) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(8.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(user.name)
        }
    }
}
```

**Custom composables and modifiers:**
```kotlin
// Custom modifier
fun Modifier.card() = this
    .fillMaxWidth()
    .padding(8.dp)
    .background(
        color = MaterialTheme.colorScheme.surface,
        shape = RoundedCornerShape(8.dp)
    )
    .padding(16.dp)

// Custom composable with slot API
@Composable
fun CustomCard(
    modifier: Modifier = Modifier,
    title: @Composable () -> Unit,
    content: @Composable () -> Unit
) {
    Card(modifier = modifier) {
        Column(modifier = Modifier.padding(16.dp)) {
            ProvideTextStyle(MaterialTheme.typography.titleMedium) {
                title()
            }
            Spacer(modifier = Modifier.height(8.dp))
            content()
        }
    }
}

// Usage
CustomCard(
    title = { Text("Title") },
    content = { Text("Content") }
)

// Remember with keys
@Composable
fun UserDetails(userId: String) {
    val user = remember(userId) {
        fetchUser(userId)
    }
    // Only recomputes when userId changes
}
```

## Android ViewModel & Lifecycle

**ViewModel patterns:**
```kotlin
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class UserListViewModel(
    private val repository: UserRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<UiState>(UiState.Loading)
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()

    private val _users = MutableStateFlow<List<User>>(emptyList())
    val users: StateFlow<List<User>> = _users.asStateFlow()

    init {
        loadUsers()
    }

    fun loadUsers() {
        viewModelScope.launch {
            _uiState.value = UiState.Loading

            repository.getUsers()
                .catch { error ->
                    _uiState.value = UiState.Error(error.message ?: "Unknown error")
                }
                .collect { userList ->
                    _users.value = userList
                    _uiState.value = UiState.Success
                }
        }
    }

    fun deleteUser(userId: String) {
        viewModelScope.launch {
            repository.deleteUser(userId)
        }
    }
}

sealed interface UiState {
    object Loading : UiState
    object Success : UiState
    data class Error(val message: String) : UiState
}

// Compose integration
@Composable
fun UserListScreen(viewModel: UserListViewModel = viewModel()) {
    val uiState by viewModel.uiState.collectAsState()
    val users by viewModel.users.collectAsState()

    when (uiState) {
        is UiState.Loading -> LoadingScreen()
        is UiState.Success -> UserList(users)
        is UiState.Error -> ErrorScreen((uiState as UiState.Error).message)
    }
}
```

**Lifecycle awareness:**
```kotlin
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle

class MainActivity : ComponentActivity() {
    private val viewModel: MyViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        lifecycleScope.launch {
            // Only collect when STARTED (not in background)
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.uiState.collect { state ->
                    updateUI(state)
                }
            }
        }

        setContent {
            MyApp()
        }
    }
}

// In Compose
@Composable
fun UserScreen() {
    val lifecycleOwner = LocalLifecycleOwner.current

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                // Refresh data
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)

        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
        }
    }
}
```

## Kotlin Coroutines & Flow

**Coroutine patterns:**
```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

// Sequential execution
suspend fun loadData() {
    val user = fetchUser()        // Wait
    val posts = fetchPosts(user)  // Then wait
    updateUI(posts)
}

// Parallel execution
suspend fun loadDataParallel() {
    coroutineScope {
        val userDeferred = async { fetchUser() }
        val settingsDeferred = async { fetchSettings() }

        val user = userDeferred.await()
        val settings = settingsDeferred.await()

        updateUI(user, settings)
    }
}

// Flow for streams
fun observeUsers(): Flow<List<User>> = flow {
    while (currentCoroutineContext().isActive) {
        emit(fetchUsers())
        delay(5000) // Poll every 5 seconds
    }
}

// Flow operators
fun searchUsers(query: String): Flow<List<User>> =
    repository.observeUsers()
        .debounce(300)
        .distinctUntilChanged()
        .filter { it.isNotEmpty() }
        .map { users ->
            users.filter { it.name.contains(query, ignoreCase = true) }
        }

// Combining flows
val combinedData: Flow<CombinedData> = combine(
    userFlow,
    settingsFlow,
    postsFlow
) { user, settings, posts ->
    CombinedData(user, settings, posts)
}

// StateFlow for state management
class DataRepository {
    private val _data = MutableStateFlow<List<Item>>(emptyList())
    val data: StateFlow<List<Item>> = _data.asStateFlow()

    suspend fun refresh() {
        _data.value = fetchItems()
    }

    fun addItem(item: Item) {
        _data.update { currentList ->
            currentList + item
        }
    }
}
```

## Room Database

**Entity and DAO patterns:**
```kotlin
import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val id: String,
    @ColumnInfo(name = "user_name") val name: String,
    val email: String,
    @ColumnInfo(name = "created_at") val createdAt: Long
)

@Dao
interface UserDao {
    @Query("SELECT * FROM users ORDER BY user_name ASC")
    fun observeAll(): Flow<List<UserEntity>>

    @Query("SELECT * FROM users WHERE id = :userId")
    suspend fun getById(userId: String): UserEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(user: UserEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(users: List<UserEntity>)

    @Update
    suspend fun update(user: UserEntity)

    @Delete
    suspend fun delete(user: UserEntity)

    @Query("DELETE FROM users WHERE id = :userId")
    suspend fun deleteById(userId: String)

    @Query("SELECT * FROM users WHERE user_name LIKE :query")
    fun search(query: String): Flow<List<UserEntity>>
}

@Database(
    entities = [UserEntity::class],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "app_database"
                )
                .fallbackToDestructiveMigration()
                .build()
                .also { INSTANCE = it }
            }
        }
    }
}

// Repository pattern
class UserRepository(private val userDao: UserDao) {
    val users: Flow<List<User>> = userDao.observeAll()
        .map { entities -> entities.map { it.toUser() } }

    suspend fun getUser(id: String): User? {
        return userDao.getById(id)?.toUser()
    }

    suspend fun addUser(user: User) {
        userDao.insert(user.toEntity())
    }

    suspend fun deleteUser(id: String) {
        userDao.deleteById(id)
    }
}
```

## Navigation

**Jetpack Compose Navigation:**
```kotlin
import androidx.navigation.compose.*
import androidx.navigation.NavType
import androidx.navigation.navArgument

@Composable
fun AppNavigation() {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = "home"
    ) {
        composable("home") {
            HomeScreen(
                onNavigateToDetail = { userId ->
                    navController.navigate("detail/$userId")
                }
            )
        }

        composable(
            route = "detail/{userId}",
            arguments = listOf(
                navArgument("userId") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val userId = backStackEntry.arguments?.getString("userId")
            DetailScreen(
                userId = userId,
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
}

// Type-safe navigation with sealed class
sealed class Screen(val route: String) {
    object Home : Screen("home")
    object Profile : Screen("profile/{userId}") {
        fun createRoute(userId: String) = "profile/$userId"
    }
}

navController.navigate(Screen.Profile.createRoute("123"))
```

## Material Design 3

**Theming:**
```kotlin
import androidx.compose.material3.*

private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF6200EE),
    onPrimary = Color.White,
    secondary = Color(0xFF03DAC6),
    background = Color(0xFFFFFBFE),
    surface = Color(0xFFFFFBFE)
)

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFFBB86FC),
    onPrimary = Color.Black,
    secondary = Color(0xFF03DAC6),
    background = Color(0xFF121212),
    surface = Color(0xFF121212)
)

@Composable
fun AppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
```

## Dependency Injection (Hilt)

**Hilt setup:**
```kotlin
import dagger.hilt.android.HiltAndroidApp
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@HiltAndroidApp
class MyApplication : Application()

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    @Inject lateinit var repository: UserRepository
}

// Module
@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase {
        return AppDatabase.getDatabase(context)
    }

    @Provides
    fun provideUserDao(database: AppDatabase): UserDao {
        return database.userDao()
    }
}

// ViewModel injection
@HiltViewModel
class UserViewModel @Inject constructor(
    private val repository: UserRepository
) : ViewModel() {
    // ...
}

@Composable
fun UserScreen(viewModel: UserViewModel = hiltViewModel()) {
    // ...
}
```

## Common Pitfalls

**Remember in Compose:**
```kotlin
// Bad - recreates list on every recomposition
@Composable
fun MyScreen() {
    val items = mutableListOf<Item>()
}

// Good - remember state
@Composable
fun MyScreen() {
    val items = remember { mutableStateListOf<Item>() }
}
```

**Coroutine scope:**
```kotlin
// Bad - may leak
viewModelScope.launch {
    while (true) {
        delay(1000)
        // Never cancels
    }
}

// Good - check cancellation
viewModelScope.launch {
    while (isActive) {
        delay(1000)
    }
}
```
