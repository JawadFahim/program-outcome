import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../lib/mongodb';
import { DB_NAME } from '../../lib/constants';

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

    const { courseId, session } = req.query; // teacherId is no longer used

    if (!courseId || !session || typeof courseId !== 'string' || typeof session !== 'string') {
        return res.status(400).json({ message: 'courseId and session are required query parameters.' });
    }

    try {
        const client = await connectToDatabase();
        const db = client.db(DB_NAME);
        const programStudentsCollection = db.collection('program_students');

        console.log(`--- GET STUDENT LIST API HIT (New Logic) ---`);
        console.log(`Searching for courseId: "${courseId}" and session: "${session}" in 'program_students' collection.`);

        const programDocument = await programStudentsCollection.findOne({
            session: session,
            'offeredCourses.courseCode': courseId
        });

        if (programDocument && Array.isArray(programDocument.students)) {
            console.log(`Found document. Returning ${programDocument.students.length} students for session ${programDocument.session}.`);

            const studentList = programDocument.students.map((student: { id: string, name: string }) => ({
                studentId: student.id,
                name: student.name
            }));

            res.status(200).json({
                studentList: studentList,
                session: programDocument.session || null
            });
        } else {
            console.log(`No student list found for this course/session combination in program_students. Returning empty.`);
            res.status(200).json({ studentList: [], session: null });
        }

    } catch (error) {
        console.error('API /getStudentList CATCH Block Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ message: 'Internal Server Error', errorDetails: errorMessage });
    }
} 