// src/pages/api/admin/add-course-to-program.ts
import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { DB_NAME } from '../../../lib/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { program, courseCode, versionCode, courseTitle, credit } = req.body;

    if (!program || !courseCode || !versionCode || !courseTitle || credit === undefined) {
        return res.status(400).json({ message: 'All fields are required: program, courseCode, versionCode, courseTitle, credit.' });
    }

    const creditNum = Number(credit);
    if (isNaN(creditNum) || creditNum <= 0) {
        return res.status(400).json({ message: 'Credit must be a positive number.' });
    }

    try {
        const client = await connectToDatabase();
        const db = client.db(DB_NAME);
        const collection = db.collection('course_tree');

        const programDoc = await collection.findOne({ program });
        if (!programDoc) {
            return res.status(404).json({ message: `Program "${program}" not found in the course tree.` });
        }

        const existingCourses: { courseCode: string; versionCode: string }[] = programDoc.courses || [];
        const duplicate = existingCourses.some(
            (c) => c.courseCode === courseCode && c.versionCode === versionCode
        );
        if (duplicate) {
            return res.status(409).json({ message: `A course with code "${courseCode}" and version "${versionCode}" already exists in this program.` });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await collection.updateOne(
            { program },
            {
                $push: {
                    courses: { courseCode, versionCode, courseTitle, credit: creditNum },
                } as any,
            }
        );

        return res.status(201).json({ message: 'Course added successfully.' });
    } catch (error) {
        console.error('Error adding course to program:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
