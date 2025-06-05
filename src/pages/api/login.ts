import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb'; // Adjust path as needed
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { teacherId, password } = req.body;

    if (!teacherId || !password) {
        return res.status(400).json({ message: 'Teacher ID and password are required' });
    }

    try {
        const client = await clientPromise;
        const db = client.db(); // Use your default DB or specify one: client.db("yourDbName")

        const teacher = await db.collection('teachers').findOne({ teacherId });

        if (!teacher) {
            return res.status(401).json({ message: 'Invalid credentials - User not found' });
        }

        // Ensure teacher.password exists and is a string before comparing
        if (typeof teacher.password !== 'string') {
            console.error('Stored password is not a string for teacherId:', teacherId);
            return res.status(500).json({ message: 'Server error: Invalid password format in DB' });
        }

        const isPasswordValid = await bcrypt.compare(password, teacher.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials - Password incorrect' });
        }

        // Here, you would typically create a session or JWT token
        // For this example, we'll just return a success message.
        // Make sure to implement proper session management for a production app.

        // Example: (Illustrative - you'll need a library like iron-session or next-auth)
        // req.session.user = { id: teacher._id, teacherId: teacher.teacherId };
        // await req.session.save();

        return res.status(200).json({ message: 'Login successful', teacherId: teacher.teacherId });

    } catch (error) {
        console.error('Login API error:', error);
        // Avoid sending detailed error messages to the client in production
        return res.status(500).json({ message: 'Internal Server Error' });
    }
} 