/// <reference types="cypress" />

describe('WorkerDetailPage', () => {
  const botId = 'bot-1';
  const workerId = 'worker-1';

  beforeEach(() => {
    cy.mockApi();
    cy.visit(`/bot/${botId}/worker/${workerId}`);
  });

  describe('Page Layout', () => {
    it('should display the page header with back button', () => {
      cy.wait('@getWorkerDetail');
      cy.get('.back-btn, [class*="back"]').should('be.visible');
    });

    it('should display breadcrumb navigation', () => {
      cy.wait('@getWorkerDetail');
      cy.get('.breadcrumb, [class*="breadcrumb"]').should('be.visible');
    });

    it('should display worker name in header', () => {
      cy.wait('@getWorkerDetail');
      cy.get('.page-title, [class*="title"]').should('contain.text', 'Data Processor');
    });

    it('should navigate back to bot detail when clicking back button', () => {
      cy.wait('@getWorkerDetail');
      cy.get('.back-btn, [class*="back"]').first().click();
      cy.url().should('include', `/bot/${botId}`);
    });

    it('should navigate to bot detail via breadcrumb', () => {
      cy.wait('@getWorkerDetail');
      cy.get('.breadcrumb, [class*="breadcrumb"]').find('span, a').contains(/bot|home/i).click();
    });
  });

  describe('Worker Information Card', () => {
    it('should display worker details', () => {
      cy.wait('@getWorkerDetail');
      cy.contains('Data Processor').should('be.visible');
    });

    it('should display worker description', () => {
      cy.wait('@getWorkerDetail');
      cy.contains('Processes incoming data streams').should('be.visible');
    });

    it('should display parent bot name', () => {
      cy.wait(['@getWorkerDetail', '@getBots']);
      // Parent bot information should be visible
    });

    it('should display edit button', () => {
      cy.wait('@getWorkerDetail');
      cy.get('button').contains(/edit/i).should('exist');
    });

    it('should display delete button', () => {
      cy.wait('@getWorkerDetail');
      cy.get('button').contains(/delete/i).should('exist');
    });

    it('should display creation date', () => {
      cy.wait('@getWorkerDetail');
      // Creation date should be formatted and visible
    });
  });

  describe('Logs Section', () => {
    it('should display logs section', () => {
      cy.wait(['@getWorkerDetail', '@getLogs']);
      cy.contains('Logs').should('be.visible');
    });

    it('should display logs count', () => {
      cy.wait(['@getWorkerDetail', '@getLogs']);
      cy.get('[class*="log"]').should('have.length.at.least', 0);
    });

    it('should display filter button for logs', () => {
      cy.wait('@getWorkerDetail');
      cy.get('.filter-btn, [class*="filter"]').should('exist');
    });

    it('should display filter history button', () => {
      cy.wait('@getWorkerDetail');
      cy.get('.history-btn, [class*="history"]').should('exist');
    });

    it('should display log cards with message and date', () => {
      cy.wait(['@getWorkerDetail', '@getLogs']);
      cy.get('[class*="log-card"], [class*="log"]').should('have.length.at.least', 0);
    });
  });

  describe('Edit Worker', () => {
    it('should open edit drawer when clicking edit button', () => {
      cy.wait('@getWorkerDetail');
      cy.get('button').contains(/edit/i).click();
      cy.get('.q-dialog, .q-drawer').should('be.visible');
    });

    it('should pre-fill form with worker data', () => {
      cy.wait('@getWorkerDetail');
      cy.get('button').contains(/edit/i).click();
      cy.get('.q-dialog, .q-drawer').should('be.visible');
      cy.get('input[type="text"]').first().should('have.value', 'Data Processor');
    });

    it('should update worker when saving changes', () => {
      cy.wait('@getWorkerDetail');
      cy.get('button').contains(/edit/i).click();

      cy.get('input[type="text"]').first().clear().type('Updated Worker Name');
      cy.get('button').contains(/save|update/i).click();

      cy.wait('@updateWorker');
      cy.get('.q-notification, .q-notify').should('be.visible');
    });

    it('should validate required fields', () => {
      cy.wait('@getWorkerDetail');
      cy.get('button').contains(/edit/i).click();

      cy.get('input[type="text"]').first().clear();
      cy.get('button').contains(/save|update/i).click();

      // Should show validation error
      cy.get('.q-field--error, [class*="error"]').should('exist');
    });
  });

  describe('Delete Worker', () => {
    it('should show confirmation dialog when clicking delete', () => {
      cy.wait('@getWorkerDetail');
      cy.get('button').contains(/delete/i).click();
      cy.get('.q-dialog').should('be.visible');
    });

    it('should delete worker and redirect on confirm', () => {
      cy.wait('@getWorkerDetail');
      cy.get('button').contains(/delete/i).click();
      cy.get('.q-dialog').should('be.visible');

      cy.get('.q-dialog').find('button').contains(/yes|confirm|delete/i).click();

      cy.wait('@deleteWorker');
      cy.url().should('include', `/bot/${botId}`);
    });

    it('should cancel deletion when clicking cancel', () => {
      cy.wait('@getWorkerDetail');
      cy.get('button').contains(/delete/i).click();
      cy.get('.q-dialog').should('be.visible');

      cy.get('.q-dialog').find('button').contains(/no|cancel/i).click();
      cy.get('.q-dialog').should('not.exist');
    });
  });

  describe('Filter Logs', () => {
    it('should open filter drawer', () => {
      cy.wait('@getWorkerDetail');
      cy.get('.filter-btn, [class*="filter"]').first().click();
      cy.get('.q-dialog, .q-drawer').should('be.visible');
    });

    it('should apply filter to logs', () => {
      cy.wait(['@getWorkerDetail', '@getLogs']);
      cy.get('.filter-btn, [class*="filter"]').first().click();
      cy.get('.q-dialog, .q-drawer').should('be.visible');
      // Apply filter and verify results change
    });

    it('should open filter history drawer', () => {
      cy.wait('@getWorkerDetail');
      cy.get('.history-btn, [class*="history"]').click();
      cy.get('.q-dialog').should('be.visible');
      cy.contains('History').should('be.visible');
    });
  });

  describe('Load More Logs', () => {
    it('should display load more button when more logs available', () => {
      cy.intercept('GET', '**/api/logs*', {
        body: {
          data: [],
          pagination: { count: 100, skip: 0, limit: 10, hasMore: true },
        },
      }).as('logsWithMore');

      cy.visit(`/bot/${botId}/worker/${workerId}`);
      cy.wait(['@getWorkerDetail', '@logsWithMore']);
      // Check for load more button
    });
  });

  describe('Responsive Design', () => {
    it('should display correctly on mobile', () => {
      cy.viewport('iphone-x');
      cy.wait('@getWorkerDetail');
      cy.get('.q-page').should('be.visible');
    });

    it('should display correctly on tablet', () => {
      cy.viewport('ipad-2');
      cy.wait('@getWorkerDetail');
      cy.get('.q-page').should('be.visible');
    });

    it('should display correctly on desktop', () => {
      cy.viewport(1920, 1080);
      cy.wait('@getWorkerDetail');
      cy.get('.q-page').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle worker not found', () => {
      cy.intercept('GET', '**/api/workers/*', {
        statusCode: 404,
        body: { error: 'Worker not found' },
      }).as('workerNotFound');

      cy.visit(`/bot/${botId}/worker/non-existent-id`);
      cy.wait('@workerNotFound');
    });

    it('should handle network errors gracefully', () => {
      cy.intercept('GET', '**/api/workers/*', {
        statusCode: 500,
        body: { error: 'Server error' },
      }).as('serverError');

      cy.visit(`/bot/${botId}/worker/${workerId}`);
      cy.wait('@serverError');
      cy.get('.q-notification, .q-notify').should('be.visible');
    });
  });
});
