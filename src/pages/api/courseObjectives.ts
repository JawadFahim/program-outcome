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
    session: string;
    objectives: Objective[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { teacherId, courseId, session, objectives } = req.body as RequestBody;

    console.log('--- SAVE OBJECTIVES API HIT ---');
    console.log('Received teacherId:', teacherId);
    console.log('Received courseId:', courseId);
    console.log('Received session:', session);
    console.log('Received objectives count:', objectives?.length);

    if (!teacherId || !courseId || !session || !objectives || !Array.isArray(objectives) || objectives.length === 0) {
        return res.status(400).json({ message: 'Missing or invalid data: teacherId, courseId, session, and a non-empty objectives array are required.' });
    }

    try {
        const client = await clientPromise;
        const db = client.db("BICE_course_map");
        const coursesCollection = db.collection('courses');

        const filter = { 
            teacherId: teacherId, 
            courseId: courseId,
            session: session
        };

        const updateDoc = {
            $set: {
                courseObjectives: objectives,
            },
            $setOnInsert: {
                teacherId: teacherId,
                courseId: courseId,
                session: session
            }
        };
        
        const result = await coursesCollection.updateOne(filter, updateDoc, { upsert: true });

        console.log('MongoDB operation result:', result);

        if (result.upsertedCount > 0) {
            console.log(`Successfully created a new course document for ${courseId}.`);
            return res.status(201).json({ message: 'Objectives saved successfully in a new document.', result });
        } else if (result.modifiedCount > 0) {
            console.log(`Successfully updated objectives for course ${courseId}.`);
            return res.status(200).json({ message: 'Objectives updated successfully.', result });
        } else if (result.matchedCount > 0 && result.modifiedCount === 0) {
            console.log(`No change needed for course ${courseId}. Data was identical.`);
            return res.status(200).json({ message: 'No changes needed, objectives were already up to date.', result });
        } else {
            // This case should ideally not be reached with upsert: true, but it's good practice to have it.
            console.log(`Could not find or update course ${courseId}.`);
            return res.status(404).json({ message: 'Could not find the specified course to update.' });
        }

    } catch (error) {
        console.error('API /courseObjectives CATCH Block Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({ message: 'Internal Server Error', errorDetails: errorMessage });
    }
} 