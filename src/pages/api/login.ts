// pages/api/login.ts
// WARNING: THIS VERSION USES PLAINTEXT PASSWORD COMPARISON AND IS NOT SECURE.
// DO NOT USE THIS IN PRODUCTION OR WITH SENSITIVE DATA.

import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb'; // Adjust path as needed
// bcrypt import is removed

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { teacherId, password: plainTextPasswordFromRequest } = req.body;

    // --- Start Logging ---
    console.log('--- LOGIN API HIT (PLAINTEXT MODE) ---');
    console.log('Request Body:', req.body);
    console.log(`Received teacherId: "${teacherId}"`);
    console.log(`Received plainTextPasswordFromRequest: "${plainTextPasswordFromRequest}"`);
    // --- End Logging ---

    if (!teacherId || !plainTextPasswordFromRequest) {
        console.log('Validation Error: Teacher ID and password are required.');
        return res.status(400).json({ message: 'Teacher ID and password are required' });
    }

    try {
        const client = await clientPromise;
        // IMPORTANT: Specify your database name here if not in URI!
        const db = client.db("BICE_course_map"); // <--- CHANGE THIS to your DB name, e.g., "biceDB"
        console.log(`Using database: "${db.databaseName}"`);

        console.log(`Attempting to find teacher with teacherId: "${teacherId}" in collection "teachers"`);
        const teacher = await db.collection('teachers').findOne({ teacherId });

        if (!teacher) {
            console.log(`Teacher not found for teacherId: "${teacherId}"`);
            return res.status(401).json({ message: 'Invalid credentials - User not found' });
        }

        console.log('Teacher found in DB:', { _id: teacher._id, teacherId: teacher.teacherId, passwordExists: !!teacher.password });

        // Ensure teacher.password exists and is a string
        if (typeof teacher.password !== 'string' || !teacher.password.trim()) {
            console.error('DB Error: Stored password is not a valid string or is empty for teacherId:', teacherId);
            return res.status(500).json({ message: 'Server error: Invalid password format in DB' });
        }

        // --- PLAINTEXT PASSWORD COMPARISON ---
        // WARNING: HIGHLY INSECURE
        console.log(`Comparing input password "${plainTextPasswordFromRequest}" with stored password "${teacher.password}"`);
        const isPasswordValid = plainTextPasswordFromRequest === teacher.password;
        // --- END PLAINTEXT PASSWORD COMPARISON ---

        console.log(`Password comparison result for "${teacherId}": ${isPasswordValid}`);

        if (!isPasswordValid) {
            console.log(`Password incorrect for teacherId: "${teacherId}"`);
            return res.status(401).json({ message: 'Invalid credentials - Password incorrect' });
        }

        console.log(`Login successful for teacherId: "${teacherId}"`);
        // Here, you would typically create a session or JWT token
        // For this example, we'll just return a success message.
        return res.status(200).json({ message: 'Login successful', teacherId: teacher.teacherId });

    } catch (error) {
        console.error('Login API CATCH Block Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({ message: 'Internal Server Error', errorDetails: errorMessage });
    }
}
