// src/pages/api/admin/get-course-programs.ts
import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const client = await connectToDatabase();
        const db = client.db("BICE_course_map");
        const collection = db.collection('course_tree');

        const programs = await collection.distinct('program');
        
        res.status(200).json({ programs });
    } catch (error) {
        console.error('Error fetching course programs:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
