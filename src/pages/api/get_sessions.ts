import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { teacherId, courseId } = req.query;
    console.log(`[Get Sessions API] Received request for teacherId: "${teacherId}", courseId: "${courseId}"`);

    if (!teacherId || !courseId || typeof teacherId !== 'string' || typeof courseId !== 'string') {
        return res.status(400).json({ message: 'teacherId and courseId are required query parameters.' });
    }

    try {
        const client = await connectToDatabase();
        const db = client.db("BICE_course_map");
        
        // Using an aggregation pipeline, which is supported by the Stable API
        const pipeline = [
            { $match: { teacherId: teacherId, courseId: courseId } },
            { $group: { _id: '$session' } },
            { $sort: { _id: -1 } } // Sort descending, so '2022-23' comes before '2021-22'
        ];
        console.log('[Get Sessions API] Executing aggregation pipeline:', JSON.stringify(pipeline));

        const result = await db.collection('scores').aggregate(pipeline).toArray();
        console.log(`[Get Sessions API] Aggregation returned ${result.length} documents.`);
        console.log('[Get Sessions API] Full result:', JSON.stringify(result));
        
        const sessions = result.map(item => item._id);
        console.log('[Get Sessions API] Extracted sessions:', JSON.stringify(sessions));

        res.status(200).json(sessions);

    } catch (error) {
        console.error('API /get_sessions Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
} 