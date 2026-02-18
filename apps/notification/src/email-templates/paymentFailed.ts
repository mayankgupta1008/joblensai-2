export const paymentFailedTemplate = (data: { userName: string }) => ({
  subject: "Payment Failed",
  html: `
    <h2>Payment Failed</h2>
    <p>Hi ${data.userName},</p>
    <p>Your payment has failed. Please try again.</p>
    <p>Thank you,</p>
    <p>JobLensAI Team</p>
  `,
});
