import puppeteer from "puppeteer";
import { razorpayInstance } from "./razorpay.js";
import { uploadFileToS3, FILE_CONFIG } from "@joblensai/shared/src/utils/s3Utility.js";

// ============ TYPES ============

interface InvoiceUserData {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
}

interface InvoicePaymentData {
  _id: string;
  amount: number;
  currency: string;
}

interface InvoiceParams {
  user: InvoiceUserData;
  payment: InvoicePaymentData;
  planName: string;
  subscriptionStartDate: Date;
  subscriptionEndDate: Date;
}

interface InvoiceResult {
  razorpayInvoiceId: string;
  s3Key: string;
}

/**
 * Downloads PDF from Razorpay invoice using Puppeteer
 * Razorpay's short_url returns an HTML page, not a direct PDF.
 * We use Puppeteer to render the page and export as PDF.
 */
const downloadInvoicePdf = async (invoiceId: string): Promise<Buffer> => {
  const credentials = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
  ).toString("base64");

  // Step 1: Fetch invoice details to get short_url
  const invoiceResponse = await fetch(`https://api.razorpay.com/v1/invoices/${invoiceId}`, {
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  });

  if (!invoiceResponse.ok) {
    throw new Error(
      `Failed to fetch invoice: ${invoiceResponse.status} ${invoiceResponse.statusText}`
    );
  }

  const invoiceData = await invoiceResponse.json();
  const shortUrl = invoiceData.short_url;

  if (!shortUrl) {
    throw new Error("Invoice short_url not available");
  }

  // Step 2: Use Puppeteer to render page and export as PDF
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined, // Use system Chromium in Docker
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"], // Required for Docker
  });

  try {
    const page = await browser.newPage();
    await page.goto(shortUrl, { waitUntil: "networkidle0", timeout: 30000 });

    // Generate PDF with A4 format
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      scale: 0.8,
      margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
};

/**
 * Creates a Razorpay invoice, downloads the PDF via Puppeteer, and uploads to S3
 *
 * Production flow:
 * 1. Create invoice via Razorpay API
 * 2. Use Puppeteer to render invoice page as PDF
 * 3. Upload PDF to S3 for permanent storage
 * 4. Return all IDs/keys for database update + Kafka message
 */
export const generateAndUploadInvoice = async (params: InvoiceParams): Promise<InvoiceResult> => {
  const { user, payment, planName, subscriptionStartDate, subscriptionEndDate } = params;

  // Step 1: Create Razorpay Invoice
  const invoice = await razorpayInstance.invoices.create({
    type: "invoice",
    description: `${planName} Plan - Subscription Invoice`,
    customer: {
      name: user.fullName,
      email: user.email,
      contact: user.phoneNumber || "9999999999", // Razorpay requires contact
    },
    line_items: [
      {
        name: `${planName} Plan Subscription`,
        description: `${subscriptionStartDate.toLocaleDateString()} to ${subscriptionEndDate.toLocaleDateString()}`,
        amount: payment.amount * 100, // Convert to paise
        currency: payment.currency,
        quantity: 1,
      },
    ],
    currency: payment.currency,
    sms_notify: 0, // We send notifications ourselves via Kafka
    email_notify: 0,
  });

  // Step 2: Download PDF using Puppeteer
  const pdfBuffer = await downloadInvoicePdf(invoice.id);

  // Step 3: Generate S3 key and upload
  const s3Key = `${FILE_CONFIG.invoice.folder}/${user._id.toString()}/${invoice.id}.pdf`;
  await uploadFileToS3(s3Key, pdfBuffer, "application/pdf");

  // Step 4: Return result for database update + Kafka message
  return {
    razorpayInvoiceId: invoice.id,
    s3Key,
  };
};
