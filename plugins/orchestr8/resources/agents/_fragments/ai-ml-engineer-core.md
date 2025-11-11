---
id: ai-ml-engineer-core
category: agent
tags: [machine-learning, ml, deep-learning, model-training, evaluation, scikit-learn, pytorch, tensorflow]
capabilities:
  - Model selection and architecture design
  - Training pipeline development
  - Model evaluation and validation
  - Hyperparameter optimization
  - Data preprocessing and feature engineering
useWhen:
  - Building machine learning models from scratch using scikit-learn for classical ML, PyTorch for deep learning with custom architectures, and TensorFlow/Keras for production deployment
  - Designing training pipelines with data loaders, batching strategies, gradient accumulation, learning rate schedules (cosine annealing, warmup), and checkpointing for fault tolerance
  - Implementing model evaluation and validation using k-fold cross-validation, stratified sampling, confusion matrices, ROC curves, and metrics (precision, recall, F1, AUC)
  - Optimizing hyperparameters through grid search, random search, Bayesian optimization (Optuna), and neural architecture search (NAS) for model performance tuning
  - Engineering features with normalization (StandardScaler, MinMaxScaler), encoding (one-hot, label, target), dimensionality reduction (PCA, t-SNE), and handling imbalanced data (SMOTE)
  - Evaluating model performance considering bias-variance tradeoff, overfitting prevention (dropout, L1/L2 regularization), and generalization to unseen data
estimatedTokens: 680
---

# AI/ML Engineer - Core Expertise

## Model Selection & Architecture

**Framework decision matrix:**
```python
# Scikit-learn - Classical ML, small to medium data
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.linear_model import LogisticRegression, Ridge

# Best for: tabular data, interpretable models, quick prototyping
model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)

# PyTorch - Research, custom architectures, flexibility
import torch
import torch.nn as nn

class CustomNet(nn.Module):
    def __init__(self, input_dim: int, hidden_dims: list[int], output_dim: int):
        super().__init__()
        layers = []
        prev_dim = input_dim
        for hidden_dim in hidden_dims:
            layers.extend([
                nn.Linear(prev_dim, hidden_dim),
                nn.ReLU(),
                nn.BatchNorm1d(hidden_dim),
                nn.Dropout(0.3)
            ])
            prev_dim = hidden_dim
        layers.append(nn.Linear(prev_dim, output_dim))
        self.network = nn.Sequential(*layers)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.network(x)

# TensorFlow/Keras - Production, serving, enterprise
from tensorflow import keras

model = keras.Sequential([
    keras.layers.Dense(128, activation='relu', input_shape=(input_dim,)),
    keras.layers.BatchNormalization(),
    keras.layers.Dropout(0.3),
    keras.layers.Dense(64, activation='relu'),
    keras.layers.Dense(output_dim, activation='softmax')
])
```

## Training Pipeline Patterns

**PyTorch training loop:**
```python
from torch.utils.data import DataLoader
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
from tqdm import tqdm

def train_epoch(model: nn.Module, loader: DataLoader, optimizer, criterion, device: str) -> float:
    model.train()
    total_loss = 0.0

    for batch in tqdm(loader, desc="Training"):
        inputs, targets = batch[0].to(device), batch[1].to(device)

        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, targets)
        loss.backward()

        # Gradient clipping prevents exploding gradients
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)

        optimizer.step()
        total_loss += loss.item()

    return total_loss / len(loader)

def validate(model: nn.Module, loader: DataLoader, criterion, device: str) -> tuple[float, float]:
    model.eval()
    total_loss = 0.0
    correct = 0

    with torch.no_grad():
        for batch in loader:
            inputs, targets = batch[0].to(device), batch[1].to(device)
            outputs = model(inputs)
            loss = criterion(outputs, targets)
            total_loss += loss.item()

            predictions = outputs.argmax(dim=1)
            correct += (predictions == targets).sum().item()

    return total_loss / len(loader), correct / len(loader.dataset)

# Full training
model = CustomNet(input_dim=784, hidden_dims=[256, 128], output_dim=10).to(device)
optimizer = AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
scheduler = CosineAnnealingLR(optimizer, T_max=epochs)
criterion = nn.CrossEntropyLoss()

for epoch in range(epochs):
    train_loss = train_epoch(model, train_loader, optimizer, criterion, device)
    val_loss, val_acc = validate(model, val_loader, criterion, device)
    scheduler.step()

    print(f"Epoch {epoch+1}: train_loss={train_loss:.4f}, val_loss={val_loss:.4f}, val_acc={val_acc:.4f}")
```

## Data Preprocessing & Feature Engineering

