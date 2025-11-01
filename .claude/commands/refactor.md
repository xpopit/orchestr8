---
description: Safely refactor code with comprehensive testing, quality validation, and zero behavior changes
argumentHint: "[refactoring-goal]"
---

# Refactor Workflow

Autonomous, safe code refactoring with test coverage, quality validation, and behavior preservation guarantees.

## Core Principles

1. **Tests First**: Ensure comprehensive tests before refactoring
2. **Small Steps**: Refactor incrementally, keeping tests green
3. **No Behavior Change**: Refactoring must not change external behavior
4. **Always Passing**: Tests must pass after every step
5. **Continuous Validation**: Run tests frequently during refactoring

## Execution Instructions

### Phase 1: Analysis & Planning (20%)

**Use `code-archaeologist` and `code-reviewer` to:**

1. **Analyze Current Code**
   ```bash
   # Understand the code
   - Read thoroughly
   - Identify code smells
   - Map dependencies
   - Check test coverage
   ```

2. **Identify Code Smells**
   ```
   Common smells:
   - Long methods (>50 lines)
   - Large classes (>300 lines)
   - Duplicated code
   - Deep nesting (>3 levels)
   - Too many parameters (>4)
   - Feature envy
   - Shotgun surgery
   - Primitive obsession
   - Long parameter lists
   ```

3. **Design Refactoring Strategy**
   ```markdown
   GOAL: [What we want to achieve]

   CURRENT STATE:
   - [What the code looks like now]
   - [Problems with current design]

   TARGET STATE:
   - [What the code should look like]
   - [How it improves the design]

   REFACTORING STEPS:
   1. [Step 1 - specific, small]
   2. [Step 2 - specific, small]
   3. [Step 3 - specific, small]
   ...

   RISKS:
   - [What could go wrong]
   - [Mitigation strategies]
   ```

4. **Verify Test Coverage**
   Use `test-engineer` to:
   ```bash
   # Check current coverage
   npm run test:coverage
   # or: pytest --cov

   # Goal: 80%+ coverage of code being refactored
   # If insufficient, write tests FIRST
   ```

**CHECKPOINT**: Plan approved, tests comprehensive ✓

### Phase 2: Pre-Refactoring Test Suite (15%)

**Use `test-engineer` to ensure bulletproof tests:**

1. **Characterization Tests**
   ```python
   # Document current behavior (even if it's buggy)
   def test_current_behavior():
       # This documents what it does NOW
       # We'll maintain this behavior during refactoring
       result = legacy_function(input_data)
       assert result == expected_current_output
   ```

2. **Edge Case Tests**
   ```python
   def test_edge_cases():
       assert function([]) == []  # Empty input
       assert function(None) is None  # Null input
       assert function([1]) == [1]  # Single item
       # Boundary conditions
       # Error conditions
   ```

3. **Integration Tests**
   ```python
   def test_integration():
       # Test how this code interacts with rest of system
       # These verify behavior doesn't change
       result = full_workflow()
       assert result == expected
   ```

4. **Performance Baselines**
   ```python
   def test_performance_baseline():
       import time
       start = time.time()
       function(large_dataset)
       duration = time.time() - start
       assert duration < 1.0  # Baseline: must stay this fast
   ```

**CHECKPOINT**: Comprehensive test suite in place, all passing ✓

### Phase 3: Incremental Refactoring (50%)

**Use appropriate development agent (python-developer, typescript-developer, etc.):**

**CRITICAL**: After EACH step below, run tests. Tests must stay GREEN.

#### Step 1: Extract Methods/Functions

```python
# Before: Long method
def process_order(order):
    # Validate
    if not order.items:
        raise ValueError("No items")
    if order.total < 0:
        raise ValueError("Invalid total")

    # Calculate tax
    tax_rate = 0.1 if order.state == 'CA' else 0.05
    tax = order.subtotal * tax_rate

    # Apply discount
    discount = 0
    if order.customer.is_vip:
        discount = order.subtotal * 0.2

    # Finalize
    order.tax = tax
    order.discount = discount
    order.total = order.subtotal + tax - discount
    order.save()

# After: Extract methods
def process_order(order):
    validate_order(order)
    tax = calculate_tax(order)
    discount = calculate_discount(order)
    finalize_order(order, tax, discount)

def validate_order(order):
    if not order.items:
        raise ValueError("No items")
    if order.total < 0:
        raise ValueError("Invalid total")

def calculate_tax(order):
    tax_rate = get_tax_rate(order.state)
    return order.subtotal * tax_rate

def calculate_discount(order):
    if order.customer.is_vip:
        return order.subtotal * 0.2
    return 0

def finalize_order(order, tax, discount):
    order.tax = tax
    order.discount = discount
    order.total = order.subtotal + tax - discount
    order.save()
```

