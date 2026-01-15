// ***********************************************
// Custom commands for BotCRUD application testing
// ***********************************************

// Mock API responses
Cypress.Commands.add('mockApi', () => {
  // Mock bots endpoint
  cy.intercept('GET', '**/api/bots*', {
    fixture: 'bots.json',
  }).as('getBots');

  // Mock workers endpoint
  cy.intercept('GET', '**/api/workers*', {
    fixture: 'workers.json',
  }).as('getWorkers');

  // Mock logs endpoint
  cy.intercept('GET', '**/api/logs*', {
    fixture: 'logs.json',
  }).as('getLogs');

  // Mock single bot endpoint
  cy.intercept('GET', '**/api/bots/*', {
    fixture: 'bot-detail.json',
  }).as('getBotDetail');

  // Mock single worker endpoint
  cy.intercept('GET', '**/api/workers/*', {
    fixture: 'worker-detail.json',
  }).as('getWorkerDetail');

  // Mock create/update/delete operations
  cy.intercept('POST', '**/api/bots', { statusCode: 201, body: { id: 'new-bot-id' } }).as('createBot');
  cy.intercept('PUT', '**/api/bots/*', { statusCode: 200 }).as('updateBot');
  cy.intercept('DELETE', '**/api/bots/*', { statusCode: 200 }).as('deleteBot');

  cy.intercept('POST', '**/api/workers', { statusCode: 201, body: { id: 'new-worker-id' } }).as('createWorker');
  cy.intercept('PUT', '**/api/workers/*', { statusCode: 200 }).as('updateWorker');
  cy.intercept('DELETE', '**/api/workers/*', { statusCode: 200 }).as('deleteWorker');

  cy.intercept('POST', '**/api/logs', { statusCode: 201, body: { id: 'new-log-id' } }).as('createLog');
  cy.intercept('DELETE', '**/api/logs/*', { statusCode: 200 }).as('deleteLog');
});

// Wait for page to fully load
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('.q-page').should('be.visible');
  cy.get('.q-spinner', { timeout: 10000 }).should('not.exist');
});

// Check if element is visible with text
Cypress.Commands.add('shouldBeVisibleWithText', { prevSubject: 'element' }, (subject, text) => {
  cy.wrap(subject).should('be.visible').and('contain.text', text);
});

// Click and wait for navigation
Cypress.Commands.add('clickAndWaitForNavigation', (route: string) => {
  cy.url().then((currentUrl) => {
    cy.get('body').click();
    cy.url().should('include', route);
  });
});

// Export empty object to make this a module
export {};
