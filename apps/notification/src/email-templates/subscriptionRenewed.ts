export const subscriptionRenewedTemplate = (data: {
  startDate: string;
  endDate: string;
  userName: string;
  planName: string;
  amount: number;
  currency: string;
}) => ({
  subject: `✅ Your ${data.planName} Subscription Has Been Renewed`,
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #333; margin-top: 0;">✅ Subscription Renewed!</h2>
    <p style="color: #555; font-size: 16px;">Hi ${data.userName},</p>
    <p style="color: #555; font-size: 16px;">We're excited to continue supporting your career growth! Your <strong>${data.planName}</strong> subscription has been successfully renewed.</p>
    
    <div style="background-color: #f8f9fa; border-radius: 6px; padding: 16px; margin: 20px 0;">
      <p style="margin: 8px 0; color: #333;"><strong>Plan:</strong> ${data.planName}</p>
      <p style="margin: 8px 0; color: #333;"><strong>Amount:</strong> ${data.currency} ${data.amount}</p>
      <p style="margin: 8px 0; color: #333;"><strong>New Expiry Date:</strong> ${data.endDate}</p>
    </div>
    
    <p style="color: #555; font-size: 16px;">You now have access to all premium features until ${data.endDate}.</p>
    
    <div style="text-align: center; margin-top: 30px;">
      <a href="https://joblens.ai" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Explore Opportunities</a>
    </div>
    
    <p style="color: #555; font-size: 16px; margin-top: 20px;">Thank you for being a valued member of JobLens AI!</p>
    <p style="color: #888; font-size: 14px; margin-top: 24px;">— The JobLensAI Team</p>
  </div>
</body>
</html>
    `,
});
