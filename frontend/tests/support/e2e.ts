// ***********************************************************
// This file is processed and loaded automatically before your test files.
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import './commands';

// Prevent TypeScript errors when accessing Cypress globals
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to intercept API calls and mock responses
       */
      mockApi(): Chainable<void>;

      /**
       * Custom command to wait for page to fully load
       */
      waitForPageLoad(): Chainable<void>;

      /**
       * Custom command to check if element is visible and contains text
       */
      shouldBeVisibleWithText(text: string): Chainable<Element>;

      /**
       * Custom command to click and wait for navigation
       */
      clickAndWaitForNavigation(route: string): Chainable<void>;
    }
  }
}

// Handle uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // on uncaught exceptions from the application
  console.log('Uncaught exception:', err.message);
  return false;
});

// Log all XHR requests for debugging
Cypress.on('window:before:load', (win) => {
  cy.spy(win.console, 'log').as('consoleLog');
  cy.spy(win.console, 'error').as('consoleError');
});
