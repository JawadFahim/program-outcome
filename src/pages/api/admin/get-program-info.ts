// src/pages/api/admin/get-program-info.ts
import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const client = await connectToDatabase();
        const db = client.db("BICE_course_map");
        const collection = db.collection('program_students');

        const sessions = await collection.distinct('session');
        const programs = await collection.distinct('program');

        // sort sessions descending
        sessions.sort((a, b) => b.localeCompare(a));

        res.status(200).json({ sessions, programs });
    } catch (error) {
        console.error('Error fetching program info:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
