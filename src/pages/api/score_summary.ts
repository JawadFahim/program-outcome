import clientPromise from '../../lib/mongodb';
import { NextApiRequest, NextApiResponse } from 'next';

const DB_NAME = "BICE_course_map";
const SCORES_COLLECTION = "scores";

// Define interfaces for our data structures
interface ScoreEntry {
    studentId: string;
    name: string;
    obtainedMark: number | 'absent';
}

interface Student {
    studentId: string;
    name: string;
}

interface AggregatedStudentData {
    id: string;
    name: string;
    scores: Record<string, number>;
    finalCoStatus: Record<string, 'Pass' | 'Fail' | 'Absent'>;
}

interface CoPassStats {
    total: number;
    passed: number;
    percentage: number;
}

interface ScoreDocument {
    co_no: string;
    passMark: number;
    scores: ScoreEntry[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method NotAllowed' });
    }

    const { courseId, session, teacherId } = req.query;

    if (!courseId || typeof courseId !== 'string' || !session || typeof session !== 'string' || !teacherId || typeof teacherId !== 'string') {
        return res.status(400).json({ message: 'Course ID, Session, and Teacher ID are required and must be strings' });
    }

    try {
        const client = await clientPromise;
        const db = client.db(DB_NAME);

        console.log(`[Score Summary API] Received request for teacherId: "${teacherId}", courseId: "${courseId}", session: "${session}"`);

        // 1. Fetch all score entries for the given course, teacher, and session
        const scoreEntries = await db.collection<ScoreDocument>(SCORES_COLLECTION).find({ 
            teacherId: teacherId,
            courseId: courseId,
            session: session 
        }).toArray();
        console.log(`[Score Summary API] Found ${scoreEntries.length} score entries for this course/session.`);
        
        if (scoreEntries.length === 0) {
            return res.status(200).json({ 
                courseObjectives: [],
                studentData: [],
                summary: {}
            });
        }
        
        // 2. Build a map of student IDs to names from all score entries.
        const studentNameMap = new Map<string, string>();
        for (const doc of scoreEntries) {
            for (const score of doc.scores) {
                if (!studentNameMap.has(score.studentId)) {
                    studentNameMap.set(score.studentId, score.name || score.studentId);
                }
            }
        }
        
        const studentList: Student[] = Array.from(studentNameMap.entries()).map(([id, name]) => ({
            studentId: id,
            name: name
        }));
        console.log(`[Score Summary API] Built a list of ${studentList.length} unique students from score entries.`);
        
        // 3. Aggregate scores and pass marks for each CO
        const coData = new Map<string, { totalMarks: number; totalPassMarks: number; students: Map<string, number | 'absent'> }>();

        for (const doc of scoreEntries) {
            const co = doc.co_no;
            if (!coData.has(co)) {
                coData.set(co, { totalMarks: 0, totalPassMarks: 0, students: new Map() });
            }
            const coInfo = coData.get(co)!;
            coInfo.totalPassMarks += doc.passMark; // Sum up pass marks for the CO
            
            for (const score of doc.scores) {
                const currentScore = coInfo.students.get(score.studentId) || 0;
                if (score.obtainedMark === 'absent' || currentScore === 'absent') {
                    coInfo.students.set(score.studentId, 'absent');
                } else if (typeof currentScore === 'number') {
                    coInfo.students.set(score.studentId, currentScore + score.obtainedMark);
                }
            }
        }
        
        const courseObjectives = Array.from(coData.keys()).sort();

        // 4. Consolidate into final student data structure
        const aggregatedStudentData: AggregatedStudentData[] = studentList.map(student => {
            const finalScores: Record<string, number> = {};
            const finalCoStatus: Record<string, 'Pass' | 'Fail' | 'Absent'> = {};

            for (const co of courseObjectives) {
                const coInfo = coData.get(co)!;
                const studentScore = coInfo.students.get(student.studentId);
                
                if (studentScore === 'absent') {
                    finalScores[co] = 0; // Or some other placeholder
                    finalCoStatus[co] = 'Absent';
                } else if (studentScore !== undefined) {
                    finalScores[co] = studentScore;
                    finalCoStatus[co] = studentScore >= coInfo.totalPassMarks ? 'Pass' : 'Fail';
                } else {
                    finalScores[co] = 0; // Student has no score for this CO
                    finalCoStatus[co] = 'Fail';
                }
            }
            return {
                id: student.studentId,
                name: studentNameMap.get(student.studentId) || student.studentId,
                scores: finalScores,
                finalCoStatus
            };
        });

        // 5. Calculate final summary statistics
        const summary: Record<string, CoPassStats> = {};
        for (const co of courseObjectives) {
            const passedCount = aggregatedStudentData.filter(s => s.finalCoStatus[co] === 'Pass').length;
            const totalStudents = studentList.length;
            summary[co] = {
                total: totalStudents,
                passed: passedCount,
                percentage: totalStudents > 0 ? (passedCount / totalStudents) * 100 : 0,
            };
        }

        res.status(200).json({ courseObjectives, studentData: aggregatedStudentData, summary });

    } catch (error) {
        console.error('Score Summary API Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
} 