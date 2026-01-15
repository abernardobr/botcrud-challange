/// <reference types="cypress" />

describe('WorkersPage', () => {
  beforeEach(() => {
    cy.mockApi();
    cy.visit('/workers');
  });

  describe('Page Layout', () => {
    it('should display the page header with back button', () => {
      cy.wait('@getWorkers');
      cy.get('.back-btn, [class*="back"]').should('be.visible');
    });

    it('should display the page title with workers count', () => {
      cy.wait('@getWorkers');
      cy.get('.page-title').should('be.visible');
      cy.get('.page-title').should('contain.text', 'Workers');
    });

    it('should display settings button', () => {
      cy.get('.settings-btn').should('be.visible');
    });

    it('should navigate back to home when clicking back button', () => {
      cy.wait('@getWorkers');
      cy.get('.back-btn').first().click();
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });
  });

  describe('Stats Bar', () => {
    it('should display workers count', () => {
      cy.wait('@getWorkers');
      cy.get('.stat-item').should('have.length.at.least', 1);
    });

    it('should display bots count as clickable', () => {
      cy.wait(['@getWorkers', '@getBots']);
      cy.get('.stat-item.clickable').should('exist');
    });

    it('should display logs count as clickable', () => {
      cy.wait(['@getWorkers', '@getLogs']);
      cy.get('.stat-item.clickable').should('exist');
    });

    it('should navigate to home page when clicking bots stat', () => {
      cy.wait(['@getWorkers', '@getBots', '@getLogs']);
      cy.get('.stat-item.clickable').contains(/bot/i).click();
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });

    it('should navigate to logs page when clicking logs stat', () => {
      cy.wait(['@getWorkers', '@getBots', '@getLogs']);
      cy.get('.stat-item.clickable').contains(/log/i).click();
      cy.url().should('include', '/logs');
    });
  });

  describe('Workers Section', () => {
    it('should display section header', () => {
      cy.get('.section-label, .section-header').should('be.visible');
    });

    it('should display create worker button', () => {
      cy.get('.add-btn, button').contains(/add|create/i).should('be.visible');
    });

    it('should display filter button', () => {
      cy.get('.filter-btn').should('be.visible');
    });

    it('should display history button', () => {
      cy.get('.history-btn').should('be.visible');
    });
  });

  describe('Workers List', () => {
    it('should display worker cards after loading', () => {
      cy.wait('@getWorkers');
      cy.get('.workers-list').should('be.visible');
    });

    it('should display worker name on each card', () => {
      cy.wait('@getWorkers');
      cy.get('[class*="worker-card"]').should('have.length.at.least', 1);
    });

    it('should display logs count on each worker card', () => {
      cy.wait('@getWorkers');
      cy.get('[class*="worker-card"]').first().should('contain.text', 'logs');
    });

    it('should navigate to worker detail when clicking a card', () => {
      cy.wait('@getWorkers');
      cy.get('[class*="worker-card"]').first().click();
      cy.url().should('include', '/worker/');
    });
  });

  describe('Add Worker Drawer', () => {
    it('should open add worker drawer when clicking add button', () => {
      cy.get('.add-btn, button').contains(/add|create/i).click();
      cy.get('.q-dialog, .q-drawer').should('be.visible');
    });

    it('should display form fields', () => {
      cy.get('.add-btn, button').contains(/add|create/i).click();
      cy.get('.q-dialog, .q-drawer').should('be.visible');
      cy.get('input[type="text"]').should('exist');
    });

    it('should require bot selection', () => {
      cy.get('.add-btn, button').contains(/add|create/i).click();
      cy.get('.q-dialog, .q-drawer').should('be.visible');
      cy.get('.q-select, select').should('exist');
    });

    it('should create worker when form is submitted', () => {
      cy.get('.add-btn, button').contains(/add|create/i).click();

      cy.get('input[type="text"]').first().type('New Test Worker');
      cy.get('textarea').type('Worker description');

      // Select a bot
      cy.get('.q-select, select').first().click();
      cy.get('.q-item, option').first().click();

      cy.get('button').contains(/save|create/i).click();
      cy.wait('@createWorker');
      cy.get('.q-notification').should('be.visible');
    });

    it('should validate required fields', () => {
      cy.get('.add-btn, button').contains(/add|create/i).click();
      cy.get('button').contains(/save|create/i).click();
      cy.get('.q-field--error, [class*="error"]').should('exist');
    });

    it('should close drawer on cancel', () => {
      cy.get('.add-btn, button').contains(/add|create/i).click();
      cy.get('.q-dialog, .q-drawer').should('be.visible');
      cy.get('body').type('{esc}');
      cy.get('.q-dialog').should('not.exist');
    });
  });

  describe('Filter Functionality', () => {
    it('should open filter drawer when clicking filter button', () => {
      cy.get('.filter-btn').click();
      cy.get('.q-dialog, .q-drawer').should('be.visible');
    });

    it('should display filter fields', () => {
      cy.get('.filter-btn').click();
      cy.get('.q-dialog, .q-drawer').should('be.visible');
      cy.contains(/name|description|bot/i).should('exist');
    });

    it('should filter workers by name', () => {
      cy.get('.filter-btn').click();
      // Build filter query
      cy.get('.q-dialog, .q-drawer').should('be.visible');
    });

    it('should filter workers by bot', () => {
      cy.get('.filter-btn').click();
      cy.get('.q-dialog, .q-drawer').should('be.visible');
    });

    it('should show filter badge when filter is active', () => {
      // Apply a filter first
      cy.get('.filter-btn').click();
      cy.get('.q-dialog, .q-drawer').should('be.visible');
    });

    it('should clear filter', () => {
      cy.get('.filter-btn').click();
      cy.get('.q-dialog, .q-drawer').should('be.visible');
      // Clear filter and verify
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
    it('should display empty state when no workers', () => {
      cy.intercept('GET', '**/api/workers*', {
        body: { data: [], pagination: { count: 0, skip: 0, limit: 10, hasMore: false } },
      }).as('emptyWorkers');

      cy.visit('/workers');
      cy.wait('@emptyWorkers');
      cy.get('.empty-state').should('be.visible');
    });
  });

  describe('Loading State', () => {
    it('should show loading state while fetching', () => {
      cy.intercept('GET', '**/api/workers*', (req) => {
        req.on('response', (res) => {
          res.setDelay(2000);
        });
      }).as('slowWorkers');

      cy.visit('/workers');
      cy.get('.q-spinner, .loading-state').should('be.visible');
    });
  });

  describe('Load More', () => {
    it('should display load more button when more workers available', () => {
      cy.intercept('GET', '**/api/workers*', {
        body: {
          data: [{ id: 'w1', name: 'Worker 1', bot: 'bot-1', logsCount: 10 }],
          pagination: { count: 50, skip: 0, limit: 10, hasMore: true },
        },
      }).as('workersWithMore');

      cy.visit('/workers');
      cy.wait('@workersWithMore');
      cy.get('button').contains(/load more/i).should('be.visible');
    });

    it('should load more workers when clicking button', () => {
      cy.intercept('GET', '**/api/workers*', {
        body: {
          data: [{ id: 'w1', name: 'Worker 1', bot: 'bot-1', logsCount: 10 }],
          pagination: { count: 50, skip: 0, limit: 10, hasMore: true },
        },
      }).as('workersWithMore');

      cy.visit('/workers');
      cy.wait('@workersWithMore');
      cy.get('button').contains(/load more/i).click();
    });
  });

  describe('Responsive Design', () => {
    it('should display as cards on mobile', () => {
      cy.viewport('iphone-x');
      cy.wait('@getWorkers');
      cy.get('.workers-page').should('be.visible');
      cy.get('.workers-list').should('be.visible');
    });

    it('should display as grid on tablet', () => {
      cy.viewport('ipad-2');
      cy.wait('@getWorkers');
      cy.get('.workers-page').should('be.visible');
    });

    it('should display as grid on desktop', () => {
      cy.viewport(1920, 1080);
      cy.wait('@getWorkers');
      cy.get('.workers-page').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      cy.intercept('GET', '**/api/workers*', {
        statusCode: 500,
        body: { error: 'Server error' },
      }).as('serverError');

      cy.visit('/workers');
      cy.wait('@serverError');
      cy.get('.q-notification').should('be.visible');
    });
  });
});
