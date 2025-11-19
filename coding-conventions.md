# 📝 의료 채팅 시스템 - 엔터프라이즈급 코딩 컨벤션

## 🏗️ 모노레포 프로젝트 구조

```
medical-chat-system/
├── packages/
│   ├── frontend/                    # Next.js 프론트엔드
│   │   ├── src/
│   │   │   ├── app/                # App Router 구조
│   │   │   │   ├── (auth)/         # 인증 관련 페이지 그룹
│   │   │   │   │   ├── login/
│   │   │   │   │   └── register/
│   │   │   │   ├── (dashboard)/    # 대시보드 페이지 그룹
│   │   │   │   │   ├── chat/
│   │   │   │   │   ├── admin/
│   │   │   │   │   └── profile/
│   │   │   │   ├── globals.css
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── components/         # 재사용 가능한 컴포넌트
│   │   │   │   ├── ui/             # 기본 UI 컴포넌트
│   │   │   │   │   ├── Button.tsx
│   │   │   │   │   ├── Input.tsx
│   │   │   │   │   ├── Modal.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── forms/          # 폼 컴포넌트
│   │   │   │   │   ├── LoginForm.tsx
│   │   │   │   │   ├── ChatMessageForm.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── chat/           # 채팅 관련 컴포넌트
│   │   │   │   │   ├── ChatRoom.tsx
│   │   │   │   │   ├── MessageList.tsx
│   │   │   │   │   ├── MessageBubble.tsx
│   │   │   │   │   ├── TypingIndicator.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── admin/          # 관리자 컴포넌트
│   │   │   │   │   ├── UserManagement.tsx
│   │   │   │   │   ├── Analytics.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   └── layout/         # 레이아웃 컴포넌트
│   │   │   │       ├── Header.tsx
│   │   │   │       ├── Sidebar.tsx
│   │   │   │       ├── Navigation.tsx
│   │   │   │       └── index.ts
│   │   │   ├── hooks/              # 커스텀 훅
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useChat.ts
│   │   │   │   ├── useWebSocket.ts
│   │   │   │   ├── useLocalStorage.ts
│   │   │   │   └── index.ts
│   │   │   ├── lib/                # 유틸리티 및 설정
│   │   │   │   ├── api/            # API 클라이언트
│   │   │   │   │   ├── auth.ts
│   │   │   │   │   ├── chat.ts
│   │   │   │   │   ├── admin.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── utils/          # 유틸리티 함수
│   │   │   │   │   ├── validation.ts
│   │   │   │   │   ├── encryption.ts
│   │   │   │   │   ├── date.ts
│   │   │   │   │   ├── format.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── constants/      # 상수 정의
│   │   │   │   │   ├── api.ts
│   │   │   │   │   ├── routes.ts
│   │   │   │   │   ├── messages.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── store/          # 상태 관리
│   │   │   │   │   ├── authStore.ts
│   │   │   │   │   ├── chatStore.ts
│   │   │   │   │   ├── adminStore.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── types/          # 타입 정의
│   │   │   │       ├── auth.ts
│   │   │   │       ├── chat.ts
│   │   │   │       ├── admin.ts
│   │   │   │       ├── api.ts
│   │   │   │       └── index.ts
│   │   │   ├── styles/             # 스타일 관련
│   │   │   │   ├── globals.css
│   │   │   │   ├── components.css
│   │   │   │   └── themes/
│   │   │   │       ├── light.css
│   │   │   │       └── dark.css
│   │   │   └── tests/              # 테스트 파일
│   │   │       ├── __mocks__/
│   │   │       ├── components/
│   │   │       ├── hooks/
│   │   │       └── utils/
│   │   ├── public/
│   │   ├── package.json
│   │   ├── next.config.js
│   │   ├── tailwind.config.js
│   │   ├── tsconfig.json
│   │   └── jest.config.js
│   │
│   ├── shared/                      # 공통 라이브러리
│   │   ├── types/                  # 공통 타입 정의
│   │   │   ├── auth.ts
│   │   │   ├── chat.ts
│   │   │   ├── user.ts
│   │   │   └── index.ts
│   │   ├── constants/              # 공통 상수
│   │   │   ├── roles.ts
│   │   │   ├── errors.ts
│   │   │   └── index.ts
│   │   ├── utils/                  # 공통 유틸리티
│   │   │   ├── validation.ts
│   │   │   ├── crypto.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── services/                    # 백엔드 마이크로서비스
│       ├── auth-service/           # 인증 서비스
│       │   ├── src/
│       │   │   ├── controllers/    # 컨트롤러
│       │   │   │   ├── auth.controller.ts
│       │   │   │   ├── user.controller.ts
│       │   │   │   └── index.ts
│       │   │   ├── services/       # 비즈니스 로직
│       │   │   │   ├── auth.service.ts
│       │   │   │   ├── user.service.ts
│       │   │   │   ├── token.service.ts
│       │   │   │   └── index.ts
│       │   │   ├── repositories/   # 데이터 액세스
│       │   │   │   ├── user.repository.ts
│       │   │   │   ├── session.repository.ts
│       │   │   │   └── index.ts
│       │   │   ├── middleware/     # 미들웨어
│       │   │   │   ├── auth.middleware.ts
│       │   │   │   ├── rateLimit.middleware.ts
│       │   │   │   ├── validation.middleware.ts
│       │   │   │   └── index.ts
│       │   │   ├── dto/            # 데이터 전송 객체
│       │   │   │   ├── auth.dto.ts
│       │   │   │   ├── user.dto.ts
│       │   │   │   └── index.ts
│       │   │   ├── entities/       # 데이터베이스 엔티티
│       │   │   │   ├── User.entity.ts
│       │   │   │   ├── Session.entity.ts
│       │   │   │   └── index.ts
│       │   │   ├── config/         # 설정
│       │   │   │   ├── database.config.ts
│       │   │   │   ├── jwt.config.ts
│       │   │   │   └── index.ts
│       │   │   ├── utils/          # 유틸리티
│       │   │   │   ├── logger.ts
│       │   │   │   ├── encryption.ts
│       │   │   │   └── index.ts
│       │   │   ├── tests/          # 테스트
│       │   │   │   ├── unit/
│       │   │   │   ├── integration/
│       │   │   │   └── e2e/
│       │   │   ├── app.ts          # 앱 진입점
│       │   │   └── server.ts       # 서버 시작
│       │   ├── Dockerfile
│       │   ├── package.json
│       │   ├── tsconfig.json
│       │   └── jest.config.js
│       │
│       ├── chat-service/           # 채팅 서비스
│       ├── admin-service/          # 관리자 서비스
│       └── notification-service/   # 알림 서비스
│
├── infrastructure/                  # 인프라 코드
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   ├── docker-compose.prod.yml
│   │   └── Dockerfiles/
│   ├── kubernetes/
│   │   ├── namespaces/
│   │   ├── deployments/
│   │   ├── services/
│   │   ├── ingress/
│   │   └── configmaps/
│   ├── terraform/                  # Infrastructure as Code
│   │   ├── environments/
│   │   │   ├── dev/
│   │   │   ├── staging/
│   │   │   └── production/
│   │   ├── modules/
│   │   └── main.tf
│   └── monitoring/
│       ├── prometheus/
│       ├── grafana/
│       └── elk/
│
├── scripts/                        # 스크립트
│   ├── setup/
│   │   ├── dev-setup.sh
│   │   └── prod-setup.sh
│   ├── deployment/
│   │   ├── deploy.sh
│   │   └── rollback.sh
│   ├── database/
│   │   ├── migrations/
│   │   └── seeds/
│   └── monitoring/
│       ├── health-check.sh
│       └── backup.sh
│
├── docs/                           # 문서
│   ├── api/                        # API 문서
│   ├── architecture/               # 아키텍처 문서
│   ├── deployment/                 # 배포 가이드
│   ├── security/                   # 보안 가이드
│   └── README.md
│
├── .github/                        # GitHub 워크플로우
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── cd.yml
│   │   └── security-scan.yml
│   ├── ISSUE_TEMPLATE/
│   └── pull_request_template.md
│
├── package.json                    # 루트 package.json (monorepo)
├── lerna.json                      # Lerna 설정 (모노레포 관리)
├── tsconfig.json                   # 루트 TypeScript 설정
├── .eslintrc.js                    # ESLint 설정
├── .prettierrc                     # Prettier 설정
├── .gitignore
└── README.md
```

