export const subscriptionRenewedTemplate = (data: {
  startDate: string;
  endDate: string;
  userName: string;
  planName: string;
  amount: number;
  currency: string;
}) => {
  const displayData = {
    ...data,
    startDate: new Date(data.startDate).toLocaleDateString(),
    endDate: new Date(data.endDate).toLocaleDateString(),
  };
  return {
    subject: `🎉 Your ${data.planName} Subscription is Renewed!`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #333; margin-top: 0;">🎉 Subscription Renewed!</h2>
    <p style="color: #555; font-size: 16px;">Hi ${data.userName},</p>
    <p style="color: #555; font-size: 16px;">Your subscription for <strong>${data.planName}</strong> has been renewed successfully!</p>

    <div style="background-color: #f8f9fa; border-radius: 6px; padding: 16px; margin: 20px 0;">
      <p style="margin: 8px 0; color: #333;"><strong>Plan:</strong> ${data.planName}</p>
      <p style="margin: 8px 0; color: #333;"><strong>Amount:</strong> ${data.currency} ${data.amount}</p>
      <p style="margin: 8px 0; color: #333;"><strong>Start Date:</strong> ${displayData.startDate}</p>
      <p style="margin: 8px 0; color: #333;"><strong>End Date:</strong> ${displayData.endDate}</p>
    </div>

    <p style="color: #555; font-size: 16px;">Your invoice is attached to this email.</p>
    <p style="color: #555; font-size: 16px;">Thank you for choosing JobLensAI!</p>
    <p style="color: #888; font-size: 14px; margin-top: 24px;">— The JobLensAI Team</p>
  </div>
</body>
</html>
  `,
  };
};
