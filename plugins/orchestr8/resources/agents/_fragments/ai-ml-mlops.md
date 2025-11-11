---
id: ai-ml-mlops
category: agent
tags: [mlops, deployment, monitoring, mlflow, wandb, docker, model-serving, experiment-tracking, ci-cd-ml]
capabilities:
  - Experiment tracking and versioning
  - Model deployment and serving
  - Monitoring and drift detection
  - ML pipeline orchestration
  - Reproducibility and version control
useWhen:
  - Building MLOps pipelines with MLflow for experiment tracking, model registry, and deployment, integrating with training workflows and production serving
  - Implementing model versioning and lineage tracking using DVC for data versioning, Git for code, and model registries for artifacts with A/B testing capabilities
  - Deploying ML models to production using Docker containers, Kubernetes for orchestration, and serving frameworks (TorchServe, TensorFlow Serving, FastAPI)
  - Monitoring model performance in production with prediction drift detection, data drift analysis using statistical tests, and automated retraining triggers
  - Setting up feature stores with Feast or Tecton for consistent feature computation across training and inference, reducing training-serving skew
  - Automating ML workflows with Kubeflow Pipelines, Airflow, or Prefect for orchestrating data prep, training, evaluation, and deployment stages
estimatedTokens: 700
---

# AI/ML Engineer - MLOps Expertise

## Experiment Tracking

**MLflow - comprehensive tracking:**
```python
import mlflow
import mlflow.pytorch
from mlflow.tracking import MlflowClient

# Start experiment
mlflow.set_experiment('image-classification')

with mlflow.start_run(run_name='resnet50-finetuned'):
    # Log parameters
    mlflow.log_param('model_architecture', 'resnet50')
    mlflow.log_param('learning_rate', 0.001)
    mlflow.log_param('batch_size', 32)
    mlflow.log_param('optimizer', 'adam')

    # Training loop
    for epoch in range(epochs):
        train_loss, train_acc = train_epoch(model, train_loader)
        val_loss, val_acc = validate(model, val_loader)

        # Log metrics
        mlflow.log_metric('train_loss', train_loss, step=epoch)
        mlflow.log_metric('train_acc', train_acc, step=epoch)
        mlflow.log_metric('val_loss', val_loss, step=epoch)
        mlflow.log_metric('val_acc', val_acc, step=epoch)

    # Log model
    mlflow.pytorch.log_model(model, 'model')

    # Log artifacts (plots, confusion matrix, etc.)
    mlflow.log_artifact('confusion_matrix.png')
    mlflow.log_dict(classification_report, 'metrics.json')

# Load best model from registry
client = MlflowClient()
model_uri = f'models:/image-classifier/production'
model = mlflow.pytorch.load_model(model_uri)

# Weights & Biases - real-time visualization
import wandb

wandb.init(
    project='image-classification',
    config={
        'learning_rate': 0.001,
        'batch_size': 32,
        'epochs': 100,
        'architecture': 'resnet50'
    }
)

for epoch in range(epochs):
    train_loss = train_epoch(model, train_loader)

    # Log metrics and visualizations
    wandb.log({
        'epoch': epoch,
        'train_loss': train_loss,
        'val_acc': val_acc,
        'learning_rate': optimizer.param_groups[0]['lr']
    })

    # Log images, tables, charts
    wandb.log({'predictions': wandb.Image(image, caption=f'Pred: {pred}')})

wandb.finish()
```

## Model Versioning & Registry

**DVC - data and model versioning:**
```bash
# Initialize DVC
dvc init

# Track data
dvc add data/train.csv
git add data/train.csv.dvc data/.gitignore
git commit -m "Add training data"

# Configure remote storage (S3, GCS, Azure, etc.)
dvc remote add -d storage s3://my-bucket/dvc-storage
dvc push

# Track model
dvc add models/best_model.pth
git add models/best_model.pth.dvc
git commit -m "Add trained model v1.0"
dvc push

# Reproduce pipeline
dvc repro

# Switch to different version
git checkout v1.0
dvc checkout
```

