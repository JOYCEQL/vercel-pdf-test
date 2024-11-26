import chromium from 'chrome-aws-lambda';

export default async function handler(req, res) {
  try {
    const options = process.env.AWS_REGION
      ? {
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath,
          headless: chromium.headless,
        }
      : {
          args: [],
          executablePath: process.env.CHROME_EXECUTABLE_PATH,
          headless: true,
        };

    const browser = await chromium.puppeteer.launch(options);
    const page = await browser.newPage();
    
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC&display=swap');
            body {
              font-family: 'Noto Sans SC', sans-serif;
              margin: 20px;
            }
          </style>
        </head>
        <body>
          ${req.body.content}
        </body>
      </html>
    `);

    // Wait for fonts to load
    await page.evaluateHandle('document.fonts.ready');

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=document.pdf');
    res.send(pdf);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'PDF generation failed' });
  }
}