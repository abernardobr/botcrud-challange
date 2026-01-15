/// <reference types="cypress" />

describe('ErrorNotFound Page', () => {
  beforeEach(() => {
    cy.visit('/non-existent-page-12345');
  });

  describe('Page Layout', () => {
    it('should display the 404 error code', () => {
      cy.contains('404').should('be.visible');
    });

    it('should display error message', () => {
      cy.get('.text-h4').should('be.visible');
    });

    it('should display home button', () => {
      cy.get('.q-btn').should('be.visible');
      cy.get('.q-btn').should('contain.text', 'Home');
    });

    it('should have home icon on button', () => {
      cy.get('.q-btn .q-icon').should('exist');
    });
  });

  describe('Navigation', () => {
    it('should navigate to home when clicking home button', () => {
      cy.get('.q-btn').click();
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });
  });

  describe('Styling', () => {
    it('should center content on page', () => {
      cy.get('.q-page').should('have.class', 'flex-center');
    });

    it('should have large 404 text', () => {
      cy.get('.text-h1').should('be.visible');
      cy.get('.text-h1').should('contain.text', '404');
    });
  });

  describe('Responsive Design', () => {
    it('should display correctly on mobile', () => {
      cy.viewport('iphone-x');
      cy.contains('404').should('be.visible');
      cy.get('.q-btn').should('be.visible');
    });

    it('should display correctly on tablet', () => {
      cy.viewport('ipad-2');
      cy.contains('404').should('be.visible');
      cy.get('.q-btn').should('be.visible');
    });

    it('should display correctly on desktop', () => {
      cy.viewport(1920, 1080);
      cy.contains('404').should('be.visible');
      cy.get('.q-btn').should('be.visible');
    });
  });

  describe('Various Invalid Routes', () => {
    it('should show 404 for random route', () => {
      cy.visit('/random-invalid-route');
      cy.contains('404').should('be.visible');
    });

    it('should show 404 for invalid bot id', () => {
      cy.visit('/bot/invalid-bot-xyz-123/invalid');
      cy.contains('404').should('be.visible');
    });

    it('should show 404 for deeply nested invalid route', () => {
      cy.visit('/a/b/c/d/e/f/g');
      cy.contains('404').should('be.visible');
    });

    it('should show 404 for route with special characters', () => {
      cy.visit('/page%20with%20spaces');
      cy.contains('404').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      cy.get('.text-h1').should('exist');
      cy.get('.text-h4').should('exist');
    });

    it('should have accessible button', () => {
      cy.get('.q-btn').should('be.visible');
      cy.get('.q-btn').should('not.be.disabled');
    });
  });
});
