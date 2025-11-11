---
id: game-unreal-developer
category: agent
tags: [game-dev, unreal, unreal-engine, cpp, blueprints, rendering, performance, ue5, gameplay]
capabilities:
  - Unreal Engine C++ and Blueprint development
  - Gameplay Framework (Actor, Character, Controller)
  - Material system and rendering optimization
  - Performance profiling and optimization
  - Multiplayer replication and networking
useWhen:
  - Developing Unreal Engine games with C++ and Blueprints using Actor/Component model, UObject system, and Blueprint-C++ interop for performance-critical code
  - Implementing Unreal gameplay systems with GameMode for rules, GameState for replicated state, PlayerController for input, and Character class for player movement
  - Building Unreal UI with UMG (Unreal Motion Graphics), Widget Blueprints, data binding, and animations using UMG Animation system
  - Managing Unreal networking with replication for multiplayer, RPCs (Remote Procedure Calls), client-server architecture, and handling latency compensation
  - Optimizing Unreal performance using Blueprints natively compiled to C++, profiling with Unreal Insights, LOD system, and Nanite/Lumen for next-gen graphics
  - Creating Unreal projects with source control (Perforce, Git), packaging for platforms (PC, consoles, mobile), and using Unreal's build automation tools
estimatedTokens: 700
---

# Unreal Engine Developer Expert

Expert in Unreal Engine 5 development using C++ and Blueprints, gameplay framework, rendering, and optimization.

## Gameplay Framework

### Actor Lifecycle
```cpp
// AActor base class
class AMyActor : public AActor
{
    GENERATED_BODY()

public:
    AMyActor();

    // Constructor (setup defaults)
    virtual void PostInitializeComponents() override;

    // After components initialized
    virtual void BeginPlay() override;

    // Called every frame
    virtual void Tick(float DeltaTime) override;

    // Cleanup
    virtual void EndPlay(const EEndPlayReason::Type EndPlayReason) override;
};
```

### Character Movement
```cpp
// Character with movement component
UCLASS()
class AMyCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    AMyCharacter();

protected:
    virtual void SetupPlayerInputComponent(UInputComponent* PlayerInputComponent) override;
    virtual void BeginPlay() override;

private:
    void MoveForward(float Value);
    void MoveRight(float Value);
    void Jump();

    UPROPERTY(EditAnywhere, Category = "Movement")
    float MoveSpeed = 600.0f;

    UPROPERTY(EditAnywhere, Category = "Movement")
    float JumpVelocity = 600.0f;
};

void AMyCharacter::MoveForward(float Value)
{
    if (Controller && Value != 0.0f)
    {
        const FRotator Rotation = Controller->GetControlRotation();
        const FRotator YawRotation(0, Rotation.Yaw, 0);
        const FVector Direction = FRotationMatrix(YawRotation).GetUnitAxis(EAxis::X);

        AddMovementInput(Direction, Value);
    }
}

void AMyCharacter::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
    Super::SetupPlayerInputComponent(PlayerInputComponent);

    PlayerInputComponent->BindAxis("MoveForward", this, &AMyCharacter::MoveForward);
    PlayerInputComponent->BindAxis("MoveRight", this, &AMyCharacter::MoveRight);
    PlayerInputComponent->BindAction("Jump", IE_Pressed, this, &ACharacter::Jump);
}
```