## 📝 네이밍 컨벤션

### 파일 및 디렉토리
```typescript
// ✅ 올바른 예시
components/ui/Button.tsx           // PascalCase for components
hooks/useAuth.ts                  // camelCase with 'use' prefix
utils/formatDate.ts               // camelCase for utilities
constants/API_ENDPOINTS.ts        // UPPER_SNAKE_CASE for constants
types/User.types.ts               // PascalCase.types.ts

// ❌ 잘못된 예시
components/ui/button.tsx          // 소문자
hooks/AuthHook.ts                // 'use' prefix 없음
utils/format-date.ts             // kebab-case
constants/apiEndpoints.ts        // camelCase for constants
```

### 변수 및 함수
```typescript
// ✅ 올바른 예시
const userName = 'john_doe'              // camelCase
const MAX_RETRY_COUNT = 3                // UPPER_SNAKE_CASE for constants
const API_BASE_URL = 'https://api.example.com'

function getUserProfile() {}             // camelCase
async function fetchChatHistory() {}     // async functions
const handleButtonClick = () => {}       // event handlers

// Boolean 변수는 is, has, can, should 등으로 시작
const isLoggedIn = true
const hasPermission = false
const canEdit = true
const shouldShowModal = false

// ❌ 잘못된 예시
const user_name = 'john_doe'            // snake_case
const maxretrycount = 3                 // 구분 없음
function get_user_profile() {}          // snake_case
const clickHandler = () => {}           // 의미 불분명
```