**RUN TESTS** ✓

#### Step 2: Extract Classes

```python
# Before: God class
class Order:
    def validate(self): ...
    def calculate_tax(self): ...
    def calculate_discount(self): ...
    def process_payment(self): ...
    def send_email(self): ...
    def generate_invoice(self): ...

# After: Single Responsibility
class Order:
    def __init__(self, items, customer):
        self.items = items
        self.customer = customer
        self.validator = OrderValidator()
        self.calculator = OrderCalculator()
        self.processor = PaymentProcessor()
        self.notifier = OrderNotifier()

    def process(self):
        self.validator.validate(self)
        amounts = self.calculator.calculate(self)
        self.processor.process_payment(self, amounts)
        self.notifier.notify(self)

class OrderValidator:
    def validate(self, order): ...

class OrderCalculator:
    def calculate(self, order): ...

class PaymentProcessor:
    def process_payment(self, order, amounts): ...

class OrderNotifier:
    def notify(self, order): ...
```

**RUN TESTS** ✓

#### Step 3: Eliminate Code Duplication

```python
# Before: Duplication
def get_active_users():
    return [u for u in users if u.status == 'active' and not u.deleted]

def get_admin_users():
    return [u for u in users if u.role == 'admin' and not u.deleted]

# After: DRY
def filter_users(predicate):
    return [u for u in users if not u.deleted and predicate(u)]

def get_active_users():
    return filter_users(lambda u: u.status == 'active')

def get_admin_users():
    return filter_users(lambda u: u.role == 'admin')
```

**RUN TESTS** ✓

#### Step 4: Improve Names

```python
# Before: Poor names
def calc(a, b, c):
    return a * b * c

def proc(d):
    return d[0] if d else None

# After: Clear names
def calculate_volume(length, width, height):
    return length * width * height

def get_first_item(items):
    return items[0] if items else None
```

**RUN TESTS** ✓

#### Step 5: Reduce Complexity

```python
# Before: Deep nesting
def process(data):
    if data:
        if data.get('user'):
            if data['user'].get('email'):
                if validate_email(data['user']['email']):
                    return send_email(data['user']['email'])
    return None

# After: Guard clauses
def process(data):
    if not data:
        return None
    if not data.get('user'):
        return None

    email = data['user'].get('email')
    if not email:
        return None
    if not validate_email(email):
        return None

    return send_email(email)

# Even better: Optional chaining
def process(data):
    email = data.get('user', {}).get('email')
    if email and validate_email(email):
        return send_email(email)
    return None
```

**RUN TESTS** ✓

#### Step 6: Introduce Design Patterns

```python
# Before: Complex conditional logic
def get_discount(customer):
    if customer.type == 'vip':
        return 0.20
    elif customer.type == 'regular' and customer.years > 5:
        return 0.10
    elif customer.type == 'regular':
        return 0.05
    else:
        return 0

# After: Strategy pattern
class DiscountStrategy:
    def calculate(self, customer):
        raise NotImplementedError

class VIPDiscount(DiscountStrategy):
    def calculate(self, customer):
        return 0.20

class LoyalCustomerDiscount(DiscountStrategy):
    def calculate(self, customer):
        return 0.10 if customer.years > 5 else 0.05

class NoDiscount(DiscountStrategy):
    def calculate(self, customer):
        return 0

def get_discount_strategy(customer):
    if customer.type == 'vip':
        return VIPDiscount()
    elif customer.type == 'regular':
        return LoyalCustomerDiscount()
    else:
        return NoDiscount()

def get_discount(customer):
    strategy = get_discount_strategy(customer)
    return strategy.calculate(customer)
```

**RUN TESTS** ✓

**CHECKPOINT**: Code refactored incrementally, tests green throughout ✓

### Phase 4: Quality Validation (10%)

**Run all quality gates in parallel:**

1. **Code Review** - `code-reviewer`:
   ```
   - Code is cleaner and more maintainable
   - SOLID principles followed
   - No code smells introduced
   - Naming is clear
   - Complexity reduced
   ```

