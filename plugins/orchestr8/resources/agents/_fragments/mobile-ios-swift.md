---
id: mobile-ios-swift
category: agent
tags: [ios, swift, swiftui, uikit, core-data, combine, concurrency]
capabilities:
  - SwiftUI declarative UI development
  - UIKit programmatic and storyboard patterns
  - Core Data for persistent storage
  - Combine framework for reactive programming
  - Swift concurrency (async/await, actors)
  - iOS app architecture (MVVM, Coordinator)
useWhen:
  - Building iOS applications with Swift using UIKit for UI (programmatic or storyboards), SwiftUI for declarative UI, and Combine for reactive programming
  - Implementing iOS navigation patterns with UINavigationController for hierarchical navigation, UITabBarController for tab-based, and modal presentation
  - Managing iOS app state with property wrappers (@State, @Binding, @ObservedObject, @EnvironmentObject in SwiftUI) or delegates/notifications in UIKit
  - Integrating iOS APIs including Core Data for persistence, URLSession for networking, Core Location for GPS, and Push Notifications (APNs)
  - Optimizing iOS performance with Instruments for profiling, lazy loading, image caching with SDWebImage, and background processing for long-running tasks
  - Testing iOS apps with XCTest for unit tests, XCUITest for UI tests, and continuous integration with Xcode Cloud or Fastlane for automation
estimatedTokens: 680
---

# iOS/Swift Expert

## SwiftUI Fundamentals

**Declarative UI patterns:**
```swift
import SwiftUI

// Basic view composition
struct ContentView: View {
    @State private var count = 0
    @State private var isPresented = false

    var body: some View {
        VStack(spacing: 20) {
            Text("Count: \(count)")
                .font(.largeTitle)
                .foregroundColor(.blue)

            Button("Increment") {
                count += 1
            }
            .buttonStyle(.borderedProminent)

            Button("Show Sheet") {
                isPresented = true
            }
            .sheet(isPresented: $isPresented) {
                DetailView(count: count)
            }
        }
        .padding()
    }
}

// Custom view with binding
struct CounterView: View {
    @Binding var value: Int

    var body: some View {
        Stepper("Value: \(value)", value: $value)
    }
}

// Environment objects for shared state
class AppState: ObservableObject {
    @Published var user: User?
    @Published var theme: Theme = .light
}

struct RootView: View {
    @StateObject private var appState = AppState()

    var body: some View {
        ContentView()
            .environmentObject(appState)
    }
}

struct ChildView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        Text(appState.user?.name ?? "Guest")
    }
}
```

**ViewModifiers and custom views:**
```swift
// Custom view modifier
struct CardStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding()
            .background(Color.white)
            .cornerRadius(10)
            .shadow(radius: 5)
    }
}

extension View {
    func cardStyle() -> some View {
        modifier(CardStyle())
    }
}

// Usage
Text("Hello")
    .cardStyle()

// Custom container view
struct Card<Content: View>: View {
    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        content
            .padding()
            .background(Color.white)
            .cornerRadius(10)
    }
}

// Usage
Card {
    VStack {
        Text("Title")
        Text("Subtitle")
    }
}
```

## UIKit Patterns

**Programmatic UI:**
```swift
import UIKit

class ViewController: UIViewController {
    private let label: UILabel = {
        let label = UILabel()
        label.font = .systemFont(ofSize: 24, weight: .bold)
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()

    private let button: UIButton = {
        let button = UIButton(type: .system)
        button.setTitle("Tap Me", for: .normal)
        button.addTarget(self, action: #selector(handleTap), for: .touchUpInside)
        button.translatesAutoresizingMaskIntoConstraints = false
        return button
    }()

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
    }

    private func setupUI() {
        view.addSubview(label)
        view.addSubview(button)

        NSLayoutConstraint.activate([
            label.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            label.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 20),

            button.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            button.topAnchor.constraint(equalTo: label.bottomAnchor, constant: 20)
        ])
    }

    @objc private func handleTap() {
        label.text = "Tapped!"
    }
}

// Custom UIView
class CustomView: UIView {
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupView()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupView()
    }

    private func setupView() {
        backgroundColor = .white
        layer.cornerRadius = 10
        layer.shadowOpacity = 0.2
        layer.shadowRadius = 5
    }
}
```

**UITableView and UICollectionView:**
```swift
// Modern UITableViewDiffableDataSource
class ListViewController: UIViewController {
    enum Section { case main }

    private var dataSource: UITableViewDiffableDataSource<Section, Item>!
    private let tableView = UITableView()

    override func viewDidLoad() {
        super.viewDidLoad()
        setupTableView()
        configureDataSource()
    }

    private func configureDataSource() {
        dataSource = UITableViewDiffableDataSource<Section, Item>(
            tableView: tableView
        ) { tableView, indexPath, item in
            let cell = tableView.dequeueReusableCell(
                withIdentifier: "Cell",
                for: indexPath
            )
            cell.textLabel?.text = item.name
            return cell
        }

        // Apply snapshot
        var snapshot = NSDiffableDataSourceSnapshot<Section, Item>()
        snapshot.appendSections([.main])
        snapshot.appendItems(items)
        dataSource.apply(snapshot, animatingDifferences: true)
    }
}
```

## Swift Concurrency

