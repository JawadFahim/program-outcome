// src/lib/mailer.ts
import nodemailer from 'nodemailer';

// It is strongly recommended to move these credentials to environment variables
// for better security and to avoid committing them to version control.
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, 
  auth: {
    user: "rupontibup@gmail.com",
    pass: "qjlouenwnysssjik",
  },
});

export const sendMail = async (mailOptions: nodemailer.SendMailOptions) => {
    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error };
    }
};