### 컴포넌트 및 클래스
```typescript
// ✅ 올바른 예시
interface User {                         // PascalCase
  id: string
  email: string
  role: UserRole
}

class AuthService {                      // PascalCase
  private apiClient: ApiClient
  
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    // 구현
  }
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, user }) => {
  return (
    <div className="chat-message">
      {/* 컴포넌트 내용 */}
    </div>
  )
}

// ❌ 잘못된 예시
interface user {}                       // 소문자
class authService {}                    // 소문자
const chatMessage = () => {}            // 소문자
```

## 🎯 TypeScript 엄격한 타입 정의

### API 응답 타입
```typescript
// shared/types/api.ts
export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
  errors?: ApiError[]
  metadata?: {
    page?: number
    limit?: number
    total?: number
    timestamp: string
  }
}

export interface ApiError {
  code: string
  message: string
  field?: string
}

// 성공 응답
export interface SuccessResponse<T> extends ApiResponse<T> {
  success: true
  data: T
}

// 에러 응답
export interface ErrorResponse extends ApiResponse<null> {
  success: false
  data: null
  errors: ApiError[]
}
```

### 채팅 관련 타입
```typescript
// shared/types/chat.ts
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system'
}

export enum MessageStatus {
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed'
}

export interface ChatMessage {
  id: string
  chatRoomId: string
  senderId: string
  content: string
  type: MessageType
  status: MessageStatus
  encryptedContent?: string
  attachments?: MessageAttachment[]
  timestamp: Date
  editedAt?: Date
  replyTo?: string
  metadata?: Record<string, unknown>
}

export interface ChatRoom {
  id: string
  type: 'direct' | 'group' | 'support'
  participants: ChatParticipant[]
  lastMessage?: ChatMessage
  unreadCount: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  metadata?: {
    patientId?: string
    doctorId?: string
    category?: string
  }
}

export interface ChatParticipant {
  userId: string
  role: UserRole
  joinedAt: Date
  lastSeenAt?: Date
  permissions: ChatPermission[]
}

export interface MessageAttachment {
  id: string
  fileName: string
  fileSize: number
  mimeType: string
  url: string
  thumbnailUrl?: string
  encryptedUrl?: string
}
```

