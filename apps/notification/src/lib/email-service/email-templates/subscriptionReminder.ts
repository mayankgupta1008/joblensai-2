export const subscriptionReminderTemplate = (data: {
  endDate: string;
  userName: string;
  planName: string;
  amount: number;
  currency: string;
}) => ({
  subject: `🔔 Reminder: Your ${data.planName} Subscription Renews Soon`,
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #333; margin-top: 0;">🔔 Renewal Incoming</h2>
    <p style="color: #555; font-size: 16px;">Hi ${data.userName},</p>
    <p style="color: #555; font-size: 16px;">Just a friendly heads-up! Your <strong>${data.planName}</strong> subscription is scheduled to renew in 24 hours.</p>

    <div style="background-color: #f8f9fa; border-radius: 6px; padding: 16px; margin: 20px 0;">
      <p style="margin: 8px 0; color: #333;"><strong>Plan:</strong> ${data.planName}</p>
      <p style="margin: 8px 0; color: #333;"><strong>Renewal Amount:</strong> ${data.currency} ${data.amount}</p>
      <p style="margin: 8px 0; color: #333;"><strong>Renewal Date:</strong> ${data.endDate}</p>
    </div>

    <p style="color: #555; font-size: 16px;">There is no action required from your side. We will automatically charge your saved payment method.</p>
    <p style="color: #555; font-size: 16px;">If you wish to make any changes, please visit your account dashboard.</p>
    
    <p style="color: #888; font-size: 14px; margin-top: 24px;">— The JobLensAI Team</p>
  </div>
</body>
</html>
  `,
});
