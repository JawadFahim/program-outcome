import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../lib/mongodb';

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
        const teachersCollection = db.collection('teachers');

        const filter = { 
            teacherId: teacherId, 
            "coursesTaught.course_id": courseId 
        };

        const updateDoc = {
            $set: {
                "coursesTaught.$.courseObjectives": objectives,
            },
        };
        
        const result = await teachersCollection.updateOne(filter, updateDoc);

        console.log('MongoDB operation result:', result);

        if (result.matchedCount > 0 && result.modifiedCount > 0) {
            console.log(`Successfully updated objectives for course ${courseId} for teacher ${teacherId}.`);
            return res.status(200).json({ message: 'Objectives updated successfully.', result });
        } else if (result.matchedCount > 0 && result.modifiedCount === 0) {
            console.log(`No change needed for course ${courseId} for teacher ${teacherId}. Data was identical.`);
            return res.status(200).json({ message: 'No changes needed, objectives were already up to date.', result });
        } else {
            console.log(`Could not find course ${courseId} for teacher ${teacherId} to update.`);
            return res.status(404).json({ message: 'Could not find the specified course for this teacher to update.' });
        }

    } catch (error) {
        console.error('API /courseObjectives CATCH Block Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({ message: 'Internal Server Error', errorDetails: errorMessage });
    }
} 