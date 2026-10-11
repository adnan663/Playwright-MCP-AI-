const { BasePage } = require('./BasePage');

class ShopAllPage extends BasePage {
  constructor(page) {
    super(page);
    this.productCards = page.locator('main li.item.product.product-item');
  }

  async open() {
    await this.page.goto('/shop-all');
    await this.dismissObstructivePopups();
  }

  async scrollToProducts() {
    await this.productCards.first().scrollIntoViewIfNeeded();
    await this.productCards.nth(4).scrollIntoViewIfNeeded();
  }

  async inspectProduct(index) {
    const card = this.productCards.nth(index);
    const name = (await card.locator('.product-item-link').innerText()).trim();
    const price = (await card.locator('.price').first().innerText()).trim();
    const image = card.locator('img').first();
    const imageAlt = await image.getAttribute('alt');
    const imageSource = await image.getAttribute('src') || await image.getAttribute('data-src');
    const addButton = card.locator('button[title="Add to bag"]');

    return {
      card,
      name,
      price,
      imageAlt,
      imageSource,
      available: await addButton.isEnabled(),
      addButton,
    };
  }

  async addOneTimePurchase(product) {
    await this.dismissObstructivePopups();
    await product.addButton.click();
    const purchaseDialog = this.page.getByRole('dialog').filter({ hasText: 'One-Time Purchase' });
    await purchaseDialog.waitFor({ state: 'visible' });

    const oneTimeOption = purchaseDialog.getByRole('radio', { name: /Regular Price/ });
    if (!(await oneTimeOption.isChecked())) {
      await oneTimeOption.check();
    }

    const addResponse = this.page.waitForResponse(response =>
      response.url().includes('/checkout/cart/add/'),
    );
    const navigation = this.page.waitForNavigation({
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    }).catch(() => null);
    await purchaseDialog.getByRole('button', { name: /add to bag/i }).click();
    await addResponse;
    await navigation;
    return purchaseDialog;
  }
}

module.exports = { ShopAllPage };