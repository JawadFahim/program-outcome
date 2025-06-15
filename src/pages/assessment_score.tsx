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
    const [teacherId, setTeacherId] = useState<string | null>(null);
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
    const [isToastVisible, setIsToastVisible] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string>('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');
    
    // --- Data Fetching Effects ---

    useEffect(() => {
        // Get teacherId from JWT on component mount
        const id = getTeacherIdFromAuth();
        if (id) {
            setTeacherId(id);
        } else {
            router.replace('/login');
        }
    }, [router]);

    useEffect(() => {
        const fetchTeacherName = async () => {
            if (!teacherId) return;

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
        fetchTeacherName();
    }, [teacherId]);

    useEffect(() => {
        const fetchCourseDetails = async () => {
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
    }, [selectedCourse, teacherId]);


    // --- UI Helpers ---
    const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setIsToastVisible(true);
        setTimeout(() => setIsToastVisible(false), 3300);
    };

    // const closeModal = () => setIsModalOpen(false);

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
        if (!teacherId) {
            showToast("Authentication error. Please log in again.", "error");
            router.push('/login');
            return;
        }

        // Validation
        if (!selectedCourse || !selectedObjective || !assessmentType || !passMark || !teacherId || !session) {
            showToast("Please ensure all fields (Course, Objective, Type, Pass Mark) are filled.", "error");
            return;
        }

        const studentNameMap = new Map(students.map(s => [s.studentId, s.name]));

        let allValid = true;
        const studentScores = Object.entries(scores).map(([studentId, scoreData]) => {
            if (!scoreData.isAbsent && scoreData.mark.trim() === '') {
                allValid = false;
            }
            return {
                studentId,
                name: studentNameMap.get(studentId),
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
    
    const handleLogout = () => {
        removeAuthTokenCookie();
        router.push('/login');
    };

    // --- Render Logic ---
    const showStudentSection = selectedCourse && selectedObjective && assessmentType && passMark.trim() !== '';
    const selectedObjectiveText = courseObjectives.find(co => co.co_no === selectedObjective)?.courseObjective || '';


    return (
        <Layout teacherName={teacherName} onLogout={handleLogout} page="assessment" title="Assessment Score">
            <Head>
                <title>Assessment Score Entry</title>
            </Head>
            
            <div className="container">
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
        </Layout>
    );
};

export default AssessmentScorePage;