# BotCRUD Frontend Architecture Documentation

## Table of Contents

1. [Overview](#1-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Application Architecture](#4-application-architecture)
5. [State Management](#5-state-management)
6. [Routing](#6-routing)
7. [Components Architecture](#7-components-architecture)
8. [API Integration](#8-api-integration)
9. [Styling & Theming](#9-styling--theming)
10. [Internationalization](#10-internationalization)
11. [Utilities & Helpers](#11-utilities--helpers)
12. [Testing Infrastructure](#12-testing-infrastructure)
13. [Build & Configuration](#13-build--configuration)
14. [Development Workflow](#14-development-workflow)
15. [Multi-Platform Support](#15-multi-platform-support)

---

## 1. Overview

**BotCRUD Frontend** is a modern, production-ready Single Page Application (SPA) built for managing bots, workers, and logs. The application provides a comprehensive dashboard with CRUD operations, advanced filtering, analytics, and multi-language support.

### Key Features

- **Bot Management**: Create, read, update, delete bots with status tracking
- **Worker Management**: Manage workers associated with bots
- **Log Management**: View and filter logs per bot/worker
- **Statistics Dashboard**: Visual analytics with charts
- **Advanced Filtering**: Query builder with filter history persistence
- **Theme Support**: Light/dark mode with system preference detection
- **Internationalization**: 7 supported languages
- **Responsive Design**: Mobile-first approach with desktop optimization

### Application Metrics

| Metric | Value |
|--------|-------|
| Total Source Lines | ~14,025 LOC |
| Vue Components | 21 |
| Pinia Stores | 4 |
| Supported Locales | 7 |
| E2E Test Files | 8 |

---

## 2. Technology Stack

### Core Frameworks

| Technology | Version | Purpose |
|------------|---------|---------|
| Vue 3 | 3.4.18 | Progressive JavaScript framework |
| Quasar | 2.14.2 | Vue 3 UI framework with Material Design |
| Vite | via @quasar/app-vite 1.7.3 | Build tool and dev server |
| Vue Router | 4.2.5 | Client-side routing |
| Pinia | 2.1.7 | State management |
| TypeScript | 5.3.3 | Type-safe JavaScript |

### UI & Styling

| Technology | Purpose |
|------------|---------|
| SCSS/SASS | CSS preprocessor |
| Material Icons | Icon library |
| Material Symbols Outlined | Extended icon set |
| Roboto Font | Primary typeface |

### Data & Utilities

| Technology | Version | Purpose |
|------------|---------|---------|
| Vue i18n | 9.9.0 | Internationalization |
| Axios | 1.6.2 | HTTP client (via api-client) |
| Chart.js | 4.5.1 | Data visualization |
| Vue-ChartJS | 5.3.3 | Vue wrapper for Chart.js |
| @abernardo/api-client | 1.0.6 | Custom API client library |

### Testing

| Technology | Version | Purpose |
|------------|---------|---------|
| Playwright | 1.57.0 | E2E testing |
| Vitest | 2.1.8 | Unit testing |
| Vue Test Utils | 2.4.6 | Component testing utilities |
| Happy DOM | 15.11.7 | Lightweight DOM for tests |

### Development Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| ESLint | 8.56.0 | Code linting |
| Prettier | 3.1.1 | Code formatting |
| @typescript-eslint | 6.17.0 | TypeScript linting |

---

## 3. Project Structure

```
frontend/
├── src/
│   ├── App.vue                     # Root component
│   │
│   ├── boot/                       # Application initialization
│   │   ├── api.ts                  # API client setup & export
│   │   └── i18n.ts                 # Vue i18n initialization
│   │
│   ├── components/                 # Reusable Vue components
│   │   ├── AddBotDrawer.vue        # Bot creation/edit modal
│   │   ├── AddLogDrawer.vue        # Log creation/edit modal
│   │   ├── AddWorkerDrawer.vue     # Worker creation/edit modal
│   │   ├── BotCard.vue             # Bot display card
│   │   ├── FilterDrawer.vue        # Filter configuration UI
│   │   ├── FilterHistoryDrawer.vue # Saved filters list
│   │   ├── HomeStats.vue           # Dashboard statistics
│   │   ├── LogCard.vue             # Log entry display
│   │   ├── NavItem.vue             # Navigation item
│   │   ├── QueryBuilder.vue        # Advanced filter UI
│   │   ├── SettingsDrawer.vue      # App settings modal
│   │   └── WorkerCard.vue          # Worker display card
│   │
│   ├── composables/                # Vue composable functions
│   │   ├── useDateTime.ts          # Date/time formatting
│   │   └── useFilterManagement.ts  # Filter state & operations
│   │
│   ├── css/
│   │   └── app.scss                # Global stylesheet
│   │
│   ├── i18n/                       # Internationalization
│   │   ├── index.ts                # i18n config & exports
│   │   ├── en-US.ts                # English (US)
│   │   ├── en-GB.ts                # English (GB)
│   │   ├── en-IE.ts                # English (Ireland)
│   │   ├── pt-BR.ts                # Portuguese (Brazil)
│   │   ├── es.ts                   # Spanish
│   │   ├── it-IT.ts                # Italian
│   │   └── fr.ts                   # French
│   │
│   ├── layouts/
│   │   └── MainLayout.vue          # Main app layout wrapper
│   │
│   ├── pages/                      # Route-based pages
│   │   ├── HomePage.vue            # Dashboard/home
│   │   ├── BotDetailPage.vue       # Bot detail & management
│   │   ├── BotsPage.vue            # Bots listing
│   │   ├── WorkersPage.vue         # Workers listing
│   │   ├── WorkerDetailPage.vue    # Worker detail
│   │   ├── LogsPage.vue            # Logs listing
│   │   ├── StatisticsPage.vue      # Analytics dashboard
│   │   ├── IndexPage.vue           # Redirect page
│   │   └── ErrorNotFound.vue       # 404 error page
│   │
│   ├── router/
│   │   ├── index.ts                # Vue Router setup
│   │   └── routes.ts               # Route definitions
│   │
│   ├── stores/                     # Pinia state management
│   │   ├── app-store.ts            # Global app state
│   │   ├── bots-store.ts           # Bot CRUD & state
│   │   ├── workers-store.ts        # Worker CRUD & state
│   │   ├── logs-store.ts           # Log CRUD & state
│   │   ├── index.ts                # Pinia initialization
│   │   └── store-flag.d.ts         # Store type declarations
│   │
│   ├── types/
│   │   └── pagination.ts           # Pagination interfaces
│   │
│   ├── utils/
│   │   ├── errors.ts               # Error handling utilities
│   │   └── filter-history.ts       # IndexedDB filter storage
│   │
│   └── env.d.ts                    # Environment variable types
│
├── tests/
│   ├── e2e/                        # End-to-end tests (Playwright)
│   │   ├── crud-operations.spec.ts
│   │   ├── home-page.spec.ts
│   │   ├── bot-detail-page.spec.ts
│   │   ├── worker-detail-page.spec.ts
│   │   ├── workers-page.spec.ts
│   │   ├── logs-page.spec.ts
│   │   ├── statistics-page.spec.ts
│   │   └── error-not-found.spec.ts
│   │
│   └── unit/                       # Unit tests (Vitest)
│       ├── setup.ts                # Test configuration
│       ├── stores/
│       │   └── bots-store.spec.ts
│       └── utils/
│           └── errors.spec.ts
│
├── public/                         # Static assets
├── src-capacitor/                  # Capacitor mobile config
│
├── quasar.config.js                # Quasar configuration
├── vitest.config.ts                # Vitest configuration
├── playwright.config.ts            # Playwright configuration
├── tsconfig.json                   # TypeScript configuration
├── .eslintrc.cjs                   # ESLint configuration
├── .prettierrc                     # Prettier configuration
├── .env                            # Environment variables
└── package.json                    # Dependencies & scripts
```

---

## 4. Application Architecture

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Vue 3 Application                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │    Pages     │    │  Components  │    │   Layouts    │       │
│  │              │    │              │    │              │       │
│  │ - HomePage   │    │ - BotCard    │    │ - MainLayout │       │
│  │ - BotDetail  │    │ - WorkerCard │    │              │       │
│  │ - Workers    │    │ - LogCard    │    └──────────────┘       │
│  │ - Logs       │    │ - Drawers    │                           │
│  │ - Statistics │    │ - QueryBuild │                           │
│  └──────┬───────┘    └──────┬───────┘                           │
│         │                   │                                    │
│         └─────────┬─────────┘                                    │
│                   │                                              │
│         ┌─────────▼─────────┐                                    │
│         │   Composables     │                                    │
│         │                   │                                    │
│         │ - useDateTime     │                                    │
│         │ - useFilter       │                                    │
│         └─────────┬─────────┘                                    │
│                   │                                              │
│         ┌─────────▼─────────┐                                    │
│         │   Pinia Stores    │                                    │
│         │                   │                                    │
│         │ - app-store       │                                    │
│         │ - bots-store      │                                    │
│         │ - workers-store   │                                    │
│         │ - logs-store      │                                    │
│         └─────────┬─────────┘                                    │
│                   │                                              │
│         ┌─────────▼─────────┐                                    │
│         │   API Client      │                                    │
│         │ @abernardo/       │                                    │
│         │   api-client      │                                    │
│         └─────────┬─────────┘                                    │
│                   │                                              │
└───────────────────┼──────────────────────────────────────────────┘
                    │
          ┌─────────▼─────────┐
          │   Backend API     │
          │  localhost:3000   │
          └───────────────────┘
```

### Data Flow

```
User Action
    │
    ▼
Vue Component (Page/Component)
    │
    ├──► Composable (optional business logic)
    │
    ▼
Pinia Store
    │
    ├──► State Mutation
    │
    ▼
API Client
    │
    ▼
Backend REST API
    │
    ▼
Response
    │
    ▼
Store State Update
    │
    ▼
Reactive UI Update
```

---

## 5. State Management

### Pinia Store Architecture

The application uses **Pinia** for state management with four specialized stores:

### 5.1 App Store (`src/stores/app-store.ts`)

Manages global application state including theme and locale preferences.

```typescript
interface AppState {
  themeMode: 'light' | 'dark' | 'auto';
  locale: SupportedLocale;
  sidebarOpen: boolean;
}
```

**Features:**
- Theme persistence (LocalStorage: `botcrud-theme`)
- Locale persistence (LocalStorage: `botcrud-locale`)
- System preference detection for auto theme
- Sidebar state management

**Actions:**
| Action | Description |
|--------|-------------|
| `setTheme(mode)` | Set theme mode |
| `setLocale(locale)` | Change application language |
| `toggleSidebar()` | Toggle sidebar visibility |
| `initializeApp()` | Load persisted preferences |

### 5.2 Bots Store (`src/stores/bots-store.ts`)

Manages bot entities with CRUD operations and filtering.

```typescript
interface BotsState {
  bots: Bot[];
  currentBot: Bot | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  statusFilter: BotStatus | null;
  activeFilter: FilterQuery | null;
  pagination: PaginationState;
}
```

**Getters:**
| Getter | Description |
|--------|-------------|
| `filteredBots` | Bots filtered by status/query |
| `getBotById(id)` | Get bot by ID |
| `botCount` | Total bot count |
| `enabledBots` | Bots with ENABLED status |
| `disabledBots` | Bots with DISABLED status |
| `pausedBots` | Bots with PAUSED status |
| `hasActiveFilter` | Check if filter is active |

**Actions:**
| Action | Description |
|--------|-------------|
| `fetchBots(reset?, filter?)` | Load bots with pagination |
| `loadMoreBots()` | Load next page |
| `fetchBot(id)` | Load single bot |
| `createBot(data)` | Create new bot |
| `updateBot(id, data)` | Update existing bot |
| `deleteBot(id)` | Delete bot (cascade) |
| `setStatusFilter(status)` | Set status filter |
| `setFilter(filter)` | Set advanced filter |
| `clearFilter()` | Clear all filters |

### 5.3 Workers Store (`src/stores/workers-store.ts`)

Manages worker entities with bot association.

```typescript
interface WorkersState {
  workers: Worker[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  botFilter: string | null;
  activeFilter: FilterQuery | null;
  pagination: PaginationState;
}
```

**Key Features:**
- Filter workers by associated bot
- Worker-specific pagination
- Cascade operations with bot deletion

### 5.4 Logs Store (`src/stores/logs-store.ts`)

Manages log entries with multi-level filtering.

```typescript
interface LogsState {
  logs: Log[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  botFilter: string | null;
  workerFilter: string | null;
  activeFilter: FilterQuery | null;
  pagination: PaginationState;
}
```

**Key Features:**
- Filter by bot, worker, or both
- Message content filtering
- Date range filtering
- Cascade operations with worker/bot deletion

### Pagination Configuration

```typescript
// src/types/pagination.ts
export const DEFAULT_PER_PAGE = 100;

export interface PaginationState {
  page: number;
  perPage: number;
  count: number;
}
```

---

## 6. Routing

### Route Configuration (`src/router/routes.ts`)

```typescript
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'home', component: () => import('pages/HomePage.vue') },
      { path: 'bot/:id', name: 'bot-detail', component: () => import('pages/BotDetailPage.vue') },
      { path: 'bot/:id/worker/:workerId', name: 'worker-detail', component: () => import('pages/WorkerDetailPage.vue') },
      { path: 'bots', name: 'bots', component: () => import('pages/BotsPage.vue') },
      { path: 'workers', name: 'workers', component: () => import('pages/WorkersPage.vue') },
      { path: 'logs', name: 'logs', component: () => import('pages/LogsPage.vue') },
      { path: 'statistics', name: 'statistics', component: () => import('pages/StatisticsPage.vue') },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    name: 'not-found',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];
```

### Route Map

| Path | Name | Component | Description |
|------|------|-----------|-------------|
| `/` | home | HomePage | Dashboard with bot cards |
| `/bot/:id` | bot-detail | BotDetailPage | Bot management |
| `/bot/:id/worker/:workerId` | worker-detail | WorkerDetailPage | Worker details |
| `/bots` | bots | BotsPage | All bots listing |
| `/workers` | workers | WorkersPage | All workers listing |
| `/logs` | logs | LogsPage | System logs |
| `/statistics` | statistics | StatisticsPage | Analytics |
| `/*` | not-found | ErrorNotFound | 404 page |

### Navigation Features

- **History Mode**: Clean URLs without hash
- **Lazy Loading**: Components loaded on demand
- **Scroll Behavior**: Auto-reset to top on navigation
- **Route Transitions**: Depth-based slide animations

---

## 7. Components Architecture

### Component Categories

#### 7.1 Page Components (`src/pages/`)

Full-page views that correspond to routes.

| Component | Lines | Description |
|-----------|-------|-------------|
| HomePage.vue | 470 | Dashboard with bot cards and statistics |
| BotDetailPage.vue | 1407 | Bot management with workers/logs tabs |
| BotsPage.vue | 438 | Bots listing with filtering |
| WorkersPage.vue | 639 | Workers listing with bot filter |
| WorkerDetailPage.vue | 902 | Worker details with logs |
| LogsPage.vue | 983 | Logs listing with multi-filter |
| StatisticsPage.vue | 1131 | Analytics with Chart.js |
| ErrorNotFound.vue | 112 | 404 error page |

#### 7.2 Display Components (`src/components/`)

Reusable UI components for data display.

| Component | Lines | Description |
|-----------|-------|-------------|
| BotCard.vue | 252 | Bot information card with status badge |
| WorkerCard.vue | 149 | Worker information card |
| LogCard.vue | 171 | Log entry display |
| HomeStats.vue | 203 | Dashboard statistics summary |

#### 7.3 Modal/Drawer Components

Interactive overlays for CRUD operations.

| Component | Lines | Description |
|-----------|-------|-------------|
| AddBotDrawer.vue | 438 | Bot create/edit form |
| AddWorkerDrawer.vue | 451 | Worker create/edit form |
| AddLogDrawer.vue | 424 | Log create/edit form |
| SettingsDrawer.vue | 316 | App settings (theme, locale) |
| FilterDrawer.vue | 333 | Basic filter interface |
| FilterHistoryDrawer.vue | 553 | Saved filters management |

#### 7.4 Complex Components

Advanced functionality components.

| Component | Lines | Description |
|-----------|-------|-------------|
| QueryBuilder.vue | 926 | Advanced filter UI with conditions |
| MainLayout.vue | 145 | App layout with transitions |

### Component Communication Patterns

```
┌─────────────────────────────────────────────────────┐
│                    Parent Page                       │
│                                                      │
│  Props ──────────────►  Child Component              │
│         v-model        (two-way binding)            │
│         :prop          (one-way binding)            │
│                                                      │
│  Events ◄──────────────  Child Component            │
│         @event         (emit to parent)             │
│         @saved         (form submission)            │
│         @apply         (filter application)         │
│                                                      │
│  Store Access ◄────────  Any Component              │
│         useStore()     (direct store access)        │
└─────────────────────────────────────────────────────┘
```

### Data Test IDs Convention

Components use `data-testid` attributes for E2E testing:

```html
<!-- Pattern: [entity]-[action]-btn or [entity]-[property] -->
<q-btn data-testid="add-bot-btn" />
<q-btn data-testid="bot-edit-btn" />
<q-btn data-testid="bot-delete-btn" />
<div data-testid="bot-card-{id}" />
<div data-testid="bot-status-{status}" />
```

---

## 8. API Integration

### API Client Setup (`src/boot/api.ts`)

```typescript
import { BotCrudApi } from '@abernardo/api-client';

const api = new BotCrudApi({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  debug: import.meta.env.DEV,
});

export { api };
```

### API Endpoints

The API client provides typed methods for all endpoints:

#### Bots API
```typescript
api.bots.list(params?)      // GET /api/bots
api.bots.get(id)            // GET /api/bots/:id
api.bots.create(data)       // POST /api/bots
api.bots.update(id, data)   // PUT /api/bots/:id
api.bots.delete(id)         // DELETE /api/bots/:id
```

#### Workers API
```typescript
api.workers.list(params?)   // GET /api/workers
api.workers.get(id)         // GET /api/workers/:id
api.workers.create(data)    // POST /api/workers
api.workers.update(id, data)// PUT /api/workers/:id
api.workers.delete(id)      // DELETE /api/workers/:id
```

#### Logs API
```typescript
api.logs.list(params?)      // GET /api/logs
api.logs.get(id)            // GET /api/logs/:id
api.logs.create(data)       // POST /api/logs
api.logs.update(id, data)   // PUT /api/logs/:id
api.logs.delete(id)         // DELETE /api/logs/:id
```

### Request/Response Types

```typescript
// Bot
interface Bot {
  id: string;
  name: string;
  description?: string;
  status: 'ENABLED' | 'DISABLED' | 'PAUSED';
  created: string;
  updated: string;
}

// Worker
interface Worker {
  id: string;
  name: string;
  description?: string;
  bot: string;  // Bot ID reference
  created: string;
  updated: string;
}

// Log
interface Log {
  id: string;
  message: string;
  bot: string;     // Bot ID reference
  worker: string;  // Worker ID reference
  created: string;
}

// Pagination Response
interface PaginatedResponse<T> {
  data: {
    items: T[];
    page: number;
    perPage: number;
    count: number;
  };
}
```

### Filter Query Structure

```typescript
interface FilterQuery {
  conditions: FilterCondition[];
  logic: 'AND' | 'OR';
}

interface FilterCondition {
  field: string;
  operator: 'eq' | 'neq' | 'contains' | 'gt' | 'gte' | 'lt' | 'lte' | 'between';
  value: string | number | boolean | [any, any];
}
```

---

## 9. Styling & Theming

### Theme Configuration

The application supports light and dark themes with automatic system preference detection.

#### Brand Colors

```scss
// quasar.config.js
brand: {
  primary: '#6366f1',    // Indigo
  secondary: '#8b5cf6',  // Purple
  accent: '#a855f7',     // Violet
  dark: '#13131a',
  'dark-page': '#0f0f14',
  positive: '#10b981',   // Green
  negative: '#ef4444',   // Red
  info: '#3b82f6',       // Blue
  warning: '#f59e0b'     // Orange
}
```

#### Theme-Aware Styling

```scss
// Example of theme-aware component styling
.component {
  .body--light & {
    background: #ffffff;
    color: #1f2937;
    border-color: rgba(0, 0, 0, 0.08);
  }

  .body--dark & {
    background: #1e1e2d;
    color: #f9fafb;
    border-color: rgba(255, 255, 255, 0.08);
  }
}
```

### Global Styles (`src/css/app.scss`)

```scss
// CSS Custom Properties
:root {
  --card-radius: 12px;
  --button-radius: 8px;
  --transition-speed: 0.3s;
  --shadow-light: 0 2px 8px rgba(0, 0, 0, 0.04);
  --shadow-dark: 0 2px 8px rgba(0, 0, 0, 0.2);
}

// Responsive Breakpoints
$breakpoint-sm: 600px;
$breakpoint-md: 1024px;
$breakpoint-lg: 1440px;
```

### Responsive Design

```scss
// Mobile first approach
.container {
  padding: 16px;

  @media (min-width: 600px) {
    padding: 24px 32px;
    max-width: 900px;
    margin: 0 auto;
  }

  @media (min-width: 1024px) {
    padding: 32px 48px;
    max-width: 1200px;
  }
}
```

### Animation System

```javascript
// quasar.config.js
animations: ['fadeIn', 'fadeOut', 'slideInLeft', 'slideOutRight']
```

Page transitions use depth-based sliding:
- Forward navigation: Slide from right
- Back navigation: Slide from left

---

## 10. Internationalization

### Supported Locales

| Code | Language | File |
|------|----------|------|
| en-US | English (US) | `src/i18n/en-US.ts` |
| en-GB | English (UK) | `src/i18n/en-GB.ts` |
| en-IE | English (Ireland) | `src/i18n/en-IE.ts` |
| pt-BR | Portuguese (Brazil) | `src/i18n/pt-BR.ts` |
| es | Spanish | `src/i18n/es.ts` |
| it-IT | Italian | `src/i18n/it-IT.ts` |
| fr | French | `src/i18n/fr.ts` |

### i18n Configuration (`src/boot/i18n.ts`)

```typescript
import { createI18n } from 'vue-i18n';
import messages from 'src/i18n';

export const i18n = createI18n({
  locale: 'en-US',
  fallbackLocale: 'en-US',
  legacy: false,
  messages,
});
```

### Translation Structure

```typescript
// Example translation file structure
export default {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    loading: 'Loading...',
    loadMore: 'Load more',
  },
  bots: {
    title: 'Bots',
    createBot: 'Create Bot',
    editBot: 'Edit Bot',
    botName: 'Bot Name',
    botDescription: 'Description',
    statusEnabled: 'Enabled',
    statusDisabled: 'Disabled',
    statusPaused: 'Paused',
  },
  // ... more namespaces
};
```

### Usage in Components

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <h1>{{ t('bots.title') }}</h1>
  <button>{{ t('common.save') }}</button>
</template>
```

---

## 11. Utilities & Helpers

### Error Handling (`src/utils/errors.ts`)

```typescript
// Error codes enum
export enum ErrorCode {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN',
}

// Standardized error interface
export interface AppError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

// Helper functions
export function getErrorMessage(error: unknown, fallback: string): string;
export function toAppError(error: unknown): AppError;
export function isNetworkError(error: unknown): boolean;
export function isValidationError(error: unknown): boolean;
export function isNotFoundError(error: unknown): boolean;
export function isConflictError(error: unknown): boolean;
```

### Filter History (`src/utils/filter-history.ts`)

Manages filter history persistence using IndexedDB with memory fallback.

```typescript
// Database configuration
const DB_NAME = 'botcrud-filter-history';
const DB_VERSION = 2;
const MAX_HISTORY_ITEMS = 100;

// Public API
export async function saveFilterHistory(
  nlQuery: string,
  filterObject: FilterQuery,
  prefix: string
): Promise<void>;

export async function getFilterHistory(
  prefix: string
): Promise<FilterHistoryItem[]>;

export async function deleteFilterHistoryItem(id: string): Promise<void>;

export async function clearFilterHistory(prefix: string): Promise<void>;

export function isIndexedDBAvailable(): boolean;

export async function recoverDatabase(): Promise<void>;
```

**Features:**
- SHA-256 hash-based deduplication
- Prefix-based separation (bots, workers, logs, worker-logs)
- Base64 encoding for filter queries
- Automatic cleanup of old entries
- Graceful fallback to memory storage
- Error recovery mechanisms

### Composables

#### useDateTime (`src/composables/useDateTime.ts`)

```typescript
export function useDateTime() {
  return {
    formatNumber(value: number): string;           // Locale-aware numbers
    formatElapsed(date: string | Date): string;    // "3 days ago"
    formatDate(date: string | Date): string;       // "Jan 15, 2024"
    formatDateTime(date: string | Date): string;   // "Jan 15, 2024 3:45 PM"
    formatDateTimeSimple(date: string | Date): string;
    formatRelativeTime(date: string | Date): string;
  };
}
```

#### useFilterManagement (`src/composables/useFilterManagement.ts`)

```typescript
export function useFilterManagement(options: FilterManagementOptions) {
  return {
    // State
    showFilterDrawer: Ref<boolean>;
    showFilterHistory: Ref<boolean>;
    initialFilter: Ref<FilterQuery | null>;

    // Methods
    openFilter(): void;
    handleFilterApply(filter: FilterQuery, nlQuery?: string): Promise<void>;
    handleHistoryApply(filter: Record<string, unknown>): void;
    handleHistoryEdit(filter: Record<string, unknown>): void;
  };
}
```

---

## 12. Testing Infrastructure

### Unit Testing (Vitest)

**Configuration:** `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    setupFiles: ['tests/unit/setup.ts'],
    include: ['tests/unit/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});
```

**Test Setup:** `tests/unit/setup.ts`

```typescript
import { vi } from 'vitest';

// Mock vue-i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: { value: 'en-US' },
  }),
}));

// Mock Quasar
vi.mock('quasar', () => ({
  useQuasar: () => ({
    screen: { lt: { sm: false } },
    dark: { isActive: false },
  }),
}));
```

**Running Unit Tests:**

```bash
npm run test:unit           # Run once
npm run test:unit:watch     # Watch mode
npm run test:unit:coverage  # With coverage
```

### E2E Testing (Playwright)

**Configuration:** `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'tests/reports' }],
  ],
  use: {
    baseURL: 'http://localhost:7030',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
});
```

**Test Files:**

| File | Coverage |
|------|----------|
| crud-operations.spec.ts | Full CRUD + cascade delete |
| home-page.spec.ts | Homepage functionality |
| bot-detail-page.spec.ts | Bot management |
| worker-detail-page.spec.ts | Worker management |
| workers-page.spec.ts | Workers listing |
| logs-page.spec.ts | Logs listing |
| statistics-page.spec.ts | Analytics |
| error-not-found.spec.ts | 404 page |

**Running E2E Tests:**

```bash
npm run test              # Run all tests
npm run test:headed       # With browser UI
npm run test:ui           # Playwright UI mode
npm run test:report       # View HTML report
```

### Test Coverage Areas

- **CRUD Operations**: Create, Read, Update, Delete for all entities
- **Cascade Delete**: Bot deletion removes workers and logs
- **UI Interactions**: Drawers, dialogs, navigation
- **Filtering**: Advanced filter application
- **Responsive Design**: Mobile, tablet, desktop viewports
- **Error States**: 404 handling, form validation

---

## 13. Build & Configuration

### Quasar Configuration (`quasar.config.js`)

```javascript
module.exports = configure(function (ctx) {
  return {
    // Boot files (initialization)
    boot: ['i18n', 'api'],

    // CSS imports
    css: ['app.scss'],

    // ESLint configuration
    eslint: {
      warnings: true,
      errors: true,
    },

    // Quasar framework plugins
    framework: {
      plugins: [
        'Dark',
        'Notify',
        'Dialog',
        'Loading',
        'LocalStorage',
        'SessionStorage',
      ],
      config: {
        dark: 'auto',
        brand: { /* colors */ },
      },
    },

    // Build configuration
    build: {
      target: {
        browser: ['es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
      },
      vueRouterMode: 'history',
    },

    // Development server
    devServer: {
      port: 7030,
      open: true,
    },

    // Animations
    animations: ['fadeIn', 'fadeOut', 'slideInLeft', 'slideOutRight'],
  };
});
```

### TypeScript Configuration (`tsconfig.json`)

```json
{
  "extends": "@quasar/app-vite/tsconfig-preset",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "src/*": ["src/*"],
      "components/*": ["src/components/*"],
      "layouts/*": ["src/layouts/*"],
      "pages/*": ["src/pages/*"],
      "stores/*": ["src/stores/*"],
      "boot/*": ["src/boot/*"]
    }
  }
}
```

### Environment Variables

**File:** `.env`

```env
VITE_API_URL=http://localhost:3000
```

**Type Definitions:** `src/env.d.ts`

```typescript
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}
```

---

## 14. Development Workflow

### Available Scripts

```bash
# Development
npm run dev               # Start dev server (port 7030)
npm run lint              # Run ESLint
npm run format            # Run Prettier

# Building
npm run build             # Production build

# Testing
npm run test              # Playwright E2E tests
npm run test:headed       # E2E with browser
npm run test:ui           # Playwright UI mode
npm run test:report       # View test report
npm run test:unit         # Vitest unit tests
npm run test:unit:watch   # Unit tests watch mode
npm run test:unit:coverage# Unit tests with coverage

# Mobile/Desktop
npm run dev:android       # Capacitor Android
npm run dev:ios           # Capacitor iOS
npm run dev:electron      # Electron desktop
npm run build:android     # Build Android APK
npm run build:ios         # Build iOS app
npm run build:electron    # Build Electron app
```

### Development Server Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 7030 | http://localhost:7030 |
| Backend API | 3000 | http://localhost:3000 |

### Code Quality Standards

- **ESLint**: TypeScript strict rules with Vue 3 support
- **Prettier**: Consistent code formatting
- **TypeScript**: Type-safe development
- **Component Style**: `<script setup>` with composition API

### Git Workflow

1. Create feature branch from `main`
2. Develop with hot reload
3. Run linting: `npm run lint`
4. Run tests: `npm run test`
5. Create pull request

---

## 15. Multi-Platform Support

### Web Application

Primary target platform. Full feature support with:
- Responsive design (mobile, tablet, desktop)
- PWA capabilities (optional)
- Modern browser support

### Mobile Applications (Capacitor)

**Configuration:** `src-capacitor/`

```bash
# Development
npm run dev:android
npm run dev:ios

# Production builds
npm run build:android
npm run build:ios
```

**Supported Features:**
- Native navigation
- Touch gestures
- Device storage
- Push notifications (configurable)

### Desktop Application (Electron)

```bash
# Development
npm run dev:electron

# Production build
npm run build:electron
```

**Platforms:**
- Windows
- macOS
- Linux

---

## Appendix

### A. File Size Reference

| Category | Lines of Code |
|----------|---------------|
| Pages | ~8,500 LOC |
| Components | ~3,500 LOC |
| Stores | ~1,200 LOC |
| Utilities | ~700 LOC |
| i18n | ~1,400 LOC |
| Tests | ~2,000 LOC |
| **Total** | **~14,025 LOC** |

### B. Browser Support

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | 87+ |
| Firefox | 78+ |
| Safari | 13.1+ |
| Edge | 88+ |

### C. Performance Considerations

- **Lazy Loading**: All route components are lazy-loaded
- **Pagination**: Default 100 items per page
- **Debouncing**: Filter inputs debounced for performance
- **Virtual Scrolling**: Available for large lists
- **IndexedDB**: Efficient filter history storage

### D. Security Considerations

- **XSS Prevention**: Vue's built-in template escaping
- **CSRF**: API client handles token management
- **Input Validation**: Client-side + server-side validation
- **Secure Storage**: Sensitive data uses SessionStorage

---

*Documentation generated for BotCRUD Frontend v1.0.0*