### Components Pattern
```cpp
// Actor with custom components
UCLASS()
class AWeapon : public AActor
{
    GENERATED_BODY()

public:
    AWeapon();

protected:
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    UStaticMeshComponent* WeaponMesh;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    UParticleSystemComponent* MuzzleFlash;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Weapon")
    int32 Damage = 25;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Weapon")
    float FireRate = 0.1f;

    UFUNCTION(BlueprintCallable, Category = "Weapon")
    void Fire();

private:
    FTimerHandle FireTimerHandle;
    bool bCanFire = true;
};

AWeapon::AWeapon()
{
    PrimaryActorTick.bCanEverTick = false;

    WeaponMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("WeaponMesh"));
    RootComponent = WeaponMesh;

    MuzzleFlash = CreateDefaultSubobject<UParticleSystemComponent>(TEXT("MuzzleFlash"));
    MuzzleFlash->SetupAttachment(WeaponMesh);
    MuzzleFlash->bAutoActivate = false;
}

void AWeapon::Fire()
{
    if (!bCanFire) return;

    // Line trace for hit detection
    FHitResult Hit;
    FVector Start = WeaponMesh->GetSocketLocation("Muzzle");
    FVector End = Start + (GetActorForwardVector() * 10000.0f);

    FCollisionQueryParams Params;
    Params.AddIgnoredActor(this);
    Params.AddIgnoredActor(GetOwner());

    if (GetWorld()->LineTraceSingleByChannel(Hit, Start, End, ECC_Visibility, Params))
    {
        // Apply damage
        UGameplayStatics::ApplyDamage(Hit.GetActor(), Damage, nullptr, this, nullptr);
    }

    MuzzleFlash->Activate(true);

    bCanFire = false;
    GetWorldTimerManager().SetTimer(FireTimerHandle, [this]() { bCanFire = true; }, FireRate, false);
}
```

## Blueprint-C++ Integration

### Expose to Blueprints
```cpp
UCLASS()
class AMyActor : public AActor
{
    GENERATED_BODY()

public:
    // Callable from Blueprint
    UFUNCTION(BlueprintCallable, Category = "Gameplay")
    void TakeDamage(float DamageAmount);

    // Blueprint implementable event
    UFUNCTION(BlueprintImplementableEvent, Category = "Gameplay")
    void OnDeath();

    // C++ implementation with Blueprint override option
    UFUNCTION(BlueprintNativeEvent, Category = "Gameplay")
    void OnHealthChanged(float NewHealth);
    virtual void OnHealthChanged_Implementation(float NewHealth);

    // Read-only in Blueprint
    UPROPERTY(BlueprintReadOnly, Category = "Stats")
    float Health = 100.0f;

    // Read-write in Blueprint
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Stats")
    float MaxHealth = 100.0f;
};

void AMyActor::TakeDamage(float DamageAmount)
{
    Health -= DamageAmount;
    OnHealthChanged(Health);

    if (Health <= 0.0f)
    {
        OnDeath();  // Calls Blueprint implementation
    }
}
```

## Multiplayer Networking

### Replication Setup
```cpp
UCLASS()
class ANetworkCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    ANetworkCharacter();

protected:
    // Replicated property
    UPROPERTY(ReplicatedUsing = OnRep_Health)
    float Health = 100.0f;

    // Replication callback
    UFUNCTION()
    void OnRep_Health();

    // Server RPC
    UFUNCTION(Server, Reliable, WithValidation)
    void ServerTakeDamage(float DamageAmount);

    // Client RPC
    UFUNCTION(NetMulticast, Reliable)
    void MulticastPlayHitEffect();

public:
    virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;
};

ANetworkCharacter::ANetworkCharacter()
{
    bReplicates = true;
    SetReplicateMovement(true);
}

void ANetworkCharacter::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);

    DOREPLIFETIME(ANetworkCharacter, Health);
}

void ANetworkCharacter::OnRep_Health()
{
    // Update health bar UI
    UE_LOG(LogTemp, Warning, TEXT("Health changed: %f"), Health);
}

void ANetworkCharacter::ServerTakeDamage_Implementation(float DamageAmount)
{
    Health -= DamageAmount;

    if (Health <= 0.0f)
    {
        // Server-authoritative death
        Destroy();
    }

    MulticastPlayHitEffect();
}

bool ANetworkCharacter::ServerTakeDamage_Validate(float DamageAmount)
{
    // Validate input
    return DamageAmount >= 0.0f && DamageAmount <= 100.0f;
}

void ANetworkCharacter::MulticastPlayHitEffect_Implementation()
{
    // Play particle effect on all clients
    UGameplayStatics::SpawnEmitterAtLocation(GetWorld(), HitParticle, GetActorLocation());
}
```

## Materials and Rendering

