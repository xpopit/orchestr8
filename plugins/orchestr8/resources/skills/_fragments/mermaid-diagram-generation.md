---
id: mermaid-diagram-generation
category: skill
tags: [mermaid, diagrams, visualization, architecture, c4-model, flowcharts, sequence-diagrams, documentation]
capabilities:
  - Generate C4 model architecture diagrams (Levels 0-3)
  - Create data flow and process flow diagrams
  - Produce sequence diagrams for API and system interactions
  - Design state machines and workflow diagrams
  - Build entity-relationship diagrams for data models
  - Create deployment and infrastructure topology diagrams
useWhen:
  - Documenting system architecture and design decisions
  - Creating technical documentation for codebases
  - Visualizing data flows and business processes
  - Explaining API interactions and async workflows
  - Illustrating database schemas and relationships
  - Adding professional diagrams to Medium technical articles
  - Generating visual documentation for code review
estimatedTokens: 950
---

# Mermaid Diagram Generation

Master the art of creating professional, clear Mermaid diagrams for technical documentation, architecture visualization, and Medium articles.

## Overview

Mermaid is a JavaScript-based diagramming tool that uses markdown-like syntax to generate diagrams. It renders natively in:
- GitHub markdown
- GitLab
- VS Code (with extensions)
- Medium (with code blocks)
- Confluence
- Notion

**Benefits:**
- Version control friendly (text-based)
- Easy to maintain and update
- No external tools required
- Renders consistently across platforms
- Fast to create and iterate

## C4 Model Architecture Diagrams

The C4 model provides a hierarchical approach to documenting software architecture.

### Level 0: System Context

**Purpose**: Show the system and its relationships with users and external systems

**Template:**
```mermaid
C4Context
    title System Context for [Your System Name]
    
    Person(user, "User", "Primary user of the system")
    Person(admin, "Administrator", "System administrator")
    
    System(system, "[Your System]", "Core system being documented")
    
    System_Ext(external1, "External API", "Third-party service")
    SystemDb_Ext(external2, "External Database", "Shared database")
    
    Rel(user, system, "Uses", "HTTPS")
    Rel(admin, system, "Manages", "HTTPS")
    Rel(system, external1, "Calls", "REST/JSON")
    Rel(system, external2, "Reads from", "SQL")
    
    UpdateRelStyle(user, system, $textColor="blue", $lineColor="blue")
```

**When to use:**
- Initial architecture documentation
- Explaining system boundaries
- Stakeholder communication
- Medium article: "How [System] fits in the ecosystem"

### Level 1: Container Diagram

**Purpose**: Show major technology containers (applications, databases, file systems)

**Template:**
```mermaid
C4Container
    title Container Diagram for [Your System]
    
    Person(user, "User", "End user")
    
    System_Boundary(system, "[Your System]") {
        Container(webapp, "Web Application", "React, TypeScript", "User interface")
        Container(api, "API Server", "Node.js, Express", "Business logic and API")
        Container(worker, "Background Worker", "Python", "Async processing")
        ContainerDb(db, "Database", "PostgreSQL", "Stores all data")
        ContainerDb(cache, "Cache", "Redis", "Session and performance cache")
    }
    
    System_Ext(email, "Email Service", "SendGrid")
    System_Ext(cdn, "CDN", "CloudFlare")
    
    Rel(user, webapp, "Uses", "HTTPS")
    Rel(webapp, cdn, "Loads assets from", "HTTPS")
    Rel(webapp, api, "Makes API calls", "JSON/HTTPS")
    Rel(api, db, "Reads/writes", "SQL over TLS")
    Rel(api, cache, "Caches data", "Redis protocol")
    Rel(api, worker, "Enqueues jobs", "Message queue")
    Rel(worker, email, "Sends emails", "HTTPS/API")
```

**When to use:**
- Showing technical architecture
- Deployment planning
- Technology stack explanation
- Medium article: "How we built [System]"

