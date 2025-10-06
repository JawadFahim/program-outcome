import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../lib/mongodb';
import { Db } from 'mongodb';
import { DB_NAME } from '../../lib/constants';

// Define a type for the score data for better type-checking
interface SavedScoreData {
    assessmentType: string;
    totalScore: string;
    passMark: string;
    scores: {
        studentId: string;
        name: string;
        obtainedMark: number | 'absent';
    }[];
    // include any other fields that are part of the document
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { teacherId, courseId, session, co_no } = req.query;

    if (!teacherId || !courseId || !session || !co_no) {
        return res.status(400).json({ message: 'Missing required query parameters.' });
    }

    try {
        const client = await connectToDatabase();
        const db: Db = client.db(DB_NAME);

        const savedAssessments = await db.collection<SavedScoreData>('scores').find({
            teacherId: teacherId as string,
            courseId: courseId as string,
            session: session as string,
            co_no: co_no as string,
        }).toArray();

        // The query returns an array of documents.
        // It could be empty if no assessments are saved for this CO.
        return res.status(200).json(savedAssessments);
        
    } catch (error) {
        console.error('API Error fetching assessments for CO:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
} 