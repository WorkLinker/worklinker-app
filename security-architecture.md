# 🔒 의료 채팅 시스템 보안 아키텍처

## 📋 보안 요구사항 (HIPAA 준수)

### 1. 데이터 암호화
```typescript
// 메시지 엔드투엔드 암호화
interface EncryptedMessage {
  id: string
  encryptedContent: string  // AES-256-GCM 암호화
  keyId: string            // 키 식별자
  timestamp: Date
  senderId: string
  receiverId: string
  messageHash: string      // 무결성 검증
}

// 암호화 서비스
class MessageEncryption {
  async encryptMessage(content: string, roomKey: string): Promise<string> {
    const cipher = crypto.createCipher('aes-256-gcm', roomKey)
    let encrypted = cipher.update(content, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return encrypted
  }
  
  async decryptMessage(encrypted: string, roomKey: string): Promise<string> {
    const decipher = crypto.createDecipher('aes-256-gcm', roomKey)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }
}
```

### 2. 접근 제어 (RBAC)
```typescript
// 역할 기반 접근 제어
enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor', 
  NURSE = 'nurse',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

interface Permission {
  resource: string
  actions: string[]
}

const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.PATIENT]: [
    { resource: 'chat', actions: ['read', 'create'] },
    { resource: 'profile', actions: ['read', 'update'] }
  ],
  [UserRole.DOCTOR]: [
    { resource: 'chat', actions: ['read', 'create', 'delete'] },
    { resource: 'patient_data', actions: ['read'] },
    { resource: 'medical_records', actions: ['read', 'create'] }
  ],
  [UserRole.ADMIN]: [
    { resource: '*', actions: ['*'] }
  ]
}
```

### 3. 감사 로그 시스템
```typescript
interface AuditLog {
  id: string
  userId: string
  action: string
  resource: string
  details: Record<string, any>
  ipAddress: string
  userAgent: string
  timestamp: Date
  sessionId: string
}

class AuditLogger {
  async logAction(
    userId: string,
    action: string, 
    resource: string,
    details: Record<string, any>,
    req: Request
  ) {
    const log: AuditLog = {
      id: generateUUID(),
      userId,
      action,
      resource,
      details,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || '',
      timestamp: new Date(),
      sessionId: req.sessionID
    }
    
    await this.auditRepository.save(log)
    
    // 중요한 액션은 실시간 알림
    if (this.isCriticalAction(action)) {
      await this.sendSecurityAlert(log)
    }
  }
}
```

### 4. 세션 관리
```typescript
// 보안 세션 관리
interface SecureSession {
  sessionId: string
  userId: string
  role: UserRole
  createdAt: Date
  lastActivity: Date
  ipAddress: string
  deviceInfo: string
  isActive: boolean
  expiresAt: Date
}

class SessionManager {
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000 // 30분
  private readonly MAX_SESSIONS_PER_USER = 3
  
  async createSession(user: User, req: Request): Promise<string> {
    // 기존 세션 수 확인
    const activeSessions = await this.getActiveSessions(user.id)
    if (activeSessions.length >= this.MAX_SESSIONS_PER_USER) {
      await this.invalidateOldestSession(user.id)
    }
    
    const session: SecureSession = {
      sessionId: generateSecureToken(),
      userId: user.id,
      role: user.role,
      createdAt: new Date(),
      lastActivity: new Date(),
      ipAddress: req.ip,
      deviceInfo: req.headers['user-agent'] || '',
      isActive: true,
      expiresAt: new Date(Date.now() + this.SESSION_TIMEOUT)
    }
    
    await this.sessionRepository.save(session)
    return session.sessionId
  }
}
```

## 🔐 API 보안

### JWT 토큰 구조
```typescript
interface CustomJWTPayload {
  sub: string        // 사용자 ID
  role: UserRole     // 사용자 역할
  sessionId: string  // 세션 ID
  permissions: string[] // 권한 목록
  iat: number        // 발급 시간
  exp: number        // 만료 시간
  jti: string        // JWT ID (토큰 무효화용)
}

// 토큰 검증 미들웨어
class AuthMiddleware {
  async validateToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = this.extractToken(req)
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as CustomJWTPayload
      
      // 세션 유효성 확인
      const session = await this.sessionManager.getSession(payload.sessionId)
      if (!session || !session.isActive) {
        throw new Error('Invalid session')
      }
      
      // 권한 확인
      req.user = {
        id: payload.sub,
        role: payload.role,
        permissions: payload.permissions,
        sessionId: payload.sessionId
      }
      
      next()
    } catch (error) {
      res.status(401).json({ error: 'Unauthorized' })
    }
  }
}
```

### API Rate Limiting
```typescript
// Redis 기반 Rate Limiting
class RateLimiter {
  private redis: Redis
  
  async checkLimit(
    key: string, 
    limit: number, 
    windowMs: number
  ): Promise<boolean> {
    const current = await this.redis.incr(key)
    
    if (current === 1) {
      await this.redis.expire(key, Math.floor(windowMs / 1000))
    }
    
    return current <= limit
  }
  
  // 의료진과 환자 다른 제한
  async checkUserTypeLimit(userId: string, userRole: UserRole): Promise<boolean> {
    const limits = {
      [UserRole.PATIENT]: { requests: 100, window: 60000 }, // 1분에 100개
      [UserRole.DOCTOR]: { requests: 500, window: 60000 },  // 1분에 500개
      [UserRole.ADMIN]: { requests: 1000, window: 60000 }   // 1분에 1000개
    }
    
    const { requests, window } = limits[userRole]
    return this.checkLimit(`user:${userId}:requests`, requests, window)
  }
}
```

## 🛡️ 실시간 보안 모니터링

```typescript
// 이상 행동 탐지
class SecurityMonitor {
  async detectAnomalies(user: User, action: string, metadata: any) {
    const checks = [
      this.checkUnusualLoginTime(user),
      this.checkSuspiciousIPPattern(user),
      this.checkRapidMessageSending(user),
      this.checkUnauthorizedAccess(user, action)
    ]
    
    const anomalies = await Promise.all(checks)
    const detected = anomalies.filter(Boolean)
    
    if (detected.length > 0) {
      await this.triggerSecurityAlert(user, detected)
    }
  }
  
  private async triggerSecurityAlert(user: User, anomalies: string[]) {
    // 관리자에게 즉시 알림
    await this.notificationService.sendSecurityAlert({
      userId: user.id,
      anomalies,
      timestamp: new Date(),
      severity: 'HIGH'
    })
    
    // 필요시 세션 자동 차단
    if (anomalies.includes('UNAUTHORIZED_ACCESS')) {
      await this.sessionManager.invalidateUserSessions(user.id)
    }
  }
}
``` 