### 사용자 및 권한 타입
```typescript
// shared/types/auth.ts
export enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  NURSE = 'nurse',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export enum Permission {
  // 채팅 권한
  CHAT_READ = 'chat:read',
  CHAT_WRITE = 'chat:write',
  CHAT_DELETE = 'chat:delete',
  CHAT_MANAGE = 'chat:manage',
  
  // 사용자 권한
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',
  USER_MANAGE = 'user:manage',
  
  // 관리자 권한
  ADMIN_ACCESS = 'admin:access',
  ADMIN_MANAGE = 'admin:manage',
  
  // 시스템 권한
  SYSTEM_CONFIG = 'system:config',
  SYSTEM_MONITOR = 'system:monitor'
}

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  permissions: Permission[]
  profileImage?: string
  isActive: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
  metadata?: {
    department?: string
    specialty?: string
    licenseNumber?: string
    patientId?: string
  }
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface AuthResult {
  user: User
  tokens: {
    accessToken: string
    refreshToken: string
    expiresAt: Date
  }
  session: {
    id: string
    expiresAt: Date
  }
}
```

## 🛡️ 에러 처리 및 유효성 검사

### 커스텀 에러 클래스
```typescript
// shared/utils/errors.ts
export abstract class BaseError extends Error {
  abstract readonly statusCode: number
  abstract readonly isOperational: boolean
  
  constructor(message: string, public readonly context?: Record<string, unknown>) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends BaseError {
  readonly statusCode = 400
  readonly isOperational = true
  
  constructor(
    message: string,
    public readonly field?: string,
    context?: Record<string, unknown>
  ) {
    super(message, context)
  }
}

export class AuthenticationError extends BaseError {
  readonly statusCode = 401
  readonly isOperational = true
}

export class AuthorizationError extends BaseError {
  readonly statusCode = 403
  readonly isOperational = true
}

export class NotFoundError extends BaseError {
  readonly statusCode = 404
  readonly isOperational = true
}

export class ConflictError extends BaseError {
  readonly statusCode = 409
  readonly isOperational = true
}

export class RateLimitError extends BaseError {
  readonly statusCode = 429
  readonly isOperational = true
}

export class InternalServerError extends BaseError {
  readonly statusCode = 500
  readonly isOperational = false
}
```

### Zod 스키마 검증
```typescript
// shared/utils/validation.ts
import { z } from 'zod'

// 기본 스키마
export const emailSchema = z.string().email('유효한 이메일 주소를 입력해주세요')
export const passwordSchema = z
  .string()
  .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    '비밀번호는 대소문자, 숫자, 특수문자를 포함해야 합니다')

// 로그인 스키마
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, '비밀번호를 입력해주세요'),
  rememberMe: z.boolean().optional()
})

// 채팅 메시지 스키마
export const chatMessageSchema = z.object({
  content: z.string().min(1, '메시지 내용을 입력해주세요').max(5000, '메시지가 너무 깁니다'),
  type: z.nativeEnum(MessageType),
  chatRoomId: z.string().uuid('유효하지 않은 채팅방 ID입니다'),
  replyTo: z.string().uuid().optional()
})

// 사용자 등록 스키마
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다').max(50, '이름이 너무 깁니다'),
  role: z.nativeEnum(UserRole)
}).refine(data => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword']
})

// 유효성 검사 헬퍼 함수
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
      throw new ValidationError('입력 데이터가 유효하지 않습니다', undefined, { validationErrors })
    }
    throw error
  }
}
```

## 🔄 상태 관리 패턴 (Zustand)

