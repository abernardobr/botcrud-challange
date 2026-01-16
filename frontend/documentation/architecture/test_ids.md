# Test IDs Documentation

This document lists all `data-testid` attributes available in the BotCRUD frontend for E2E testing.

## Naming Convention

All test IDs follow kebab-case naming convention:
- Page elements: `{page-name}-{element}`
- Components: `{component-name}-{element}`
- Dynamic IDs: `{component}-{entity}-${id}`

---

## Pages

### HomePage (`src/pages/HomePage.vue`)

| Test ID | Element | Description |
|---------|---------|-------------|
| `home-title` | h1 | Main page title with bot count |
| `settings-btn` | q-btn | Opens settings drawer |
| `add-bot-btn` | q-btn | Opens add bot drawer |
| `filter-btn` | q-btn | Opens filter drawer |
| `filter-history-btn` | q-btn | Opens filter history drawer |
| `loading-state` | div | Loading spinner container |
| `empty-state` | div | Empty state when no bots exist |
| `bots-list` | div | Container for bot cards |
| `load-more-btn` | q-btn | Load more bots button |

### WorkersPage (`src/pages/WorkersPage.vue`)

| Test ID | Element | Description |
|---------|---------|-------------|
| `workers-page` | q-page | Page container |
| `back-btn` | q-btn | Navigate back button |
| `page-title` | h1 | Page title |
| `settings-btn` | q-btn | Opens settings drawer |
| `add-worker-btn` | q-btn | Opens add worker drawer |
| `filter-btn` | q-btn | Opens filter drawer |
| `filter-history-btn` | q-btn | Opens filter history drawer |
| `loading-state` | div | Loading spinner container |
| `empty-state` | div | Empty state when no workers exist |
| `workers-list` | div | Container for worker cards |
| `load-more-btn` | q-btn | Load more workers button |

### LogsPage (`src/pages/LogsPage.vue`)

| Test ID | Element | Description |
|---------|---------|-------------|
| `logs-page` | q-page | Page container |
| `back-btn` | q-btn | Navigate back button |
| `page-title` | h1 | Page title |
| `settings-btn` | q-btn | Opens settings drawer |
| `add-log-btn` | q-btn | Opens add log dialog |
| `filter-btn` | q-btn | Opens filter drawer |
| `filter-history-btn` | q-btn | Opens filter history drawer |
| `loading-state` | div | Loading spinner container |
| `empty-state` | div | Empty state when no logs exist |
| `logs-list` | div | Container for log cards |
| `load-more-btn` | q-btn | Load more logs button |
| `log-dialog` | q-dialog | Add/Edit log dialog |
| `log-dialog-card` | q-card | Dialog card container |
| `log-message-input` | q-input | Log message input field |
| `log-bot-select` | q-select | Bot selection dropdown |
| `log-worker-select` | q-select | Worker selection dropdown |
| `log-cancel-btn` | q-btn | Cancel dialog button |
| `log-save-btn` | q-btn | Save log button |

### StatisticsPage (`src/pages/StatisticsPage.vue`)

| Test ID | Element | Description |
|---------|---------|-------------|
| `statistics-page` | q-page | Page container |
| `back-btn` | q-btn | Navigate back button |
| `loading-state` | div | Loading spinner container |
| `overview-section` | section | Overview statistics section |
| `overview-card-bots` | div | Bots count card |
| `overview-card-workers` | div | Workers count card |
| `overview-card-logs` | div | Logs count card |
| `overview-card-enabled-rate` | div | Enabled rate card |
| `charts-section` | section | Charts section container |
| `performers-section` | section | Top performers section |
| `top-bots-card` | div | Top bots card |
| `top-bots-list` | div | Top bots list container |
| `top-workers-card` | div | Top workers card |
| `top-workers-list` | div | Top workers list container |

---

## Card Components

### BotCard (`src/components/BotCard.vue`)

| Test ID | Element | Description |
|---------|---------|-------------|
| `bot-card-${bot.id}` | q-card | Bot card container (dynamic ID) |
| `bot-status-${status}` | q-badge | Status badge (enabled/disabled/paused) |
| `bot-name` | h3 | Bot name |
| `bot-description` | p | Bot description |

### WorkerCard (`src/components/WorkerCard.vue`)

| Test ID | Element | Description |
|---------|---------|-------------|
| `worker-card-${worker.id}` | q-card | Worker card container (dynamic ID) |
| `worker-name` | h3 | Worker name |
| `worker-description` | p | Worker description |
| `worker-logs-count` | p | Worker logs count |

### LogCard (`src/components/LogCard.vue`)

| Test ID | Element | Description |
|---------|---------|-------------|
| `log-card-${log.id}` | q-card | Log card container (dynamic ID) |
| `log-message` | p | Log message |

---

## Drawer Components

### AddBotDrawer (`src/components/AddBotDrawer.vue`)

| Test ID | Element | Description |
|---------|---------|-------------|
| `add-bot-drawer` | q-dialog | Drawer container |
| `add-bot-close-btn` | q-btn | Close drawer button |
| `add-bot-name-input` | q-input | Bot name input |
| `add-bot-description-input` | q-input | Bot description textarea |
| `add-bot-status-select` | q-select | Status selection dropdown |
| `add-bot-cancel-btn` | q-btn | Cancel button |
| `add-bot-save-btn` | q-btn | Save button |

