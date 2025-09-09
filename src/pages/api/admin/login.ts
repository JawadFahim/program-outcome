// pages/api/admin/login.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { SignJWT } from 'jose';
import { DB_NAME } from '../../../lib/constants';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'a-secure-and-long-secret-key-for-testing');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }

        const client = await connectToDatabase();
        const db = client.db(DB_NAME);
        const admin = await db.collection('admin').findOne({ username: username });
        
        if (!admin || admin.password !== password) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Create a JWT with an 'admin' role
        const token = await new SignJWT({ username: admin.username, role: 'admin' })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('30m')
            .sign(JWT_SECRET);

        // Return the token. The client will save it in a cookie.
        return res.status(200).json({ token });

    } catch (error) {
        console.error('Admin Login API error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
} 