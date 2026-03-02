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
      console.log("Email data:", emailData);
      // TODO: switch on emailData.type and send appropriate email
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
          const { subject, html } = subscriptionStartTemplate(emailData.data);
          const attachments: Attachment[] = [];
          if (emailData.pdfKey) {
            const pdfBuffer = await getFileFromS3(emailData.pdfKey);
            attachments.push({
              filename: "invoice.pdf",
              content: pdfBuffer,
              contentType: "application/pdf",
            });
          }
          await sendEmail(emailData.to, subject, html, attachments);
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
          const { subject, html } = subscriptionRenewedTemplate(emailData.data);
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