### AddWorkerDrawer (`src/components/AddWorkerDrawer.vue`)

| Test ID | Element | Description |
|---------|---------|-------------|
| `add-worker-drawer` | q-dialog | Drawer container |
| `add-worker-close-btn` | q-btn | Close drawer button |
| `add-worker-name-input` | q-input | Worker name input |
| `add-worker-description-input` | q-input | Worker description textarea |
| `add-worker-bot-select` | q-select | Assigned bot dropdown |
| `add-worker-cancel-btn` | q-btn | Cancel button |
| `add-worker-save-btn` | q-btn | Save button |

### AddLogDrawer (`src/components/AddLogDrawer.vue`)

| Test ID | Element | Description |
|---------|---------|-------------|
| `add-log-drawer` | q-dialog | Drawer container |
| `add-log-close-btn` | q-btn | Close drawer button |
| `add-log-message-input` | q-input | Log message textarea |
| `add-log-worker-select` | q-select | Worker selection dropdown |
| `add-log-cancel-btn` | q-btn | Cancel button |
| `add-log-save-btn` | q-btn | Save button |

### FilterDrawer (`src/components/FilterDrawer.vue`)

| Test ID | Element | Description |
|---------|---------|-------------|
| `filter-drawer` | q-dialog | Drawer container |
| `filter-close-btn` | q-btn | Close drawer button |
| `filter-clear-all-btn` | q-btn | Clear all conditions button |
| `filter-clear-filter-btn` | q-btn | Clear active filter button |
| `filter-cancel-btn` | q-btn | Cancel button |
| `filter-apply-btn` | q-btn | Apply filter button |

### FilterHistoryDrawer (`src/components/FilterHistoryDrawer.vue`)

| Test ID | Element | Description |
|---------|---------|-------------|
| `filter-history-drawer` | q-dialog | Drawer container |
| `filter-history-clear-all-btn` | q-btn | Clear all history button |
| `filter-history-close-btn` | q-btn | Close drawer button |
| `filter-history-loading` | q-card-section | Loading state container |
| `filter-history-empty` | q-card-section | Empty state container |
| `filter-history-list` | q-card-section | History list container |
| `filter-history-item-${item.id}` | div | History item card (dynamic ID) |
| `filter-history-apply-btn` | q-btn | Apply filter button (per item) |
| `filter-history-edit-btn` | q-btn | Edit filter button (per item) |
| `filter-history-delete-btn` | q-btn | Delete filter button (per item) |

### SettingsDrawer (`src/components/SettingsDrawer.vue`)

| Test ID | Element | Description |
|---------|---------|-------------|
| `settings-drawer` | q-dialog | Drawer container |
| `settings-close-btn` | q-btn | Close drawer button |
| `settings-theme-section` | div | Theme settings section |
| `settings-theme-options` | div | Theme options container |
| `settings-theme-${value}` | button | Theme option (auto/dark/light) |
| `settings-language-section` | div | Language settings section |
| `settings-language-options` | div | Language options container |
| `settings-language-${locale}` | button | Language option (dynamic) |

---

## Utility Components

### HomeStats (`src/components/HomeStats.vue`)

| Test ID | Element | Description |
|---------|---------|-------------|
| `home-stats` | div | Stats bar container |
| `stats-bots-count` | div | Bots count display |
| `stats-workers-link` | div | Workers count (clickable) |
| `stats-logs-link` | div | Logs count (clickable) |
| `stats-statistics-btn` | q-btn | Statistics button |

### QueryBuilder (`src/components/query-builder/QueryBuilder.vue`)

| Test ID | Element | Description |
|---------|---------|-------------|
| `query-builder` | div | Query builder container |
| `query-builder-empty` | div | Empty state when no conditions |
| `query-builder-conditions` | div | Conditions list container |
| `query-builder-add-condition-btn` | q-btn | Add condition button |

---

## Usage Examples

### Playwright Example

```typescript
// Click add bot button
await page.getByTestId('add-bot-btn').click();

// Fill form
await page.getByTestId('add-bot-name-input').fill('My Bot');
await page.getByTestId('add-bot-description-input').fill('Description');
await page.getByTestId('add-bot-status-select').click();
await page.getByRole('option', { name: 'Enabled' }).click();

// Save
await page.getByTestId('add-bot-save-btn').click();

// Verify bot appears in list
await expect(page.getByTestId('bots-list')).toContainText('My Bot');
```

### Cypress Example

```typescript
// Click add bot button
cy.get('[data-testid="add-bot-btn"]').click();

// Fill form
cy.get('[data-testid="add-bot-name-input"]').type('My Bot');
cy.get('[data-testid="add-bot-description-input"]').type('Description');
cy.get('[data-testid="add-bot-status-select"]').click();
cy.contains('Enabled').click();

// Save
cy.get('[data-testid="add-bot-save-btn"]').click();

// Verify bot appears in list
cy.get('[data-testid="bots-list"]').should('contain', 'My Bot');
```

---

## Best Practices

1. **Use specific selectors**: Prefer `getByTestId` over CSS selectors for more stable tests
2. **Dynamic IDs**: Use template literals for entity-specific elements (e.g., `bot-card-${id}`)
3. **Wait for elements**: Always wait for elements to be visible before interacting
4. **Test user flows**: Use test IDs to simulate complete user journeys
5. **Avoid implementation details**: Test behavior, not internal component structure
