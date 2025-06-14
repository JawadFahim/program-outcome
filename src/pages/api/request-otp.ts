import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb';
import nodemailer from 'nodemailer';
import { otpStore } from '../../lib/otpStore';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, 
  auth: {
    user: "rupontibup@gmail.com",
    pass: "qjlouenwnysssjik",
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { emailOrId } = req.body;

    if (!emailOrId) {
        return res.status(400).json({ message: 'Email or Teacher ID is required.' });
    }

    try {
        const client = await clientPromise;
        const db = client.db("BICE_course_map"); 
        const teachersCollection = db.collection('teachers');

        let teacher;
        if (emailOrId.includes('@')) {
            teacher = await teachersCollection.findOne({ email: emailOrId });
        } else {
            teacher = await teachersCollection.findOne({ teacherId: emailOrId });
        }

        if (!teacher) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const email = teacher.email;
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

        otpStore[email] = { otp, expires };

        const mailOptions = {
            from: '"Course Mapper" <course@bup.edu.bd>',
            to: email,
            subject: 'Your Password Reset OTP',
            text: `Your OTP for password reset is: ${otp}. It will expire in 10 minutes.`,
            html: `<b>Your OTP for password reset is: ${otp}</b>. It will expire in 10 minutes.`,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'OTP sent successfully to your email.' });

    } catch (error) {
        console.error('Request OTP error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
} 