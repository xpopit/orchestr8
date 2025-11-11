---
id: python-core
category: agent
tags: [python, types, dataclasses, protocols, typing]
capabilities:
  - Advanced type hints and annotations
  - Dataclass patterns and customization
  - Protocol-based structural typing
  - Generic types and type variables
useWhen:
  - Designing type-safe Python APIs using advanced type hints (TypeVar, Generic, Protocol, Literal), TypeAlias for complex types, and get_type_hints() for runtime validation
  - Implementing dataclasses with frozen=True for immutability, slots=True for memory optimization, field() with default_factory, InitVar for initialization-only params, and __post_init__ validation
  - Building protocol-based polymorphism with @runtime_checkable Protocol classes, structural subtyping (SupportsRead, Container[T_co]), and covariant/contravariant type variables
  - Creating runtime type checking decorators using inspect.signature, get_type_hints(), and isinstance() validation for function parameters and return values
  - Leveraging Python 3.10+ pattern matching with structural patterns on dataclasses, guard clauses (if conditions), capture patterns (case int() as scalar), and exhaustive matching
  - Designing advanced resource management with @contextmanager/@asynccontextmanager decorators, custom descriptors for validation (__get__/__set__), and __slots__ for memory efficiency
estimatedTokens: 700
---

# Python Core Expertise

## Type Hints & Annotations

**Modern type hint patterns:**
```python
from typing import TypeVar, Generic, Protocol, Literal, TypeAlias, get_args, get_origin
from collections.abc import Sequence, Callable, Iterator

# Type aliases for clarity
UserId: TypeAlias = int
JSONValue: TypeAlias = dict[str, "JSONValue"] | list["JSONValue"] | str | int | float | bool | None

# Generic with constraints
T = TypeVar('T', bound='Comparable')

class Comparable(Protocol):
    def __lt__(self, other: 'Comparable') -> bool: ...

def sort_items(items: Sequence[T]) -> list[T]:
    return sorted(items)

# Literal types for strict values
Mode = Literal['read', 'write', 'append']

def open_file(path: str, mode: Mode) -> None: ...

# Callable with specific signature
Handler: TypeAlias = Callable[[str, int], bool]

# Generic class with variance
from typing import TypeVar
T_co = TypeVar('T_co', covariant=True)
T_contra = TypeVar('T_contra', contravariant=True)

class Producer(Generic[T_co]):
    def get(self) -> T_co: ...

class Consumer(Generic[T_contra]):
    def process(self, item: T_contra) -> None: ...
```

**Runtime type checking:**
```python
from typing import get_type_hints, Union, Any
import inspect

def validate_types(func: Callable) -> Callable:
    hints = get_type_hints(func)
    sig = inspect.signature(func)
    
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        bound = sig.bind(*args, **kwargs)
        for name, value in bound.arguments.items():
            if name in hints:
                expected = hints[name]
                if not isinstance(value, expected):
                    raise TypeError(f"{name} must be {expected}, got {type(value)}")
        return func(*args, **kwargs)
    
    return wrapper
```

## Dataclasses Advanced Patterns

**Customization and validation:**
```python
from dataclasses import dataclass, field, asdict, InitVar
from typing import ClassVar
from datetime import datetime

@dataclass(frozen=True, slots=True, kw_only=True)
class User:
    """Immutable user with optimized memory and keyword-only args."""
    id: int
    username: str
    created_at: datetime = field(default_factory=datetime.utcnow)
    _password_hash: str = field(repr=False)  # Hidden from repr
    
    # Class variable (not per-instance)
    MAX_USERNAME_LENGTH: ClassVar[int] = 50
    
    def __post_init__(self) -> None:
        if len(self.username) > self.MAX_USERNAME_LENGTH:
            raise ValueError("Username too long")

# With initialization variable (not stored)
@dataclass
class Database:
    connection_string: str
    _connection: Any = field(init=False, repr=False)
    
    # InitVar for setup-only parameters
    timeout: InitVar[int] = 30
    
    def __post_init__(self, timeout: int) -> None:
        self._connection = create_connection(self.connection_string, timeout)

# Derived fields
@dataclass
class Rectangle:
    width: float
    height: float
    area: float = field(init=False)
    
    def __post_init__(self) -> None:
        self.area = self.width * self.height

# Custom field comparison
@dataclass(order=True)
class Task:
    priority: int = field(compare=True)
    name: str = field(compare=False)
    created_at: datetime = field(default_factory=datetime.utcnow, compare=False)
```

