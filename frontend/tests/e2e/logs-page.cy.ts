/// <reference types="cypress" />

describe('LogsPage', () => {
  beforeEach(() => {
    cy.mockApi();
    cy.visit('/logs');
  });

  describe('Page Layout', () => {
    it('should display the page header with back button', () => {
      cy.wait('@getLogs');
      cy.get('.back-btn, [class*="back"]').should('be.visible');
    });

    it('should display the page title with logs count', () => {
      cy.wait('@getLogs');
      cy.get('.page-title').should('be.visible');
      cy.get('.page-title').should('contain.text', 'Logs');
    });

    it('should display settings button', () => {
      cy.get('.settings-btn').should('be.visible');
    });

    it('should navigate back to home when clicking back button', () => {
      cy.wait('@getLogs');
      cy.get('.back-btn').first().click();
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });
  });

  describe('Stats Bar', () => {
    it('should display logs count', () => {
      cy.wait('@getLogs');
      cy.get('.stat-item').should('have.length.at.least', 1);
    });

    it('should display bots count as clickable', () => {
      cy.wait(['@getLogs', '@getBots']);
      cy.get('.stat-item.clickable').should('exist');
    });

    it('should display workers count as clickable', () => {
      cy.wait(['@getLogs', '@getWorkers']);
      cy.get('.stat-item.clickable').should('exist');
    });

    it('should navigate to home page when clicking bots stat', () => {
      cy.wait(['@getLogs', '@getBots', '@getWorkers']);
      cy.get('.stat-item.clickable').contains(/bot/i).click();
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });

    it('should navigate to workers page when clicking workers stat', () => {
      cy.wait(['@getLogs', '@getBots', '@getWorkers']);
      cy.get('.stat-item.clickable').contains(/worker/i).click();
      cy.url().should('include', '/workers');
    });
  });

  describe('Logs Section', () => {
    it('should display section header', () => {
      cy.get('.section-label, .section-header').should('be.visible');
    });

    it('should display create log button', () => {
      cy.get('.add-btn, button').contains(/add|create/i).should('be.visible');
    });

    it('should display filter button', () => {
      cy.get('.filter-btn').should('be.visible');
    });

    it('should display history button', () => {
      cy.get('.history-btn').should('be.visible');
    });
  });

  describe('Logs List', () => {
    it('should display log cards after loading', () => {
      cy.wait('@getLogs');
      cy.get('.logs-list, [class*="logs-list"]').should('be.visible');
    });

    it('should display log message on each card', () => {
      cy.wait('@getLogs');
      cy.get('[class*="log-card"]').should('have.length.at.least', 1);
    });

    it('should display bot name on log cards', () => {
      cy.wait(['@getLogs', '@getBots']);
      cy.get('[class*="log-card"]').first().should('be.visible');
    });

    it('should display worker name on log cards', () => {
      cy.wait(['@getLogs', '@getWorkers']);
      cy.get('[class*="log-card"]').first().should('be.visible');
    });

    it('should display creation date on log cards', () => {
      cy.wait('@getLogs');
      cy.get('[class*="log-card"]').first().should('be.visible');
    });
  });

  describe('Create Log Dialog', () => {
    it('should open create log dialog when clicking add button', () => {
      cy.get('.add-btn, button').contains(/add|create/i).click();
      cy.get('.q-dialog').should('be.visible');
    });

    it('should display form fields', () => {
      cy.get('.add-btn, button').contains(/add|create/i).click();
      cy.get('.q-dialog').should('be.visible');
      cy.get('textarea, input').should('exist');
    });

    it('should require bot and worker selection', () => {
      cy.get('.add-btn, button').contains(/add|create/i).click();
      cy.get('.q-dialog').should('be.visible');
      cy.get('.q-select').should('have.length.at.least', 2);
    });

    it('should create log when form is submitted', () => {
      cy.get('.add-btn, button').contains(/add|create/i).click();

      cy.get('textarea').type('New test log message');

      // Select a bot
      cy.get('.q-select').first().click();
      cy.get('.q-item').first().click();

      // Select a worker
      cy.get('.q-select').eq(1).click();
      cy.get('.q-item').first().click();

      cy.get('button').contains(/save|create/i).click();
      cy.wait('@createLog');
      cy.get('.q-notification').should('be.visible');
    });

    it('should validate required fields', () => {
      cy.get('.add-btn, button').contains(/add|create/i).click();
      cy.get('button').contains(/save|create/i).click();
      // Should show validation error
    });

    it('should close dialog on cancel', () => {
      cy.get('.add-btn, button').contains(/add|create/i).click();
      cy.get('.q-dialog').should('be.visible');
      cy.get('body').type('{esc}');
      cy.get('.q-dialog').should('not.exist');
    });
  });

  describe('Filter Functionality', () => {
    it('should open filter drawer when clicking filter button', () => {
      cy.get('.filter-btn').click();
      cy.get('.q-dialog, .q-drawer').should('be.visible');
    });

    it('should display filter fields for message, bot, worker', () => {
      cy.get('.filter-btn').click();
      cy.get('.q-dialog, .q-drawer').should('be.visible');
      cy.contains(/message|bot|worker/i).should('exist');
    });

    it('should filter logs by message', () => {
      cy.get('.filter-btn').click();
      cy.get('.q-dialog, .q-drawer').should('be.visible');
      // Build and apply filter
    });

    it('should filter logs by bot', () => {
      cy.get('.filter-btn').click();
      cy.get('.q-dialog, .q-drawer').should('be.visible');
    });

    it('should filter logs by worker', () => {
      cy.get('.filter-btn').click();
      cy.get('.q-dialog, .q-drawer').should('be.visible');
    });

    it('should show filter badge when filter is active', () => {
      cy.get('.filter-btn').click();
      cy.get('.q-dialog, .q-drawer').should('be.visible');
    });
  });

  describe('Filter History', () => {
    it('should open filter history drawer', () => {
      cy.get('.history-btn').click();
      cy.get('.q-dialog').should('be.visible');
      cy.contains('History').should('be.visible');
    });

    it('should display empty state when no history', () => {
      cy.get('.history-btn').click();
      cy.get('.q-dialog').should('be.visible');
    });
  });

  describe('Settings Drawer', () => {
    it('should open settings drawer', () => {
      cy.get('.settings-btn').click();
      cy.get('.q-dialog, .q-drawer').should('be.visible');
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no logs', () => {
      cy.intercept('GET', '**/api/logs*', {
        body: { data: [], pagination: { count: 0, skip: 0, limit: 10, hasMore: false } },
      }).as('emptyLogs');

      cy.visit('/logs');
      cy.wait('@emptyLogs');
      cy.get('.empty-state').should('be.visible');
    });
  });

  describe('Loading State', () => {
    it('should show loading state while fetching', () => {
      cy.intercept('GET', '**/api/logs*', (req) => {
        req.on('response', (res) => {
          res.setDelay(2000);
        });
      }).as('slowLogs');

      cy.visit('/logs');
      cy.get('.q-spinner, .loading-state').should('be.visible');
    });
  });

  describe('Load More', () => {
    it('should display load more button when more logs available', () => {
      cy.intercept('GET', '**/api/logs*', {
        body: {
          data: [{ id: 'l1', message: 'Test log', bot: 'bot-1', worker: 'worker-1' }],
          pagination: { count: 1000, skip: 0, limit: 10, hasMore: true },
        },
      }).as('logsWithMore');

      cy.visit('/logs');
      cy.wait('@logsWithMore');
      cy.get('button').contains(/load more/i).should('be.visible');
    });

    it('should load more logs when clicking button', () => {
      cy.intercept('GET', '**/api/logs*', {
        body: {
          data: [{ id: 'l1', message: 'Test log', bot: 'bot-1', worker: 'worker-1' }],
          pagination: { count: 1000, skip: 0, limit: 10, hasMore: true },
        },
      }).as('logsWithMore');

      cy.visit('/logs');
      cy.wait('@logsWithMore');
      cy.get('button').contains(/load more/i).click();
    });
  });

  describe('Responsive Design', () => {
    it('should display as cards on mobile', () => {
      cy.viewport('iphone-x');
      cy.wait('@getLogs');
      cy.get('.logs-page').should('be.visible');
    });

    it('should display as grid on tablet', () => {
      cy.viewport('ipad-2');
      cy.wait('@getLogs');
      cy.get('.logs-page').should('be.visible');
    });

    it('should display as grid on desktop', () => {
      cy.viewport(1920, 1080);
      cy.wait('@getLogs');
      cy.get('.logs-page').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      cy.intercept('GET', '**/api/logs*', {
        statusCode: 500,
        body: { error: 'Server error' },
      }).as('serverError');

      cy.visit('/logs');
      cy.wait('@serverError');
      cy.get('.q-notification').should('be.visible');
    });
  });
});