**MLflow Model Registry:**
```python
from mlflow.tracking import MlflowClient

client = MlflowClient()

# Register model
model_uri = f'runs:/{run_id}/model'
result = mlflow.register_model(model_uri, 'image-classifier')

# Transition to staging
client.transition_model_version_stage(
    name='image-classifier',
    version=result.version,
    stage='Staging'
)

# Promote to production after validation
client.transition_model_version_stage(
    name='image-classifier',
    version=result.version,
    stage='Production',
    archive_existing_versions=True
)

# Load production model
model = mlflow.pyfunc.load_model(f'models:/image-classifier/production')
```

## Model Serving

**FastAPI for REST API:**
```python
from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel
import torch
from PIL import Image
import io

app = FastAPI()

# Load model at startup
model = None
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

@app.on_event('startup')
async def load_model():
    global model
    model = torch.load('model.pth', map_location=device)
    model.eval()

class PredictionResponse(BaseModel):
    class_id: int
    class_name: str
    confidence: float

@app.post('/predict', response_model=PredictionResponse)
async def predict(file: UploadFile = File(...)):
    # Read and preprocess image
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert('RGB')
    image_tensor = transform(image).unsqueeze(0).to(device)

    # Inference
    with torch.no_grad():
        output = model(image_tensor)
        probabilities = torch.softmax(output, dim=1)
        confidence, predicted = torch.max(probabilities, 1)

    class_id = predicted.item()
    return PredictionResponse(
        class_id=class_id,
        class_name=class_names[class_id],
        confidence=confidence.item()
    )

@app.get('/health')
async def health():
    return {'status': 'healthy', 'model_loaded': model is not None}

# Run with: uvicorn app:app --host 0.0.0.0 --port 8000 --workers 4
```

**TorchServe - production-grade serving:**
```bash
# Archive model
torch-model-archiver \
  --model-name image_classifier \
  --version 1.0 \
  --model-file model.py \
  --serialized-file model.pth \
  --handler image_classifier_handler.py \
  --export-path model-store

# Start TorchServe
torchserve --start --model-store model-store --models classifier=image_classifier.mar

# Inference
curl -X POST http://localhost:8080/predictions/classifier -T image.jpg
```

**BentoML - framework-agnostic serving:**
```python
import bentoml
from bentoml.io import Image, JSON

# Save model to BentoML
bentoml.pytorch.save_model('image_classifier', model)

# Create service
@bentoml.service(
    resources={'gpu': 1},
    traffic={'timeout': 30}
)
class ImageClassifier:
    def __init__(self):
        self.model = bentoml.pytorch.load_model('image_classifier:latest')
        self.model.eval()

    @bentoml.api
    def predict(self, image: Image) -> JSON:
        tensor = transform(image).unsqueeze(0)
        with torch.no_grad():
            output = self.model(tensor)
            probabilities = torch.softmax(output, dim=1)
        return {'predictions': probabilities.tolist()}

# Build and containerize
# bentoml build
# bentoml containerize image_classifier:latest
```

## Monitoring & Drift Detection

**Model performance monitoring:**
```python
import prometheus_client
from prometheus_client import Counter, Histogram, Gauge
import time

# Metrics
prediction_counter = Counter('predictions_total', 'Total predictions')
prediction_latency = Histogram('prediction_latency_seconds', 'Prediction latency')
prediction_confidence = Histogram('prediction_confidence', 'Prediction confidence')
drift_score = Gauge('feature_drift_score', 'Feature drift score')

@app.post('/predict')
async def predict_with_monitoring(file: UploadFile):
    start_time = time.time()

    # Prediction logic
    result = await predict(file)

    # Record metrics
    prediction_counter.inc()
    latency = time.time() - start_time
    prediction_latency.observe(latency)
    prediction_confidence.observe(result.confidence)

    return result

# Expose metrics endpoint
@app.get('/metrics')
async def metrics():
    return prometheus_client.generate_latest()

# Data drift detection with Evidently
from evidently.report import Report
from evidently.metric_preset import DataDriftPreset
import pandas as pd

reference_data = pd.read_csv('reference_data.csv')
current_data = pd.read_csv('production_data.csv')

report = Report(metrics=[DataDriftPreset()])
report.run(reference_data=reference_data, current_data=current_data)
report.save_html('drift_report.html')

# Get drift score
drift_result = report.as_dict()
if drift_result['metrics'][0]['result']['dataset_drift']:
    drift_score.set(drift_result['metrics'][0]['result']['share_of_drifted_columns'])
```

