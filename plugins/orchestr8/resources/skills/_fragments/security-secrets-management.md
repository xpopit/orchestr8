---
id: security-secrets-management
category: skill
tags: [security, secrets, vault, encryption, environment-variables, kms]
capabilities:
  - Secret storage and retrieval
  - Environment variable security
  - Secret rotation strategies
  - Vault integration (HashiCorp, AWS)
  - Encryption key management
estimatedTokens: 580
useWhen:
  - Implementing secrets management with AWS Secrets Manager for database credentials and API keys in production
  - Building secure environment variable handling with dotenv for local development and encrypted secrets in CI/CD
  - Designing secret rotation strategy with automatic credential updates and zero-downtime deployment
  - Creating secrets access control with IAM roles and policies restricting secret retrieval to authorized services
  - Implementing secret scanning with git-secrets preventing accidental credential commits to version control
---

# Secrets Management Security

## Environment Variables (Development)

```typescript
import dotenv from 'dotenv';
import { z } from 'zod';

// ✅ Load and validate environment variables
dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  API_KEY: z.string().min(20),
  ENCRYPTION_KEY: z.string().length(64), // 32 bytes hex
  PORT: z.string().default('3000').transform(Number),
});

type Env = z.infer<typeof EnvSchema>;

// Validate on startup
let env: Env;
try {
  env = EnvSchema.parse(process.env);
} catch (error) {
  console.error('Invalid environment configuration:', error);
  process.exit(1);
}

export { env };

// .env.example (commit to repo)
/*
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/db
JWT_SECRET=generate-with-openssl-rand-hex-32
API_KEY=your-api-key-here
ENCRYPTION_KEY=generate-with-openssl-rand-hex-64
PORT=3000
*/

// .env (NEVER commit - add to .gitignore)
```

## Secret Encryption at Rest

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes

interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
}

// Encrypt secret before storing
export function encrypt(plaintext: string): EncryptedData {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

// Decrypt secret when needed
export function decrypt(data: EncryptedData): string {
  const decipher = createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(data.iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));

  let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// Store API key securely
async function saveApiKey(userId: string, apiKey: string) {
  const encrypted = encrypt(apiKey);

  await prisma.apiKey.create({
    data: {
      userId,
      encryptedKey: encrypted.encrypted,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      createdAt: new Date(),
    },
  });
}

// Retrieve and decrypt
async function getApiKey(userId: string): Promise<string | null> {
  const stored = await prisma.apiKey.findFirst({ where: { userId } });

  if (!stored) return null;

  return decrypt({
    encrypted: stored.encryptedKey,
    iv: stored.iv,
    authTag: stored.authTag,
  });
}
```

## HashiCorp Vault Integration

```typescript
import vault from 'node-vault';

const client = vault({
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN,
});

// Store secret in Vault
async function storeSecret(path: string, data: Record<string, any>) {
  await client.write(`secret/data/${path}`, { data });
}

// Retrieve secret from Vault
async function getSecret(path: string): Promise<any> {
  const result = await client.read(`secret/data/${path}`);
  return result.data.data;
}

// Example: Database credentials
async function getDatabaseCredentials() {
  const secrets = await getSecret('database/postgres');
  return {
    host: secrets.host,
    port: secrets.port,
    username: secrets.username,
    password: secrets.password,
    database: secrets.database,
  };
}

// Initialize app with Vault secrets
async function initializeApp() {
  const dbCreds = await getDatabaseCredentials();
  const apiKeys = await getSecret('api-keys/external');

  const config = {
    database: {
      url: `postgresql://${dbCreds.username}:${dbCreds.password}@${dbCreds.host}:${dbCreds.port}/${dbCreds.database}`,
    },
    stripe: {
      apiKey: apiKeys.stripe_secret_key,
    },
  };

  return config;
}
```

## AWS Secrets Manager

```typescript
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: 'us-east-1' });

// Retrieve secret from AWS
async function getAwsSecret(secretName: string): Promise<any> {
  const command = new GetSecretValueCommand({ SecretId: secretName });

  try {
    const response = await client.send(command);

    if (response.SecretString) {
      return JSON.parse(response.SecretString);
    }

    throw new Error('Secret not found');
  } catch (error) {
    logger.error('Failed to retrieve secret', { secretName, error });
    throw error;
  }
}

// Cache secrets in memory (refresh periodically)
class SecretCache {
  private cache = new Map<string, { value: any; expiresAt: number }>();
  private ttl = 5 * 60 * 1000; // 5 minutes

  async get(secretName: string): Promise<any> {
    const cached = this.cache.get(secretName);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const value = await getAwsSecret(secretName);
    this.cache.set(secretName, {
      value,
      expiresAt: Date.now() + this.ttl,
    });

    return value;
  }

