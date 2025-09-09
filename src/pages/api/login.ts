// pages/api/login.ts
// WARNING: THIS VERSION USES PLAINTEXT PASSWORD COMPARISON AND IS NOT SECURE.
// DO NOT USE THIS IN PRODUCTION OR WITH SENSITIVE DATA.

import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../lib/mongodb';
import { SignJWT } from 'jose';
import { DB_NAME } from '../../lib/constants';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'a-secure-and-long-secret-key-for-testing');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { teacherId, password } = req.body;

        if (!teacherId || !password) {
            return res.status(400).json({ message: 'Teacher ID and password are required.' });
        }

        const client = await connectToDatabase();
        const db = client.db(DB_NAME);
        const teacher = await db.collection('teachers').findOne({ teacherId: teacherId });
        
        if (!teacher || teacher.password !== password) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Credentials are valid, now generate the JWT
        const token = await new SignJWT({ teacherId: teacher.teacherId })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('30m')
            .sign(JWT_SECRET);

        // Return the token to the client
        return res.status(200).json({ token });

    } catch (error) {
        console.error('Login API error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
