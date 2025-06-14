import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getTeacherIdFromAuth, removeAuthTokenCookie } from '../lib/jwt';

// --- Interfaces ---
interface CourseTaught {
    course_id: string;
    courseName: string;
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
interface SummaryData {
    courseObjectives: string[];
    studentData: AggregatedStudentData[];
    summary: Record<string, CoPassStats>;
}


const ScoreSummaryPage = () => {
    const router = useRouter();
    const teacherId = getTeacherIdFromAuth();
    const [teacherName, setTeacherName] = useState('Loading...');
    const [courses, setCourses] = useState<CourseTaught[]>([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [sessions, setSessions] = useState<string[]>([]);
    const [selectedSession, setSelectedSession] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);
    const [summaryData, setSummaryData] = useState<SummaryData | null>(null);

    useEffect(() => {
        if (!teacherId) {
            router.replace('/login');
            return;
        }

        const fetchInitialData = async () => {
            try {
                const response = await fetch(`/api/teachers/${teacherId}`);
                if (!response.ok) throw new Error('Failed to fetch teacher data');
                const data = await response.json();
                setTeacherName(data.name || 'Teacher Not Found');
                setCourses(data.coursesTaught || []);
            } catch (error) {
                console.error(error);
                setTeacherName('Error fetching data');
            }
        };

        fetchInitialData();
    }, [teacherId, router]);

    const handleCourseChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const courseId = e.target.value;
        setSelectedCourse(courseId);
        // Reset everything downstream
        setSessions([]);
        setSelectedSession('');
        setSummaryData(null);

        if (courseId && teacherId) {
            setIsLoadingSessions(true);
            try {
                const response = await fetch(`/api/get_sessions?teacherId=${teacherId}&courseId=${courseId}`);
                if (!response.ok) throw new Error('Failed to fetch sessions');
                const data = await response.json();
                setSessions(data);
            } catch (error) {
                console.error("Failed to load sessions:", error);
                setSessions([]); // Clear on error
            } finally {
                setIsLoadingSessions(false);
            }
        }
    };
    
    const handleSessionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const session = e.target.value;
        setSelectedSession(session);
        setSummaryData(null); // Clear previous summary

        if (session && selectedCourse && teacherId) {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/score_summary?teacherId=${teacherId}&courseId=${selectedCourse}&session=${session}`);
                if (!response.ok) throw new Error('Failed to fetch summary data');
                const data = await response.json();
                setSummaryData(data);
            } catch (error) {
                console.error("Failed to load summary data:", error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleLogout = () => {
        removeAuthTokenCookie();
        router.push('/login');
    };

    const courseDisplayName = courses.find(c => c.course_id === selectedCourse)?.courseName || selectedCourse;

    return (
        <>
            <Head>
                <title>Final Score Summary</title>
            </Head>
            <style jsx global>{`
                body { font-family: 'Inter', sans-serif; background-color: #f3f4f6; }
                .card { background-color: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); margin-bottom: 1.5rem; }
                .select-field { width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; box-sizing: border-box; }
                .table-container { overflow-x: auto; }
                th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #e5e7eb; white-space: nowrap; }
                th { background-color: #f9fafb; font-weight: 600; color: #374151; text-transform: uppercase; font-size: 0.875rem; }
                .summary-table th, .summary-table td { font-weight: 500; }
                .pass { color: #10b981; font-weight: 600; }
                .fail { color: #ef4444; font-weight: 600; }
                .absent { color: #6b7280; }
                .btn { padding: 0.5rem 1rem; border-radius: 0.375rem; font-weight: 600; cursor: pointer; border: 1px solid transparent; text-decoration: none; }
                .btn-outline { background-color: transparent; color: #4f46e5; border-color: #4f46e5; }
                .btn-danger { background-color: #ef4444; color: white; }
                .loading-spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 2rem auto; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>

            <header className="bg-white shadow-md rounded-lg p-4 mb-6 mx-4 sm:mx-6 md:mx-8 mt-4">
                <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
                    <h1 className="text-2xl font-semibold text-blue-600">Final Score Summary</h1>
                    <div className="flex items-center gap-4 mt-2 sm:mt-0">
                         <button onClick={() => router.push('/homepage')} className="btn btn-outline">Back to Home</button>
                        <span className="text-lg text-gray-700">Teacher: <span className="font-medium">{teacherName}</span></span>
                        <button onClick={handleLogout} className="btn btn-danger">Logout</button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 sm:px-6 md:px-8">
                <div className="card">
                    <label htmlFor="courseSelector" className="block text-lg font-medium text-gray-700 mb-2">Select Course:</label>
                    <select id="courseSelector" className="select-field text-base" value={selectedCourse} onChange={handleCourseChange} disabled={courses.length === 0}>
                        <option value="">{courses.length > 0 ? "-- Please select a course --" : "No courses available"}</option>
                        {courses.map(course => (
                             <option key={course.course_id} value={course.course_id}>
                                {course.courseName} ({course.course_id})
                             </option>
                        ))}
                    </select>
                </div>

                <div className="card">
                    <label htmlFor="sessionSelector" className="block text-lg font-medium text-gray-700 mb-2">Select Session:</label>
                    <select 
                        id="sessionSelector" 
                        className="select-field text-base" 
                        value={selectedSession} 
                        onChange={handleSessionChange} 
                        disabled={!selectedCourse || isLoadingSessions || sessions.length === 0}
                    >
                        <option value="">
                            {isLoadingSessions ? "Loading sessions..." : 
                            !selectedCourse ? "Select a course first" : 
                            sessions.length > 0 ? "-- Please select a session --" : 
                            "No sessions found"}
                        </option>
                        {sessions.map(session => (
                            <option key={session} value={session}>{session}</option>
                        ))}
                    </select>
                </div>

                {isLoading && <div className="loading-spinner"></div>}

                {summaryData && !isLoading && (
                    <div id="scoresDisplaySection">
                         <h2 className="text-2xl font-semibold text-gray-800 mb-4">Scores for <span className="text-blue-600">{courseDisplayName}</span></h2>
                        <div className="card table-container">
                             <table className="min-w-full bg-white">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Student ID</th>
                                        <th>Student Name</th>
                                        {summaryData.courseObjectives.map(co => <th key={co}>{co}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {summaryData.studentData.map((student, index) => (
                                        <tr key={student.id}>
                                            <td>{index + 1}</td>
                                            <td>{student.id}</td>
                                            <td>{student.name}</td>
                                            {summaryData.courseObjectives.map(co => (
                                                <td key={co} className={student.finalCoStatus[co]?.toLowerCase()}>{student.scores[co]}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="card mt-6">
                            <h3 className="text-xl font-semibold text-gray-700 mb-3">Course Objective Pass Percentages</h3>
                            <div className="table-container">
                                <table className="min-w-full bg-white summary-table">
                                    <thead>
                                        <tr>
                                            {summaryData.courseObjectives.map(co => <th key={co}>{co}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            {summaryData.courseObjectives.map(co => {
                                                const stats = summaryData.summary[co];
                                                return (
                                                    <td key={co}>
                                                        {stats.percentage.toFixed(2)}% 
                                                        <span className="text-gray-500 text-sm ml-1">({stats.passed}/{stats.total})</span>
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {!selectedCourse && !isLoading && (
                    <div id="noCourseSelectedMessage" className="card text-center text-gray-500">
                        <p>Please select a course to view the final scores.</p>
                    </div>
                )}
                 {summaryData && summaryData.studentData.length === 0 && !isLoading &&(
                     <div className="card text-center text-gray-500">
                         <p>No score data found for the selected course.</p>
                     </div>
                 )}
            </main>
        </>
    );
};

export default ScoreSummaryPage; 