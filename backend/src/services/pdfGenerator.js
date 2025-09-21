const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const path = require('path');
const fs = require('fs');

class PDFGenerator {
  constructor() {
    this.templatesPath = path.join(__dirname, '../templates');
  }

  async generateGatePassPDF(movementData) {
    try {
      // Load the HTML template
      const templatePath = path.join(this.templatesPath, 'gate-pass.hbs');
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      const template = handlebars.compile(templateSource);

      // Prepare data for the template
      const templateData = {
        ...movementData,
        generatedAt: new Date().toLocaleString('en-PK', { 
          timeZone: 'Asia/Karachi',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        companyName: 'Pakasian Foods Ltd',
        companyAddress: 'Industrial Area, Karachi, Pakistan',
        companyPhone: '+92-21-1234567',
        companyEmail: 'info@pakasian.com'
      };

      // Generate HTML from template
      const html = template(templateData);

      // Launch Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });

      await browser.close();

      return pdfBuffer;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate gate pass PDF');
    }
  }

  async generateGatePassFromMovementId(movementId) {
    try {
      const { runQuery } = require('../config/database');
      
      // Fetch movement data with related information
      const result = await runQuery(`
        SELECT 
          sm.*,
          p.name as product_name,
          p.sku as product_sku,
          p.batch_number as product_batch,
          p.expiry_date,
          w.name as warehouse_name,
          w.location as warehouse_location,
          u.name as gatekeeper_name
        FROM stock_movements sm
        JOIN products p ON sm.product_id = p.id
        JOIN warehouses w ON sm.warehouse_id = w.id
        JOIN users u ON sm.created_by = u.id
        WHERE sm.id = $1
      `, [movementId]);

      if (result.length === 0) {
        throw new Error('Movement not found');
      }

      const movementData = result[0];
      return await this.generateGatePassPDF(movementData);
    } catch (error) {
      console.error('Error generating PDF from movement ID:', error);
      throw error;
    }
  }
}

module.exports = new PDFGenerator();
