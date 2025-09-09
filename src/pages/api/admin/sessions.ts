import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { DB_NAME } from '../../../lib/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const client = await connectToDatabase();
        const db = client.db(DB_NAME);
        
        // Use aggregation pipeline to get distinct, sorted sessions
        const pipeline = [
            { $group: { _id: '$session' } },
            { $sort: { _id: -1 } }, // Sorts '2022-23' before '2021-22'
            { $project: { _id: 0, session: '$_id' } }
        ];

        const results = await db.collection('scores').aggregate(pipeline).toArray();
        
        const sessions = results.map(item => item.session).filter(Boolean); // Ensure no null/undefined values

        res.status(200).json(sessions);
    } catch (error) {
        console.error('Failed to fetch sessions:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
} 