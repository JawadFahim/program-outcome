import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getTeacherIdFromAuth, removeAuthTokenCookie } from '../lib/jwt';
import Layout from '../components/Layout';

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
    assessmentTypes: string[];
    finalPassMark: number;
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
        <Layout teacherName={teacherName} onLogout={handleLogout} page="summary" title="Score Summary">
            <Head>
                <title>Final Score Summary</title>
            </Head>

            <main className="container mx-auto px-4 sm:px-6 md:px-8">
                <div className="card">
                    <label htmlFor="courseSelector" className="block text-lg font-medium text-gray-700 mb-2">Select Course:</label>
                    <select id="courseSelector" className="select-field text-base" value={selectedCourse} onChange={handleCourseChange} disabled={courses.length === 0}>
                        <option value="">{courses.length > 0 ? "-- Please select a course --" : "No courses available"}</option>
                        {Array.from(new Map(courses.map(course => [course.course_id, course])).values()).map(course => (
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
                             <table className="score-table">
                                <thead>
                                    <tr>
                                        <th className="text-center">#</th>
                                        <th className="text-center">Student ID</th>
                                        <th className="text-center">Student Name</th>
                                        {summaryData.courseObjectives.map(co => <th key={co} className="text-center">{co}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {summaryData.studentData.map((student, index) => (
                                        <tr key={student.id}>
                                            <td className="text-center">{index + 1}</td>
                                            <td className="text-center">{student.id}</td>
                                            <td className="text-center">{student.name}</td>
                                            {summaryData.courseObjectives.map(co => (
                                                <td key={co} className="text-center">
                                                    <span className={`score-badge ${student.finalCoStatus[co]?.toLowerCase()}`}>
                                                        {student.scores[co] !== undefined ? student.scores[co] : 'N/A'}
                                                    </span>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="card mt-6">
                            <h3 className="text-xl font-semibold text-gray-700 mb-3">Course Objective Pass Percentages</h3>
                            <div className="summary-stats-grid">
                                {summaryData.courseObjectives.map(co => {
                                    const stats = summaryData.summary[co];
                                    if (!stats) return null;
                                    return (
                                        <div key={co} className="stat-card">
                                            <h4 className="stat-title">{co}</h4>
                                            <p className="stat-percentage">{stats.percentage.toFixed(2)}%</p>
                                            <p className="stat-ratio">{stats.passed} / {stats.total} passed</p>
                                            <div className="stat-details-footer">
                                                <span>{stats.assessmentTypes.join(' + ')}</span>
                                                <br></br>
                                                <span>Pass Mark: {stats.finalPassMark}</span>
                                            </div>
                                        </div>
                                    )
                                })}
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
        </Layout>
    );
};

export default ScoreSummaryPage; 