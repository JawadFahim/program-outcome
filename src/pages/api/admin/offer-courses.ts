// src/pages/api/admin/offer-courses.ts
import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { DB_NAME } from '../../../lib/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { session, program, offeredCourses } = req.body;

    if (!session || !program || !offeredCourses || !Array.isArray(offeredCourses)) {
        return res.status(400).json({ message: 'Invalid request body' });
    }

    try {
        const client = await connectToDatabase();
        const db = client.db(DB_NAME);
        const collection = db.collection('program_students');

        const result = await collection.updateOne(
            { session, program },
            { $set: { offeredCourses } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'No student list found for the selected session and program.' });
        }

        res.status(200).json({ message: 'Courses offered successfully.' });
    } catch (error) {
        console.error('Error offering courses:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
