const { BasePage } = require('./BasePage');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.emailForm = page.locator('#passwordless-login-form');
    this.emailInput = this.emailForm.locator('input[type="email"]');
    this.continueButton = this.emailForm.getByRole('button', { name: /continue/i });
  }

  async open() {
    await this.page.goto('/customer/account/login/');
    await this.dismissObstructivePopups();
  }

  async signIn(email, password) {
    await this.emailInput.fill(email);

    const passwordInput = this.page.locator('input[type="password"]:visible').first();
    if (await passwordInput.isVisible().catch(() => false)) {
      if (!password) {
        return 'password-required';
      }
      await passwordInput.fill(password);
      await this.page.locator('button[type="submit"]:visible').last().click();

      if (await this.isSecurityBlocked()) {
        return 'security-blocked';
      }

      const verificationGate = this.page.getByText(
        /verification code|one-time passcode|check your email|enter.*code|captcha/i,
      ).first();
      if (await verificationGate.isVisible().catch(() => false)) {
        return 'manual-verification-required';
      }

      return 'authentication-submitted';
    }

    return 'manual-verification-required';
  }
}

module.exports = { LoginPage };