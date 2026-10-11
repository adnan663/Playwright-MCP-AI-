const { BasePage } = require('./BasePage');

class SkinPage extends BasePage {
  constructor(page) {
    super(page);
    this.productCards = page.locator('main li.item.product.product-item');
  }

  async open() {
    await this.page.goto('/skin');
    await this.dismissObstructivePopups();
  }

  async scrollThroughProducts() {
    await this.productCards.first().scrollIntoViewIfNeeded();
    await this.productCards.nth(4).scrollIntoViewIfNeeded();
  }

  async inspectProduct(index = 0) {
    const card = this.productCards.nth(index);
    const addButton = card.locator('button[title="Add to bag"]');

    return {
      card,
      name: (await card.locator('.product-item-link').innerText()).trim(),
      price: (await card.locator('.price').first().innerText()).trim(),
      imageAlt: await card.locator('img').first().getAttribute('alt'),
      available: await addButton.isEnabled(),
      addButton,
    };
  }

  async openPurchaseDialog(product) {
    await this.dismissObstructivePopups();
    await product.addButton.click();

    const dialog = this.page.getByRole('dialog').filter({ hasText: 'One-Time Purchase' });
    await dialog.waitFor({ state: 'visible' });
    return dialog;
  }

  async selectOneTimePurchase(dialog) {
    const oneTimeOption = dialog.getByRole('radio', { name: /Regular Price/ });
    if (!(await oneTimeOption.isChecked())) {
      await oneTimeOption.check();
    }
    return oneTimeOption;
  }

  async addSelectedProductToBag(dialog) {
    await this.dismissObstructivePopups();

    const addResponse = this.page.waitForResponse(response =>
      response.url().includes('/checkout/cart/add/'),
    );
    const navigation = this.page.waitForNavigation({
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    }).catch(() => null);

    await dialog.getByRole('button', { name: /add to bag/i }).click();
    await addResponse;
    await navigation;
  }
}

module.exports = { SkinPage };