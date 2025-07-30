const https = require('https');
const fs = require('fs');
const path = require('path');
const createEsbuildPlugin = require('@bahmutov/cypress-esbuild-preprocessor');
const rawlyQuotes = require('./rawlyQuotes');

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

module.exports = (on, config) => {
  console.log('index.js plugin loaded');

  on('file:preprocessor', createEsbuildPlugin());

  on('after:run', async (results) => {
    console.log('after:run worked!');
    console.log('results:', JSON.stringify(results, null, 2));

    const startTime = new Date(results.startedTestsAt);
    const endTime = new Date(results.endedTestsAt);
    const durationMs = endTime - startTime;
    const durationStr = new Date(durationMs).toISOString().substr(11, 8);
    const startedAtStr = startTime.toISOString().replace('T', ' ').replace('Z', ' UTC').replace(/\.\d{3}/, '');

    const totalPassed = results.runs.reduce((sum, run) => sum + run.stats.passes, 0);
    const totalFailed = results.runs.reduce((sum, run) => sum + run.stats.failures, 0);
    const totalTests = totalPassed + totalFailed;
    const allPassed = totalFailed === 0;
    const emoji = allPassed ? '🟢' : '🔴';

    const projectName = 'YOUR_PROJECT_NAME';
    const branch = config.env.BRANCH_NAME || process.env.BRANCH_NAME || 'unknown';
    const buildUrl = process.env.BUILD_URL || results.buildUrl || 'https://automate.browserstack.com/dashboard';

    const bsConfigPath = path.resolve(__dirname, '../../browserstack.json');
    let buildName = 'Unnamed Build';
    let environmentText = 'unknown';
    const deviceName = config.env.DEVICE_NAME || process.env.DEVICE_NAME || '';

    try {
      const bsConfigRaw = fs.readFileSync(bsConfigPath, 'utf-8');
      const bsConfig = JSON.parse(bsConfigRaw);
      buildName = bsConfig.run_settings?.build_name || buildName;

      const browsers = bsConfig.browsers || [];
      if (browsers.length > 0) {
        const envDescriptions = browsers.map(b => {
          const version = b.versions?.[0] || 'latest';
          const os = b.os || '';
          const browser = b.browser || '';
          const device = b.device || '';
          return device ? `${device} on ${os}` : `${browser} (${version}) on ${os}`;
        });
        environmentText = envDescriptions.join(', ');
      }
    } catch (e) {
      console.warn('Failed to read browserstack.json:', e.message);
    }

    const flakyTests = [];
    results.runs.forEach(run => {
      run.tests.forEach(test => {
        const attempts = test.attempts || [];
        if (attempts.length > 1 && test.state === 'passed') {
          flakyTests.push({
            title: test.title.join(' → '),
            retries: attempts.length - 1
          });
        }
      });
    });

    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${emoji} Cypress Test Results — ${projectName}`,
          emoji: true
        }
      },
      { type: "divider" },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            `📦 *Project:* YOUR_PROJECT_NAME\n` +
            `🧪 *Build:* ${buildName}\n` +
            `🌿 *Branch:* ${branch}\n` +
            `🖥️ *Environment:* ${environmentText}` +
            (deviceName ? `\n📱 *Device:* ${deviceName}` : '')
        }
      },
      { type: "divider" },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `🔮 *Total:* ${totalTests}   ✅ *Passed:* ${totalPassed}   ❌ *Failed:* ${totalFailed}`
        }
      }
    ];

    if (flakyTests.length > 0) {
      const flakyPercent = ((flakyTests.length / totalPassed) * 100).toFixed(1);
      const flakyEmoji = flakyPercent >= 25 ? '🔴' : flakyPercent >= 15 ? '🟡' : '🟢';

      const percentValue = Math.min(100, parseFloat(flakyPercent));
      const graphBars = Math.round(percentValue / 5);
      const graph = '▮'.repeat(graphBars) + '▯'.repeat(20 - graphBars);

      blocks.push(
        { type: "divider" },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text:
              `${flakyEmoji} *Flaky tests:* ${flakyTests.length} (${flakyPercent}%)\n` +
              `\`${graph}\``
          }
        }
      );
    }

    const quote = allPassed
      ? getRandom(rawlyQuotes.successQuotes)
      : Math.random() < 0.5
        ? getRandom(rawlyQuotes.spicyQuotes)
        : getRandom(rawlyQuotes.geekyFacts);

    blocks.push(
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:wink: *Rawly says:*\n> ${quote}`
        }
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `🕒 *Started at:* ${startedAtStr}   ⏱ *Duration:* ${durationStr}`
          }
        ]
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "🔎 Open Build",
              emoji: true
            },
            url: buildUrl
          }
        ]
      }
    );

    const payload = JSON.stringify({ username: "Rawly", blocks });

    const webhookUrl = new URL('YOUR_WEBHOOK_URL', import.meta.url); // insert yours here

    const options = {
      hostname: webhookUrl.hostname,
      path: webhookUrl.pathname + webhookUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    console.log('Sending a Slack notification...');

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        console.log(`Slack webhook status: ${res.statusCode}`);
        res.on('data', (d) => console.log('Slack\'s response:', d.toString()));
        res.on('end', resolve);
      });

      req.on('error', (error) => {
        console.error('Slack webhook error: ', error);
        reject(error);
      });

      req.write(payload);
      req.end();
    });
  });
};