**Async/await patterns:**
```swift
// Async function
func fetchUser(id: String) async throws -> User {
    let url = URL(string: "https://api.example.com/users/\(id)")!
    let (data, _) = try await URLSession.shared.data(from: url)
    return try JSONDecoder().decode(User.self, from: data)
}

// Task groups for parallel execution
func fetchMultipleUsers(ids: [String]) async throws -> [User] {
    try await withThrowingTaskGroup(of: User.self) { group in
        for id in ids {
            group.addTask {
                try await fetchUser(id: id)
            }
        }

        var users: [User] = []
        for try await user in group {
            users.append(user)
        }
        return users
    }
}

// Main actor for UI updates
@MainActor
class ViewModel: ObservableObject {
    @Published var users: [User] = []
    @Published var isLoading = false

    func loadUsers() async {
        isLoading = true
        defer { isLoading = false }

        do {
            users = try await fetchMultipleUsers(ids: ["1", "2", "3"])
        } catch {
            print("Failed to load users: \(error)")
        }
    }
}

// Usage in SwiftUI
struct UserListView: View {
    @StateObject private var viewModel = ViewModel()

    var body: some View {
        List(viewModel.users) { user in
            Text(user.name)
        }
        .task {
            await viewModel.loadUsers()
        }
    }
}
```

**Actors for thread safety:**
```swift
actor UserCache {
    private var cache: [String: User] = [:]

    func getUser(id: String) -> User? {
        cache[id]
    }

    func setUser(_ user: User) {
        cache[user.id] = user
    }
}

// Usage
let cache = UserCache()

Task {
    await cache.setUser(user)
    let cached = await cache.getUser(id: "123")
}
```

## Core Data

**Modern Core Data patterns:**
```swift
import CoreData

// NSManagedObject subclass
@objc(User)
class User: NSManagedObject {
    @NSManaged var id: UUID
    @NSManaged var name: String
    @NSManaged var email: String
    @NSManaged var createdAt: Date
}

// Persistent container setup
class PersistenceController {
    static let shared = PersistenceController()

    let container: NSPersistentContainer

    init() {
        container = NSPersistentContainer(name: "Model")
        container.loadPersistentStores { _, error in
            if let error = error {
                fatalError("Core Data failed to load: \(error)")
            }
        }
        container.viewContext.automaticallyMergesChangesFromParent = true
    }

    func save() {
        let context = container.viewContext
        if context.hasChanges {
            do {
                try context.save()
            } catch {
                print("Failed to save: \(error)")
            }
        }
    }
}

// SwiftUI integration
struct ContentView: View {
    @Environment(\.managedObjectContext) private var viewContext

    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \User.name, ascending: true)],
        animation: .default
    )
    private var users: FetchedResults<User>

    var body: some View {
        List(users) { user in
            Text(user.name)
        }
    }
}

// App setup
@main
struct MyApp: App {
    let persistenceController = PersistenceController.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
        }
    }
}
```

## Combine Framework

**Reactive programming:**
```swift
import Combine

class SearchViewModel: ObservableObject {
    @Published var searchText = ""
    @Published var results: [Item] = []

    private var cancellables = Set<AnyCancellable>()

    init() {
        $searchText
            .debounce(for: 0.3, scheduler: DispatchQueue.main)
            .removeDuplicates()
            .filter { !$0.isEmpty }
            .flatMap { query in
                self.search(query: query)
                    .catch { _ in Just([]) }
            }
            .receive(on: DispatchQueue.main)
            .assign(to: &$results)
    }

    private func search(query: String) -> AnyPublisher<[Item], Error> {
        URLSession.shared
            .dataTaskPublisher(for: URL(string: "https://api.example.com/search?q=\(query)")!)
            .map(\.data)
            .decode(type: [Item].self, decoder: JSONDecoder())
            .eraseToAnyPublisher()
    }
}

// Multiple publishers
let publisher1 = Just(1)
let publisher2 = Just(2)

Publishers.Zip(publisher1, publisher2)
    .sink { value1, value2 in
        print(value1, value2)
    }
    .store(in: &cancellables)
```

## App Architecture

**MVVM with Coordinator:**
```swift
// ViewModel
class UserListViewModel: ObservableObject {
    @Published var users: [User] = []
    @Published var error: Error?

    private let userService: UserService

    init(userService: UserService) {
        self.userService = userService
    }

    func loadUsers() async {
        do {
            users = try await userService.fetchUsers()
        } catch {
            self.error = error
        }
    }
}

// Coordinator for navigation
class AppCoordinator {
    let navigationController: UINavigationController

    init(navigationController: UINavigationController) {
        self.navigationController = navigationController
    }

    func start() {
        let viewModel = UserListViewModel(userService: UserService())
        let viewController = UserListViewController(viewModel: viewModel)
        viewController.coordinator = self
        navigationController.pushViewController(viewController, animated: false)
    }

    func showDetail(user: User) {
        let viewModel = UserDetailViewModel(user: user)
        let viewController = UserDetailViewController(viewModel: viewModel)
        navigationController.pushViewController(viewController, animated: true)
    }
}
```

## Common Pitfalls

**Retain cycles:**
```swift
// Bad - strong reference cycle
class ViewController: UIViewController {
    var closure: (() -> Void)?

    func setupClosure() {
        closure = {
            self.view.backgroundColor = .red // Captures self strongly
        }
    }
}

// Good - weak self
closure = { [weak self] in
    self?.view.backgroundColor = .red
}

// Or unowned if self is guaranteed to exist
closure = { [unowned self] in
    self.view.backgroundColor = .red
}
```

**SwiftUI state updates:**
```swift
// Must use @MainActor for published properties
@MainActor
class ViewModel: ObservableObject {
    @Published var data: [Item] = []
}
```
