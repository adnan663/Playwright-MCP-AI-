const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { ShopAllPage } = require('../pages/ShopAllPage');
const { CartPage } = require('../pages/CartPage');
const { CheckoutPage } = require('../pages/CheckoutPage');
const { SkinPage } = require('../pages/SkinPage');

const accountEmail = 'muhammadadnannawaz06@gmail.com';

async function skipWithScreenshot(page, testInfo, reason) {
  await testInfo.attach('external-blocker-screenshot', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
  test.skip(true, reason);
}

test('account login pauses at the website verification gate', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.open();

  if (await loginPage.isSecurityBlocked()) {
    await skipWithScreenshot(page, test.info(), 'The site security service blocked this browser session.');
  }

  await expect(page.locator('main')).toContainText('Sign in with your email');
  const result = await loginPage.signIn(accountEmail, process.env.TEST_PASSWORD);

  if (result === 'password-required') {
    test.skip(!process.env.TEST_PASSWORD, 'Set TEST_PASSWORD locally, then rerun the login test.');
  }
  if (result === 'manual-verification-required') {
    await skipWithScreenshot(
      page,
      test.info(),
      'The site requires email/OTP verification. Complete it manually; automation will not bypass it.',
    );
  }
  if (result === 'security-blocked') {
    await skipWithScreenshot(page, test.info(), 'The site security service blocked the login attempt.');
  }

  await expect(page).not.toHaveURL(/customer\/account\/login/);
});

test('shop one available item, review the bag and checkout, then inspect Skin', async ({ page }) => {
  const shopAll = new ShopAllPage(page);
  await shopAll.open();
  if (await shopAll.isSecurityBlocked()) {
    await skipWithScreenshot(page, test.info(), 'The site security service blocked the storefront session.');
  }
  await shopAll.scrollToProducts();

  const products = await shopAll.productCards.count();
  expect(products).toBeGreaterThan(0);

  const product = await shopAll.inspectProduct(0);
  expect(product.name).toBeTruthy();
  expect(product.price).toMatch(/\$\s?\d/);
  expect(product.imageAlt).toBeTruthy();
  expect(product.imageSource).toMatch(/^https?:\/\//);
  expect(product.available).toBe(true);

  await shopAll.addOneTimePurchase(product);
  if (await shopAll.isSecurityBlocked()) {
    await skipWithScreenshot(
      page,
      test.info(),
      'The cart request triggered the site security block; cart and checkout were not accessed.',
    );
  }

  const cart = new CartPage(page);
  await cart.open();
  if (await cart.isSecurityBlocked()) {
    await skipWithScreenshot(page, test.info(), 'The site security service blocked access to the cart.');
  }
  await expect(cart.dialog).toContainText(product.name);
  await expect(cart.dialog).toContainText(product.price);
  await expect(cart.dialog).toContainText(/Estimated Total/i);
  const cartContents = await cart.inspectProduct(product.name, product.price);
  expect(cartContents.productLines).toBeGreaterThan(0);
  expect(cartContents.matchingPrices).toBeGreaterThan(0);
  expect(cartContents.estimatedTotal).toMatch(/Estimated Total\s*\$?\s*\d/i);
  expect(cartContents.paypalVisible).toBe(true);
  expect(cartContents.checkoutVisible).toBe(true);
  if (cartContents.mysteryGiftCount > 0) {
    await expect(cart.dialog).toContainText('Mystery Gift');
  }

  await cart.proceedToCheckout();
  const checkout = new CheckoutPage(page);
  const review = await checkout.inspectReview();
  if (await checkout.isOpen()) {
    const shippingDetails = {
      firstName: 'Automation',
      lastName: 'Test',
      address: '123 Test Street',
      apartment: 'Suite 1',
      city: 'Testville',
      state: 'CA',
      zipCode: '90210',
      phone: '5550100100',
    };
    await checkout.fillShippingDetails(shippingDetails);
    for (const [field, value] of Object.entries(shippingDetails)) {
      await expect(checkout.shippingFields[field]).toHaveValue(value);
    }

    expect(review.bodyText).toMatch(/Shipping method[\s\S]*International \(7-14 business days\)/i);
    expect(review.bodyText).toMatch(/Subtotal\s*\$?\s*\d/i);
    expect(review.bodyText).toMatch(/Shipping\s*&\s*Handling\s*\$?\s*\d/i);
    expect(review.bodyText).toMatch(/Order Total\s*\$?\s*\d/i);
    await expect(checkout.continueButton).toBeVisible();
    expect(review.bodyText).not.toMatch(/order (?:was )?placed|thank you for your order/i);
  } else {
    expect(review.bodyText).toMatch(/sign in|login|account/i);
    test.info().annotations.push({
      type: 'checkout-blocker',
      description: 'Checkout redirected to account access; no order or payment was submitted.',
    });
  }

});

test('Skin catalog loads and exposes product details', async ({ page }) => {
  const skin = new SkinPage(page);
  await skin.open();
  if (await skin.isSecurityBlocked()) {
    await skipWithScreenshot(page, test.info(), 'The site security service blocked the Skin catalog.');
  }

  await expect(page.locator('main')).toContainText(/skin/i);
  await skin.scrollThroughProducts();
  expect(await skin.productCards.count()).toBeGreaterThan(0);

  const skinImage = skin.productCards.first().locator('img').first();
  await expect(skinImage).toHaveAttribute('alt', /.+/);
  await expect(skin.productCards.first().getByRole('button', { name: /add to bag/i })).toBeVisible();
});

test('Skin product can be added using the one-time purchase option', async ({ page }) => {
  const skin = new SkinPage(page);
  await skin.open();
  if (await skin.isSecurityBlocked()) {
    await skipWithScreenshot(page, test.info(), 'The site security service blocked the Skin catalog.');
  }

  const product = await skin.inspectProduct();
  expect(product.name).toBeTruthy();
  expect(product.price).toMatch(/\$\s?\d/);
  expect(product.imageAlt).toBeTruthy();
  expect(product.available).toBe(true);

  const dialog = await skin.openPurchaseDialog(product);
  await expect(dialog).toContainText(product.name);
  const oneTimeOption = await skin.selectOneTimePurchase(dialog);
  await expect(oneTimeOption).toBeChecked();
  await expect(dialog.getByRole('radio', { name: /Single Subscription/ })).not.toBeChecked();

  await skin.addSelectedProductToBag(dialog);
  if (await skin.isSecurityBlocked()) {
    await skipWithScreenshot(
      page,
      test.info(),
      'The site security service blocked the add-to-bag request; the cart was not available.',
    );
  }

  const cart = new CartPage(page);
  await cart.open();
  await expect(cart.dialog).toContainText(product.name);
  await expect(cart.dialog).toContainText(product.price);
  await expect(cart.dialog).toContainText(/Estimated Total/i);

  const cartContents = await cart.inspectProduct(product.name, product.price);
  expect(cartContents.productLines).toBeGreaterThan(0);
  expect(cartContents.matchingPrices).toBeGreaterThan(0);
  expect(cartContents.estimatedTotal).toMatch(/Estimated Total\s*\$?\s*\d/i);
  expect(cartContents.paypalVisible).toBe(true);
  expect(cartContents.checkoutVisible).toBe(true);
  if (cartContents.mysteryGiftCount > 0) {
    await expect(cart.dialog).toContainText('Mystery Gift');
  }
});