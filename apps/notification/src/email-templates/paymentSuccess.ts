export const paymentSuccessTemplate = (data: {
  invoiceUrl: string;
  userName: string;
}) => ({
  subject: "Payment Success",
  html: `
    <h2>Payment Success</h2>
    <p>Hi ${data.userName},</p>
    <p>Your payment has been processed successfully.</p>
    <a href="${data.invoiceUrl}">View Invoice</a>
    <p>Thank you,</p>
    <p>JobLensAI Team</p>
  `,
});
