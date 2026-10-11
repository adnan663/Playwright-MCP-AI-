const { BasePage } = require('./BasePage');

class CheckoutPage extends BasePage {
  constructor(page) {
    super(page);
    this.shippingFields = {
      firstName: page.getByPlaceholder('First Name'),
      lastName: page.getByPlaceholder('Last Name'),
      address: page.getByPlaceholder('Address'),
      apartment: page.getByPlaceholder('Apt/Floor/Suite'),
      city: page.getByPlaceholder('City'),
      state: page.getByPlaceholder('State'),
      zipCode: page.getByPlaceholder('ZIP code'),
      phone: page.getByPlaceholder('Phone'),
    };
    this.continueButton = page.getByRole('button', { name: /continue to final step/i });
  }

  async isOpen() {
    return this.page.url().includes('/checkout');
  }

  async fillShippingDetails(details) {
    for (const [field, value] of Object.entries(details)) {
      await this.shippingFields[field].fill(value);
    }
  }

  async inspectReview() {
    return {
      url: this.page.url(),
      title: await this.page.title(),
      fields: await this.page.locator('input:visible, select:visible').count(),
      bodyText: (await this.page.locator('body').innerText()).slice(0, 5000),
    };
  }
}

module.exports = { CheckoutPage };