### Level 2: Component Diagram

**Purpose**: Show components within a container and their relationships

**Template:**
```mermaid
C4Component
    title Component Diagram for API Server
    
    Container_Boundary(api, "API Server") {
        Component(router, "Router", "Express Router", "Routes requests")
        Component(auth, "Auth Controller", "Node.js", "Authentication logic")
        Component(resource, "Resource Controller", "Node.js", "Business logic")
        Component(validator, "Validator", "Joi", "Request validation")
        Component(cache, "Cache Manager", "Node.js", "Caching logic")
    }
    
    ContainerDb(db, "Database", "PostgreSQL")
    ContainerDb(redis, "Redis Cache", "Redis")
    
    Rel(router, validator, "Validates requests")
    Rel(router, auth, "Authenticates")
    Rel(router, resource, "Handles")
    Rel(auth, db, "Reads user data")
    Rel(resource, cache, "Checks cache")
    Rel(cache, redis, "Gets/sets")
    Rel(resource, db, "Queries")
```

**When to use:**
- Detailed technical documentation
- Code review preparation
- Onboarding new developers
- Medium article: "Inside the [Component] architecture"

### Level 3: Code Diagram

**Purpose**: Show classes, interfaces, and their relationships (less common with Mermaid)

**Template:**
```mermaid
classDiagram
    class ResourceController {
        +create(data) Resource
        +read(id) Resource
        +update(id, data) Resource
        +delete(id) boolean
        -validate(data) boolean
    }
    
    class ResourceService {
        +findById(id) Resource
        +save(resource) Resource
        +delete(id) boolean
    }
    
    class CacheManager {
        +get(key) any
        +set(key, value, ttl) void
        +invalidate(key) void
    }
    
    class Database {
        <<interface>>
        +query(sql, params) Result
    }
    
    ResourceController --> ResourceService : uses
    ResourceService --> CacheManager : caches with
    ResourceService --> Database : persists to
```

**When to use:**
- Detailed implementation documentation
- Design pattern explanation
- Code refactoring planning

## Data Flow Diagrams

**Purpose**: Show how data moves through a system

### Simple Flow
```mermaid
flowchart LR
    User[User Request] --> API[API Gateway]
    API --> Auth{Authenticated?}
    Auth -->|Yes| Process[Process Request]
    Auth -->|No| Error[Return 401]
    Process --> Cache{In Cache?}
    Cache -->|Hit| Return[Return Response]
    Cache -->|Miss| DB[(Database)]
    DB --> Transform[Transform Data]
    Transform --> Store[Cache Result]
    Store --> Return
    Return --> User
    
    style Auth fill:#5bc0de
    style Cache fill:#d9534f
    style DB fill:#2d7a3e
    style Process fill:#1168bd
```

### Complex Flow with Swimlanes
```mermaid
flowchart TB
    subgraph Client
        A[User Action] --> B[Frontend]
    end
    
    subgraph API Layer
        B --> C{Route}
        C -->|Auth| D[Auth Service]
        C -->|Data| E[Data Service]
    end
    
    subgraph Services
        D --> F[(User DB)]
        E --> G[(Main DB)]
        E --> H[Cache]
    end
    
    subgraph Response
        F --> I[Token]
        G --> J[Data]
        H --> J
        I --> K[Response]
        J --> K
    end
    
    K --> B
```

**When to use:**
- Explaining system processes
- Debugging workflow issues
- Documenting business logic
- Medium article: "How data flows through [System]"

## Sequence Diagrams

**Purpose**: Show interactions between components over time

### API Authentication Flow
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant AuthService
    participant Database
    
    User->>Frontend: Enter credentials
    Frontend->>API: POST /auth/login
    activate API
    API->>AuthService: validateCredentials()
    activate AuthService
    AuthService->>Database: SELECT user WHERE email=?
    Database-->>AuthService: User data
    AuthService->>AuthService: verifyPassword()
    AuthService-->>API: Valid + user data
    deactivate AuthService
    API->>API: generateToken()
    API-->>Frontend: 200 OK + JWT token
    deactivate API
    Frontend->>Frontend: Store token
    Frontend-->>User: Login successful
