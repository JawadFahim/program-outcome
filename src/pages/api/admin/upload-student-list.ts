// src/pages/api/admin/upload-student-list.ts
import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { DB_NAME } from '../../../lib/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { session, program, students } = req.body;

        if (!session || !program || !students || !Array.isArray(students)) {
            return res.status(400).json({ message: 'Missing or invalid parameters' });
        }

        const client = await connectToDatabase();
        const db = client.db(DB_NAME);
        const collection = db.collection('program_students');

        const result = await collection.updateOne(
            { session, program },
            { $set: { students } },
            { upsert: true }
        );

        if (result.upsertedCount > 0 || result.modifiedCount > 0) {
            res.status(200).json({ message: 'Student list saved successfully' });
        } else {
            res.status(200).json({ message: 'No changes were made to the student list.' });
        }
    } catch (error) {
        console.error('Error saving student list:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
