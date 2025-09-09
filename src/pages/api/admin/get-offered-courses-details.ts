// src/pages/api/admin/get-offered-courses-details.ts
import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { DB_NAME } from '../../../lib/constants';

interface CourseInfo {
    courseCode: string;
    versionCode: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { session, program } = req.query;

    if (!session || !program) {
        return res.status(400).json({ message: 'Session and Program are required query parameters.' });
    }

    try {
        const client = await connectToDatabase();
        const db = client.db(DB_NAME);

        // 1. Get the list of offered course codes from program_students
        const programStudentsCollection = db.collection('program_students');
        const programDoc = await programStudentsCollection.findOne({ session: session as string, program: program as string });

        if (!programDoc || !programDoc.offeredCourses || programDoc.offeredCourses.length === 0) {
            return res.status(200).json({ courses: [] });
        }
        
        const offeredCourseObjects = programDoc.offeredCourses;

        // 2. Get the course details from course_tree
        const courseTreeCollection = db.collection('course_tree');
        const courseTreeDoc = await courseTreeCollection.findOne({ program: program as string });

        if (!courseTreeDoc || !courseTreeDoc.courses) {
            return res.status(404).json({ message: 'Course tree not found for the specified program.' });
        }

        // 3. Filter the course tree to get details of only the offered courses
        const offeredCoursesDetails = courseTreeDoc.courses.filter((course: CourseInfo) => {
            return offeredCourseObjects.some((offered: CourseInfo) =>
                offered.courseCode === course.courseCode && offered.versionCode === course.versionCode
            );
        });

        res.status(200).json({ courses: offeredCoursesDetails });

    } catch (error) {
        console.error('Error fetching offered courses details:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
