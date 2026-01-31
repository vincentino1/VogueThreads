// Karma configuration with CI-friendly Chrome launcher and optional Puppeteer fallback
module.exports = function (config) {
  // Detect CI and set a safer default browser + run mode
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true' || process.env.GITLAB_CI === 'true';

  // Optional: try to set CHROME_BIN from Puppeteer if available (helps when Chrome isn't installed in CI)
  try {
    if (!process.env.CHROME_BIN) {
      // Lazy require to avoid forcing puppeteer on local dev
      const puppeteer = require('puppeteer');
      process.env.CHROME_BIN = puppeteer.executablePath();
    }
  } catch (e) {
    // Puppeteer not installed; rely on system Chrome/Chromium and/or CI image to provide CHROME_BIN
  }

  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma'),
    ],
    client: {
      jasmine: {},
      clearContext: false,
    },
    jasmineHtmlReporter: {
      suppressAll: true,
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/voguethreads'),
      subdir: '.',
      reporters: [{ type: 'html' }, { type: 'text-summary' }],
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,

    // In CI we don't want file watching; ensure a single run exits
    autoWatch: !isCI,
    singleRun: isCI,

    // Define a Chrome launcher that works in many containerized CI environments
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-software-rasterizer',
          '--remote-debugging-port=9222',
        ],
      },
    },

    // Use CI-safe launcher when running in CI, otherwise the default headless Chrome
    browsers: [isCI ? 'ChromeHeadlessNoSandbox' : 'ChromeHeadless'],

    // CI stability tweaks
    browserNoActivityTimeout: 60000,
    browserDisconnectTimeout: 10000,
    browserDisconnectTolerance: 2,

    restartOnFileChange: true,
  });
};

