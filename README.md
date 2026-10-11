# SpoiledChild Playwright POM

JavaScript UI automation using Playwright Test and the Page Object Model.

## Setup

```powershell
npm install
npx playwright install chromium
```

Set `TEST_PASSWORD` in the ignored `.env` file only if a password prompt is presented. Never commit `.env`. The current site begins with email-based sign-in and may require a one-time verification step; the test stops there for manual completion.

## Run

```powershell
npm test
```

The storefront test adds one product using its one-time purchase option, reviews the cart and checkout without submitting an order, and inspects the Skin catalog. Failure screenshots and traces are saved under `test-results/`.