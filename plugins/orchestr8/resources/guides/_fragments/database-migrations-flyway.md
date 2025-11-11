---
id: database-migrations-flyway
category: guide
tags: [database, migrations, flyway, postgres, devops]
capabilities:
  - Database migration strategy
  - Flyway setup
  - Version control for schemas
useWhen:
  - Managing PostgreSQL schema evolution with version-controlled migrations using Flyway requiring sequential V1, V2, V3 naming
  - Implementing database migrations in CI/CD pipelines with automated validation, rollback plans, and production testing
  - Building migration workflows for Kubernetes deployments using Flyway as init Job before application pods start
  - Managing schema changes across multiple environments (dev, staging, prod) with Flyway baseline and validate on migrate
  - Deploying databases requiring audit trails, soft deletes, and incremental schema updates without modifying existing migrations
  - Integrating Flyway with Docker containers and ConfigMaps for GitOps-friendly database migration management
estimatedTokens: 420
---

# Database Migrations with Flyway

## Directory Structure

```
migrations/
├── V1__initial_schema.sql
├── V2__add_users_table.sql
├── V3__add_email_index.sql
└── V4__add_audit_columns.sql
```

## Migration Files

```sql
-- V1__initial_schema.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- V2__add_roles.sql
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

ALTER TABLE users ADD COLUMN role_id INTEGER REFERENCES roles(id);

INSERT INTO roles (name) VALUES ('admin'), ('user');

-- V3__add_audit_columns.sql
ALTER TABLE users ADD COLUMN updated_at TIMESTAMP;
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP;

CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;
```

## Flyway Configuration

```properties
# flyway.conf
flyway.url=jdbc:postgresql://localhost:5432/myapp
flyway.user=postgres
flyway.password=password
flyway.locations=filesystem:./migrations
flyway.baselineOnMigrate=true
flyway.validateOnMigrate=true
```

## Docker Integration

```dockerfile
FROM flyway/flyway:10

COPY migrations /flyway/sql
```

## Kubernetes Job

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration
  namespace: production
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: flyway
        image: flyway/flyway:10
        args:
          - migrate
        env:
        - name: FLYWAY_URL
          valueFrom:
            secretKeyRef:
              name: database-secrets
              key: url
        - name: FLYWAY_USER
          valueFrom:
            secretKeyRef:
              name: database-secrets
              key: username
        - name: FLYWAY_PASSWORD
          valueFrom:
            secretKeyRef:
              name: database-secrets
              key: password
        volumeMounts:
        - name: migrations
          mountPath: /flyway/sql
      volumes:
      - name: migrations
        configMap:
          name: db-migrations
```

## CI/CD Integration

```yaml
# In GitHub Actions
- name: Run migrations
  run: |
    flyway -url="${DATABASE_URL}" \
           -user="${DB_USER}" \
           -password="${DB_PASSWORD}" \
           -locations="filesystem:./migrations" \
           migrate
```

**Best Practices:**
- Never modify existing migrations
- Test migrations on copy of production data
- Always have rollback plan
- Use transactions where possible
