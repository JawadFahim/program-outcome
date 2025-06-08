import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

// --- Interfaces ---
interface CourseTaught {
    course_id: string;
    courseName: string;
}

interface CourseObjective {
    co_no: string;
    courseObjective: string;
    mappedProgramOutcome: string;
}

interface Student {
    studentId: string;
    name: string;
}

interface StudentScore {
    mark: string;
    isAbsent: boolean;
}

const AssessmentScorePage = () => {
    const router = useRouter();

    // --- State Management ---
    const [teacherName, setTeacherName] = useState<string>('Loading...');
    const [courses, setCourses] = useState<CourseTaught[]>([]);
    const [courseObjectives, setCourseObjectives] = useState<CourseObjective[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [session, setSession] = useState<string | null>(null);
    const [scores, setScores] = useState<Record<string, StudentScore>>({});
    
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedObjective, setSelectedObjective] = useState('');
    const [assessmentType, setAssessmentType] = useState('');
    const [passMark, setPassMark] = useState('');

    // UI State
    const [isLoadingCourses, setIsLoadingCourses] = useState<boolean>(true);
    const [isLoadingObjectives, setIsLoadingObjectives] = useState<boolean>(false);
    const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [modalTitle, setModalTitle] = useState<string>('');
    const [modalMessage, setModalMessage] = useState<string>('');
    const [isToastVisible, setIsToastVisible] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string>('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');
    
    // --- Data Fetching Effects ---

    useEffect(() => {
        const fetchTeacherAndCourses = async (teacherId: string) => {
            setIsLoadingCourses(true);
            try {
                const response = await fetch(`/api/teachers/${teacherId}`);
                if (!response.ok) throw new Error('Failed to fetch teacher data');
                const data = await response.json();
                setTeacherName(data.name || 'Teacher Not Found');
                setCourses(data.coursesTaught || []);
            } catch (error) {
                console.error(error);
                setTeacherName('Error fetching data');
            } finally {
                setIsLoadingCourses(false);
            }
        };

        if (router.isReady) {
            const teacherId = router.query.teacherId as string;
            if (teacherId) {
                fetchTeacherAndCourses(teacherId);
            } else {
                setTeacherName('Teacher ID not provided');
                setIsLoadingCourses(false);
            }
        }
    }, [router.isReady, router.query.teacherId]);

    useEffect(() => {
        const fetchCourseDetails = async () => {
            const teacherId = router.query.teacherId as string;
            if (selectedCourse && teacherId) {
                setIsLoadingObjectives(true);
                setIsLoadingStudents(true);
                setCourseObjectives([]);
                setStudents([]);
                setSession(null);
                setScores({});

                try {
                    const [objectivesRes, studentsRes] = await Promise.all([
                        fetch(`/api/getCourseObjectives?teacherId=${teacherId}&courseId=${selectedCourse}`),
                        fetch(`/api/getStudentList?teacherId=${teacherId}&courseId=${selectedCourse}`)
                    ]);

                    if (!objectivesRes.ok) throw new Error(`Failed to fetch objectives: ${objectivesRes.statusText}`);
                    const objectivesData = await objectivesRes.json();
                    setCourseObjectives(objectivesData || []);

                    if (!studentsRes.ok) throw new Error(`Failed to fetch students: ${studentsRes.statusText}`);
                    const studentsData = await studentsRes.json();
                    setStudents(studentsData.studentList || []);
                    setSession(studentsData.session || null);

                    if ((studentsData.studentList || []).length === 0) {
                        showToast('No students are enrolled in this course.', 'warning');
                    } else {
                        // Initialize scores state
                        const initialScores: Record<string, StudentScore> = {};
                        (studentsData.studentList || []).forEach((student: Student) => {
                            initialScores[student.studentId] = { mark: '', isAbsent: false };
                        });
                        setScores(initialScores);
                    }
                } catch (error) {
                    console.error("Failed to load course details:", error);
                    showToast('Could not load data for this course.', 'error');
                } finally {
                    setIsLoadingObjectives(false);
                    setIsLoadingStudents(false);
                }
            }
        };
        fetchCourseDetails();
    }, [selectedCourse, router.query.teacherId]);


    // --- UI Helpers ---
    const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setIsToastVisible(true);
        setTimeout(() => setIsToastVisible(false), 3300);
    };

    const closeModal = () => setIsModalOpen(false);

    // --- Event Handlers ---
    const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedCourse(e.target.value);
        setSelectedObjective('');
        setAssessmentType('');
        setPassMark('');
        setScores({});
    };
    
    const handleScoreChange = (studentId: string, value: string) => {
        setScores(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], mark: value }
        }));
    };

    const handleAbsentChange = (studentId: string, isChecked: boolean) => {
        setScores(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], isAbsent: isChecked, mark: isChecked ? '' : prev[studentId].mark }
        }));
    };

    const handleSaveScores = async () => {
        const teacherId = router.query.teacherId as string;

        // Validation
        if (!selectedCourse || !selectedObjective || !assessmentType || !passMark || !teacherId || !session) {
            showToast("Please ensure all fields (Course, Objective, Type, Pass Mark) are filled.", "error");
            return;
        }

        let allValid = true;
        const studentScores = Object.entries(scores).map(([studentId, scoreData]) => {
            if (!scoreData.isAbsent && scoreData.mark.trim() === '') {
                allValid = false;
            }
            return {
                studentId,
                obtainedMark: scoreData.isAbsent ? 'absent' : Number(scoreData.mark)
            };
        });

        if (!allValid) {
            showToast("Please fill in obtained marks for all present students.", "error");
            return;
        }
        
        setIsSaving(true);

        try {
            const response = await fetch('/api/saveScores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teacherId,
                    courseId: selectedCourse,
                    co_no: selectedObjective,
                    assessmentType,
                    passMark,
                    session,
                    scores: studentScores,
                })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Server error');

            showToast(result.message || "Scores saved successfully!", "success");

        } catch (error) {
            console.error('Failed to save scores:', error);
            showToast(error instanceof Error ? error.message : 'An unknown error occurred.', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    // --- Render Logic ---
    const showStudentSection = selectedCourse && selectedObjective && assessmentType && passMark.trim() !== '';
    const selectedObjectiveText = courseObjectives.find(co => co.co_no === selectedObjective)?.courseObjective || '';


    return (
        <>
            <Head>
                <title>Assessment Score Entry</title>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
            </Head>
            <style jsx global>{`
                :root {
                    --primary-color: #4f46e5;
                    --primary-hover: #4338ca;
                    --success-color: #10b981;
                    --warning-color: #f59e0b;
                    --error-color: #ef4444;
                    --text-primary: #111827;
                    --text-secondary: #6b7280;
                    --bg-main: #f9fafb;
                    --bg-card: #ffffff;
                    --border-color: #e5e7eb;
                    --border-radius: 0.75rem;
                    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                }

                body {
                    font-family: 'Inter', sans-serif;
                    background-color: var(--bg-main);
                    color: var(--text-primary);
                    margin: 0;
                    line-height: 1.5;
                }

                .container {
                    width: 100%;
                    max-width: 1280px;
                    margin-left: auto;
                    margin-right: auto;
                    padding: 2rem;
                    box-sizing: border-box;
                }

                .page-header {
                    background-color: var(--bg-card);
                    box-shadow: var(--shadow-lg);
                    border-radius: var(--border-radius);
                    padding: 1.5rem 2rem;
                    margin-bottom: 2rem;
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: space-between;
                    align-items: center;
                    gap: 1rem;
                }

                .page-title {
                    font-size: 1.75rem;
                    font-weight: 600;
                    color: var(--primary-color);
                }

                .teacher-info {
                    font-size: 1.125rem;
                    color: var(--text-secondary);
                }
                .teacher-info span {
                    font-weight: 500;
                    color: var(--text-primary);
                }

                .card {
                    background-color: var(--bg-card);
                    padding: 2rem;
                    border-radius: var(--border-radius);
                    box-shadow: var(--shadow-lg);
                    margin-bottom: 2rem;
                }

                .form-label {
                    display: block;
                    font-size: 1rem;
                    font-weight: 500;
                    color: var(--text-primary);
                    margin-bottom: 0.75rem;
                }

                .input-field, .select-field {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border: 1px solid var(--border-color);
                    border-radius: 0.5rem;
                    font-size: 1rem;
                    transition: all 0.2s ease-in-out;
                    box-sizing: border-box;
                    background-color: #fff;
                }

                .input-field:focus, .select-field:focus {
                    outline: none;
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
                }
                
                .select-field:disabled, .input-field:disabled {
                    background-color: #f3f4f6;
                    cursor: not-allowed;
                    color: var(--text-secondary);
                }
                
                .btn {
                    padding: 0.75rem 1.5rem;
                    border-radius: 0.5rem;
                    font-weight: 600;
                    font-size: 1rem;
                    transition: all 0.2s ease-in-out;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid transparent;
                    text-decoration: none;
                }
                .btn:disabled { opacity: 0.6; cursor: not-allowed; }
                .btn-primary { background-color: var(--primary-color); color: white; }
                .btn-primary:hover:not(:disabled) { background-color: var(--primary-hover); }

                .assessment-details-grid {
                    display: grid;
                    grid-template-columns: repeat(1, 1fr);
                    gap: 1.5rem;
                }
                @media (min-width: 1024px) {
                    .assessment-details-grid {
                        grid-template-columns: repeat(3, 1fr);
                    }
                }

                .student-scores-header {
                    margin-bottom: 1.5rem;
                }
                .student-scores-header h3 {
                    font-size: 1.5rem;
                    font-weight: 600;
                }
                .student-scores-header span {
                    color: var(--primary-color);
                    font-weight: 600;
                }

                .table-container {
                    overflow-x: auto;
                }

                .student-table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                }
                .student-table th, .student-table td {
                    padding: 1rem;
                    border-bottom: 1px solid var(--border-color);
                    vertical-align: middle;
                    white-space: nowrap;
                }
                .student-table thead th {
                    background-color: #f9fafb;
                    font-weight: 600;
                    font-size: 0.875rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .student-table tbody tr:last-child td {
                    border-bottom: none;
                }
                .student-table .input-field {
                    max-width: 100px;
                    padding: 0.5rem;
                    text-align: center;
                }
                .student-table input[type="checkbox"] {
                    width: 1.25rem;
                    height: 1.25rem;
                    border-radius: 0.25rem;
                    border: 1px solid var(--border-color);
                    cursor: pointer;
                }
                .actions-footer {
                    margin-top: 2rem;
                    display: flex;
                    justify-content: flex-end;
                }

                .message-card {
                    text-align: center;
                    padding: 4rem 2rem;
                    color: var(--text-secondary);
                }

                /* Hide number input spinners */
                input[type=number]::-webkit-inner-spin-button, 
                input[type=number]::-webkit-outer-spin-button { 
                    -webkit-appearance: none; margin: 0;
                }
                input[type=number] { -moz-appearance: textfield; }
                
                .notification-toast { position: fixed; bottom: 2rem; right: 2rem; color: white; padding: 1rem 1.5rem; border-radius: 0.5rem; box-shadow: var(--shadow-lg); transition: all 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55); opacity: 0; visibility: hidden; transform: translateY(50px); z-index: 2000; display: flex; align-items: center; }
                .notification-toast.visible { opacity: 1; visibility: visible; transform: translateY(0); }
                .toast-success { background-color: var(--success-color); }
                .toast-error { background-color: var(--error-color); }
                .toast-warning { background-color: var(--warning-color); }
            `}</style>
            
            <div className="container">
                <header className="page-header">
                    <h1 className="page-title">Assessment Score Entry</h1>
                    <div className="teacher-info">Teacher: <span>{teacherName}</span></div>
                </header>

                <main>
                    <div className="card">
                        <label htmlFor="courseSelector" className="form-label">1. Select Course</label>
                        <select id="courseSelector" className="select-field" value={selectedCourse} onChange={handleCourseChange} disabled={isLoadingCourses || courses.length === 0}>
                            <option value="">{isLoadingCourses ? "Loading courses..." : "-- Please select a course --"}</option>
                            {courses.map(course => ( <option key={course.course_id} value={course.course_id}> {course.courseName} ({course.course_id}) </option> ))}
                        </select>
                    </div>

                    {selectedCourse ? (
                        <div id="assessmentDetailsSection">
                            <div className="card">
                                <div className="assessment-details-grid">
                                    <div>
                                        <label htmlFor="courseObjectiveSelector" className="form-label">2. Course Objective</label>
                                        <select id="courseObjectiveSelector" className="select-field" value={selectedObjective} onChange={(e) => setSelectedObjective(e.target.value)} disabled={isLoadingObjectives || courseObjectives.length === 0}>
                                            <option value="">{isLoadingObjectives ? "Loading..." : "-- Select an objective --"}</option>
                                            {courseObjectives.map(obj => ( <option key={obj.co_no} value={obj.co_no}> {obj.co_no}: {obj.courseObjective} </option> ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="assessmentTypeSelector" className="form-label">3. Assessment Type</label>
                                        <select id="assessmentTypeSelector" className="select-field" value={assessmentType} onChange={(e) => setAssessmentType(e.target.value)}>
                                            <option value="">-- Select type --</option>
                                            <option value="quiz">Quiz</option>
                                            <option value="midterm">Mid Term</option>
                                            <option value="assignment">Assignment</option>
                                            <option value="final">Final</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="passMarkInput" className="form-label">4. Pass Mark</label>
                                        <input type="number" id="passMarkInput" className="input-field" placeholder="e.g., 40" min="0" max="100" value={passMark} onChange={(e) => setPassMark(e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            {showStudentSection && (
                                <div id="studentScoresSection" className="card">
                                    <div className="student-scores-header">
                                        <h3>5. Enter Student Scores for <span>{selectedObjectiveText}</span> (<span>{assessmentType}</span>)</h3>
                                    </div>
                                    <div className="table-container">
                                        <table className="student-table">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Student ID</th>
                                                    <th>Student Name</th>
                                                    <th>Obtained Mark</th>
                                                    <th className="text-center">Absent</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {isLoadingStudents ? (
                                                    <tr><td colSpan={5} className="text-center p-8">Loading student list...</td></tr>
                                                ) : students.length > 0 ? (
                                                    students.map((student, index) => (
                                                        <tr key={student.studentId}>
                                                            <td>{index + 1}</td>
                                                            <td>{student.studentId}</td>
                                                            <td>{student.name}</td>
                                                            <td>
                                                                <input 
                                                                    type="number" 
                                                                    className="input-field" 
                                                                    value={scores[student.studentId]?.mark || ''}
                                                                    onChange={(e) => handleScoreChange(student.studentId, e.target.value)}
                                                                    disabled={scores[student.studentId]?.isAbsent}
                                                                    min="0" max="100" placeholder="Mark" 
                                                                    onWheel={(e) => e.currentTarget.blur()}
                                                                />
                                                            </td>
                                                            <td className="text-center">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={scores[student.studentId]?.isAbsent || false}
                                                                    onChange={(e) => handleAbsentChange(student.studentId, e.target.checked)}
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr><td colSpan={5} className="text-center p-8">No students found for this course.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="actions-footer">
                                        <button type="button" onClick={handleSaveScores} className="btn btn-primary" disabled={isSaving}>
                                            {isSaving ? 'Saving...' : 'Save Scores'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!showStudentSection && (
                                <div id="selectObjectiveMessage" className="card message-card">
                                    <p>Please complete steps 1-4 to enter student scores.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div id="noCourseSelectedMessage" className="card message-card">
                            <p>Please select a course above to proceed.</p>
                        </div>
                    )}
                </main>

                <div 
                    id="notificationToast" 
                    className={`notification-toast ${isToastVisible ? 'visible' : ''} ${
                        toastType === 'success' ? 'toast-success' : 
                        toastType === 'error' ? 'toast-error' : 'toast-warning'
                    }`}
                >
                    <p>{toastMessage}</p>
                </div>
            </div>
        </>
    );
};

export default AssessmentScorePage;