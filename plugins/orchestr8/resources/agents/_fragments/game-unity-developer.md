---
id: game-unity-developer
category: agent
tags: [game-dev, unity, csharp, physics, optimization, multiplayer, unity-3d, gameplay]
capabilities:
  - Unity engine architecture and best practices
  - C# scripting for gameplay systems
  - Physics simulation and collision handling
  - Performance optimization for games
  - Multiplayer networking with Netcode/Mirror
useWhen:
  - Developing Unity games in C# using MonoBehaviour lifecycle (Awake, Start, Update, FixedUpdate), GameObject/Component architecture, and prefabs for reusable objects
  - Implementing Unity physics with Rigidbody for physics simulation, Collider for collision detection, raycasting for line-of-sight checks, and Physics layers for selective collision
  - Building Unity UI with Canvas, UI Toolkit (formerly UIElements), TextMeshPro for text rendering, and UI animation with DOTween or Animator
  - Managing Unity game state with ScriptableObjects for data assets, singletons for global managers, and event systems for decoupled communication
  - Optimizing Unity performance through object pooling, occlusion culling, LOD (Level of Detail), batching, and profiling with Unity Profiler
  - Building and deploying Unity games to multiple platforms (iOS, Android, WebGL, PC) with platform-specific builds, asset bundles for downloadable content, and cloud saves
estimatedTokens: 680
---

# Unity Game Developer Expert

Expert in Unity engine development, C# scripting, physics, optimization, and multiplayer systems.

## Unity Architecture Patterns

### MonoBehaviour Lifecycle
```csharp
public class GameController : MonoBehaviour
{
    void Awake() {
        // Initialize before Start, components exist
        Debug.Log("Awake - refs and initialization");
    }

    void Start() {
        // Initialize after all Awake calls complete
        Debug.Log("Start - begin game logic");
    }

    void FixedUpdate() {
        // Physics calculations (0.02s intervals)
        HandlePhysics();
    }

    void Update() {
        // Per-frame logic (variable time)
        HandleInput();
    }

    void LateUpdate() {
        // After all Update calls (camera follow)
        FollowPlayer();
    }
}
```

### ScriptableObject Architecture
```csharp
// Data-driven design
[CreateAssetMenu(fileName = "WeaponData", menuName = "Game/Weapon")]
public class WeaponData : ScriptableObject
{
    public string weaponName;
    public int damage;
    public float fireRate;
    public GameObject projectilePrefab;

    public void Fire(Vector3 position, Vector3 direction)
    {
        var projectile = Instantiate(projectilePrefab, position, Quaternion.identity);
        projectile.GetComponent<Projectile>().Initialize(damage, direction);
    }
}

// Usage
public class Weapon : MonoBehaviour
{
    [SerializeField] private WeaponData weaponData;

    void Fire() => weaponData.Fire(transform.position, transform.forward);
}
```

### Event System
```csharp
// Decoupled communication
public class GameEvents
{
    public static event Action<int> OnScoreChanged;
    public static event Action<Enemy> OnEnemyDied;
    public static event Action OnGameOver;

    public static void TriggerScoreChanged(int newScore)
        => OnScoreChanged?.Invoke(newScore);
}

// Listener
public class UIController : MonoBehaviour
{
    void OnEnable() => GameEvents.OnScoreChanged += UpdateScore;
    void OnDisable() => GameEvents.OnScoreChanged -= UpdateScore;

    void UpdateScore(int score) => scoreText.text = $"Score: {score}";
}
```

## Physics Best Practices

### Rigidbody Movement
```csharp
public class PlayerMovement : MonoBehaviour
{
    [SerializeField] private float moveSpeed = 5f;
    [SerializeField] private float jumpForce = 10f;

    private Rigidbody rb;
    private bool isGrounded;

    void Awake() => rb = GetComponent<Rigidbody>();

    void FixedUpdate()
    {
        // Use FixedUpdate for physics
        float h = Input.GetAxis("Horizontal");
        float v = Input.GetAxis("Vertical");

        Vector3 movement = new Vector3(h, 0, v) * moveSpeed;

        // Velocity-based movement (preserves physics)
        rb.velocity = new Vector3(movement.x, rb.velocity.y, movement.z);

        // Or force-based (more realistic)
        // rb.AddForce(movement, ForceMode.Force);
    }

    void Update()
    {
        // Input in Update, physics in FixedUpdate
        if (Input.GetButtonDown("Jump") && isGrounded)
        {
            rb.AddForce(Vector3.up * jumpForce, ForceMode.Impulse);
        }
    }

    void OnCollisionStay(Collision collision)
    {
        isGrounded = collision.gameObject.CompareTag("Ground");
    }
}
```

### Collision Detection
```csharp
// Trigger-based detection (no physics response)
void OnTriggerEnter(Collider other)
{
    if (other.CompareTag("Pickup"))
    {
        Collect(other.gameObject);
        Destroy(other.gameObject);
    }
}

// Collision-based (physics response)
void OnCollisionEnter(Collision collision)
{
    if (collision.gameObject.CompareTag("Enemy"))
    {
        TakeDamage(collision.relativeVelocity.magnitude);
    }
}

// Raycast for precision
bool IsGrounded()
{
    return Physics.Raycast(transform.position, Vector3.down,
        groundDistance, groundLayer);
}
```

## Performance Optimization

