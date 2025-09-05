import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

interface Score {
    studentId: string;
    name: string;
    obtainedMark: number | string;
}

interface ScoreDoc {
    _id: ObjectId;
    teacherId: string;
    courseId: string;
    co_no: string;
    assessmentType: string;
    passMark: number;
    session: string;
    scores: Score[];
    po_no?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { studentId } = req.query;
    console.log(`[API RERUN] Received request for studentId: ${studentId}`);

    // Stricter validation: ensure studentId is a non-empty string
    if (!studentId || typeof studentId !== 'string' || studentId.trim() === '') {
        return res.status(400).json({ message: 'A non-empty Student ID is required' });
    }

    try {
        const client = await connectToDatabase();
        const db = client.db("BICE_course_map");
        const scoresCollection = db.collection<ScoreDoc>('scores');

        // Find all documents where the student's ID is in the scores array
        const results = await scoresCollection.find({ 'scores.studentId': studentId }).toArray();

        if (!results || results.length === 0) {
            console.log(`[API RERUN] No documents found for studentId: ${studentId}`);
            return res.status(404).json({ message: 'No records found for this student ID' });
        }

        // For each document, extract the relevant info for that specific student
        const studentData = results.map(doc => {
            const studentScore = doc.scores.find(s => s.studentId === studentId);

            if (!studentScore) {
                return null;
            }

            return {
                _id: doc._id.toString(),
                teacherId: doc.teacherId,
                courseId: doc.courseId,
                co_no: doc.co_no,
                assessmentType: doc.assessmentType,
                passMark: doc.passMark,
                po_no: doc.po_no || 'N/A',
                session: doc.session,
                obtainedMark: studentScore.obtainedMark,
                studentName: studentScore.name,
            };
        }).filter(Boolean);

        console.log(`[API RERUN] Found and processed ${studentData.length} records for studentId: ${studentId}`);
        if (studentData.length > 0) {
            console.log('[API RERUN] First processed record:', JSON.stringify(studentData[0], null, 2));
        }

        res.status(200).json(studentData);

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
} 