import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/mongodb';
// import bcrypt from 'bcryptjs'; // Temporarily disabled for testing

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const client = await connectToDatabase();
        const db = client.db("BICE_course_map");
        const { teacherId, email, name, password, courses } = req.body;

        // Basic validation
        if (!teacherId || !email || !name || !password || !Array.isArray(courses)) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }

        // Check for duplicate teacherId or email
        const existingTeacher = await db.collection('teachers').findOne({
            $or: [{ teacherId }, { email }],
        });

        if (existingTeacher) {
            const message = existingTeacher.email === email ? 'Email already exists.' : 'Teacher ID already exists.';
            return res.status(409).json({ message });
        }

        // Password hashing disabled for testing
        // const hashedPassword = await bcrypt.hash(password, 10);

        const coursesTaught = courses.map(course => ({
            course_id: course.courseId,
            courseName: course.courseName,
            session: course.session,
        }));

        // Insert teacher with embedded coursesTaught array
        const teacherResult = await db.collection('teachers').insertOne({
            teacherId,
            email,
            name,
            password: password, // Storing plaintext password
            coursesTaught: coursesTaught,
        });
        
        // Don't proceed if teacher insert failed, though it's unlikely.
        if (!teacherResult.insertedId) {
             throw new Error('Failed to insert teacher.');
        }

        // Also insert courses into the canonical 'courses' collection for objective mapping
        if (courses.length > 0) {
            const coursesToInsert = courses.map(course => ({
                courseId: course.courseId,
                courseName: course.courseName,
                session: course.session,
                teacherId: teacherId, // Link course to teacher
                courseObjectives: [], // Initialize with empty objectives
            }));
            await db.collection('courses').insertMany(coursesToInsert);
        }

        res.status(201).json({ message: 'Teacher added successfully.' });
    } catch (error) {
        console.error('Failed to add teacher:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
} 