class BasePage {
  constructor(page) {
    this.page = page;
  }

  async dismissObstructivePopups() {
    const promo = this.page.getByRole('dialog', { name: 'POPUP Form' });
    if (await promo.isVisible().catch(() => false)) {
      const closeButton = promo.getByRole('button', { name: 'Close dialog' });
      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click();
      }
    }

    const cookieDialog = this.page.getByRole('dialog', { name: /cookie|consent/i });
    if (await cookieDialog.isVisible().catch(() => false)) {
      const dismissButton = cookieDialog.getByRole('button', {
        name: /accept|reject|close|dismiss/i,
      }).first();
      if (await dismissButton.isVisible().catch(() => false)) {
        await dismissButton.click();
      }
    }
  }

  async isSecurityBlocked() {
    return this.page.getByRole('heading', {
      name: /Sorry, you have been blocked|unable to access/i,
    }).first().isVisible().catch(() => false);
  }
}

module.exports = { BasePage };