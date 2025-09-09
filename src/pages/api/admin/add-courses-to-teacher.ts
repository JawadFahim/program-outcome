// src/pages/api/admin/add-courses-to-teacher.ts
import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { DB_NAME } from '../../../lib/constants';

interface NewCourse {
    courseId: string;
    courseName: string;
    session: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { teacherId, newCourses } = req.body; // teacherId is the _id string

    if (!teacherId || !newCourses || !Array.isArray(newCourses)) {
        return res.status(400).json({ message: 'Invalid request body' });
    }

    try {
        const client = await connectToDatabase();
        const db = client.db(DB_NAME);
        const teachersCollection = db.collection('teachers');
        const coursesCollection = db.collection('courses');

        const teacher = await teachersCollection.findOne({ _id: new ObjectId(teacherId) });
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found.' });
        }

        // 1. Add courses to the `coursesTaught` array in the teacher's document.
        const coursesForTaughtArray = newCourses.map((course: NewCourse) => ({
            course_id: course.courseId,
            courseName: course.courseName,
            session: course.session,
        }));
        
        await teachersCollection.updateOne(
            { _id: new ObjectId(teacherId) },
            { $addToSet: { coursesTaught: { $each: coursesForTaughtArray } } }
        );

        // 2. Insert the new courses into the main `courses` collection.
        // This is what the UI's $lookup uses to display the courses.
        if (newCourses.length > 0) {
            const coursesToInsert = newCourses.map((course: NewCourse) => ({
                courseId: course.courseId,
                courseName: course.courseName,
                session: course.session,
                teacherId: teacher.teacherId, // Link course to the string teacherId
                courseObjectives: [], // Initialize with empty objectives
            }));
            await coursesCollection.insertMany(coursesToInsert);
        }

        res.status(200).json({ message: 'Courses added successfully.' });
    } catch (error) {
        console.error('Error adding courses to teacher:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