```

### Async Workflow
```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Queue
    participant Worker
    participant Storage
    
    Client->>API: POST /process (file)
    activate API
    API->>Queue: Enqueue job
    API-->>Client: 202 Accepted (jobId)
    deactivate API
    
    Note over Queue,Worker: Async processing
    
    Worker->>Queue: Poll for jobs
    Queue-->>Worker: Job data
    activate Worker
    Worker->>Worker: Process file
    Worker->>Storage: Save result
    Storage-->>Worker: Success
    Worker->>API: Update job status
    deactivate Worker
    
    Client->>API: GET /jobs/{jobId}
    API-->>Client: Status: complete
```

**When to use:**
- API documentation
- Explaining timing and order of operations
- Debugging race conditions
- Medium article: "How [Feature] works behind the scenes"

## State Machines

**Purpose**: Show states and transitions

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Loading: User requests data
    Loading --> Validating: Data loaded
    Loading --> Error: Load failed
    
    Validating --> Processing: Valid
    Validating --> Error: Invalid
    
    Processing --> Caching: Success
    Processing --> Error: Failed
    
    Caching --> Complete: Cached
    Caching --> Complete: Cache failed (continue)
    
    Complete --> Idle: Reset
    Error --> Idle: Retry
    Error --> [*]: Give up
    Complete --> [*]: Done
    
    note right of Processing
        Heavy computation
        happens here
    end note
```

**When to use:**
- Workflow documentation
- UI state management explanation
- Process lifecycle documentation

## Entity Relationship Diagrams

