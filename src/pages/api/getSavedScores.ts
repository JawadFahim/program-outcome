import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { teacherId, courseId, session, co_no, assessmentType } = req.query;

    if (!teacherId || !courseId || !session || !co_no || !assessmentType) {
        return res.status(400).json({ message: 'Missing required query parameters.' });
    }

    try {
        const client = await clientPromise;
        const db = client.db("BICE_course_map");

        const scoreRecord = await db.collection('scores').findOne({
            teacherId: teacherId as string,
            courseId: courseId as string,
            session: session as string,
            co_no: co_no as string,
            assessmentType: assessmentType as string,
        });

        if (scoreRecord) {
            return res.status(200).json(scoreRecord);
        } else {
            return res.status(404).json({ message: 'No saved scores found for the given criteria.' });
        }
    } catch (error) {
        console.error('API Error fetching saved scores:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
} 