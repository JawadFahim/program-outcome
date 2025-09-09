// src/pages/api/admin/move-students.ts
import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { DB_NAME } from '../../../lib/constants';

interface Student {
    id: string;
    name: string;
}

interface ProgramStudents {
    _id?: ObjectId;
    session: string;
    program: string;
    students: Student[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { source, target, studentsToMove } = req.body;

    if (!source || !target || !studentsToMove || !Array.isArray(studentsToMove) || studentsToMove.length === 0) {
        return res.status(400).json({ message: 'Invalid request body' });
    }

    const client = await connectToDatabase();
    const db = client.db(DB_NAME);
    const collection = db.collection<ProgramStudents>('program_students');
    
    const session = client.startSession();

    try {
        let result;
        await session.withTransaction(async () => {
            // 1. Add students to the target list
            await collection.updateOne(
                { session: target.session, program: target.program },
                { $addToSet: { students: { $each: studentsToMove } } },
                { session }
            );

            // 2. Remove students from the source list
            const studentIdsToRemove = (studentsToMove as Student[]).map(s => s.id);
            result = await collection.updateOne(
                { session: source.session, program: source.program },
                { $pull: { students: { id: { $in: studentIdsToRemove } } } },
                { session }
            );
        });
        
        session.endSession();
        res.status(200).json({ message: 'Students moved successfully.', result });

    } catch (error) {
        console.error('Error moving students:', error);
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ message: 'Internal Server Error during transaction.' });
    }
}
