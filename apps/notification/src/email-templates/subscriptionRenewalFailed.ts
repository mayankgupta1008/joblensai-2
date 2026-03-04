export const subscriptionRenewalFailedTemplate = (data: {
  userName: string;
  planName?: string;
  shortUrl: string;
  isHalted: boolean;
}) => ({
  subject: data.isHalted
    ? `⚠️ Action Required: Your Subscription has Expired`
    : `❌ Payment Failed: Action Required for Your Subscription`,
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #d9534f; margin-top: 0;">${data.isHalted ? "Subscription Expired" : "Renewal Payment Failed"}</h2>
    <p style="color: #555; font-size: 16px;">Hi ${data.userName},</p>
    
    <p style="color: #555; font-size: 16px;">
      We were unable to renew your subscription. Your automated payment failed, and your premium access has been paused. This often happens due to an expired card or missing authorization.
    </p>

    <div style="background-color: #fff5f5; border: 1px solid #feb2b2; border-radius: 6px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0; color: #c53030; font-weight: bold;">Action Required:</p>
      <p style="margin: 8px 0; color: #555;">Please use the link below to complete your payment manually or update your payment method to restore/keep your access.</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.shortUrl}" style="display: inline-block; background-color: #d9534f; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;"> Complete Payment Now </a>
    </div>

    <p style="color: #555; font-size: 14px;">If you've already resolved this, please ignore this email. Your subscription status will update automatically once the payment is confirmed.</p>
    
    <p style="color: #888; font-size: 14px; margin-top: 24px;">— The JobLensAI Team</p>
  </div>
</body>
</html>
  `,
});
