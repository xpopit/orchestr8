---
id: workflow-build-ml-pipeline
category: pattern
tags: [workflow, ml, machine-learning, data-pipeline, mlops, training, deployment, model, automation]
capabilities:
  - End-to-end ML pipeline construction
  - Data engineering and model training automation
  - MLOps deployment and monitoring
useWhen:
  - ML pipeline construction requiring data ingestion, preprocessing, model training, validation, and deployment automation
  - Machine learning workflow design needing feature engineering, model versioning, A/B testing, and monitoring integration
estimatedTokens: 540
---

# ML Pipeline Development Pattern

**Phases:** Discovery (0-15%) → Data (15-35%) → Model (35-65%) → Deployment (65-85%) → Operations (85-100%)

## Phase 1: Problem Discovery (0-15%)
- Define business problem and success metrics
- Assess data availability and quality
- Choose ML approach (supervised, unsupervised, RL)
- Estimate feasibility and ROI
- **Checkpoint:** Problem scoped, approach validated

## Phase 2: Data Engineering (15-35%)
**Parallel tracks:**
- **Collection:** Identify sources, APIs, databases, scraping
- **Pipeline:** ETL/ELT automation, data validation, versioning
- **Exploration:** EDA, distributions, correlations, missing data
- **Preprocessing:** Cleaning, feature engineering, normalization, splits (train/val/test)
- **Checkpoint:** Clean, versioned dataset ready

## Phase 3: Model Development (35-65%)
**Parallel tracks:**
- **Baseline:** Simple model (logistic regression, decision tree) for comparison
- **Experimentation:** Try multiple algorithms (ensemble, neural nets, etc.)
- **Training:** Hyperparameter tuning, cross-validation, regularization
- **Evaluation:** Metrics (accuracy, precision, recall, F1, AUC), confusion matrix, error analysis
- **Iteration:** Feature engineering based on errors, data augmentation

**Per-Experiment Loop:**
1. Define hypothesis (new features, algorithm, hyperparams)
2. Train model with experiment tracking (MLflow, W&B)
3. Evaluate on validation set
4. Log metrics, artifacts, parameters
5. Analyze errors, iterate

- **Checkpoint:** Model meets success criteria on test set

## Phase 4: Deployment Pipeline (65-85%)
**Parallel tracks:**
- **Serving:** REST API (FastAPI/Flask), batch prediction, streaming
- **Containerization:** Docker, dependencies, model artifacts
- **Infrastructure:** Cloud (AWS/GCP/Azure), scaling, GPU if needed
- **CI/CD:** Automated testing, model validation, deployment pipeline
- **Monitoring Setup:** Logging, metrics (latency, throughput), alerts
- **Checkpoint:** Model deployed, serving predictions

## Phase 5: MLOps & Operations (85-100%)
**Parallel tracks:**
- **Monitoring:** Data drift, model drift, performance degradation
- **Retraining:** Automated pipelines triggered by drift or schedule
- **A/B Testing:** Shadow mode, canary deployments, champion/challenger
- **Optimization:** Latency reduction, model compression, caching
- **Docs:** Model cards, API docs, runbooks, incident response
- **Checkpoint:** Production system healthy, monitored, automated

## Parallelism
- **Independent:** Collection + Exploration (Phase 2), Baseline + Experimentation (Phase 3), Serving + Docker + Infra (Phase 4), Monitoring + Retraining + A/B Testing (Phase 5)
- **Dependencies:** Model needs data, deployment needs trained model, operations needs deployment

## Key Principles
- **Iterate fast:** Start simple, add complexity incrementally
- **Track experiments:** Log everything (data versions, hyperparams, metrics)
- **Monitor continuously:** Catch drift before it impacts users
- **Automate retraining:** Models decay, pipelines must refresh
- **Validate rigorously:** Test on holdout data, monitor production metrics
