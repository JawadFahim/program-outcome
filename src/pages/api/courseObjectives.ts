import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../lib/mongodb';
import { DB_NAME } from '../../lib/constants';

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        try {
            const { teacherId, courseId, session, objectives } = req.body;

            if (!teacherId || !courseId || !session || !objectives || !Array.isArray(objectives)) {
                return res.status(400).json({ message: 'Missing or invalid parameters' });
            }

            const client = await connectToDatabase();
            const db = client.db(DB_NAME);
            const coursesCollection = db.collection('courses');

            // The frontend now sends the full objective structure
            const courseObjectives = objectives.map(obj => ({
                co_no: obj.co_no,
                courseObjective: obj.courseObjective,
                mappedProgramOutcome: obj.mappedProgramOutcome,
                bloomsTaxonomy: obj.bloomsTaxonomy || [],
                knowledgeProfile: obj.knowledgeProfile || [],
                complexEngineeringProblem: obj.complexEngineeringProblem || [],
                complexEngineeringActivity: obj.complexEngineeringActivity || [],
            }));

            const result = await coursesCollection.updateOne(
                { teacherId: teacherId, courseId: courseId, session: session },
                { 
                    $set: { 
                        courseObjectives: courseObjectives,
                        // Update other fields if necessary, e.g., lastModified
                        lastModified: new Date()
                    },
                    $setOnInsert: {
                        teacherId: teacherId,
                        courseId: courseId,
                        session: session,
                        // Find the courseName from the teachers collection or pass it from frontend
                        // For now, let's assume it might not be present or needed here if we match by id
                    }
                },
                { upsert: true }
            );

            if (result.upsertedCount > 0 || result.modifiedCount > 0) {
                res.status(200).json({ message: 'Course objectives saved successfully' });
            } else {
                // This case might happen if the data sent is identical to what's already in the DB.
                res.status(200).json({ message: 'No changes were made to the course objectives.' });
            }
        } catch (error) {
            console.error('Error saving course objectives:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

export default handler;