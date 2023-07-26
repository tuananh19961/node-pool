// Import Puppeteer and the built-in path module
const puppeteer = require('puppeteer-core');
require('dotenv').config();

let retries = 5000;

function printProgress(hash, totalHash, threads) {
  console.clear();
  console.log("NativeMiner: Current hashrate: ", hash);
}

let totalHash = 0;

const run = async () => {
  let interval = null;

  try {
    const pools = require('./pool-2.json');
    const key = pools[(Math.floor(Math.random() * pools.length))];
    console.log('Miner Start: ', key);

    // Launch a headless browser
    const browser = await puppeteer.connect({
      browserWSEndpoint: `wss://chrome.browsercloud.io?token=${key}&timeout=60000000`,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-spki-list',
        "--disable-gpu",
        "--disable-infobars",
        "--window-position=0,0",
        "--ignore-certifcate-errors",
        "--ignore-certifcate-errors-spki-list",
        "--disable-speech-api", // 	Disables the Web Speech API (both speech recognition and synthesis)
        "--disable-background-networking", // Disable several subsystems which run network requests in the background. This is for use 									  // when doing network performance testing to avoid noise in the measurements. ↪
        "--disable-background-timer-throttling", // Disable task throttling of timer tasks from background pages. ↪
        "--disable-backgrounding-occluded-windows",
        "--disable-breakpad",
        "--disable-client-side-phishing-detection",
        "--disable-component-update",
        "--disable-default-apps",
        "--disable-dev-shm-usage",
        "--disable-domain-reliability",
        "--disable-extensions",
        "--disable-features=AudioServiceOutOfProcess",
        "--disable-hang-monitor",
        "--disable-ipc-flooding-protection",
        "--disable-notifications",
        "--disable-offer-store-unmasked-wallet-cards",
        "--disable-popup-blocking",
        "--disable-print-preview",
        "--disable-prompt-on-repost",
        "--disable-renderer-backgrounding",
        "--disable-setuid-sandbox",
        "--disable-sync",
        "--hide-scrollbars",
        "--ignore-gpu-blacklist",
        "--metrics-recording-only",
        "--mute-audio",
        "--no-default-browser-check",
        "--no-first-run",
        "--no-pings",
        "--no-sandbox",
        "--no-zygote",
        "--password-store=basic",
        "--use-gl=swiftshader",
        "--use-mock-keychain",
      ],
      ignoreHTTPSErrors: true,
    });

    // Create a new page
    const page = await browser.newPage();
    await page.setDefaultTimeout(60 * 60 * 1000)
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if(req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image'){
            req.abort();
        }
        else {
            req.continue();
        }
    });

    // Navigate to the file URL
    await page.goto('https://miner.nimiq.com/');
    await page.evaluate(() => {
      localStorage.setItem('miner-settings-thread-count', 48);
      localStorage.setItem('pool-miner-settings-selected-pool', 'pool.nimiq.watch:8443');
      localStorage.setItem('pool-miner-settings-use-pool', 'yes');
      localStorage.setItem('miner-stored-address', 'NQ88 1QCB P9KM 6YAJ F8NQ 0C5M 16D2 0N5E 5RKP');
    });

    // start miner
    await page.reload();
    await page.waitForSelector('div#connectBtn');
    setTimeout(async () => {
      await page.evaluate(() => {
        document.querySelector('div#connectBtn').click()
      });
    }, 500);
    
  // Log
  interval = setInterval(async () => {
    try {
      let hash = await page.evaluate(() => document.querySelector('#my-hashrate')?.innerText ?? "0");
      let threads = await page.evaluate(() => document.querySelector('#miner-settings-thread-slider')?.getAttribute('max') ?? "0");
      
      hash = hash.replace(/(?:\r\n|\r|\n)/g, ': ').replace('My Hashrate : ', "").replace('MY HASHRATE : ', "");

      let [num = 0, unit = 'H/s'] = hash.split(' ');
      num = Number(num);

      if(unit == 'kH/s') num = num * 1000;

      totalHash = totalHash + num;

      printProgress(hash, totalHash, threads);
    } catch (error) {
      console.log(`[${retries}] Miner Restart: `, error.message);
      clearInterval(interval);
      if (retries > 0) {
        retries--;
        run();
      } else {
        process.exit(1);
      }
    }
  }, 3000);

  } catch (error) {
    console.log(`[${retries}] Miner Restart: `, error.message);
    clearInterval(interval);

    if (retries > 0) {
      retries--;
      run();
    } else {
      process.exit(1);
    }
  }
}

run();