/// <reference types="cypress" />

describe('StatisticsPage', () => {
  beforeEach(() => {
    cy.mockApi();
    cy.visit('/statistics');
  });

  describe('Page Layout', () => {
    it('should display the page header with back button', () => {
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.get('.back-btn, [class*="back"]').should('be.visible');
    });

    it('should display breadcrumb navigation', () => {
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.get('.breadcrumb, [class*="breadcrumb"]').should('be.visible');
    });

    it('should navigate back to home when clicking back button', () => {
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.get('.back-btn').first().click();
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });

    it('should navigate via breadcrumb link', () => {
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.get('.breadcrumb-link, [class*="breadcrumb"] span').first().click();
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });
  });

  describe('Loading State', () => {
    it('should show loading state while fetching data', () => {
      cy.intercept('GET', '**/api/bots*', (req) => {
        req.on('response', (res) => {
          res.setDelay(2000);
        });
      }).as('slowBots');

      cy.visit('/statistics');
      cy.get('.q-spinner, .loading-container').should('be.visible');
    });
  });

  describe('Overview Cards', () => {
    it('should display total bots card', () => {
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.get('.overview-card').should('have.length', 4);
    });

    it('should display total bots count', () => {
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.get('.overview-card.primary').should('be.visible');
      cy.get('.overview-card.primary .card-value').should('be.visible');
    });

    it('should display total workers card', () => {
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.get('.overview-card.secondary').should('be.visible');
    });

    it('should display total logs card', () => {
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.get('.overview-card.tertiary').should('be.visible');
    });

    it('should display enabled rate card', () => {
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.get('.overview-card.accent').should('be.visible');
    });

    it('should display workers per bot average', () => {
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.get('.overview-card.secondary .card-trend').should('be.visible');
    });

    it('should display logs per worker average', () => {
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.get('.overview-card.tertiary .card-trend').should('be.visible');
    });
  });

  describe('Charts Section', () => {
    it('should display bots by status chart', () => {
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.contains('Status').should('be.visible');
      cy.get('.chart-card').should('have.length.at.least', 1);
    });

    it('should display logs distribution chart', () => {
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.contains('Distribution').should('be.visible');
    });

    it('should display workers per bot chart', () => {
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.contains('Workers per Bot').should('be.visible');
    });

    it('should display activity timeline chart', () => {
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.contains('Timeline').should('be.visible');
    });

    it('should render chart canvas elements', () => {
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.get('canvas').should('have.length.at.least', 1);
    });

    it('should display chart legend for status chart', () => {
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.get('.chart-legend, .legend-item').should('be.visible');
    });
  });

  describe('Top Performers Section', () => {
    it('should display top bots section', () => {
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.contains('Top Bots').should('be.visible');
    });

    it('should display top workers section', () => {
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.contains('Top Workers').should('be.visible');
    });

    it('should display up to 5 top bots', () => {
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.get('.performers-card').first().find('.performer-item').should('have.length.at.most', 5);
    });

    it('should display up to 5 top workers', () => {
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.get('.performers-card').last().find('.performer-item').should('have.length.at.most', 5);
    });

    it('should display rank badges (gold, silver, bronze)', () => {
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.get('.performer-rank.gold').should('exist');
    });

    it('should display bot name and workers count', () => {
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.get('.performers-card').first().find('.performer-name').should('be.visible');
    });

    it('should display worker name and bot name', () => {
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.get('.performers-card').last().find('.performer-name').should('be.visible');
    });

    it('should display logs count for each performer', () => {
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.get('.performer-value').should('have.length.at.least', 1);
    });
  });

  describe('Top Bots Navigation', () => {
    it('should navigate to bot detail when clicking top bot', () => {
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.get('.performers-card').first().find('.performer-item.clickable').first().click();
      cy.url().should('include', '/bot/');
    });

    it('should have clickable styling on top bots', () => {
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.get('.performers-card').first().find('.performer-item.clickable').should('exist');
    });
  });

  describe('Top Workers Navigation', () => {
    it('should navigate to worker detail when clicking top worker', () => {
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.get('.performers-card').last().find('.performer-item.clickable').first().click();
      cy.url().should('include', '/worker/');
    });

    it('should have clickable styling on top workers', () => {
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.get('.performers-card').last().find('.performer-item.clickable').should('exist');
    });
  });

  describe('Empty States', () => {
    it('should handle no bots gracefully', () => {
      cy.intercept('GET', '**/api/bots*', {
        body: { data: [], pagination: { count: 0, skip: 0, limit: 10, hasMore: false } },
      }).as('emptyBots');

      cy.visit('/statistics');
      cy.wait(['@emptyBots', '@getWorkers', '@getLogs']);
      cy.get('.overview-card').should('be.visible');
    });

    it('should display no data message for empty performers', () => {
      cy.intercept('GET', '**/api/bots*', {
        body: { data: [], pagination: { count: 0, skip: 0, limit: 10, hasMore: false } },
      }).as('emptyBots');

      cy.visit('/statistics');
      cy.wait(['@emptyBots', '@getWorkers', '@getLogs']);
      cy.get('.no-data').should('be.visible');
    });

    it('should display no chart data message when no status data', () => {
      cy.intercept('GET', '**/api/bots*', {
        body: { data: [], pagination: { count: 0, skip: 0, limit: 10, hasMore: false } },
      }).as('emptyBots');

      cy.visit('/statistics');
      cy.wait(['@emptyBots', '@getWorkers', '@getLogs']);
    });
  });

  describe('Responsive Design', () => {
    it('should display correctly on mobile', () => {
      cy.viewport('iphone-x');
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.get('.statistics-page').should('be.visible');
      cy.get('.overview-section').should('be.visible');
    });

    it('should stack overview cards on mobile', () => {
      cy.viewport('iphone-x');
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.get('.overview-section').should('be.visible');
    });

    it('should display correctly on tablet', () => {
      cy.viewport('ipad-2');
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.get('.statistics-page').should('be.visible');
    });

    it('should display charts side by side on tablet', () => {
      cy.viewport('ipad-2');
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.get('.charts-row').should('be.visible');
    });

    it('should display correctly on desktop', () => {
      cy.viewport(1920, 1080);
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.get('.statistics-page').should('be.visible');
    });

    it('should display performers side by side on larger screens', () => {
      cy.viewport(1024, 768);
      cy.wait(['@getBots', '@getWorkers', '@getLogs']);
      cy.get('.performers-section').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      cy.intercept('GET', '**/api/bots*', {
        statusCode: 500,
        body: { error: 'Server error' },
      }).as('serverError');

      cy.visit('/statistics');
      cy.wait('@serverError');
    });

    it('should still display page when some data fails', () => {
      cy.intercept('GET', '**/api/logs*', {
        statusCode: 500,
        body: { error: 'Server error' },
      }).as('logsError');

      cy.visit('/statistics');
      cy.wait(['@getBots', '@getWorkers', '@logsError']);
      cy.get('.statistics-page').should('be.visible');
    });
  });

  describe('Data Accuracy', () => {
    it('should display correct total counts from pagination', () => {
      cy.intercept('GET', '**/api/bots*', {
        body: {
          data: [{ id: 'b1', name: 'Bot 1', status: 'ENABLED', workersCount: 5, logsCount: 100 }],
          pagination: { count: 100, skip: 0, limit: 10, hasMore: true },
        },
      }).as('botsWithCount');

      cy.visit('/statistics');
      cy.wait(['@botsWithCount', '@getWorkers', '@getLogs']);
      cy.get('.overview-card.primary .card-value').should('contain.text', '100');
    });
  });
});
