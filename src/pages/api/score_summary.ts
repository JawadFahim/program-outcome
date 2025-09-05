import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../lib/mongodb';
import { Db } from 'mongodb';

interface ScoreDoc {
    teacherId: string;
    courseId: string;
    session: string;
    co_no: string;
    assessmentType: string;
    passMark: string;
    scores: {
    studentId: string;
        name:string;
        obtainedMark: number | 'absent';
    }[];
}

interface AggregatedCoData {
    assessmentTypes: string[];
    finalPassMark: number;
    studentScores: Record<string, { totalMark: number; isAbsent: boolean }>;
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { teacherId, courseId, session } = req.query;

    if (!teacherId || !courseId || !session) {
        return res.status(400).json({ message: 'Missing required query parameters.' });
    }

    try {
        const client = await connectToDatabase();
        const db: Db = client.db("BICE_course_map");

        const scoreDocs = await db.collection<ScoreDoc>('scores').find({
            teacherId: teacherId as string,
            courseId: courseId as string,
            session: session as string,
        }).toArray();
        
        if (scoreDocs.length === 0) {
            return res.status(200).json({ courseObjectives: [], studentData: [], summary: {} });
        }
        
        const studentMasterList: Record<string, string> = {};
        const aggregatedData: Record<string, AggregatedCoData> = {};

        // Aggregate data in-memory
        for (const doc of scoreDocs) {
            const co = doc.co_no;
            if (!aggregatedData[co]) {
                aggregatedData[co] = {
                    assessmentTypes: [],
                    finalPassMark: 0,
                    studentScores: {},
                };
            }
            aggregatedData[co].assessmentTypes.push(doc.assessmentType);
            aggregatedData[co].finalPassMark += Number(doc.passMark);

            for (const studentScore of doc.scores) {
                const { studentId, name, obtainedMark } = studentScore;
                if (!studentMasterList[studentId]) {
                    studentMasterList[studentId] = name;
                }
                if (!aggregatedData[co].studentScores[studentId]) {
                    aggregatedData[co].studentScores[studentId] = { totalMark: 0, isAbsent: false };
                }

                if (obtainedMark === 'absent') {
                    aggregatedData[co].studentScores[studentId].isAbsent = true;
                } else {
                    aggregatedData[co].studentScores[studentId].totalMark += Number(obtainedMark);
                }
            }
        }

        // --- Final Processing and Structuring ---
        
        const courseObjectives = Object.keys(aggregatedData).sort();
        const summary: Record<string, object> = {};
        const studentDataMap: Record<string, { id: string; name: string; scores: Record<string, number>; finalCoStatus: Record<string, string> }> = {};

        // Initialize studentDataMap
        for (const studentId in studentMasterList) {
            studentDataMap[studentId] = {
                id: studentId,
                name: studentMasterList[studentId],
                scores: {},
                finalCoStatus: {},
            };
        }

            for (const co of courseObjectives) {
            const coData = aggregatedData[co];
            let passedCount = 0;
            const totalStudents = Object.keys(coData.studentScores).length;

            for (const studentId in coData.studentScores) {
                const studentResult = coData.studentScores[studentId];
                studentDataMap[studentId].scores[co] = studentResult.totalMark;
                
                if (studentResult.isAbsent) {
                    studentDataMap[studentId].finalCoStatus[co] = 'Absent';
                } else if (studentResult.totalMark >= coData.finalPassMark) {
                    studentDataMap[studentId].finalCoStatus[co] = 'Pass';
                    passedCount++;
                } else {
                    studentDataMap[studentId].finalCoStatus[co] = 'Fail';
                }
            }
            
            summary[co] = {
                total: totalStudents,
                passed: passedCount,
                percentage: totalStudents > 0 ? (passedCount / totalStudents) * 100 : 0,
                assessmentTypes: coData.assessmentTypes,
                finalPassMark: coData.finalPassMark,
            };
        }

        const finalStudentData = Object.values(studentDataMap);

        return res.status(200).json({
            courseObjectives,
            studentData: finalStudentData,
            summary,
        });

    } catch (error) {
        console.error('API Error in score_summary:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
} 