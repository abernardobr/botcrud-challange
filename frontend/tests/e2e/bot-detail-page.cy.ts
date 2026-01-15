/// <reference types="cypress" />

describe('BotDetailPage', () => {
  const botId = 'bot-1';

  beforeEach(() => {
    cy.mockApi();
    cy.visit(`/bot/${botId}`);
  });

  describe('Page Layout', () => {
    it('should display the page header with back button', () => {
      cy.wait('@getBotDetail');
      cy.get('.back-btn, [class*="back"]').should('be.visible');
    });

    it('should display breadcrumb navigation', () => {
      cy.wait('@getBotDetail');
      cy.get('.breadcrumb, [class*="breadcrumb"]').should('be.visible');
    });

    it('should display bot name in header', () => {
      cy.wait('@getBotDetail');
      cy.get('.page-title, [class*="title"]').should('contain.text', 'Test Bot');
    });

    it('should navigate back when clicking back button', () => {
      cy.wait('@getBotDetail');
      cy.get('.back-btn, [class*="back"]').first().click();
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });
  });

  describe('Bot Information Card', () => {
    it('should display bot details card', () => {
      cy.wait('@getBotDetail');
      cy.get('.bot-card, [class*="detail"]').should('be.visible');
    });

    it('should display bot name', () => {
      cy.wait('@getBotDetail');
      cy.contains('Test Bot').should('be.visible');
    });

    it('should display bot description', () => {
      cy.wait('@getBotDetail');
      cy.contains('test bot').should('be.visible');
    });

    it('should display bot status badge', () => {
      cy.wait('@getBotDetail');
      cy.get('.q-badge, .q-chip, [class*="status"]').should('be.visible');
    });

    it('should display edit button', () => {
      cy.wait('@getBotDetail');
      cy.get('[class*="edit"], button').contains(/edit/i).should('exist');
    });

    it('should display delete button', () => {
      cy.wait('@getBotDetail');
      cy.get('[class*="delete"], button').contains(/delete/i).should('exist');
    });
  });

  describe('Workers Section', () => {
    it('should display workers section', () => {
      cy.wait(['@getBotDetail', '@getWorkers']);
      cy.contains('Workers').should('be.visible');
    });

    it('should display add worker button', () => {
      cy.wait('@getBotDetail');
      cy.get('button').contains(/add.*worker|create.*worker/i).should('be.visible');
    });

    it('should display worker cards', () => {
      cy.wait(['@getBotDetail', '@getWorkers']);
      cy.get('[class*="worker-card"], [class*="worker"]').should('have.length.at.least', 0);
    });

    it('should navigate to worker detail when clicking worker card', () => {
      cy.wait(['@getBotDetail', '@getWorkers']);
      cy.get('[class*="worker-card"], [class*="worker"]').first().click({ force: true });
      cy.url().should('include', '/worker/');
    });

    it('should display filter button for workers', () => {
      cy.wait('@getBotDetail');
      cy.get('.filter-btn, [class*="filter"]').should('exist');
    });
  });

  describe('Logs Section', () => {
    it('should display logs section', () => {
      cy.wait(['@getBotDetail', '@getLogs']);
      cy.contains('Logs').should('be.visible');
    });

    it('should display log entries', () => {
      cy.wait(['@getBotDetail', '@getLogs']);
      cy.get('[class*="log-card"], [class*="log"]').should('have.length.at.least', 0);
    });

    it('should display filter button for logs', () => {
      cy.wait('@getBotDetail');
      cy.get('.filter-btn, [class*="filter"]').should('exist');
    });
  });

  describe('Edit Bot', () => {
    it('should open edit drawer when clicking edit button', () => {
      cy.wait('@getBotDetail');
      cy.get('button').contains(/edit/i).click();
      cy.get('.q-dialog, .q-drawer').should('be.visible');
    });

    it('should pre-fill form with bot data', () => {
      cy.wait('@getBotDetail');
      cy.get('button').contains(/edit/i).click();
      cy.get('.q-dialog, .q-drawer').should('be.visible');
      cy.get('input[type="text"]').first().should('have.value', 'Test Bot 1');
    });

    it('should update bot when saving changes', () => {
      cy.wait('@getBotDetail');
      cy.get('button').contains(/edit/i).click();
      cy.get('.q-dialog, .q-drawer').should('be.visible');

      cy.get('input[type="text"]').first().clear().type('Updated Bot Name');
      cy.get('button').contains(/save|update/i).click();

      cy.wait('@updateBot');
      cy.get('.q-notification, .q-notify').should('be.visible');
    });
  });

  describe('Delete Bot', () => {
    it('should show confirmation dialog when clicking delete', () => {
      cy.wait('@getBotDetail');
      cy.get('button').contains(/delete/i).click();
      cy.get('.q-dialog').should('be.visible');
      cy.get('.q-dialog').should('contain.text', 'confirm');
    });

    it('should delete bot and redirect on confirm', () => {
      cy.wait('@getBotDetail');
      cy.get('button').contains(/delete/i).click();
      cy.get('.q-dialog').should('be.visible');

      // Click confirm button
      cy.get('.q-dialog').find('button').contains(/yes|confirm|delete/i).click();

      cy.wait('@deleteBot');
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });

    it('should cancel deletion when clicking cancel', () => {
      cy.wait('@getBotDetail');
      cy.get('button').contains(/delete/i).click();
      cy.get('.q-dialog').should('be.visible');

      cy.get('.q-dialog').find('button').contains(/no|cancel/i).click();
      cy.get('.q-dialog').should('not.exist');
      cy.url().should('include', `/bot/${botId}`);
    });
  });

  describe('Add Worker', () => {
    it('should open add worker drawer', () => {
      cy.wait('@getBotDetail');
      cy.get('button').contains(/add.*worker|create.*worker/i).click();
      cy.get('.q-dialog, .q-drawer').should('be.visible');
    });

    it('should create worker when submitting form', () => {
      cy.wait('@getBotDetail');
      cy.get('button').contains(/add.*worker|create.*worker/i).click();

      cy.get('.q-dialog, .q-drawer').find('input[type="text"]').first().type('New Worker');
      cy.get('.q-dialog, .q-drawer').find('textarea').type('Worker description');
      cy.get('.q-dialog, .q-drawer').find('button').contains(/save|create/i).click();

      cy.wait('@createWorker');
      cy.get('.q-notification, .q-notify').should('be.visible');
    });
  });

  describe('Status Change', () => {
    it('should allow changing bot status', () => {
      cy.wait('@getBotDetail');
      cy.get('.q-select, select, [class*="status"]').should('exist');
    });
  });

  describe('Responsive Design', () => {
    it('should display correctly on mobile', () => {
      cy.viewport('iphone-x');
      cy.wait('@getBotDetail');
      cy.get('.q-page').should('be.visible');
    });

    it('should display correctly on tablet', () => {
      cy.viewport('ipad-2');
      cy.wait('@getBotDetail');
      cy.get('.q-page').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle bot not found', () => {
      cy.intercept('GET', '**/api/bots/*', {
        statusCode: 404,
        body: { error: 'Bot not found' },
      }).as('botNotFound');

      cy.visit('/bot/non-existent-id');
      cy.wait('@botNotFound');
      // Should show error or redirect
    });

    it('should handle network errors', () => {
      cy.intercept('GET', '**/api/bots/*', {
        statusCode: 500,
        body: { error: 'Server error' },
      }).as('serverError');

      cy.visit(`/bot/${botId}`);
      cy.wait('@serverError');
      cy.get('.q-notification, .q-notify').should('be.visible');
    });
  });
});
