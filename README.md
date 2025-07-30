# 💜 Rawly — BrowserStack Slack Reporter

A Cypress plugin that sends test results from BrowserStack directly to your Slack channel, with a twist of personality.  
Built for teams who want clear feedback *and* a little sass.  
**Rawly says**: _"If it passed — great. If it failed — I’m telling everyone."_  

---

## ✨ Features

- Aggregated BrowserStack test run stats
- Flaky test detection and visual breakdown
- Quotes with attitude (via `rawlyQuotes.js`)
- Test status: passed / failed / skipped
- Slack message with build URL, project name, branch, environment

---

## 📁 File Structure

```
├── index.js              # Main plugin logic
├── rawlyQuotes.js        # Spicy / geeky / success quotes
├── rawly.png             # Avatar for Rawly
├── README.md             # You're here!
└── LICENSE               # MIT
```

---

## ⚙️ Usage

1. Copy `index.js` and `rawlyQuotes.js` into your Cypress plugins folder (e.g. `cypress/plugins/`)
2. Add your Slack webhook URL to `index.js`:
   ```js
   const webhookUrl = new URL('YOUR_WEBHOOK_URL', import.meta.url); // replace with your own
   ```
3. Ensure your `cypress.config.js` is wired to call Rawly:

   ```js
   const { defineConfig } = require('cypress');

   module.exports = defineConfig({
     e2e: {
       setupNodeEvents(on, config) {
         return require('./cypress/plugins/index.js')(on, config);
       },
       // ...rest of your config
     }
   });
   ```

---

## 🧠 Assumptions

This plugin relies on the following:

- A valid `browserstack.json` file with fields:
  ```json
  {
    "browsers": [
      {
        "os": "OS X Ventura",
        "browser": "chrome",
        "versions": ["latest"]
      }
    ],
    "run_settings": {
      "project_name": "YOUR_PROJECT_NAME",
      "build_name": "main branch tests",
      "env": {
        "BRANCH_NAME": "main"
      }
    }
  }
  ```

- You are using [BrowserStack Cypress CLI](https://www.browserstack.com/docs/automate/cypress/cli-installation)

---

## 📣 Slack Notification Example

Rawly’s messages include:

- ✅ Build status: passed / failed
- 🧪 Flaky test count (if any)
- 🔗 Build URL
- 🏷 Project name & branch
- 💬 Random Rawly quote (she’s got opinions)

---

## 🧪 Quote Customization

Quotes are stored in `rawlyQuotes.js` and grouped by:

- `spicyQuotes`
- `geekyFacts`
- `successQuotes`

Feel free to add your own 🔥. Rawly *lives* for drama.

---

## 📜 License

[MIT](./LICENSE) — raw, free, and open-source.  
Because feedback should be loud, honest, and a little flirty.

---

> _Run me raw._  
> — Rawly 💋

---

![Rawly avatar](./rawly.png)
