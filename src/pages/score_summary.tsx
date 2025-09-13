import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getTeacherIdFromAuth, removeAuthTokenCookie } from '../lib/jwt';
import Layout from '../components/Layout';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import PieChart from '../components/PieChart';

interface jsPDFWithAutoTable extends jsPDF {
    lastAutoTable?: {
        finalY?: number;
    };
}

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
    const [openSelects, setOpenSelects] = useState<Record<string, boolean>>({});

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
                
                // Pre-load all unique sessions from all courses
                const allSessions = data.coursesTaught?.map((c: CourseTaught) => c.session) || [];
                const uniqueSessions = [...new Set(allSessions)] as string[];
                uniqueSessions.sort((a, b) => b.localeCompare(a));
                setSessions(uniqueSessions);
            } catch (error) {
                console.error(error);
                setTeacherName('Error fetching data');
            }
        };

        fetchInitialData();

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.custom-select')) {
                setOpenSelects({});
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [teacherId, router]);

    const toggleSelect = (id: string) => {
        setOpenSelects(prev => ({
            ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
            [id]: !prev[id],
        }));
    };

    const handleCourseChange = async (courseId: string) => {
        setSelectedCourse(courseId);
        // Reset downstream state but keep sessions loaded
        setSelectedSession('');
        setSummaryData(null);
        setOpenSelects({});
    };
    
    const handleSessionChange = async (session: string) => {
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
        setOpenSelects({});
    };

    const handleLogout = () => {
        removeAuthTokenCookie();
        router.push('/login');
    };

    const generatePdf = () => {
        if (!summaryData) return;

        const doc: jsPDFWithAutoTable = new jsPDF();

        // Title
        doc.setFontSize(20);
        doc.text("Score Summary", 14, 22);

        // Course Details
        doc.setFontSize(12);
        doc.text(`Course: ${courseDisplayName} (${selectedCourse})`, 14, 32);
        doc.text(`Session: ${selectedSession}`, 14, 38);
        doc.text(`Teacher: ${teacherName}`, 14, 44);

        // Student Scores Table
        const studentTableHead = [['#', 'Student ID', 'Student Name', ...summaryData.courseObjectives]];
        const studentTableBody = summaryData.studentData.map((student, index) => [
            index + 1,
            student.id,
            student.name,
            ...summaryData.courseObjectives.map(co => {
                const score = student.scores[co];
                const status = student.finalCoStatus[co];
                if (score === undefined || score === null) return 'N/A';
                return `${score} (${status})`;
            })
        ]);

        autoTable(doc, {
            head: studentTableHead,
            body: studentTableBody,
            startY: 50,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] }, // Darker Blue
            styles: { halign: 'center' },
        });

        // CO Summary Table
        const finalY = doc.lastAutoTable?.finalY ?? 50;
        doc.setFontSize(16);
        doc.text("Course Objective Pass Percentages", 14, finalY + 12);

        const summaryTableHead = [['CO', 'Pass %', 'Passed/Total', 'Assessment Types', 'Total Pass Mark']];
        const summaryTableBody = summaryData.courseObjectives.map(co => {
            const stats = summaryData.summary[co];
            if (!stats) return [];
            return [
                co,
                `${stats.percentage.toFixed(2)}%`,
                `${stats.passed} / ${stats.total}`,
                stats.assessmentTypes.join(' + '),
                stats.finalPassMark
            ];
        }).filter(row => row.length > 0);

        autoTable(doc, {
            head: summaryTableHead,
            body: summaryTableBody,
            startY: finalY + 16,
            theme: 'striped',
            headStyles: { fillColor: [22, 160, 133] }, // Teal
            styles: { halign: 'center' },
        });
        
        doc.save(`${courseDisplayName.replace(/\s+/g, '_')}_${selectedSession}_Summary.pdf`);
    };

    const courseDisplayName = courses.find(c => c.course_id === selectedCourse)?.courseName || selectedCourse;

    return (
        <Layout teacherName={teacherName} onLogout={handleLogout} page="summary" title="Score Summary">
            <Head>
                <title>Final Score Summary</title>
            </Head>

            <main className="container">
                <div className="card">
                    <div className="dropdown-grid">
                        <div className="dropdown-item">
                            <label htmlFor="courseSelector" className="form-label">1. Select Course</label>
                            <div className="custom-select">
                                <button
                                    id="courseSelector"
                                    type="button"
                                    className={`custom-select-toggle ${courses.length === 0 ? 'disabled' : ''}`}
                                    onClick={() => toggleSelect('course')}
                                    disabled={courses.length === 0}
                                >
                                    <span className={!selectedCourse ? 'placeholder' : ''}>
                                        {selectedCourse
                                            ? courses.find(c => c.course_id === selectedCourse)?.courseName + ` (${selectedCourse})`
                                            : courses.length > 0 ? "-- Please select a course --" : "No courses available"
                                        }
                                    </span>
                                </button>
                                {openSelects['course'] && (
                                    <ul className="custom-select-options">
                                        {Array.from(new Map(courses.map(course => [course.course_id, course])).values()).map(course => (
                                             <li key={course.course_id} className={`custom-select-option ${selectedCourse === course.course_id ? 'selected' : ''}`} onClick={() => handleCourseChange(course.course_id)}>
                                        {course.courseName} ({course.course_id})
                                             </li>
                                ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div className="dropdown-item">
                            <label htmlFor="sessionSelector" className="form-label">2. Select Session</label>
                            <div className="custom-select">
                                <button
                                id="sessionSelector" 
                                    type="button"
                                    className={`custom-select-toggle ${!selectedCourse || sessions.length === 0 ? 'disabled' : ''}`}
                                    onClick={() => toggleSelect('session')}
                                disabled={!selectedCourse || sessions.length === 0}
                            >
                                    <span className={!selectedSession ? 'placeholder' : ''}>
                                        {!selectedCourse ? "Select course first" : 
                                            selectedSession ? selectedSession :
                                            sessions.filter(session => 
                                                courses.some(c => c.course_id === selectedCourse && c.session === session)
                                            ).length > 0 ? "-- Select a session --" : 
                                            "No sessions found"
                                        }
                                    </span>
                                </button>
                                {openSelects['session'] && selectedCourse && (
                                    <ul className="custom-select-options">
                                        {sessions.filter(session => 
                                            courses.some(c => c.course_id === selectedCourse && c.session === session)
                                        ).map(session => (
                                            <li key={session} className={`custom-select-option ${selectedSession === session ? 'selected' : ''}`} onClick={() => handleSessionChange(session)}>{session}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {isLoading && <div className="loading-spinner"></div>}

                {summaryData && !isLoading && (
                    <div id="scoresDisplaySection">
                         <div className="summary-header">
                            <h2 className="summary-title">Scores for <span>{courseDisplayName}</span></h2>
                            <button onClick={generatePdf} className="btn btn-primary" disabled={!summaryData || summaryData.studentData.length === 0}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm6 10a.75.75 0 01-.75-.75V8.707l-1.72 1.72a.75.75 0 01-1.06-1.06l3-3a.75.75 0 011.06 0l3 3a.75.75 0 11-1.06 1.06l-1.72-1.72V11.25A.75.75 0 0110 12z" clipRule="evenodd" />
                                </svg>
                                Generate PDF
                            </button>
                        </div>
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
                                                        {student.finalCoStatus[co] === 'Absent'
                                                            ? 'Absent'
                                                            : student.scores[co] !== undefined
                                                                ? student.scores[co]
                                                                : 'N/A'}
                                                    </span>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="card">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Course Objective Pass Percentages</h3>
                            <div className="summary-stats-grid">
                                            {summaryData.courseObjectives.map(co => {
                                                const stats = summaryData.summary[co];
                                                if (!stats) return null;

                                                const absentCount = summaryData.studentData.filter(
                                                    student => student.finalCoStatus[co] === 'Absent'
                                                ).length;

                                                const failedCount = stats.total - stats.passed - absentCount;
                                                
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
                                            <PieChart passed={stats.passed} failed={failedCount} absent={absentCount} />
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