2. **Test Verification** - `test-engineer`:
   ```
   - All tests still passing
   - Coverage maintained or improved
   - No flaky tests
   - Performance within baseline
   ```

3. **Security Check** - `security-auditor`:
   ```
   - No new security issues
   - Security posture maintained
   ```

4. **Performance Check** - `performance-analyzer`:
   ```
   - Performance maintained or improved
   - No regressions
   - Memory usage acceptable
   ```

**CHECKPOINT**: All quality gates passed ✓

### Phase 5: Documentation & Deployment (5%)

1. **Update Documentation**
   ```markdown
   - Update code comments (if complex)
   - Update README (if public API changed)
   - Update architecture docs (if design changed)
   - Document refactoring decisions
   ```

2. **Create Commit**
   ```bash
   git commit -m "$(cat <<'EOF'
   refactor(component): improve code organization

   Refactoring:
   - Extract methods for better readability
   - Apply SRP to large classes
   - Eliminate code duplication
   - Improve naming clarity
   - Reduce cyclomatic complexity from 15 to 5

   Testing:
   - All tests passing
   - Coverage maintained at 85%
   - Performance within baseline

   Impact: No behavior changes, internal improvement only
   EOF
   )"
   ```

3. **Deploy**
   ```
   1. Deploy to staging
   2. Run full regression suite
   3. Performance testing
   4. Deploy to production (low-risk since no behavior change)
   5. Monitor (should see no impact)
   ```

**CHECKPOINT**: Deployed successfully ✓

## Common Refactoring Patterns

### 1. Extract Method

**When**: Method is too long (>50 lines)

```python
# Before
def process():
    # 100 lines of code

# After
def process():
    prepare_data()
    validate_input()
    execute_operation()
    save_results()
```

### 2. Extract Class

**When**: Class has too many responsibilities

```python
# Before
class User:
    def authenticate(self): ...
    def send_email(self): ...
    def log_action(self): ...

# After
class User:
    def __init__(self):
        self.auth = AuthService()
        self.mailer = EmailService()
        self.logger = LogService()
```

### 3. Inline Method/Variable

**When**: Method/variable adds no value

```python
# Before
def get_total():
    base = get_base_price()
    return base

# After
def get_total():
    return get_base_price()
```

### 4. Replace Conditional with Polymorphism

**When**: Complex type-based conditionals

```python
# Before
def calculate(type, amount):
    if type == 'A':
        return amount * 1.5
    elif type == 'B':
        return amount * 2.0

# After
class CalculatorA:
    def calculate(self, amount):
        return amount * 1.5

class CalculatorB:
    def calculate(self, amount):
        return amount * 2.0
```

### 5. Introduce Parameter Object

**When**: Many parameters (>4)

```python
# Before
def create_user(name, email, age, address, phone, city, state, zip):
    ...

# After
@dataclass
class UserData:
    name: str
    email: str
    age: int
    address: str
    phone: str
    city: str
    state: str
    zip: str

def create_user(user_data: UserData):
    ...
```

## Success Criteria

Refactoring complete when:
- ✅ All tests passing (100%)
- ✅ Coverage maintained or improved
- ✅ Code complexity reduced
- ✅ Code smells eliminated
- ✅ SOLID principles followed
- ✅ No behavior changes
- ✅ Performance maintained
- ✅ Quality gates passed
- ✅ Documentation updated
- ✅ Deployed successfully

## Example Usage

### Example 1: Extract Service

```bash
/refactor "Extract authentication logic from User model into AuthService for better testability and reusability"
```

**Time: 1-2 hours**

### Example 2: Eliminate Duplication

```bash
/refactor "Remove code duplication in payment processing - same logic exists in 5 different places"
```

**Time: 2-3 hours**

### Example 3: Simplify Complex Method

```bash
/refactor "Refactor process_order method - it's 200 lines long with cyclomatic complexity of 25"
```

**Time: 2-4 hours**

## Anti-Patterns

### DON'T
❌ Refactor without tests
❌ Change behavior during refactoring
❌ Make large changes all at once
❌ Skip running tests during refactoring
❌ Refactor and add features simultaneously
❌ Deploy without validation

### DO
✅ Write tests first if missing
✅ Keep behavior identical
✅ Small, incremental steps
✅ Run tests after each step
✅ Separate refactoring from feature work
✅ Validate thoroughly before deploying

Autonomous, safe, and thorough refactoring that improves code quality without breaking anything.