```typescript
// frontend/src/lib/store/authStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User, AuthResult } from '@shared/types/auth'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  sessionId: string | null
  permissions: Permission[]
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  updateUser: (user: Partial<User>) => void
  checkPermission: (permission: Permission) => boolean
  clearAuth: () => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      sessionId: null,
      permissions: [],

      // Actions
      login: async (credentials) => {
        set({ isLoading: true })
        try {
          const authResult = await authApi.login(credentials)
          set({
            user: authResult.user,
            isAuthenticated: true,
            sessionId: authResult.session.id,
            permissions: authResult.user.permissions,
            isLoading: false
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        authApi.logout()
        set({
          user: null,
          isAuthenticated: false,
          sessionId: null,
          permissions: [],
          isLoading: false
        })
      },

      refreshToken: async () => {
        try {
          const authResult = await authApi.refreshToken()
          set({
            user: authResult.user,
            permissions: authResult.user.permissions
          })
        } catch (error) {
          get().logout()
          throw error
        }
      },

      updateUser: (userData) => {
        set(state => ({
          user: state.user ? { ...state.user, ...userData } : null
        }))
      },

      checkPermission: (permission) => {
        const { permissions } = get()
        return permissions.includes(permission)
      },

      clearAuth: () => {
        set({
          user: null,
          isAuthenticated: false,
          sessionId: null,
          permissions: [],
          isLoading: false
        })
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        sessionId: state.sessionId,
        permissions: state.permissions
      })
    }
  )
)
```

## 🎨 컴포넌트 구조 패턴

```typescript
// frontend/src/components/chat/ChatMessage.tsx
import React, { memo, useCallback } from 'react'
import { ChatMessage as ChatMessageType, MessageStatus } from '@shared/types/chat'
import { useAuthStore } from '@/lib/store/authStore'
import { formatMessageTime } from '@/lib/utils/date'
import { MessageBubble } from './MessageBubble'
import { MessageActions } from './MessageActions'
import { TypingIndicator } from './TypingIndicator'

// Props 인터페이스 정의
interface ChatMessageProps {
  message: ChatMessageType
  isOwn: boolean
  showAvatar?: boolean
  showTime?: boolean
  onReply?: (messageId: string) => void
  onEdit?: (messageId: string) => void
  onDelete?: (messageId: string) => void
  className?: string
}

// 메모이제이션을 위한 비교 함수
const arePropsEqual = (prevProps: ChatMessageProps, nextProps: ChatMessageProps): boolean => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.status === nextProps.message.status &&
    prevProps.isOwn === nextProps.isOwn &&
    prevProps.showAvatar === nextProps.showAvatar &&
    prevProps.showTime === nextProps.showTime
  )
}

export const ChatMessage = memo<ChatMessageProps>(({
  message,
  isOwn,
  showAvatar = true,
  showTime = true,
  onReply,
  onEdit,
  onDelete,
  className = ''
}) => {
  const { checkPermission } = useAuthStore()
  
  // 권한 확인
  const canEdit = checkPermission(Permission.CHAT_WRITE) && isOwn
  const canDelete = checkPermission(Permission.CHAT_DELETE) && isOwn
  const canReply = checkPermission(Permission.CHAT_WRITE)
  
  // 이벤트 핸들러
  const handleReply = useCallback(() => {
    if (onReply && canReply) {
      onReply(message.id)
    }
  }, [onReply, canReply, message.id])
  
  const handleEdit = useCallback(() => {
    if (onEdit && canEdit) {
      onEdit(message.id)
    }
  }, [onEdit, canEdit, message.id])
  
  const handleDelete = useCallback(() => {
    if (onDelete && canDelete) {
      onDelete(message.id)
    }
  }, [onDelete, canDelete, message.id])
  
  // 메시지 상태 렌더링
  const renderMessageStatus = () => {
    if (!isOwn) return null
    
    switch (message.status) {
      case MessageStatus.SENDING:
        return <TypingIndicator size="sm" />
      case MessageStatus.SENT:
        return <span className="text-gray-400">✓</span>
      case MessageStatus.DELIVERED:
        return <span className="text-gray-400">✓✓</span>
      case MessageStatus.READ:
        return <span className="text-blue-500">✓✓</span>
      case MessageStatus.FAILED:
        return <span className="text-red-500">⚠</span>
      default:
        return null
    }
  }
  
  return (
    <div 
      className={`chat-message ${isOwn ? 'own' : 'other'} ${className}`}
      data-message-id={message.id}
    >
      <div className="message-content">
        <MessageBubble
          message={message}
          isOwn={isOwn}
          showAvatar={showAvatar}
        />
        
        <MessageActions
          message={message}
          canReply={canReply}
          canEdit={canEdit}
          canDelete={canDelete}
          onReply={handleReply}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
      
      {showTime && (
        <div className="message-meta">
          <span className="message-time">
            {formatMessageTime(message.timestamp)}
          </span>
          {renderMessageStatus()}
        </div>
      )}
    </div>
  )
}, arePropsEqual)

ChatMessage.displayName = 'ChatMessage'

export default ChatMessage
```

