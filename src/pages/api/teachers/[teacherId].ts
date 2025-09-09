import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { DB_NAME } from '../../../lib/constants';

interface CourseTaught {
    course_id: string;
    courseName: string;
}

interface TeacherData {
    id: string;
    name: string;
    coursesTaught: CourseTaught[];
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<TeacherData | { message: string; errorDetails?: string }>
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { teacherId } = req.query;

    if (!teacherId || typeof teacherId !== 'string') {
        return res.status(400).json({ message: 'Teacher ID is required and must be a string' });
    }

    try {
        const client = await connectToDatabase();
        const db = client.db(DB_NAME); // Ensure this is your correct database name

        console.log(`API /api/teachers: Attempting to find teacher with teacherId: "${teacherId}"`);
        const teacher = await db.collection('teachers').findOne({ teacherId: teacherId });

        if (!teacher) {
            console.log(`API /api/teachers: Teacher not found for teacherId: "${teacherId}"`);
            return res.status(404).json({ message: 'Teacher not found' });
        }

        if (!teacher.name || typeof teacher.name !== 'string') {
            console.error(`API /api/teachers: Teacher found but name is missing or not a string for teacherId: "${teacherId}"`);
            return res.status(500).json({ message: 'Teacher data incomplete in database (missing name)' });
        }
        
        // Ensure coursesTaught exists. If not, default to an empty array.
        const coursesTaught: CourseTaught[] = (teacher.coursesTaught && Array.isArray(teacher.coursesTaught)) ? teacher.coursesTaught : [];
        if (coursesTaught.length === 0) {
            console.warn(`API /api/teachers: Teacher "${teacherId}" has no courses assigned.`);
        }

        console.log(`API /api/teachers: Teacher found: ${teacher.name}`);
        const teacherData: TeacherData = {
            id: teacher.teacherId,
            name: teacher.name,
            coursesTaught: coursesTaught
        };

        return res.status(200).json(teacherData);

    } catch (error) {
        console.error('API /api/teachers CATCH Block Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({ message: 'Internal Server Error', errorDetails: errorMessage });
    }
} 