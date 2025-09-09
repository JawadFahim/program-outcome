import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { DB_NAME } from '../../../lib/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const client = await connectToDatabase();
        const db = client.db(DB_NAME);

        // Use an aggregation pipeline to fetch teachers and their associated courses/objectives
        const pipeline = [
            {
                $lookup: {
                    from: 'courses', // The collection to join with
                    localField: 'teacherId', // Field from the teachers collection
                    foreignField: 'teacherId', // Field from the courses collection
                    as: 'courses' // Output array field
                }
            },
            {
                $addFields: {
                    courses: {
                        $ifNull: [ "$courses", [] ] // Ensure courses is always an array
                    }
                }
            },
            {
                $project: {
                    // You can specify which fields to include or exclude
                    // For example, exclude password
                    password: 0,
                }
            }
        ];
        
        const teachers = await db.collection('teachers').aggregate(pipeline).toArray();

        res.status(200).json(teachers);

    } catch (error) {
        console.error('Failed to fetch teachers:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
} 