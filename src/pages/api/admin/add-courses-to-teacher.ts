// src/pages/api/admin/add-courses-to-teacher.ts
import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { teacherId, newCourses } = req.body;

    if (!teacherId || !newCourses || !Array.isArray(newCourses)) {
        return res.status(400).json({ message: 'Invalid request body' });
    }

    try {
        const client = await connectToDatabase();
        const db = client.db("BICE_course_map");
        const collection = db.collection('teachers');

        const result = await collection.updateOne(
            { _id: new ObjectId(teacherId) },
            { $addToSet: { coursesTaught: { $each: newCourses } } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Teacher not found.' });
        }

        res.status(200).json({ message: 'Courses added successfully.' });
    } catch (error) {
        console.error('Error adding courses to teacher:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