**Robust preprocessing pipeline:**
```python
from sklearn.preprocessing import StandardScaler, RobustScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer

# Handle mixed data types
numeric_features = ['age', 'income', 'credit_score']
categorical_features = ['occupation', 'education', 'region']

numeric_transformer = Pipeline([
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', RobustScaler())  # Robust to outliers
])

categorical_transformer = Pipeline([
    ('imputer', SimpleImputer(strategy='most_frequent')),
    ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
])

preprocessor = ColumnTransformer([
    ('num', numeric_transformer, numeric_features),
    ('cat', categorical_transformer, categorical_features)
])

# PyTorch dataset with preprocessing
from torch.utils.data import Dataset

class CustomDataset(Dataset):
    def __init__(self, features: np.ndarray, labels: np.ndarray, transform=None):
        self.features = torch.FloatTensor(features)
        self.labels = torch.LongTensor(labels)
        self.transform = transform

    def __len__(self) -> int:
        return len(self.features)

    def __getitem__(self, idx: int) -> tuple[torch.Tensor, torch.Tensor]:
        x, y = self.features[idx], self.labels[idx]
        if self.transform:
            x = self.transform(x)
        return x, y
```

## Model Evaluation & Metrics

**Comprehensive evaluation:**
```python
from sklearn.metrics import (
    accuracy_score, precision_recall_fscore_support,
    confusion_matrix, roc_auc_score, classification_report
)
import numpy as np

def evaluate_classification(y_true: np.ndarray, y_pred: np.ndarray, y_proba: np.ndarray = None):
    """Complete classification evaluation."""
    accuracy = accuracy_score(y_true, y_pred)
    precision, recall, f1, _ = precision_recall_fscore_support(y_true, y_pred, average='weighted')

    results = {
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1': f1,
        'confusion_matrix': confusion_matrix(y_true, y_pred)
    }

    if y_proba is not None:
        results['auc_roc'] = roc_auc_score(y_true, y_proba, multi_class='ovr')

    return results

# Regression metrics
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

def evaluate_regression(y_true: np.ndarray, y_pred: np.ndarray):
    return {
        'mse': mean_squared_error(y_true, y_pred),
        'rmse': np.sqrt(mean_squared_error(y_true, y_pred)),
        'mae': mean_absolute_error(y_true, y_pred),
        'r2': r2_score(y_true, y_pred)
    }
```

## Hyperparameter Optimization

**Modern approaches:**
```python
# Optuna - flexible, efficient
import optuna

def objective(trial):
    # Suggest hyperparameters
    lr = trial.suggest_float('lr', 1e-5, 1e-2, log=True)
    hidden_dim = trial.suggest_int('hidden_dim', 64, 512, step=64)
    dropout = trial.suggest_float('dropout', 0.1, 0.5)

    model = CustomNet(input_dim, [hidden_dim], output_dim)
    optimizer = AdamW(model.parameters(), lr=lr)

    # Train and return validation metric
    val_loss, val_acc = train_and_validate(model, optimizer, epochs=10)
    return val_acc

study = optuna.create_study(direction='maximize')
study.optimize(objective, n_trials=50)

print(f"Best params: {study.best_params}")
print(f"Best value: {study.best_value}")

# Ray Tune - distributed hyperparameter search
from ray import tune
from ray.tune.schedulers import ASHAScheduler

config = {
    'lr': tune.loguniform(1e-5, 1e-2),
    'hidden_dim': tune.choice([64, 128, 256, 512]),
    'batch_size': tune.choice([32, 64, 128])
}

scheduler = ASHAScheduler(metric='val_acc', mode='max')
analysis = tune.run(
    train_function,
    config=config,
    scheduler=scheduler,
    num_samples=50
)
```

## Best Practices

- **Always use separate validation and test sets** - never tune on test data
- **Track experiments** - use MLflow, Weights & Biases, or TensorBoard
- **Set random seeds** - reproducibility across runs
- **Monitor overfitting** - watch train/val loss gap, use early stopping
- **Save checkpoints** - best model, resume capability
- **Use mixed precision training** - `torch.cuda.amp` for faster training
- **Batch normalization** - stabilizes training, often replaces need for careful initialization
- **Learning rate scheduling** - cosine annealing, reduce on plateau, warmup

## Anti-Patterns

- Training on unscaled/unnormalized data (except tree-based models)
- Not shuffling training data between epochs
- Using test set for model selection or hyperparameter tuning
- Ignoring class imbalance (use stratified splits, class weights, or oversampling)
- Not checking for data leakage (target info in features)
- Optimizing on training metrics instead of validation
- Using too small batch sizes (unstable gradients) or too large (poor generalization)
