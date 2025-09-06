// src/pages/api/admin/get-courses-for-program.ts
import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { program } = req.query;

    if (!program) {
        return res.status(400).json({ message: 'Program is a required query parameter.' });
    }

    try {
        const client = await connectToDatabase();
        const db = client.db("BICE_course_map");
        const collection = db.collection('course_tree');

        const result = await collection.findOne({ program: program as string });

        if (result) {
            res.status(200).json({ courses: result.courses || [] });
        } else {
            res.status(404).json({ message: 'Program not found.' });
        }
    } catch (error) {
        console.error('Error fetching courses for program:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
