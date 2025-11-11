---
id: k8s-secrets-management
category: guide
tags: [kubernetes, secrets, security, vault, sealed-secrets]
capabilities:
  - Kubernetes secrets management
  - External secrets operator
  - Sealed secrets
useWhen:
  - Managing Kubernetes secrets with External Secrets Operator syncing from AWS Secrets Manager or Vault with automatic refresh
  - Implementing GitOps-friendly secret management using Sealed Secrets for encrypted secrets that can be safely committed to Git
  - Building production K8s environments requiring centralized secret storage in AWS Secrets Manager with IRSA authentication
  - Deploying applications needing automatic secret rotation with 1-hour refresh intervals via External Secrets Operator
  - Setting up Kubernetes secret injection from HashiCorp Vault using agent sidecar pattern for dynamic secret management
  - Implementing secure secret workflows where developers can't access production secrets but deployments automatically fetch them
estimatedTokens: 450
---

# Kubernetes Secrets Management

## Option 1: Sealed Secrets (GitOps-friendly)

```bash
# Install Sealed Secrets controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Install kubeseal CLI
brew install kubeseal

# Create sealed secret
echo -n "my-secret-value" | kubectl create secret generic my-secret \
  --dry-run=client \
  --from-file=password=/dev/stdin \
  -o yaml | \
  kubeseal -o yaml > sealed-secret.yaml

# Apply (safe to commit to git)
kubectl apply -f sealed-secret.yaml
```

## Option 2: External Secrets Operator (AWS Secrets Manager)

```yaml
# Install External Secrets Operator
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets -n external-secrets --create-namespace

# SecretStore
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets-manager
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets

# ExternalSecret
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: app-secrets
    creationPolicy: Owner
  data:
  - secretKey: DATABASE_URL
    remoteRef:
      key: production/database-url
  - secretKey: API_KEY
    remoteRef:
      key: production/api-key
```

## Option 3: HashiCorp Vault

```yaml
# Install Vault
helm repo add hashicorp https://helm.releases.hashicorp.com
helm install vault hashicorp/vault

# Vault agent injector annotation
apiVersion: v1
kind: Pod
metadata:
  annotations:
    vault.hashicorp.com/agent-inject: "true"
    vault.hashicorp.com/role: "myapp"
    vault.hashicorp.com/agent-inject-secret-database: "secret/data/database/config"
spec:
  containers:
  - name: app
    image: myapp:latest
```

**Best Practice:** Use External Secrets Operator with cloud provider secret managers for production.