  invalidate(secretName: string) {
    this.cache.delete(secretName);
  }
}

const secretCache = new SecretCache();

// Usage
app.get('/api/data', async (req, res) => {
  const apiKey = await secretCache.get('external-api-key');
  const data = await externalApi.fetch(apiKey);
  res.json({ data });
});
```

## Secret Rotation

```typescript
// Implement graceful secret rotation
class RotatingSecret {
  private currentSecret: string;
  private previousSecret: string | null = null;
  private rotationInterval: NodeJS.Timeout;

  constructor(
    private secretPath: string,
    private rotationHours = 24
  ) {
    this.rotationInterval = setInterval(
      () => this.rotate(),
      rotationHours * 60 * 60 * 1000
    );
  }

  async initialize() {
    this.currentSecret = await getSecret(this.secretPath);
  }

  async rotate() {
    logger.info('Rotating secret', { path: this.secretPath });

    // Keep previous secret for grace period
    this.previousSecret = this.currentSecret;

    // Fetch new secret
    this.currentSecret = await getSecret(this.secretPath);

    // Clear previous secret after grace period (1 hour)
    setTimeout(() => {
      this.previousSecret = null;
    }, 60 * 60 * 1000);
  }

  // Try current first, fall back to previous
  verify(providedSecret: string): boolean {
    if (providedSecret === this.currentSecret) return true;
    if (providedSecret === this.previousSecret) {
      logger.warn('Using previous secret - client should update');
      return true;
    }
    return false;
  }

  getCurrent(): string {
    return this.currentSecret;
  }
}

// Usage with API keys
const apiKeySecret = new RotatingSecret('api-keys/service');
await apiKeySecret.initialize();

app.use('/api', (req, res, next) => {
  const providedKey = req.headers['x-api-key'] as string;

  if (!apiKeySecret.verify(providedKey)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  next();
});
```

## Kubernetes Secrets

```yaml
# k8s-secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
stringData:
  DATABASE_URL: postgresql://user:password@db:5432/mydb
  JWT_SECRET: your-secret-here
  API_KEY: your-api-key-here
```

```typescript
// Access in Node.js
import fs from 'fs/promises';

// Kubernetes mounts secrets as files
async function loadK8sSecrets() {
  const secretsPath = '/var/run/secrets/app';

  const [databaseUrl, jwtSecret, apiKey] = await Promise.all([
    fs.readFile(`${secretsPath}/DATABASE_URL`, 'utf8'),
    fs.readFile(`${secretsPath}/JWT_SECRET`, 'utf8'),
    fs.readFile(`${secretsPath}/API_KEY`, 'utf8'),
  ]);

  return {
    DATABASE_URL: databaseUrl.trim(),
    JWT_SECRET: jwtSecret.trim(),
    API_KEY: apiKey.trim(),
  };
}
```

## Anti-Patterns

```typescript
// ❌ NEVER: Hardcode secrets
const apiKey = 'sk_live_abcd1234'; // NEVER

// ❌ NEVER: Commit .env to repo
// Add to .gitignore:
// .env
// .env.local
// .env.*.local

// ❌ NEVER: Log secrets
logger.info('API key', { apiKey }); // NEVER

// ❌ NEVER: Store secrets in client-side code
const config = {
  apiKey: 'secret123', // Exposed to users
};

// ❌ NEVER: Use weak encryption
const encrypted = Buffer.from(secret).toString('base64'); // Not encryption!

// ✅ ALWAYS: Use environment variables or secret managers
const apiKey = process.env.API_KEY || await getSecret('api-key');
```

## Secret Detection

```bash
# Install pre-commit hook to detect secrets
npm install -D @commitlint/cli husky

# .pre-commit-config.yaml
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
```

## Best Practices

1. **Never hardcode secrets**: Use environment variables or secret managers
2. **Encrypt at rest**: Use AES-256-GCM for stored secrets
3. **Rotate regularly**: Implement automatic rotation (daily/weekly)
4. **Use secret managers**: Vault, AWS Secrets Manager, Azure Key Vault
5. **Validate on startup**: Fail fast if secrets missing/invalid
6. **Least privilege**: Each service gets only needed secrets
7. **Audit access**: Log all secret retrievals
8. **Grace period**: Support old + new during rotation
9. **Separate environments**: Different secrets for dev/staging/prod
10. **Pre-commit hooks**: Detect accidentally committed secrets

## Compliance

- **PCI DSS**: 3.4 Cryptographic key management
- **SOC 2**: CC6.1 Logical access controls
- **GDPR**: Article 32 Security of processing
- **HIPAA**: 164.312(a)(2)(iv) Encryption
