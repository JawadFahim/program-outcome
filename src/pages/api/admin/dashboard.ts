import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { session, po_no } = req.query;

    if (!session || !po_no) {
        return res.status(400).json({ message: 'Session and Program Outcome are required.' });
    }

    try {
        const client = await clientPromise;
        const db = client.db("BICE_course_map");
        
        const scores = await db.collection('scores').find({
            session: session as string,
            po_no: po_no as string,
        }).toArray();

        res.status(200).json(scores);

    } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
} 