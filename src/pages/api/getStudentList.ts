import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../lib/mongodb';

interface Student {
    studentId: string;
    name: string;
}

interface StudentListData {
    studentList: Student[];
    session: string | null;
}

interface ErrorResponse {
    message: string;
    errorDetails?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<StudentListData | ErrorResponse>
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { teacherId, courseId, session } = req.query;

    if (!teacherId || !courseId || !session || typeof teacherId !== 'string' || typeof courseId !== 'string' || typeof session !== 'string') {
        return res.status(400).json({ message: 'teacherId, courseId, and session are required query parameters.' });
    }

    try {
        const client = await connectToDatabase();
        const db = client.db("BICE_course_map");
        const studentsCollection = db.collection('students');

        console.log(`--- GET STUDENT LIST API HIT ---`);
        console.log(`Searching for teacherId: "${teacherId}", courseId: "${courseId}", and session: "${session}" in 'students' collection.`);

        const studentDocument = await studentsCollection.findOne({ 
            teacherId: teacherId, 
            courseId: courseId,
            session: session
        });

        if (studentDocument && Array.isArray(studentDocument.studentList)) {
            console.log(`Found document. Returning ${studentDocument.studentList.length} students for session ${studentDocument.session}.`);
            res.status(200).json({
                studentList: studentDocument.studentList,
                session: studentDocument.session || null
            });
        } else {
            console.log(`No student list found for this teacher/course combination. Returning empty.`);
            res.status(200).json({ studentList: [], session: null });
        }

    } catch (error) {
        console.error('API /getStudentList CATCH Block Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ message: 'Internal Server Error', errorDetails: errorMessage });
    }
} 