## Protocol-Based Design

**Structural subtyping:**
```python
from typing import Protocol, runtime_checkable

@runtime_checkable
class Closable(Protocol):
    def close(self) -> None: ...

@runtime_checkable
class SupportsRead(Protocol):
    def read(self, size: int = -1) -> bytes: ...
    def close(self) -> None: ...

def process_file(file: SupportsRead) -> bytes:
    """Works with any object implementing read() and close()."""
    try:
        return file.read()
    finally:
        file.close()

# Protocol with generic
from typing import TypeVar
T_co = TypeVar('T_co', covariant=True)

class Container(Protocol[T_co]):
    def __len__(self) -> int: ...
    def __getitem__(self, index: int) -> T_co: ...

def first_item(container: Container[T_co]) -> T_co:
    return container[0]

# Complex protocol
class Mapper(Protocol):
    def map(self, func: Callable[[Any], Any]) -> 'Mapper': ...
    def filter(self, pred: Callable[[Any], bool]) -> 'Mapper': ...
    def collect(self) -> list[Any]: ...
```

## Pattern Matching (Python 3.10+)

**Structural pattern matching:**
```python
from dataclasses import dataclass
from typing import Literal

@dataclass
class Point:
    x: int
    y: int

def describe(point: Point | tuple[int, int] | int) -> str:
    match point:
        case Point(x=0, y=0):
            return "origin"
        case Point(x=0, y=y):
            return f"on Y axis at {y}"
        case Point(x=x, y=0):
            return f"on X axis at {x}"
        case Point(x=x, y=y) if x == y:
            return f"on diagonal at {x}"
        case Point():
            return "somewhere in space"
        case (x, y):
            return f"tuple point: ({x}, {y})"
        case int() as scalar:
            return f"scalar: {scalar}"
        case _:
            return "unknown"
```

## Context Managers & Descriptors

**Advanced resource management:**
```python
from contextlib import contextmanager, asynccontextmanager
from typing import Generator, AsyncGenerator

@contextmanager
def transaction(db: Database) -> Generator[Transaction, None, None]:
    tx = db.begin()
    try:
        yield tx
        tx.commit()
    except Exception:
        tx.rollback()
        raise

@asynccontextmanager
async def async_resource() -> AsyncGenerator[Resource, None]:
    resource = await acquire()
    try:
        yield resource
    finally:
        await resource.close()

# Descriptor for validation
class ValidatedField:
    def __init__(self, validator: Callable[[Any], bool]) -> None:
        self.validator = validator
        self.name = ""
    
    def __set_name__(self, owner: type, name: str) -> None:
        self.name = f"_{name}"
    
    def __get__(self, obj: Any, objtype: type | None = None) -> Any:
        return getattr(obj, self.name)
    
    def __set__(self, obj: Any, value: Any) -> None:
        if not self.validator(value):
            raise ValueError(f"Invalid value: {value}")
        setattr(obj, self.name, value)
```

## Performance Patterns

- Use `__slots__` for memory optimization in large object collections
- Prefer `dataclass(frozen=True, slots=True)` for immutable data
- Use `typing.Protocol` instead of ABC for better duck typing
- Leverage `functools.lru_cache` for expensive pure functions
- Use `__future__` annotations to defer type evaluation: `from __future__ import annotations`

## Common Pitfalls

**Mutable defaults:**
```python
# Wrong - shared mutable default
def add_item(item: str, items: list[str] = []) -> list[str]:
    items.append(item)
    return items

# Right - use None and create new
def add_item(item: str, items: list[str] | None = None) -> list[str]:
    if items is None:
        items = []
    items.append(item)
    return items

# Or use field in dataclass
@dataclass
class Container:
    items: list[str] = field(default_factory=list)
```
