import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../lib/mongodb';
import { DB_NAME } from '../../lib/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { teacherId, action, details } = req.body;

        if (!teacherId || !action) {
            return res.status(400).json({ message: 'teacherId and action are required' });
        }

        const client = await connectToDatabase();
        const db = client.db(DB_NAME);

        await db.collection('audit_logs').insertOne({
            teacherId: String(teacherId),
            action: String(action),
            details: details || {},
            timestamp: new Date(),
        });

        return res.status(200).json({ message: 'Logged' });
    } catch (err) {
        console.error('Audit log error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