**Purpose**: Show database schema and relationships

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    USER {
        int id PK
        string email UK
        string name
        datetime created_at
    }
    
    ORDER ||--|{ ORDER_ITEM : contains
    ORDER {
        int id PK
        int user_id FK
        decimal total
        string status
        datetime created_at
    }
    
    PRODUCT ||--o{ ORDER_ITEM : "ordered in"
    PRODUCT {
        int id PK
        string name
        string sku UK
        decimal price
        int stock
    }
    
    ORDER_ITEM {
        int id PK
        int order_id FK
        int product_id FK
        int quantity
        decimal price
    }
```

**When to use:**
- Database design documentation
- Schema migration planning
- Data model explanation
- Medium article: "Database design for [System]"

## Deployment Topology

**Purpose**: Show infrastructure and deployment architecture

```mermaid
flowchart TB
    subgraph Internet
        Users[Users/Clients]
    end
    
    subgraph CDN[CloudFlare CDN]
        CDN1[Edge Servers]
    end
    
    subgraph AWS["AWS (us-east-1)"]
        subgraph ELB[Load Balancer]
            LB[Application LB]
        end
        
        subgraph EC2[Application Tier]
            App1[App Server 1]
            App2[App Server 2]
            App3[App Server 3]
        end
        
        subgraph Data[Data Tier]
            RDS[(RDS PostgreSQL<br/>Multi-AZ)]
            Redis[(ElastiCache<br/>Redis)]
        end
        
        subgraph Storage
            S3[S3 Bucket]
        end
    end
    
    Users --> CDN1
    CDN1 --> LB
    LB --> App1
    LB --> App2
    LB --> App3
    App1 --> RDS
    App2 --> RDS
    App3 --> RDS
    App1 --> Redis
    App2 --> Redis
    App3 --> Redis
    App1 --> S3
    App2 --> S3
    App3 --> S3
    
    style RDS fill:#2d7a3e
    style Redis fill:#d9534f
    style S3 fill:#f0ad4e
```

**When to use:**
- Infrastructure documentation
- Deployment planning
- Scaling strategy explanation
- Medium article: "How we scale [System]"

## Best Practices

### 1. Keep It Simple
- Start with high-level, add detail only when necessary
- Limit diagrams to 7-12 main elements
- Use subgraphs to organize complexity
- Break complex diagrams into multiple simpler ones

### 2. Use Consistent Colors
```
Blue (#1168bd)       - Internal systems
Gray (#999999)       - External systems
Green (#2d7a3e)      - Databases
Red (#d9534f)        - Caches
Orange (#f0ad4e)     - Queues/async
Light Blue (#5bc0de) - User interfaces
```

### 3. Clear Labels
- No abbreviations unless universally understood
- Use descriptive names
- Add technology stack in parentheses
- Include brief descriptions

### 4. Direction Matters
- Top-to-bottom (TB) or Left-to-right (LR) for flows
- Consistent direction within a diagram
- Use arrows to show data/control flow direction

### 5. Add Context
```markdown
# Diagram Title

**Purpose**: What this diagram shows

**Context**: When to reference this diagram

```mermaid
[diagram code]
```

**Key Points:**
- Important aspect 1
- Important aspect 2
- Important aspect 3

**Related Diagrams:**
- [Container Diagram](container.md)
- [Sequence Diagram](sequence-auth.md)
```

### 6. Test Rendering
- Preview in Mermaid Live Editor: https://mermaid.live
- Verify in target platform (GitHub, VS Code, Medium)
- Check on mobile if target audience uses mobile

### 7. Version Control
- Keep diagrams in markdown files
- Track changes in Git
- Add comments for complex logic
- Document diagram purpose in commit messages

## Common Patterns

### API Request Flow
```mermaid
sequenceDiagram
    participant C as Client
    participant A as API
    participant S as Service
    participant D as Database
    
    C->>A: HTTP Request
    activate A
    A->>S: Call service method
    activate S
    S->>D: Query
    D-->>S: Result
    S-->>A: Processed data
    deactivate S
    A-->>C: HTTP Response
    deactivate A
```

### Caching Strategy
```mermaid
flowchart TD
    Request[Request] --> Cache{Check Cache}
    Cache -->|Hit| Return1[Return Cached]
    Cache -->|Miss| Fetch[Fetch from DB]
    Fetch --> Transform[Transform Data]
    Transform --> Store[Update Cache]
    Store --> Return2[Return Data]
```

### Microservices Architecture
```mermaid
C4Container
    System_Boundary(system, "Microservices") {
        Container(api, "API Gateway", "Kong")
        Container(auth, "Auth Service", "Node.js")
        Container(user, "User Service", "Go")
        Container(order, "Order Service", "Python")
        ContainerDb(db1, "User DB", "PostgreSQL")
        ContainerDb(db2, "Order DB", "MongoDB")
    }
    
    Person(user_person, "User")
    
    Rel(user_person, api, "Uses")
    Rel(api, auth, "Authenticates")
    Rel(api, user, "User ops")
    Rel(api, order, "Order ops")
    Rel(user, db1, "Reads/writes")
    Rel(order, db2, "Reads/writes")
```

## Troubleshooting

### Diagram Not Rendering
- Check syntax at https://mermaid.live
- Verify proper indentation
- Ensure closing tags/brackets
- Check for special characters in labels (escape if needed)

### Diagram Too Complex
- Break into multiple diagrams
- Use subgraphs to organize
- Increase level of abstraction
- Focus on one aspect at a time

### Labels Overlapping
- Adjust direction (TB vs LR)
- Shorten label text
- Use line breaks in labels (`<br/>`)
- Increase spacing with empty nodes

## Resources

- **Mermaid Live Editor**: https://mermaid.live (test diagrams)
- **Official Docs**: https://mermaid.js.org
- **C4 Model**: https://c4model.com
- **VS Code Extension**: Mermaid Preview
- **GitHub**: Native rendering support

---

**Master these patterns and you'll create professional diagrams that clarify complex systems!**
