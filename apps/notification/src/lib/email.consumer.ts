import { createConsumer, KAFKA_TOPICS } from "@joblensai/shared/src/utils/kafka.config.js";
import { getFileFromS3 } from "@joblensai/shared/src/utils/s3Utility.js";
import { sendEmail } from "@/lib/email.service.js";
import { passwordResetTemplate } from "@/email-templates/passwordReset.js";
import { paymentFailedTemplate } from "@/email-templates/paymentFailed.js";
import { subscriptionStartTemplate } from "@/email-templates/subscriptionStart.js";
import { subscriptionCancelTemplate } from "@/email-templates/subscriptionCancel.js";
import { ensureTopicExists } from "@joblensai/shared/src/utils/kafka.config.js";
import type { Attachment } from "nodemailer/lib/mailer/index.js";
import { subscriptionReminderTemplate } from "@/email-templates/subscriptionReminder.js";
import { subscriptionRenewedTemplate } from "@/email-templates/subscriptionRenewed.js";
import { subscriptionRenewalFailedTemplate } from "@/email-templates/subscriptionRenewalFailed.js";
import { generateAndUploadInvoice } from "@/lib/invoice.js";
import Payment from "@joblensai/shared/src/models/payment.model.js";

const consumer = createConsumer("notification-service");

export const startEmailConsumer = async () => {
  // Ensure topic exists before subscribing (Enterprise practice: only auto-create in dev/test)
  if (process.env.NODE_ENV !== "production") {
    await ensureTopicExists(KAFKA_TOPICS.NOTIFICATION_EMAIL);
  }

  await consumer.connect();

  await consumer.subscribe({
    topic: KAFKA_TOPICS.NOTIFICATION_EMAIL,
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const emailData = JSON.parse(message.value?.toString() || "{}");
      switch (emailData.type) {
        case "PASSWORD_RESET": {
          const { subject, html } = passwordResetTemplate(emailData.data);
          await sendEmail(emailData.to, subject, html);
          break;
        }
        case "PAYMENT_FAILED": {
          const { subject, html } = paymentFailedTemplate(emailData.data);
          await sendEmail(emailData.to, subject, html);
          break;
        }
        case "SUBSCRIPTION_STARTED": {
          const { data, to } = emailData;
          // 1. First, make the PDF (This is the slow part)
          const invoiceResult = await generateAndUploadInvoice({
            user: {
              _id: data.userId,
              fullName: data.userName,
              email: to,
              phoneNumber: data.phoneNumber,
            },
            payment: {
              _id: data.paymentId,
              amount: data.amount,
              currency: data.currency,
            },
            planName: data.planName,
            subscriptionStartDate: new Date(data.startDate),
            subscriptionEndDate: new Date(data.endDate),
          });

          // 2. IMPORTANT: Update the DB so the dashboard shows the invoice
          await Payment.findByIdAndUpdate(data.paymentId, {
            razorpayInvoiceId: invoiceResult.razorpayInvoiceId,
            invoiceS3Key: invoiceResult.s3Key,
          });

          // 3. Finally, send the email with the attachment
          const { subject, html } = subscriptionStartTemplate(data);
          const attachments: Attachment[] = [];
          if (invoiceResult.s3Key) {
            const pdfBuffer = await getFileFromS3(invoiceResult.s3Key);
            attachments.push({
              filename: "invoice.pdf",
              content: pdfBuffer,
              contentType: "application/pdf",
            });
          }
          await sendEmail(to, subject, html, attachments);
          break;
        }
        case "SUBSCRIPTION_CANCELLED": {
          const { subject, html } = subscriptionCancelTemplate(emailData.data);
          await sendEmail(emailData.to, subject, html);
          break;
        }
        case "SUBSCRIPTION_REMINDER": {
          const { subject, html } = subscriptionReminderTemplate(emailData.data);
          await sendEmail(emailData.to, subject, html);
          break;
        }
        case "SUBSCRIPTION_RENEWED": {
          const { data, to } = emailData;

          const invoiceResult = await generateAndUploadInvoice({
            user: {
              _id: data.userId,
              fullName: data.userName,
              email: to,
              phoneNumber: data.phoneNumber,
            },
            payment: {
              _id: data.paymentId,
              amount: data.amount,
              currency: data.currency,
            },
            planName: data.planName,
            subscriptionStartDate: new Date(data.startDate),
            subscriptionEndDate: new Date(data.endDate),
          });

          // 2. IMPORTANT: Update the DB so the dashboard shows the invoice
          await Payment.findByIdAndUpdate(data.paymentId, {
            razorpayInvoiceId: invoiceResult.razorpayInvoiceId,
            invoiceS3Key: invoiceResult.s3Key,
          });

          // 3. Finally, send the email with the attachment
          const { subject, html } = subscriptionRenewedTemplate(data);
          const attachments: Attachment[] = [];
          if (invoiceResult.s3Key) {
            const pdfBuffer = await getFileFromS3(invoiceResult.s3Key);
            attachments.push({
              filename: "invoice.pdf",
              content: pdfBuffer,
              contentType: "application/pdf",
            });
          }
          await sendEmail(to, subject, html, attachments);
          break;
        }
        case "SUBSCRIPTION_RENEWAL_FAILED": {
          const { subject, html } = subscriptionRenewalFailedTemplate(emailData.data);
          await sendEmail(emailData.to, subject, html);
          break;
        }
        default: {
          console.log("Unknown email type:", emailData.type);
        }
      }
    },
  });
};

export { consumer as emailConsumer };
