# 🚀 엔터프라이즈급 배포 및 확장성 아키텍처

## 🐳 Docker & Kubernetes 배포 전략

### 컨테이너화 구조
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  # 🎯 프론트엔드
  frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile.prod
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.medical-chat.com
    depends_on:
      - auth-service
      - chat-service

  # 🔐 인증 서비스
  auth-service:
    build: ./services/auth
    ports:
      - "4001:4001"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/auth_db
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis

  # 💬 채팅 서비스
  chat-service:
    build: ./services/chat
    ports:
      - "4002:4002"
    environment:
      - MONGODB_URL=mongodb://mongo:27017/chat_db
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis

  # 👑 관리자 서비스
  admin-service:
    build: ./services/admin
    ports:
      - "4003:4003"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/admin_db
    depends_on:
      - postgres

  # 🗄️ 데이터베이스
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: medical_chat
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  mongo:
    image: mongo:6
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongo_data:/data/db

  # 🔄 로드 밸런서
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - frontend
      - auth-service
      - chat-service

volumes:
  postgres_data:
  redis_data:
  mongo_data:
```

### Kubernetes 배포 (Production)
```yaml
# k8s/namespace.yml
apiVersion: v1
kind: Namespace
metadata:
  name: medical-chat
  labels:
    app: medical-chat

---
# k8s/configmap.yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: medical-chat
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  SESSION_TIMEOUT: "1800000"

---
# k8s/secret.yml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: medical-chat
type: Opaque
data:
  jwt-secret: <base64-encoded-secret>
  db-password: <base64-encoded-password>
  redis-password: <base64-encoded-password>

---
# k8s/frontend-deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: medical-chat
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: medical-chat/frontend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: NODE_ENV
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
# k8s/chat-service-deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chat-service
  namespace: medical-chat
spec:
  replicas: 5  # 실시간 채팅 부하 대비
  selector:
    matchLabels:
      app: chat-service
  template:
    metadata:
      labels:
        app: chat-service
    spec:
      containers:
      - name: chat-service
        image: medical-chat/chat-service:latest
        ports:
        - containerPort: 4002
        env:
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        - name: MONGODB_URL
          value: "mongodb://mongo-service:27017/chat_db"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"

---
# k8s/hpa.yml - Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: chat-service-hpa
  namespace: medical-chat
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: chat-service
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80

---
# k8s/ingress.yml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: medical-chat-ingress
  namespace: medical-chat
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - medical-chat.com
    - api.medical-chat.com
    secretName: medical-chat-tls
  rules:
  - host: medical-chat.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 3000
  - host: api.medical-chat.com
    http:
      paths:
      - path: /auth
        pathType: Prefix
        backend:
          service:
            name: auth-service
            port:
              number: 4001
      - path: /chat
        pathType: Prefix
        backend:
          service:
            name: chat-service
            port:
              number: 4002
```

## 📈 확장성 및 성능 최적화

### Load Balancer 설정
```nginx
# nginx.conf
upstream frontend_servers {
    least_conn;
    server frontend-1:3000 weight=1;
    server frontend-2:3000 weight=1;
    server frontend-3:3000 weight=1;
}

upstream chat_servers {
    ip_hash;  # WebSocket sticky session을 위해
    server chat-service-1:4002;
    server chat-service-2:4002;
    server chat-service-3:4002;
}