## Containerization & Deployment

**Docker for ML models:**
```dockerfile
FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy model and code
COPY model.pth .
COPY app.py .
COPY transforms.py .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl --fail http://localhost:8000/health || exit 1

# Run application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

**Kubernetes deployment:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-model-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ml-model
  template:
    metadata:
      labels:
        app: ml-model
    spec:
      containers:
      - name: ml-model
        image: ml-model:v1.0
        ports:
        - containerPort: 8000
        resources:
          requests:
            memory: "2Gi"
            cpu: "1"
            nvidia.com/gpu: "1"
          limits:
            memory: "4Gi"
            cpu: "2"
            nvidia.com/gpu: "1"
        env:
        - name: MODEL_PATH
          value: "/models/model.pth"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: ml-model-service
spec:
  selector:
    app: ml-model
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  type: LoadBalancer
```

## CI/CD for ML

**GitHub Actions workflow:**
```yaml
name: ML Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-model:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.10'

    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        pip install pytest

    - name: Run tests
      run: pytest tests/

    - name: Check model performance
      run: python scripts/evaluate_model.py --threshold 0.85

  train-and-deploy:
    needs: test-model
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Train model
      run: python train.py

    - name: Register model
      env:
        MLFLOW_TRACKING_URI: ${{ secrets.MLFLOW_URI }}
      run: python scripts/register_model.py

    - name: Build Docker image
      run: docker build -t ml-model:${{ github.sha }} .

    - name: Push to registry
      run: |
        echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
        docker push ml-model:${{ github.sha }}

    - name: Deploy to production
      run: kubectl set image deployment/ml-model ml-model=ml-model:${{ github.sha }}
```

## Pipeline Orchestration

**Kubeflow Pipelines:**
```python
from kfp import dsl
from kfp import compiler

@dsl.component
def preprocess_data(input_path: str, output_path: str):
    import pandas as pd
    data = pd.read_csv(input_path)
    # Preprocessing logic
    data.to_csv(output_path, index=False)

@dsl.component
def train_model(data_path: str, model_path: str, learning_rate: float):
    # Training logic
    pass

@dsl.component
def evaluate_model(model_path: str, test_data_path: str) -> float:
    # Evaluation logic
    return accuracy

@dsl.pipeline(name='ML Training Pipeline')
def ml_pipeline(input_data: str, lr: float = 0.001):
    preprocess = preprocess_data(input_path=input_data, output_path='/data/processed.csv')
    train = train_model(data_path=preprocess.outputs['output_path'], model_path='/models/model.pth', learning_rate=lr)
    evaluate = evaluate_model(model_path=train.outputs['model_path'], test_data_path='/data/test.csv')

# Compile and run
compiler.Compiler().compile(ml_pipeline, 'pipeline.yaml')
```

## Best Practices

- **Version everything** - Code, data, models, environment
- **Track all experiments** - Parameters, metrics, artifacts
- **Automate testing** - Unit tests, integration tests, model validation
- **Monitor in production** - Performance, latency, drift, errors
- **Use feature stores** - Centralize feature engineering (Feast, Tecton)
- **Implement A/B testing** - Gradual rollout, champion/challenger
- **Set up alerts** - Performance degradation, drift detection
- **Document models** - Model cards, data sheets, limitations

## Anti-Patterns

- No experiment tracking (can't reproduce results)
- Training on different data than production (train/serve skew)
- Not monitoring model performance in production
- Hardcoding configurations instead of using config files
- No rollback strategy for failed deployments
- Not setting resource limits (OOM crashes)
- Ignoring security (model theft, adversarial attacks)
- Manual deployment processes
