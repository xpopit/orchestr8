---
id: ml-model-evaluation
category: skill
tags: [machine-learning, ml, evaluation, metrics, validation, bias, testing, ab-testing]
capabilities:
  - Metrics selection for different tasks
  - Cross-validation strategies
  - Bias and fairness detection
  - A/B testing for ML models
useWhen:
  - Evaluating machine learning model performance with cross-validation, precision, recall, and F1-score metrics
  - Building ML model comparison framework testing multiple algorithms and hyperparameter configurations
  - Implementing model validation strategy with holdout test set preventing overfitting and ensuring generalization
  - Creating confusion matrix analysis for classification models identifying false positives and false negatives
  - Designing A/B testing framework for ML models comparing champion vs challenger in production with statistical significance
estimatedTokens: 600
---

# ML Model Evaluation

## Metrics Selection

**Classification Metrics:**

```python
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, roc_auc_score

# Accuracy: Use only for balanced datasets
accuracy = accuracy_score(y_true, y_pred)

# Precision: Of positive predictions, how many correct?
# Use when false positives are costly (spam detection)

# Recall: Of actual positives, how many caught?
# Use when false negatives are costly (cancer detection)

# F1-Score: Harmonic mean of precision and recall
# Use for imbalanced datasets

precision, recall, f1, _ = precision_recall_fscore_support(y_true, y_pred)

# ROC-AUC: Area under ROC curve (0.5=random, 1.0=perfect)
# Use for binary classification, threshold-independent
auc = roc_auc_score(y_true, y_pred_proba)

# PR-AUC: Better for imbalanced datasets
from sklearn.metrics import average_precision_score
pr_auc = average_precision_score(y_true, y_pred_proba)
```

**Regression Metrics:**

```python
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# MAE: Average absolute error (same units as target)
# Less sensitive to outliers
mae = mean_absolute_error(y_true, y_pred)

# RMSE: Root mean squared error (penalizes large errors)
rmse = mean_squared_error(y_true, y_pred, squared=False)

# R²: Proportion of variance explained (0=bad, 1=perfect)
r2 = r2_score(y_true, y_pred)

# MAPE: Mean absolute percentage error
mape = np.mean(np.abs((y_true - y_pred) / y_true)) * 100
```

**Ranking Metrics:**
- NDCG (Normalized Discounted Cumulative Gain)
- MAP (Mean Average Precision)
- MRR (Mean Reciprocal Rank)

## Cross-Validation

**K-Fold CV:**
```python
from sklearn.model_selection import KFold, cross_val_score

# Standard k-fold (k=5 or 10)
kf = KFold(n_splits=5, shuffle=True, random_state=42)
scores = cross_val_score(model, X, y, cv=kf, scoring='accuracy')
```

**Stratified K-Fold (Classification):**
```python
# Preserves class distribution in each fold
from sklearn.model_selection import StratifiedKFold
skf = StratifiedKFold(n_splits=5)
```

**Time Series CV:**
```python
# No shuffling, preserves temporal order
from sklearn.model_selection import TimeSeriesSplit
tscv = TimeSeriesSplit(n_splits=5)

# Expanding window (all past data)
for train_idx, test_idx in tscv.split(X):
    X_train, X_test = X[train_idx], X[test_idx]
```

**Leave-One-Out (Small Datasets):**
```python
from sklearn.model_selection import LeaveOneOut
loo = LeaveOneOut()
# Expensive: trains n models for n samples
```

**Group K-Fold (Grouped Data):**
```python
# Ensures groups don't leak between train/test
from sklearn.model_selection import GroupKFold
gkf = GroupKFold(n_splits=5)
scores = cross_val_score(model, X, y, groups=groups, cv=gkf)
```

## Bias Detection

**Class Imbalance Check:**
```python
# Check class distribution
class_counts = pd.Series(y).value_counts()
imbalance_ratio = class_counts.max() / class_counts.min()
# If >10, dataset is imbalanced
```

**Fairness Metrics:**
```python
# Demographic parity: P(ŷ=1|A=0) = P(ŷ=1|A=1)
# Equal opportunity: P(ŷ=1|y=1,A=0) = P(ŷ=1|y=1,A=1)

# Using AIF360 library
from aif360.metrics import BinaryLabelDatasetMetric

metric = BinaryLabelDatasetMetric(dataset,
                                  unprivileged_groups=[{'sex': 0}],
                                  privileged_groups=[{'sex': 1}])
disparate_impact = metric.disparate_impact()
# 0.8-1.2 is acceptable range
```

**Confusion Matrix by Subgroup:**
```python
# Check performance across demographics
for group in df['demographic'].unique():
    subset = df[df['demographic'] == group]
    print(f"{group}: {accuracy_score(subset['y_true'], subset['y_pred'])}")
```

**Feature Importance Bias:**
```python
# Check if protected attributes have high importance
importances = model.feature_importances_
# Protected attributes shouldn't be top features
```

## A/B Testing

**Statistical Significance:**
```python
from scipy.stats import ttest_ind

# Compare control vs treatment metrics
control_conversions = [0.12, 0.13, 0.11, ...]  # Daily rates
treatment_conversions = [0.15, 0.16, 0.14, ...]

t_stat, p_value = ttest_ind(control_conversions, treatment_conversions)
if p_value < 0.05:
    print("Statistically significant difference")
```

**Sample Size Calculation:**
```python
# Minimum detectable effect (MDE)
from statsmodels.stats.power import zt_ind_solve_power

n_samples = zt_ind_solve_power(
    effect_size=0.2,  # Cohen's d
    alpha=0.05,       # Significance level
    power=0.8         # 80% power
)
```

**Multi-Armed Bandit (Adaptive):**
```python
# Thompson Sampling (Bayesian approach)
# Balances exploration/exploitation
# Reduces sample size vs fixed A/B test
```

**Guardrail Metrics:**
- Monitor system metrics (latency, errors)
- Business metrics (revenue, engagement)
- Ensure new model doesn't degrade these

## Best Practices

**Validation Strategy:**
1. Train/Val/Test split: 70/15/15
2. Cross-validation on train+val
3. Final evaluation on held-out test set
4. NEVER tune on test set

**Avoid Overfitting:**
- Monitor train vs validation metrics
- Use regularization (L1, L2, dropout)
- Early stopping
- Ensemble methods

**Production Monitoring:**
- Track prediction distribution drift
- Monitor feature distributions
- Log model performance over time
- Retrain when performance degrades

**Tools:**
- **Metrics:** scikit-learn, torchmetrics
- **Fairness:** AIF360, Fairlearn
- **Experiment Tracking:** MLflow, Weights & Biases
- **A/B Testing:** Optimizely, statsmodels
