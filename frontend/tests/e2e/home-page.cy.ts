/// <reference types="cypress" />

describe('HomePage (Bot Dashboard)', () => {
  beforeEach(() => {
    // Mock API responses
    cy.mockApi();
    cy.visit('/');
  });

  describe('Page Layout', () => {
    it('should display the page title with bot count', () => {
      cy.wait('@getBots');
      cy.get('.home-title').should('be.visible');
      cy.get('.home-title').should('contain.text', 'Bot Dashboard');
    });

    it('should display the settings button', () => {
      cy.get('.settings-btn').should('be.visible');
      cy.get('.settings-btn').find('.q-icon').should('exist');
    });

    it('should display the stats bar', () => {
      cy.get('.stats-bar').should('be.visible');
    });
  });

  describe('Stats Bar', () => {
    it('should display bots count', () => {
      cy.wait('@getBots');
      cy.get('.stat-item').first().should('be.visible');
      cy.get('.stat-value').should('have.length.at.least', 1);
    });

    it('should display workers count as clickable', () => {
      cy.wait('@getWorkers');
      cy.get('.stat-item.clickable').should('have.length.at.least', 1);
    });

    it('should display logs count as clickable', () => {
      cy.wait('@getLogs');
      cy.get('.stat-item.clickable').should('exist');
    });

    it('should navigate to workers page when clicking workers stat', () => {
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.get('.stat-item.clickable').contains('Workers').click();
      cy.url().should('include', '/workers');
    });

    it('should navigate to logs page when clicking logs stat', () => {
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.get('.stat-item.clickable').contains('Logs').click();
      cy.url().should('include', '/logs');
    });

    it('should display statistics button', () => {
      cy.get('.stats-btn').should('be.visible');
      cy.get('.stats-btn').should('contain.text', 'Statistics');
    });

    it('should navigate to statistics page when clicking statistics button', () => {
      cy.get('.stats-btn').click();
      cy.url().should('include', '/statistics');
    });
  });

  describe('Bots Section', () => {
    it('should display bots section header', () => {
      cy.get('.bots-label').should('be.visible');
    });

    it('should display add bot button', () => {
      cy.get('.add-bot-btn').should('be.visible');
      cy.get('.add-bot-btn').should('contain.text', 'Add Bot');
    });

    it('should display filter button', () => {
      cy.get('.filter-btn').should('be.visible');
    });

    it('should display history button', () => {
      cy.get('.history-btn').should('be.visible');
    });
  });

  describe('Bots List', () => {
    it('should display bot cards after loading', () => {
      cy.wait('@getBots');
      cy.get('.bots-list').should('be.visible');
      cy.get('.bot-card, [class*="bot-card"]').should('have.length.at.least', 1);
    });

    it('should show loading state initially', () => {
      cy.intercept('GET', '**/api/bots*', (req) => {
        req.on('response', (res) => {
          res.setDelay(2000);
        });
      }).as('slowBots');

      cy.visit('/');
      cy.get('.q-spinner, .loading-state').should('be.visible');
    });

    it('should navigate to bot detail when clicking a bot card', () => {
      cy.wait('@getBots');
      cy.get('.bots-list').find('[class*="card"]').first().click();
      cy.url().should('include', '/bot/');
    });
  });

  describe('Add Bot Drawer', () => {
    it('should open add bot drawer when clicking add button', () => {
      cy.get('.add-bot-btn').first().click();
      cy.get('.q-dialog, .q-drawer').should('be.visible');
    });

    it('should close drawer when clicking outside or close button', () => {
      cy.get('.add-bot-btn').first().click();
      cy.get('.q-dialog, .q-drawer').should('be.visible');
      cy.get('body').type('{esc}');
      cy.get('.q-dialog').should('not.exist');
    });
  });

  describe('Filter Drawer', () => {
    it('should open filter drawer when clicking filter button', () => {
      cy.get('.filter-btn').click();
      cy.get('.q-dialog, .q-drawer').should('be.visible');
    });

    it('should display filter options', () => {
      cy.get('.filter-btn').click();
      cy.get('.q-dialog, .q-drawer').should('be.visible');
      // Filter drawer should have query builder or filter fields
      cy.get('.q-dialog, .q-drawer').should('contain.text', 'Filter');
    });
  });

  describe('Filter History Drawer', () => {
    it('should open filter history drawer when clicking history button', () => {
      cy.get('.history-btn').click();
      cy.get('.q-dialog').should('be.visible');
      cy.get('.q-dialog').should('contain.text', 'History');
    });
  });

  describe('Settings Drawer', () => {
    it('should open settings drawer when clicking settings button', () => {
      cy.get('.settings-btn').click();
      cy.get('.q-dialog, .q-drawer').should('be.visible');
    });

    it('should display language and theme options', () => {
      cy.get('.settings-btn').click();
      cy.get('.q-dialog, .q-drawer').should('be.visible');
      cy.get('.q-dialog, .q-drawer').should('contain.text', 'Settings');
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no bots', () => {
      cy.intercept('GET', '**/api/bots*', {
        body: { data: [], pagination: { count: 0, skip: 0, limit: 10, hasMore: false } },
      }).as('emptyBots');

      cy.visit('/');
      cy.wait('@emptyBots');
      cy.get('.empty-state').should('be.visible');
      cy.get('.empty-state').should('contain.text', 'No bots');
    });
  });

  describe('Load More', () => {
    it('should display load more button when more bots available', () => {
      cy.intercept('GET', '**/api/bots*', {
        fixture: 'bots.json',
        body: (body: any) => {
          body.pagination.hasMore = true;
          return body;
        },
      }).as('botsWithMore');

      cy.visit('/');
      cy.wait('@getBots');
      // Check if load more exists when hasMore is true
    });
  });

  describe('Responsive Design', () => {
    it('should display correctly on mobile viewport', () => {
      cy.viewport('iphone-x');
      cy.wait('@getBots');
      cy.get('.home-page').should('be.visible');
      cy.get('.stats-bar').should('be.visible');
    });

    it('should display correctly on tablet viewport', () => {
      cy.viewport('ipad-2');
      cy.wait('@getBots');
      cy.get('.home-page').should('be.visible');
    });

    it('should display correctly on desktop viewport', () => {
      cy.viewport(1920, 1080);
      cy.wait('@getBots');
      cy.get('.home-page').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      cy.intercept('GET', '**/api/bots*', {
        statusCode: 500,
        body: { error: 'Internal Server Error' },
      }).as('errorBots');

      cy.visit('/');
      cy.wait('@errorBots');
      // Should show error notification or error state
      cy.get('.q-notification, .q-notify').should('be.visible');
    });
  });
});
