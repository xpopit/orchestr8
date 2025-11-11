---
id: ml-feature-engineering
category: skill
tags: [machine-learning, ml, feature-engineering, preprocessing, encoding, scaling, feature-store]
capabilities:
  - Feature selection techniques
  - Categorical encoding strategies
  - Feature scaling methods
  - Feature store implementation
useWhen:
  - Implementing feature engineering pipeline for machine learning with normalization, encoding, and feature selection
  - Building feature extraction workflow from raw data creating meaningful representations for model training
  - Designing feature store architecture for ML models enabling feature reuse and consistent online/offline serving
  - Creating automated feature engineering with time-series windowing, aggregations, and lagged variables
  - Implementing feature importance analysis with SHAP values identifying most predictive features for model optimization
estimatedTokens: 600
---

# ML Feature Engineering

## Feature Selection

**Filter Methods (Fast, Model-Agnostic):**
```python
# Correlation with target
from scipy.stats import pearsonr
correlations = {col: pearsonr(df[col], y)[0] for col in df.columns}

# Mutual information
from sklearn.feature_selection import mutual_info_regression
mi = mutual_info_regression(X, y)

# Variance threshold (remove low-variance)
from sklearn.feature_selection import VarianceThreshold
selector = VarianceThreshold(threshold=0.01)
```

**Wrapper Methods (Slow, Model-Specific):**
```python
# Recursive feature elimination
from sklearn.feature_selection import RFE
rfe = RFE(estimator=RandomForestRegressor(), n_features_to_select=10)
rfe.fit(X, y)

# Forward/backward selection
from mlxtend.feature_selection import SequentialFeatureSelector
sfs = SequentialFeatureSelector(model, k_features=10, forward=True)
```

**Embedded Methods (During Training):**
- L1 regularization (Lasso) - drives coefficients to zero
- Tree feature importance
- Gradient boosting gain/split counts

## Categorical Encoding

**One-Hot Encoding (Low Cardinality <10):**
```python
from sklearn.preprocessing import OneHotEncoder
encoder = OneHotEncoder(sparse=False, handle_unknown='ignore')
# Creates binary columns for each category
```

**Label Encoding (Ordinal):**
```python
# For ordered categories: small, medium, large
from sklearn.preprocessing import OrdinalEncoder
encoder = OrdinalEncoder(categories=[['small', 'medium', 'large']])
```

**Target Encoding (High Cardinality):**
```python
# Mean target per category (risk of overfitting)
category_means = df.groupby('category')['target'].mean()
df['category_encoded'] = df['category'].map(category_means)
```

**Frequency Encoding:**
```python
# Count occurrences
freq = df['category'].value_counts(normalize=True)
df['category_freq'] = df['category'].map(freq)
```

**Embedding (Deep Learning):**
```python
# For very high cardinality (user IDs, product IDs)
from tensorflow.keras.layers import Embedding
embedding = Embedding(input_dim=n_categories, output_dim=50)
```

## Feature Scaling

**Standardization (Z-Score):**
```python
# Mean=0, Std=1 (preserves outliers)
from sklearn.preprocessing import StandardScaler
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
# Use for: linear models, neural networks, PCA
```

**Min-Max Scaling:**
```python
# Range [0, 1]
from sklearn.preprocessing import MinMaxScaler
scaler = MinMaxScaler()
# Use for: neural networks, image data
```

**Robust Scaling:**
```python
# Uses median and IQR (robust to outliers)
from sklearn.preprocessing import RobustScaler
scaler = RobustScaler()
# Use for: data with outliers
```

**When NOT to Scale:**
- Tree-based models (Random Forest, XGBoost)
- Already scaled features (probabilities, percentages)

## Feature Engineering Techniques

**Datetime Features:**
```python
# Extract temporal patterns
df['hour'] = df['timestamp'].dt.hour
df['day_of_week'] = df['timestamp'].dt.dayofweek
df['is_weekend'] = df['day_of_week'].isin([5, 6])
df['quarter'] = df['timestamp'].dt.quarter
```

**Binning/Discretization:**
```python
# Convert continuous to categorical
df['age_group'] = pd.cut(df['age'], bins=[0, 18, 35, 50, 100],
                          labels=['youth', 'adult', 'middle', 'senior'])
```

**Interaction Features:**
```python
# Polynomial features
from sklearn.preprocessing import PolynomialFeatures
poly = PolynomialFeatures(degree=2, interaction_only=True)
# Creates: x1*x2, x1*x3, x2*x3
```

**Aggregations (Time-Series):**
```python
# Rolling statistics
df['rolling_mean_7d'] = df['value'].rolling(7).mean()
df['rolling_std_7d'] = df['value'].rolling(7).std()

# Lag features
df['lag_1'] = df['value'].shift(1)
df['lag_7'] = df['value'].shift(7)
```

## Feature Stores

**Why Use:**
- Consistent features across training/serving
- Avoid train/serve skew
- Reuse features across models
- Point-in-time correctness

**Architecture:**
```python
# Feast example
from feast import FeatureStore

store = FeatureStore(repo_path=".")

# Define features
features = [
    "user_features:age",
    "user_features:purchase_count_30d"
]

# Training: historical features
training_df = store.get_historical_features(
    entity_df=entity_df,
    features=features
).to_df()

# Serving: online features
online_features = store.get_online_features(
    features=features,
    entity_rows=[{"user_id": 123}]
).to_dict()
```

**Popular Tools:**
- **Feast:** Open-source, cloud-agnostic
- **Tecton:** Managed, enterprise
- **AWS SageMaker Feature Store**
- **Google Vertex AI Feature Store**

## Best Practices

- Split before scaling (fit on train, transform on test)
- Handle missing values before encoding
- Document transformations for reproducibility
- Version feature pipelines
- Monitor feature drift in production