server {
    listen 443 ssl http2;
    server_name medical-chat.com;
    
    # SSL 설정
    ssl_certificate /etc/ssl/certs/fullchain.pem;
    ssl_certificate_key /etc/ssl/certs/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    
    # 보안 헤더
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    limit_req_zone $binary_remote_addr zone=chat:10m rate=300r/m;
    
    location / {
        proxy_pass http://frontend_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api/chat {
        limit_req zone=chat burst=50 nodelay;
        proxy_pass http://chat_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Redis Clustering (캐싱 및 세션)
```typescript
// redis-cluster.config.ts
import { Redis, Cluster } from 'ioredis'

export class RedisClusterManager {
  private cluster: Cluster
  
  constructor() {
    this.cluster = new Cluster([
      { host: 'redis-node-1', port: 6379 },
      { host: 'redis-node-2', port: 6379 },
      { host: 'redis-node-3', port: 6379 }
    ], {
      redisOptions: {
        password: process.env.REDIS_PASSWORD,
        connectTimeout: 10000,
        lazyConnect: true
      },
      slotsRefreshTimeout: 10000,
      enableOfflineQueue: false
    })
  }
  
  // 세션 관리
  async setSession(sessionId: string, data: any, ttl: number = 1800) {
    await this.cluster.setex(`session:${sessionId}`, ttl, JSON.stringify(data))
  }
  
  async getSession(sessionId: string): Promise<any> {
    const data = await this.cluster.get(`session:${sessionId}`)
    return data ? JSON.parse(data) : null
  }
  
  // 실시간 채팅 캐시
  async cacheMessage(roomId: string, message: any) {
    await this.cluster.lpush(`room:${roomId}:messages`, JSON.stringify(message))
    await this.cluster.ltrim(`room:${roomId}:messages`, 0, 99) // 최근 100개만 유지
  }
  
  async getCachedMessages(roomId: string): Promise<any[]> {
    const messages = await this.cluster.lrange(`room:${roomId}:messages`, 0, -1)
    return messages.map(msg => JSON.parse(msg))
  }
}
```

## 🔄 CI/CD 파이프라인

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy Medical Chat System

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: medical-chat

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [frontend, auth-service, chat-service, admin-service]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: '${{ matrix.service }}/package-lock.json'
    
    - name: Install dependencies
      run: npm ci
      working-directory: ./${{ matrix.service }}
    
    - name: Run tests
      run: npm test
      working-directory: ./${{ matrix.service }}
    
    - name: Run security audit
      run: npm audit --audit-level high
      working-directory: ./${{ matrix.service }}

  security-scan:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Run CodeQL Analysis
      uses: github/codeql-action/init@v2
      with:
        languages: javascript, typescript
    
    - name: Perform CodeQL Analysis
      uses: github/codeql-action/analyze@v2
    
    - name: Run OWASP Dependency Check
      uses: dependency-check/Dependency-Check_Action@main
      with:
        project: 'Medical Chat'
        path: '.'
        format: 'ALL'

  build-and-push:
    runs-on: ubuntu-latest
    needs: [test, security-scan]
    if: github.ref == 'refs/heads/main'
    
    strategy:
      matrix:
        service: [frontend, auth-service, chat-service, admin-service]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Login to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/${{ matrix.service }}
        tags: |
          type=ref,event=branch
          type=sha,prefix={{branch}}-
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: ./${{ matrix.service }}
        platforms: linux/amd64,linux/arm64
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  deploy:
    runs-on: ubuntu-latest
    needs: build-and-push
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup kubectl
      uses: azure/setup-kubectl@v3
      with:
        version: 'v1.25.0'
    
    - name: Setup Helm
      uses: azure/setup-helm@v3
      with:
        version: '3.10.0'
    
    - name: Deploy to Kubernetes
      env:
        KUBE_CONFIG: ${{ secrets.KUBE_CONFIG }}
      run: |
        echo "$KUBE_CONFIG" | base64 -d > kubeconfig
        export KUBECONFIG=kubeconfig
        
        # Helm 차트로 배포
        helm upgrade --install medical-chat ./helm-chart \
          --namespace medical-chat \
          --create-namespace \
          --set image.tag=${{ github.sha }} \
          --set environment=production \
          --wait --timeout=600s
    
    - name: Verify deployment
      run: |
        kubectl get pods -n medical-chat
        kubectl get services -n medical-chat
        
        # Health check
        kubectl wait --for=condition=ready pod -l app=frontend -n medical-chat --timeout=300s
        kubectl wait --for=condition=ready pod -l app=chat-service -n medical-chat --timeout=300s

  notify:
    runs-on: ubuntu-latest
    needs: [deploy]
    if: always()
    
    steps:
    - name: Notify deployment status
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        channel: '#deployments'
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        fields: repo,message,commit,author,action,eventName,ref,workflow
```

## 📊 모니터링 및 로깅

### Prometheus + Grafana 설정
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert-rules.yml"

scrape_configs:
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
    - role: pod
    relabel_configs:
    - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
      action: keep
      regex: true

  - job_name: 'medical-chat-services'
    static_configs:
    - targets: 
      - 'auth-service:4001'
      - 'chat-service:4002'
      - 'admin-service:4003'
    metrics_path: '/metrics'
    scrape_interval: 5s

alerting:
  alertmanagers:
  - static_configs:
    - targets:
      - alertmanager:9093

# monitoring/alert-rules.yml
groups:
- name: medical-chat-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
      description: "Error rate is {{ $value }} per second"

  - alert: HighMemoryUsage
    expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High memory usage detected"

  - alert: ChatServiceDown
    expr: up{job="medical-chat-services",instance=~"chat-service:.*"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Chat service is down"
```

### ELK Stack (로깅)
```yaml
# logging/filebeat.yml
filebeat.inputs:
- type: container
  paths:
    - '/var/lib/docker/containers/*/*.log'
  processors:
  - add_kubernetes_metadata:
      host: ${NODE_NAME}
      matchers:
      - logs_path:
          logs_path: "/var/lib/docker/containers/"

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "medical-chat-logs-%{+yyyy.MM.dd}"

# logging/logstash.conf
input {
  beats {
    port => 5044
  }
}

filter {
  if [kubernetes][labels][app] == "chat-service" {
    grok {
      match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{GREEDYDATA:log_message}" }
    }
    
    if [log_message] =~ /ERROR|WARN/ {
      mutate {
        add_field => { "alert_required" => "true" }
      }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "medical-chat-logs-%{+YYYY.MM.dd}"
  }
  
  if [alert_required] == "true" {
    http {
      url => "http://alertmanager:9093/api/v1/alerts"
      http_method => "post"
      format => "json"
    }
  }
}
```

## 🔄 마이그레이션 및 백업 전략

### 데이터베이스 마이그레이션
```typescript
// migration/migration-manager.ts
export class MigrationManager {
  private migrations: Migration[] = []
  
  async runMigrations() {
    const applied = await this.getAppliedMigrations()
    const pending = this.migrations.filter(m => !applied.includes(m.id))
    
    for (const migration of pending) {
      try {
        console.log(`Running migration: ${migration.id}`)
        await migration.up()
        await this.markAsApplied(migration.id)
        console.log(`✅ Migration ${migration.id} completed`)
      } catch (error) {
        console.error(`❌ Migration ${migration.id} failed:`, error)
        await migration.down() // 롤백
        throw error
      }
    }
  }
  
  async rollback(steps: number = 1) {
    const applied = await this.getAppliedMigrations()
    const toRollback = applied.slice(-steps)
    
    for (const migrationId of toRollback.reverse()) {
      const migration = this.migrations.find(m => m.id === migrationId)
      if (migration) {
        await migration.down()
        await this.markAsRolledBack(migrationId)
      }
    }
  }
}

// 제로 다운타임 마이그레이션 예시
export class AddEncryptionMigration implements Migration {
  id = '2024010101_add_message_encryption'
  
  async up() {
    // 1단계: 새 암호화 컬럼 추가
    await this.db.query(`
      ALTER TABLE messages 
      ADD COLUMN encrypted_content TEXT,
      ADD COLUMN encryption_key_id VARCHAR(255)
    `)
    
    // 2단계: 점진적 데이터 암호화 (배치 처리)
    await this.encryptExistingMessages()
    
    // 3단계: 애플리케이션 코드 업데이트 완료 후
    // 구 컬럼 제거 (별도 마이그레이션에서)
  }
  
  async down() {
    // 롤백 로직
    await this.db.query(`
      ALTER TABLE messages 
      DROP COLUMN encrypted_content,
      DROP COLUMN encryption_key_id
    `)
  }
  
  private async encryptExistingMessages() {
    const batchSize = 1000
    let offset = 0
    
    while (true) {
      const messages = await this.db.query(`
        SELECT id, content FROM messages 
        WHERE encrypted_content IS NULL
        LIMIT ${batchSize} OFFSET ${offset}
      `)
      
      if (messages.length === 0) break
      
      for (const message of messages) {
        const encrypted = await this.encryptionService.encrypt(message.content)
        await this.db.query(`
          UPDATE messages 
          SET encrypted_content = ?, encryption_key_id = ?
          WHERE id = ?
        `, [encrypted.content, encrypted.keyId, message.id])
      }
      
      offset += batchSize
      await this.sleep(100) // 부하 분산
    }
  }
}
```

### 백업 자동화
```bash
#!/bin/bash
# backup/automated-backup.sh

BACKUP_DIR="/backups/medical-chat"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# PostgreSQL 백업
pg_dump -h postgres -U $DB_USER -d medical_chat | gzip > "$BACKUP_DIR/postgres_$DATE.sql.gz"

# MongoDB 백업
mongodump --host mongo --db chat_db --gzip --archive="$BACKUP_DIR/mongo_$DATE.archive.gz"

# Redis 백업
redis-cli --rdb "$BACKUP_DIR/redis_$DATE.rdb"

# 파일 시스템 백업 (업로드된 파일들)
tar -czf "$BACKUP_DIR/files_$DATE.tar.gz" /app/uploads

# AWS S3에 업로드
aws s3 sync $BACKUP_DIR s3://medical-chat-backups/$(date +%Y/%m/%d)/

# 오래된 백업 삭제
find $BACKUP_DIR -name "*.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.rdb" -mtime +$RETENTION_DAYS -delete

# 백업 검증
if [ $? -eq 0 ]; then
    echo "✅ Backup completed successfully at $DATE"
    # Slack 알림
    curl -X POST -H 'Content-type: application/json' \
         --data '{"text":"✅ Medical Chat backup completed successfully"}' \
         $SLACK_WEBHOOK_URL
else
    echo "❌ Backup failed at $DATE"
    # 실패 알림
    curl -X POST -H 'Content-type: application/json' \
         --data '{"text":"❌ Medical Chat backup FAILED - immediate attention required"}' \
         $SLACK_WEBHOOK_URL
fi
``` 