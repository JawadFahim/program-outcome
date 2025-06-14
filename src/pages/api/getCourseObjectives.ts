import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../lib/mongodb';

interface Objective {
    co_no: string;
    courseObjective: string;
    mappedProgramOutcome: string;
}

interface ErrorResponse {
    message: string;
    errorDetails?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Objective[] | ErrorResponse>
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { teacherId, courseId } = req.query;

    if (!teacherId || !courseId || typeof teacherId !== 'string' || typeof courseId !== 'string') {
        return res.status(400).json({ message: 'teacherId and courseId are required query parameters.' });
    }

    try {
        const client = await clientPromise;
        const db = client.db("BICE_course_map");
        const coursesCollection = db.collection('courses');

        console.log(`--- GET OBJECTIVES API HIT ---`);
        console.log(`Searching for teacherId: "${teacherId}", courseId: "${courseId}"`);

        const courseDocument = await coursesCollection.findOne({ teacherId, courseId });

        if (courseDocument) {
            console.log(`Found document. Returning ${courseDocument.courseObjectives?.length || 0} objectives.`);
            // Return the objectives array, or an empty array if it doesn't exist for some reason
            res.status(200).json(courseDocument.courseObjectives || []);
        } else {
            console.log('No document found for this teacher/course combination. Returning empty array.');
            // If no document exists, it means no objectives have been saved yet. Return an empty array.
            res.status(200).json([]);
        }

    } catch (error) {
        console.error('API /getCourseObjectives CATCH Block Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ message: 'Internal Server Error', errorDetails: errorMessage });
    }
} 