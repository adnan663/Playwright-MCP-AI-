const { BasePage } = require('./BasePage');

class CartPage extends BasePage {
  constructor(page) {
    super(page);
    this.cartLink = page.getByRole('link', { name: 'My Cart' });
  }

  async open() {
    await this.cartLink.click();
    this.dialog = this.page.getByRole('dialog').filter({ hasText: 'Your Bag' });
    await this.dialog.waitFor({ state: 'visible' });
  }

  async getSubtotalText() {
    return this.dialog.getByText(/Estimated Total/i).locator('..').innerText();
  }

  async inspectProduct(productName, price) {
    return {
      productLines: await this.dialog.getByText(productName, { exact: true }).count(),
      matchingPrices: await this.dialog.getByText(price, { exact: true }).count(),
      estimatedTotal: await this.getSubtotalText(),
      mysteryGiftCount: await this.dialog.getByText('Mystery Gift', { exact: true }).count(),
      paypalVisible: await this.dialog.getByRole('button', { name: /paypal/i }).isVisible(),
      checkoutVisible: await this.dialog.getByRole('button', { name: /checkout/i }).isVisible(),
    };
  }

  async proceedToCheckout() {
    await this.dialog.getByRole('button', { name: 'Checkout' }).click();
  }
}

module.exports = { CartPage };