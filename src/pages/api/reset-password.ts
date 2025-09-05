import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../lib/mongodb';
import { otpStore } from '../../lib/otpStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { emailOrId, otp, newPassword } = req.body;

    if (!emailOrId || !otp || !newPassword) {
        return res.status(400).json({ message: 'Email/ID, OTP, and new password are required.' });
    }

    try {
        const client = await connectToDatabase();
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
        const storedOtpData = otpStore[email];

        if (!storedOtpData) {
            return res.status(400).json({ message: 'OTP not requested or already used.' });
        }

        if (storedOtpData.expires < Date.now()) {
            delete otpStore[email];
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        if (storedOtpData.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP.' });
        }

        // OTP is valid, update the password
        await teachersCollection.updateOne(
            { _id: teacher._id },
            { $set: { password: newPassword } }
        );

        delete otpStore[email]; // Clean up the used OTP

        res.status(200).json({ message: 'Password reset successfully.' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
} 