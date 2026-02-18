import {
  createConsumer,
  KAFKA_TOPICS,
} from "@joblensai/shared/src/utils/kafka.config.js";
import { sendEmail } from "@/lib/email.service.js";
import { passwordResetTemplate } from "@/email-templates/passwordReset.js";
import { paymentSuccessTemplate } from "@/email-templates/paymentSuccess.js";
import { paymentFailedTemplate } from "@/email-templates/paymentFailed.js";
import { subscriptionStartTemplate } from "@/email-templates/subscriptionStart.js";
import { subscriptionEndTemplate } from "@/email-templates/subscriptionEnd.js";

const consumer = createConsumer("notification-service");

export const startEmailConsumer = async () => {
  await consumer.connect();

  await consumer.subscribe({
    topic: KAFKA_TOPICS.NOTIFICATION_EMAIL,
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const emailData = JSON.parse(message.value?.toString() || "{}");
      console.log("Email data:", emailData);
      // TODO: switch on emailData.type and send appropriate email
      switch (emailData.type) {
        case "PASSWORD_RESET": {
          const { subject, html } = passwordResetTemplate(emailData.data);
          await sendEmail(emailData.to, subject, html);
          break;
        }
        case "PAYMENT_SUCCESS": {
          const { subject, html } = paymentSuccessTemplate(emailData.data);
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
          await sendEmail(emailData.to, subject, html);
          break;
        }
        case "SUBSCRIPTION_END": {
          const { subject, html } = subscriptionEndTemplate(emailData.data);
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
