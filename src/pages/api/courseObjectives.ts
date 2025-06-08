import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb';

interface Objective {
    co_no: string;
    courseObjective: string;
    mappedProgramOutcome: string;
}

interface RequestBody {
    teacherId: string;
    courseId: string;
    objectives: Objective[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { teacherId, courseId, objectives } = req.body as RequestBody;

    console.log('--- SAVE OBJECTIVES API HIT ---');
    console.log('Received teacherId:', teacherId);
    console.log('Received courseId:', courseId);
    console.log('Received objectives count:', objectives?.length);

    if (!teacherId || !courseId || !objectives || !Array.isArray(objectives) || objectives.length === 0) {
        return res.status(400).json({ message: 'Missing or invalid data: teacherId, courseId, and a non-empty objectives array are required.' });
    }

    try {
        const client = await clientPromise;
        const db = client.db("BICE_course_map");
        const coursesCollection = db.collection('courses');

        const filter = { 
            teacherId: teacherId, 
            courseId: courseId 
        };

        const updateDoc = {
            $set: {
                courseObjectives: objectives,
            },
        };
        
        const options = { upsert: true }; // This is the key for "update or insert"

        const result = await coursesCollection.updateOne(filter, updateDoc, options);

        console.log('MongoDB operation result:', result);

        if (result.upsertedCount > 0) {
            console.log(`Successfully created a new document for course ${courseId} for teacher ${teacherId}.`);
            return res.status(201).json({ message: 'Objectives saved successfully (new document created).', result });
        } else if (result.matchedCount > 0) {
            console.log(`Successfully updated objectives for course ${courseId} for teacher ${teacherId}.`);
            return res.status(200).json({ message: 'Objectives updated successfully.', result });
        } else {
             // This case might happen if an existing document was matched but not modified because the data was the same.
            console.log(`No change needed for course ${courseId} for teacher ${teacherId}. Data was identical.`);
            return res.status(200).json({ message: 'No changes needed, objectives were already up to date.', result });
        }

    } catch (error) {
        console.error('API /courseObjectives CATCH Block Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({ message: 'Internal Server Error', errorDetails: errorMessage });
    }
} 