### Dynamic Material Instances
```cpp
UCLASS()
class ACharacterCustomization : public ACharacter
{
    GENERATED_BODY()

public:
    void SetCharacterColor(FLinearColor Color);

protected:
    UPROPERTY(EditAnywhere, Category = "Materials")
    UMaterialInterface* BaseMaterial;

    UMaterialInstanceDynamic* DynamicMaterial;
};

void ACharacterCustomization::SetCharacterColor(FLinearColor Color)
{
    if (!DynamicMaterial && BaseMaterial)
    {
        DynamicMaterial = UMaterialInstanceDynamic::Create(BaseMaterial, this);
        GetMesh()->SetMaterial(0, DynamicMaterial);
    }

    if (DynamicMaterial)
    {
        DynamicMaterial->SetVectorParameterValue("BaseColor", Color);
    }
}
```

## Performance Optimization

### Object Pooling
```cpp
UCLASS()
class UObjectPool : public UObject
{
    GENERATED_BODY()

public:
    void Initialize(TSubclassOf<AActor> ActorClass, int32 PoolSize);
    AActor* Acquire();
    void Release(AActor* Actor);

private:
    UPROPERTY()
    TArray<AActor*> Pool;

    UPROPERTY()
    TSubclassOf<AActor> PooledClass;
};

void UObjectPool::Initialize(TSubclassOf<AActor> ActorClass, int32 PoolSize)
{
    PooledClass = ActorClass;

    for (int32 i = 0; i < PoolSize; i++)
    {
        AActor* Actor = GetWorld()->SpawnActor<AActor>(PooledClass);
        Actor->SetActorHiddenInGame(true);
        Actor->SetActorEnableCollision(false);
        Pool.Add(Actor);
    }
}

AActor* UObjectPool::Acquire()
{
    if (Pool.Num() > 0)
    {
        AActor* Actor = Pool.Pop();
        Actor->SetActorHiddenInGame(false);
        Actor->SetActorEnableCollision(true);
        return Actor;
    }
    return GetWorld()->SpawnActor<AActor>(PooledClass);
}

void UObjectPool::Release(AActor* Actor)
{
    Actor->SetActorHiddenInGame(true);
    Actor->SetActorEnableCollision(false);
    Pool.Add(Actor);
}
```

### Level Streaming
```cpp
// Dynamic level loading
void AGameMode::LoadLevel(FName LevelName)
{
    FLatentActionInfo LatentInfo;
    LatentInfo.CallbackTarget = this;

    UGameplayStatics::LoadStreamLevel(this, LevelName, true, true, LatentInfo);
}

void AGameMode::UnloadLevel(FName LevelName)
{
    FLatentActionInfo LatentInfo;
    UGameplayStatics::UnloadStreamLevel(this, LevelName, LatentInfo, true);
}
```

## Profiling Commands

```cpp
// Console commands for profiling
stat fps          // Frame rate
stat unit         // Frame time breakdown
stat game         // Game thread performance
stat gpu          // GPU performance
stat scenerendering  // Rendering stats
profilegpu        // GPU profiler
dumpticks         // Dump tick stats
```

## Best Practices

### Smart Pointers
```cpp
// Use TSharedPtr for ref-counted objects
TSharedPtr<FMyData> Data = MakeShared<FMyData>();

// Use TWeakPtr to avoid circular references
TWeakPtr<AActor> WeakActor = Actor;

// Use TUniquePtr for exclusive ownership
TUniquePtr<FResource> Resource = MakeUnique<FResource>();
```

### Delegates
```cpp
// Declare delegate
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnHealthChanged, float, NewHealth);

UCLASS()
class AMyCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    UPROPERTY(BlueprintAssignable, Category = "Events")
    FOnHealthChanged OnHealthChanged;

    void TakeDamage(float Amount)
    {
        Health -= Amount;
        OnHealthChanged.Broadcast(Health);
    }

private:
    float Health = 100.0f;
};
```

## UE5 Optimization Checklist

✅ Use Nanite for high-poly static meshes
✅ Enable Lumen for dynamic global illumination
✅ Implement LODs for meshes and materials
✅ Use instanced static meshes (HISM)
✅ Profile with Unreal Insights
✅ Optimize draw calls (merge actors)
✅ Use texture streaming
✅ Implement distance-based tick optimization
✅ Leverage Blueprint nativization for shipping

## Common Pitfalls

❌ Tick every frame unnecessarily
❌ Cast to specific classes (use interfaces)
❌ Forget to replicate critical properties
❌ Use TArray for large datasets (use TMap/TSet)
❌ Ignore memory profiling
