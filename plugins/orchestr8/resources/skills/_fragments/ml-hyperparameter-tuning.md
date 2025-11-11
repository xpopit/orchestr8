---
id: ml-hyperparameter-tuning
category: skill
tags: [machine-learning, ml, hyperparameter, tuning, optimization, grid-search, bayesian, optuna]
capabilities:
  - Grid search implementation
  - Random search strategies
  - Bayesian optimization
  - Early stopping techniques
useWhen:
  - Implementing hyperparameter optimization with grid search and random search finding optimal model configurations
  - Building automated hyperparameter tuning pipeline with Optuna using Bayesian optimization for efficiency
  - Designing cross-validation strategy for hyperparameter tuning preventing overfitting on validation set
  - Creating hyperparameter search space definition balancing exploration and exploitation with sensible bounds
  - Implementing early stopping criteria for hyperparameter tuning reducing computational cost without sacrificing accuracy
estimatedTokens: 580
---

# ML Hyperparameter Tuning

## Grid Search

**Exhaustive Search (Small Spaces):**
```python
from sklearn.model_selection import GridSearchCV

param_grid = {
    'max_depth': [3, 5, 7, 10],
    'min_samples_split': [2, 5, 10],
    'n_estimators': [50, 100, 200]
}

grid = GridSearchCV(
    RandomForestClassifier(),
    param_grid,
    cv=5,
    scoring='roc_auc',
    n_jobs=-1  # Parallel processing
)

grid.fit(X_train, y_train)
best_params = grid.best_params_
```

**When to Use:**
- Small hyperparameter spaces (<100 combinations)
- Need to explore all combinations
- Computational resources available

**Limitations:**
- Exponential growth with parameters
- Inefficient for large spaces
- No early stopping

## Random Search

**Sample Random Combinations:**
```python
from sklearn.model_selection import RandomizedSearchCV
from scipy.stats import randint, uniform

param_distributions = {
    'max_depth': randint(3, 20),
    'min_samples_split': randint(2, 20),
    'n_estimators': randint(50, 500),
    'learning_rate': uniform(0.01, 0.3)
}

random_search = RandomizedSearchCV(
    XGBClassifier(),
    param_distributions,
    n_iter=100,  # Number of random samples
    cv=5,
    scoring='roc_auc',
    n_jobs=-1,
    random_state=42
)

random_search.fit(X_train, y_train)
```

**When to Use:**
- Large hyperparameter spaces
- Limited time/compute budget
- Unknown optimal parameter ranges

**Benefits:**
- 10x faster than grid search
- Better coverage of space
- Logarithmic scaling vs exponential

## Bayesian Optimization

**Intelligent Search (Optuna):**
```python
import optuna

def objective(trial):
    params = {
        'max_depth': trial.suggest_int('max_depth', 3, 20),
        'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3, log=True),
        'n_estimators': trial.suggest_int('n_estimators', 50, 500),
        'subsample': trial.suggest_float('subsample', 0.5, 1.0),
        'colsample_bytree': trial.suggest_float('colsample_bytree', 0.5, 1.0)
    }

    model = XGBClassifier(**params)
    scores = cross_val_score(model, X_train, y_train, cv=5, scoring='roc_auc')
    return scores.mean()

study = optuna.create_study(direction='maximize')
study.optimize(objective, n_trials=100, timeout=3600)  # 1 hour limit

best_params = study.best_params
print(f"Best score: {study.best_value}")
```

**Advanced Features:**
```python
# Pruning (early stopping for unpromising trials)
study.optimize(objective, n_trials=100,
               callbacks=[optuna.pruning.MedianPruner()])

# Multi-objective optimization
study = optuna.create_study(directions=['maximize', 'minimize'])
# Optimize for accuracy AND inference time

# Visualization
optuna.visualization.plot_optimization_history(study)
optuna.visualization.plot_param_importances(study)
```

**When to Use:**
- Expensive model training
- Large hyperparameter spaces
- Need efficient exploration
- Previous trials inform future choices

## Early Stopping

**XGBoost Example:**
```python
model = XGBClassifier(
    early_stopping_rounds=10,  # Stop if no improvement for 10 rounds
    eval_metric='auc'
)

model.fit(
    X_train, y_train,
    eval_set=[(X_val, y_val)],
    verbose=False
)

# Get optimal number of trees
best_iteration = model.best_iteration
```

**Neural Networks (Keras):**
```python
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau

early_stop = EarlyStopping(
    monitor='val_loss',
    patience=10,
    restore_best_weights=True
)

reduce_lr = ReduceLROnPlateau(
    monitor='val_loss',
    factor=0.5,
    patience=5
)

model.fit(X_train, y_train,
          validation_data=(X_val, y_val),
          epochs=100,
          callbacks=[early_stop, reduce_lr])
```

**Benefits:**
- Prevents overfitting
- Saves training time
- Adaptive to convergence speed

## Hyperparameter Importance

**Analyze Impact:**
```python
# Optuna importance
importance = optuna.importance.get_param_importances(study)
# Focus tuning on high-importance parameters

# Permutation importance
from sklearn.inspection import permutation_importance
result = permutation_importance(model, X_val, y_val, n_repeats=10)
```

## Best Practices

**Search Strategy:**
1. **Coarse search:** Random/Bayesian (100 trials)
2. **Refine:** Narrow ranges around best values
3. **Fine-tune:** Grid search in small space

**Parameter Ranges:**
```python
# Learning rate: log scale
'learning_rate': [0.001, 0.01, 0.1, 1.0]

# Regularization: log scale
'alpha': [1e-5, 1e-4, 1e-3, 1e-2, 1e-1]

# Tree depth: linear
'max_depth': [3, 5, 7, 10, 15, 20]
```

**Validation:**
- Use cross-validation for small datasets
- Hold-out validation for large datasets
- Stratified splits for imbalanced data

**Computational Efficiency:**
- Start with small n_iter/n_trials
- Use parallel processing (n_jobs=-1)
- Prune unpromising trials early
- Cache expensive computations

**Common Hyperparameters:**

**Tree Models:**
- max_depth, min_samples_split, n_estimators
- learning_rate (boosting)
- subsample, colsample_bytree

**Neural Networks:**
- learning_rate, batch_size, hidden_units
- dropout_rate, weight_decay
- optimizer (Adam, SGD, RMSprop)

**SVMs:**
- C (regularization), gamma, kernel

**Tools:**
- **Optuna:** Modern, flexible, pruning
- **Hyperopt:** Bayesian optimization
- **Ray Tune:** Distributed hyperparameter search
- **Scikit-Optimize:** Bayesian optimization
- **Keras Tuner:** Neural network tuning
