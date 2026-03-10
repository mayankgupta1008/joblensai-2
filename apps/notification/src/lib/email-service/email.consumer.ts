import {
  createConsumer,
  KAFKA_TOPICS,
  ensureTopicExists,
} from "@joblensai/shared/src/utils/kafka.config.js";
import { getFileFromS3 } from "@joblensai/shared/src/utils/s3Utility.js";
import { sendEmail } from "@/lib/email-service/email.service.js";
import { passwordResetTemplate } from "@/lib/email-service/email-templates/passwordReset.js";
import { paymentFailedTemplate } from "@/lib/email-service/email-templates/paymentFailed.js";
import { subscriptionStartTemplate } from "@/lib/email-service/email-templates/subscriptionStart.js";
import { subscriptionCancelTemplate } from "@/lib/email-service/email-templates/subscriptionCancel.js";
import type { Attachment } from "nodemailer/lib/mailer/index.js";
import { subscriptionReminderTemplate } from "@/lib/email-service/email-templates/subscriptionReminder.js";
import { subscriptionRenewedTemplate } from "@/lib/email-service/email-templates/subscriptionRenewed.js";
import { subscriptionRenewalFailedTemplate } from "@/lib/email-service/email-templates/subscriptionRenewalFailed.js";
import { generateAndUploadInvoice } from "@/lib/email-service/invoice.js";
import Payment from "@joblensai/shared/src/models/payment.model.js";
import { io } from "@/lib/socket.js";
import Notification from "@joblensai/shared/src/models/notification.model.js";

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
          const notification = new Notification({
            userId: emailData.data.userId,
            title: "Payment Failed",
            message: "Your payment has failed.",
            type: "PAYMENT_FAILED",
          });
          await notification.save();
          io.to(emailData.data.userId).emit("notification", notification);
          const { subject, html } = paymentFailedTemplate(emailData.data);
          await sendEmail(emailData.to, subject, html);
          break;
        }
        case "SUBSCRIPTION_STARTED": {
          const { data, to } = emailData;

          // 1. FIRST: Save + emit notification (instant user feedback)
          const notification = await new Notification({
            userId: data.userId,
            title: "Subscription Started",
            message: `Your ${data.planName} subscription is now active!`,
            type: "SUBSCRIPTION_STARTED",
            metadata: { planName: data.planName },
          }).save();
          io.to(data.userId).emit("notification", notification);

          // 2. Generate PDF (slow - but user already saw notification)
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

          // 3. Update DB with invoice details
          await Payment.findByIdAndUpdate(data.paymentId, {
            razorpayInvoiceId: invoiceResult.razorpayInvoiceId,
            invoiceS3Key: invoiceResult.s3Key,
          });

          // 4. Finally, send the email with the attachment
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
          const notification = await new Notification({
            userId: emailData.data.userId,
            title: "Subscription Cancelled",
            message: "Your subscription has been cancelled.",
            type: "SUBSCRIPTION_CANCELLED",
          }).save();
          io.to(emailData.data.userId).emit("notification", notification);
          const { subject, html } = subscriptionCancelTemplate(emailData.data);
          await sendEmail(emailData.to, subject, html);
          break;
        }
        case "SUBSCRIPTION_REMINDER": {
          const notification = await new Notification({
            userId: emailData.data.userId,
            title: "Subscription Renewal Reminder",
            message: "Your subscription will renew in 24 hours.",
            type: "SUBSCRIPTION_REMINDER",
          }).save();
          io.to(emailData.data.userId).emit("notification", notification);
          const { subject, html } = subscriptionReminderTemplate(emailData.data);
          await sendEmail(emailData.to, subject, html);
          break;
        }
        case "SUBSCRIPTION_RENEWED": {
          const { data, to } = emailData;

          // 1. FIRST: Save + emit notification (instant user feedback)
          const notification = await new Notification({
            userId: data.userId,
            title: "Subscription Renewed",
            message: `Your ${data.planName} subscription has been renewed.`,
            type: "SUBSCRIPTION_RENEWED",
            metadata: { planName: data.planName },
          }).save();
          io.to(data.userId).emit("notification", notification);

          // 2. Generate PDF (slow - but user already saw notification)
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

          // 3. Update DB with invoice details
          await Payment.findByIdAndUpdate(data.paymentId, {
            razorpayInvoiceId: invoiceResult.razorpayInvoiceId,
            invoiceS3Key: invoiceResult.s3Key,
          });

          // 4. Finally, send the email with the attachment
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
          const notification = new Notification({
            userId: emailData.data.userId,
            title: "Subscription Renewal Failed",
            message: "Your subscription renewal has failed.",
            type: "SUBSCRIPTION_RENEWAL_FAILED",
          });
          await notification.save();
          io.to(emailData.data.userId).emit("notification", notification);
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