## 🚀 성능 최적화 패턴

### React Query 설정
```typescript
// frontend/src/lib/api/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      cacheTime: 10 * 60 * 1000, // 10분
      retry: (failureCount, error: any) => {
        // 4xx 에러는 재시도하지 않음
        if (error?.status >= 400 && error?.status < 500) {
          return false
        }
        return failureCount < 3
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true
    },
    mutations: {
      retry: false
    }
  }
})

// 채팅 메시지 쿼리 훅
export const useChatMessages = (chatRoomId: string) => {
  return useInfiniteQuery({
    queryKey: ['chat-messages', chatRoomId],
    queryFn: ({ pageParam = 0 }) => 
      chatApi.getMessages(chatRoomId, { page: pageParam, limit: 50 }),
    getNextPageParam: (lastPage, pages) => 
      lastPage.data.length === 50 ? pages.length : undefined,
    enabled: !!chatRoomId,
    staleTime: 30 * 1000, // 30초 (실시간 채팅이므로 짧게)
    select: (data) => ({
      ...data,
      pages: data.pages.flatMap(page => page.data)
    })
  })
}
```

### 가상화된 메시지 리스트
```typescript
// frontend/src/components/chat/VirtualizedMessageList.tsx
import { FixedSizeList as List } from 'react-window'
import { useMemo, useCallback } from 'react'
import { ChatMessage } from '@shared/types/chat'

interface VirtualizedMessageListProps {
  messages: ChatMessage[]
  height: number
  onLoadMore?: () => void
}

const MESSAGE_HEIGHT = 80

export const VirtualizedMessageList: React.FC<VirtualizedMessageListProps> = ({
  messages,
  height,
  onLoadMore
}) => {
  const itemData = useMemo(() => ({ messages, onLoadMore }), [messages, onLoadMore])
  
  const MessageItem = useCallback(({ index, style, data }: any) => {
    const { messages } = data
    const message = messages[index]
    
    return (
      <div style={style}>
        <ChatMessage
          message={message}
          isOwn={message.senderId === currentUserId}
        />
      </div>
    )
  }, [])
  
  return (
    <List
      height={height}
      itemCount={messages.length}
      itemSize={MESSAGE_HEIGHT}
      itemData={itemData}
      overscanCount={5}
    >
      {MessageItem}
    </List>
  )
}
```

이 컨벤션을 따르면 **9일 만에 엔터프라이즈급 의료 채팅 시스템**을 완성할 수 있습니다! 🚀

K님, 이 아키텍처로 시작하시면 **확장성**, **보안성**, **유지보수성** 모두 확보하면서 빠르게 개발할 수 있어요. 혹시 특정 부분에 대해 더 자세히 알고 싶으시면 언제든 말씀해주세요! 