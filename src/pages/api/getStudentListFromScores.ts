import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { teacherId, courseId, session, co_no } = req.query;

    if (!teacherId || !courseId || !session || !co_no) {
        return res.status(400).json({ message: 'Missing required query parameters for finding student list.' });
    }

    try {
        const client = await connectToDatabase();
        const db = client.db("BICE_course_map");

        // Find any score record for this CO to get the student list
        const anyScoreRecord = await db.collection('scores').findOne({
            teacherId: teacherId as string,
            courseId: courseId as string,
            session: session as string,
            co_no: co_no as string,
        });

        if (anyScoreRecord && anyScoreRecord.scores) {
            // We only need the student info, not their previous marks for this call
            const studentList = anyScoreRecord.scores.map((s: { studentId: string; name: string; }) => ({
                studentId: s.studentId,
                name: s.name,
            }));
            return res.status(200).json(studentList);
        } else {
            return res.status(404).json({ message: 'No student list found in any existing score records for this CO.' });
        }
    } catch (error) {
        console.error('API Error fetching student list from scores:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
} 