import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../lib/mongodb';

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

    const { teacherId, courseId } = req.query;

    if (!teacherId || !courseId || typeof teacherId !== 'string' || typeof courseId !== 'string') {
        return res.status(400).json({ message: 'teacherId and courseId are required query parameters.' });
    }

    try {
        const client = await clientPromise;
        const db = client.db("BICE_course_map");
        const teachersCollection = db.collection('teachers');

        console.log(`--- GET STUDENT LIST API HIT ---`);
        console.log(`Searching for teacherId: "${teacherId}"`);

        const teacherDocument = await teachersCollection.findOne({ teacherId: teacherId });

        if (teacherDocument) {
            const course = teacherDocument.coursesTaught?.find((c: any) => c.course_id === courseId);
            if (course && Array.isArray(course.studentList)) {
                console.log(`Found course. Returning ${course.studentList.length} students for session ${course.session}.`);
                res.status(200).json({
                    studentList: course.studentList,
                    session: course.session || null
                });
            } else {
                 console.log(`Course ${courseId} not found for teacher or student list is missing. Returning empty.`);
                res.status(200).json({ studentList: [], session: null });
            }
        } else {
            console.log('No teacher document found for this teacherId. Returning empty array.');
            res.status(404).json({ message: 'Teacher not found.' });
        }

    } catch (error) {
        console.error('API /getStudentList CATCH Block Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ message: 'Internal Server Error', errorDetails: errorMessage });
    }
} 