### Object Pooling
```csharp
public class ObjectPool : MonoBehaviour
{
    [SerializeField] private GameObject prefab;
    [SerializeField] private int poolSize = 20;

    private Queue<GameObject> pool = new Queue<GameObject>();

    void Start()
    {
        for (int i = 0; i < poolSize; i++)
        {
            var obj = Instantiate(prefab);
            obj.SetActive(false);
            pool.Enqueue(obj);
        }
    }

    public GameObject Get()
    {
        if (pool.Count > 0)
        {
            var obj = pool.Dequeue();
            obj.SetActive(true);
            return obj;
        }
        return Instantiate(prefab);
    }

    public void Return(GameObject obj)
    {
        obj.SetActive(false);
        pool.Enqueue(obj);
    }
}
```

### LOD (Level of Detail)
```csharp
// Automatic LOD groups
LODGroup lodGroup = gameObject.AddComponent<LODGroup>();
LOD[] lods = new LOD[3];

lods[0] = new LOD(0.6f, highDetailRenderers);
lods[1] = new LOD(0.3f, mediumDetailRenderers);
lods[2] = new LOD(0.1f, lowDetailRenderers);

lodGroup.SetLODs(lods);
```

### Culling and Occlusion
```csharp
// Frustum culling (automatic)
// Occlusion culling (bake in editor)

// Manual distance culling
void Update()
{
    float distance = Vector3.Distance(transform.position, player.position);

    if (distance > maxRenderDistance)
        GetComponent<Renderer>().enabled = false;
    else
        GetComponent<Renderer>().enabled = true;
}
```

## Multiplayer with Unity Netcode

### NetworkManager Setup
```csharp
using Unity.Netcode;

public class PlayerController : NetworkBehaviour
{
    [SerializeField] private float moveSpeed = 5f;

    void Update()
    {
        // Only allow local player to control
        if (!IsOwner) return;

        float h = Input.GetAxis("Horizontal");
        float v = Input.GetAxis("Vertical");

        Vector3 movement = new Vector3(h, 0, v) * moveSpeed * Time.deltaTime;
        transform.Translate(movement);
    }

    [ServerRpc]
    void ShootServerRpc(Vector3 direction)
    {
        // Server validates and spawns projectile
        var projectile = Instantiate(projectilePrefab, transform.position, Quaternion.identity);
        projectile.GetComponent<NetworkObject>().Spawn();
    }
}
```

### Network Variables
```csharp
public class PlayerHealth : NetworkBehaviour
{
    private NetworkVariable<int> health = new NetworkVariable<int>(
        100,
        NetworkVariableReadPermission.Everyone,
        NetworkVariableWritePermission.Server
    );

    public override void OnNetworkSpawn()
    {
        health.OnValueChanged += OnHealthChanged;
    }

    void OnHealthChanged(int previous, int current)
    {
        // Update UI for all clients
        healthBar.fillAmount = current / 100f;
    }

    [ServerRpc]
    public void TakeDamageServerRpc(int damage)
    {
        health.Value -= damage;
        if (health.Value <= 0)
        {
            PlayerDiedClientRpc();
        }
    }

    [ClientRpc]
    void PlayerDiedClientRpc()
    {
        // Death animation for all clients
        PlayDeathAnimation();
    }
}
```

## UI with Unity UI / TextMeshPro

```csharp
using TMPro;
using UnityEngine.UI;

public class UIManager : MonoBehaviour
{
    [SerializeField] private TextMeshProUGUI scoreText;
    [SerializeField] private Slider healthBar;
    [SerializeField] private GameObject pauseMenu;

    void Start()
    {
        GameEvents.OnScoreChanged += UpdateScore;
        GameEvents.OnHealthChanged += UpdateHealth;
    }

    void UpdateScore(int score)
    {
        scoreText.text = $"Score: {score}";
    }

    void UpdateHealth(float health)
    {
        healthBar.value = health / 100f;
    }

    public void PauseGame()
    {
        Time.timeScale = 0;
        pauseMenu.SetActive(true);
    }

    public void ResumeGame()
    {
        Time.timeScale = 1;
        pauseMenu.SetActive(false);
    }
}
```

## Animation System

```csharp
public class CharacterAnimation : MonoBehaviour
{
    private Animator animator;

    void Awake() => animator = GetComponent<Animator>();

    public void SetMoving(bool isMoving)
    {
        animator.SetBool("IsMoving", isMoving);
    }

    public void Jump()
    {
        animator.SetTrigger("Jump");
    }

    public void TakeDamage()
    {
        animator.SetTrigger("Hit");
    }

    public void Die()
    {
        animator.SetBool("IsDead", true);
        GetComponent<Collider>().enabled = false;
    }
}
```

## Common Optimization Techniques

✅ Use object pooling for frequent instantiation
✅ Implement LOD for distant objects
✅ Bake lighting when possible
✅ Use sprite atlases for 2D
✅ Minimize Update/FixedUpdate logic
✅ Cache component references
✅ Use layer-based physics collision matrix
✅ Enable GPU instancing for repeated objects
✅ Profile with Unity Profiler regularly

## Unity Best Practices

- Separate data (ScriptableObjects) from logic (MonoBehaviour)
- Use events for decoupled communication
- Implement object pooling for projectiles/effects
- Optimize physics with layer collision matrix
- Use TextMeshPro instead of legacy Text
- Implement save/load system early
- Test on target devices frequently
- Version control Assets folder with Git LFS
