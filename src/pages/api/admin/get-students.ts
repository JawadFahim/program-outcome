// src/pages/api/admin/get-students.ts
import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { DB_NAME } from '../../../lib/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { session, program } = req.query;

    if (!session || !program) {
        return res.status(400).json({ message: 'Session and Program are required.' });
    }

    try {
        const client = await connectToDatabase();
        const db = client.db(DB_NAME);
        const collection = db.collection('program_students');

        const result = await collection.findOne({
            session: session as string,
            program: program as string
        });

        if (result) {
            res.status(200).json({ students: result.students || [] });
        } else {
            res.status(200).json({ students: [] });
        }
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
