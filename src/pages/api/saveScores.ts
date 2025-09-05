import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const {
            teacherId,
            courseId,
            co_no,
            assessmentType,
            passMark,
            session,
            scores
        } = req.body;

        // Basic validation
        if (!teacherId || !courseId || !co_no || !assessmentType || !passMark || !session || !scores) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }

        const client = await connectToDatabase();
        const db = client.db("BICE_course_map");
        const scoresCollection = db.collection('scores');
        
        const newScoreEntry = {
            teacherId,
            courseId,
            co_no,
            assessmentType,
            passMark: Number(passMark),
            session,
            scores, // Array of { studentId, name, obtainedMark }
            createdAt: new Date(),
        };

        // For now, we are inserting a new document every time.
        // Later, we might want to "upsert" based on teacher, course, co, and assessment type.
        const result = await scoresCollection.insertOne(newScoreEntry);

        if (result.acknowledged) {
            console.log(`Scores saved successfully. Document ID: ${result.insertedId}`);
            res.status(201).json({ message: 'Scores saved successfully!', id: result.insertedId });
        } else {
            throw new Error("Failed to insert document into database.");
        }

    } catch (error) {
        console.error('API /saveScores CATCH Block Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
        res.status(500).json({ message: 'Failed to save scores.', error: errorMessage });
    }
} 