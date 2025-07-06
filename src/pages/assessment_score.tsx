import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getTeacherIdFromAuth, removeAuthTokenCookie } from '../lib/jwt';
import Layout from '../components/Layout';

// --- Interfaces ---
interface CourseTaught {
    course_id: string;
    courseName: string;
    session: string;
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

// This represents the state for a single assessment panel (new or existing)
interface AssessmentEntry {
    id: string; // Unique ID for the panel (assessmentType for saved, generated for new)
    assessmentType: string;
    passMark: string;
    scores: Record<string, StudentScore>;
    isSavedInDb: boolean;
    isEditing: boolean;
}

interface SavedScoreData {
    assessmentType: string;
    passMark: string;
    scores: {
        studentId: string;
        name: string;
        obtainedMark: number | 'absent';
    }[];
}

const AssessmentScorePage = () => {
    const router = useRouter();
    const [teacherId, setTeacherId] = useState<string | null>(null);
    const [teacherName, setTeacherName] = useState<string>('Loading...');
    const [courses, setCourses] = useState<CourseTaught[]>([]);
    const [courseObjectives, setCourseObjectives] = useState<CourseObjective[]>([]);
    // This will hold the master student list for the selected course/session/CO
    const [students, setStudents] = useState<Student[]>([]);
    const [session, setSession] = useState<string | null>(null);
    
    // This state now manages all assessment panels on the page
    const [assessmentEntries, setAssessmentEntries] = useState<AssessmentEntry[]>([]);
    
    const [selectedCourse, setSelectedCourse] = useState('');
    const [sessions, setSessions] = useState<string[]>([]);
    const [selectedSession, setSelectedSession] = useState('');
    const [selectedObjective, setSelectedObjective] = useState('');

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
        const fetchCourseObjectives = async () => {
            if (selectedCourse && teacherId && selectedSession) {
                setIsLoadingObjectives(true);
                setCourseObjectives([]);
                setSelectedObjective('');
                setStudents([]);
                setSession(null);
                setAssessmentEntries([]);

                try {
                    const objectivesRes = await fetch(`/api/getCourseObjectives?teacherId=${teacherId}&courseId=${selectedCourse}&session=${selectedSession}`);

                    if (!objectivesRes.ok) throw new Error(`Failed to fetch objectives: ${objectivesRes.statusText}`);
                    const objectivesData = await objectivesRes.json();
                    setCourseObjectives(objectivesData || []);
                } catch (error) {
                    console.error("Failed to load course objectives:", error);
                    showToast('Could not load objectives for this course.', 'error');
                } finally {
                    setIsLoadingObjectives(false);
                }
            } else {
                setCourseObjectives([]);
                setSelectedObjective('');
            }
        };
        fetchCourseObjectives();
    }, [selectedCourse, selectedSession, teacherId]);

    useEffect(() => {
        const fetchAssessmentsAndStudents = async () => {
            if (selectedObjective && selectedCourse && teacherId && selectedSession) {
                setIsLoadingStudents(true);
                setAssessmentEntries([]);
                setStudents([]);

                try {
                    // Step 1: Fetch the master student list for the course. This is always the source of truth for who is in the class.
                    const studentListRes = await fetch(
                        `/api/getStudentList?teacherId=${teacherId}&courseId=${selectedCourse}&session=${selectedSession}`,
                        { cache: 'no-store' }
                    );
                    if (!studentListRes.ok) throw new Error('Failed to fetch the master student list.');
                    
                    const studentsData = await studentListRes.json();
                    const studentList: Student[] = studentsData.studentList || [];
                    setStudents(studentList);
                    setSession(studentsData.session || null);

                    if (studentList.length === 0) {
                        showToast('No students are enrolled in this course.', 'warning');
                        setIsLoadingStudents(false);
                        return;
                    }

                    // Step 2: Concurrently, fetch all saved assessments for this CO
                    const assessmentsRes = await fetch(`/api/getAssessmentsForCO?teacherId=${teacherId}&courseId=${selectedCourse}&session=${selectedSession}&co_no=${selectedObjective}`);
                    if (!assessmentsRes.ok) throw new Error('Failed to fetch saved assessments');
                    
                    const savedAssessments: SavedScoreData[] = await assessmentsRes.json();

                    if (savedAssessments.length > 0) {
                        // Create a panel for each saved assessment, populating scores against the master student list
                        const loadedEntries: AssessmentEntry[] = savedAssessments.map(data => {
                            const initialScores: Record<string, StudentScore> = {};
                            // Initialize scores for all students from the master list
                            studentList.forEach(student => {
                                initialScores[student.studentId] = { mark: '', isAbsent: false };
                            });
                            // Then, fill in the marks for students who have saved scores
                            data.scores.forEach(s => {
                                if (initialScores[s.studentId]) {
                                    initialScores[s.studentId] = {
                                        mark: s.obtainedMark === 'absent' ? '' : String(s.obtainedMark),
                                        isAbsent: s.obtainedMark === 'absent',
                                    };
                                }
                            });
                            return {
                                id: data.assessmentType,
                                assessmentType: data.assessmentType,
                                passMark: data.passMark,
                                scores: initialScores,
                                isSavedInDb: true,
                                isEditing: false,
                            };
                        });
                        setAssessmentEntries(loadedEntries);
                        showToast(`Loaded ${loadedEntries.length} saved assessment(s).`, 'success');

                    } else {
                        // No saved assessments found, so create one blank panel for the user to fill out
                        const initialScores: Record<string, StudentScore> = {};
                        studentList.forEach(student => {
                            initialScores[student.studentId] = { mark: '', isAbsent: false };
                        });
                        const newEntry: AssessmentEntry = {
                            id: 'new-0',
                            assessmentType: '',
                            passMark: '',
                            scores: initialScores,
                            isSavedInDb: false,
                            isEditing: true,
                        };
                        setAssessmentEntries([newEntry]);
                    }
                } catch (error) {
                    console.error("Failed to load student/score details:", error);
                    showToast('An error occurred while loading data.', 'error');
                } finally {
                    setIsLoadingStudents(false);
                }
            }
        };

        fetchAssessmentsAndStudents();
    }, [selectedObjective, selectedCourse, selectedSession, teacherId]);


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
        const newCourseValue = e.target.value;
        setSelectedCourse(newCourseValue);
        // Reset downstream state
        setSelectedSession('');
        setSessions([]);
        setCourseObjectives([]);
        setSelectedObjective('');
        setAssessmentEntries([]);

        if (newCourseValue) {
            const courseSessions = courses
                .filter(c => c.course_id === newCourseValue)
                .map(c => c.session)
                .filter((session, index, self) => self.indexOf(session) === index);
            setSessions(courseSessions);
        }
    };
    
    const handleSessionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedSession(e.target.value);
        // Reset fields that depend on session
        setCourseObjectives([]);
        setSelectedObjective('');
        setAssessmentEntries([]);
    };
    
    const handleScoreChange = (entryId: string, studentId: string, value: string) => {
        setAssessmentEntries(prev => prev.map(entry => 
            entry.id === entryId 
                ? { ...entry, scores: { ...entry.scores, [studentId]: { ...entry.scores[studentId], mark: value } } }
                : entry
        ));
    };
    
    const handleAbsentChange = (entryId: string, studentId: string, isChecked: boolean) => {
        setAssessmentEntries(prev => prev.map(entry => {
            if (entry.id !== entryId) return entry;
            const newScores = { ...entry.scores };
            newScores[studentId] = { ...newScores[studentId], isAbsent: isChecked, mark: isChecked ? '' : newScores[studentId].mark };
            return { ...entry, scores: newScores };
        }));
    };

    const handleFieldChange = (entryId: string, field: 'assessmentType' | 'passMark', value: string) => {
        setAssessmentEntries(prev => prev.map(entry => 
            entry.id === entryId ? { ...entry, [field]: value } : entry
        ));
    };
    
    const handleEditToggle = (entryId: string) => {
        setAssessmentEntries(prev => prev.map(entry =>
            entry.id === entryId ? { ...entry, isEditing: !entry.isEditing } : entry
        ));
    };

    const handleAddNewAssessment = () => {
        if (students.length === 0) {
            showToast("Student list not available. Cannot add new assessment.", "error");
            return;
        }
        const initialScores: Record<string, StudentScore> = {};
        students.forEach(student => {
            initialScores[student.studentId] = { mark: '', isAbsent: false };
        });
        const newEntry: AssessmentEntry = {
            id: `new-${Date.now()}`,
            assessmentType: '',
            passMark: '',
            scores: initialScores,
            isSavedInDb: false,
            isEditing: true,
        };
        setAssessmentEntries(prev => [...prev, newEntry]);
    };

    const handleSaveScores = async (entry: AssessmentEntry) => {
        if (!teacherId || !session) {
            showToast("Authentication error. Please log in again.", "error");
            router.push('/login');
            return;
        }

        // Validation
        if (!selectedCourse || !selectedObjective || !entry.assessmentType || !entry.passMark) {
            showToast("Please ensure all fields (Course, Objective, Type, Pass Mark) are filled.", "error");
            return;
        }

        const studentNameMap = new Map(students.map(s => [s.studentId, s.name]));

        let allValid = true;
        const studentScores = Object.entries(entry.scores).map(([studentId, scoreData]) => {
            if (!scoreData.isAbsent && scoreData.mark.trim() === '') {
                allValid = false;
            }
            return {
                studentId,
                name: studentNameMap.get(studentId) || 'Unknown',
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
                    assessmentType: entry.assessmentType,
                    passMark: entry.passMark,
                    session,
                    scores: studentScores,
                })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Server error');

            showToast(result.message || "Scores saved successfully!", "success");

            // After saving, refresh the state to reflect the changes
            // A simple way is to re-trigger the data fetch for the current objective
            const currentObjective = selectedObjective;
            setSelectedObjective(''); 
            setTimeout(() => setSelectedObjective(currentObjective), 100);

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
    const showStudentSection = selectedCourse && selectedObjective;
    const selectedObjectiveText = courseObjectives.find(co => co.co_no === selectedObjective)?.courseObjective || '';
    const savedAssessmentTypes = assessmentEntries
        .filter(e => e.isSavedInDb)
        .map(e => e.assessmentType);
    const allAssessmentTypes = ['quiz', 'midterm', 'assignment', 'final'];
    const canAddNew = savedAssessmentTypes.length > 0 && savedAssessmentTypes.length < allAssessmentTypes.length;


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
                            {Array.from(new Map(courses.map(course => [course.course_id, course])).values()).map(course => ( <option key={course.course_id} value={course.course_id}> {course.courseName} ({course.course_id}) </option> ))}
                        </select>
                    </div>

                    {selectedCourse && (
                         <div className="card">
                            <label htmlFor="sessionSelector" className="form-label">2. Select Session</label>
                            <select 
                                id="sessionSelector" 
                                className="select-field" 
                                value={selectedSession} 
                                onChange={handleSessionChange} 
                                disabled={sessions.length === 0}
                            >
                                <option value="">-- Select a session --</option>
                                {sessions.map(session => (
                                    <option key={session} value={session}>{session}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {selectedCourse && selectedSession ? (
                        <div id="assessmentDetailsSection">
                            <div className="card">
                                <label htmlFor="courseObjectiveSelector" className="form-label">3. Course Objective</label>
                                        <select id="courseObjectiveSelector" className="select-field" value={selectedObjective} onChange={(e) => setSelectedObjective(e.target.value)} disabled={isLoadingObjectives || courseObjectives.length === 0}>
                                            <option value="">{isLoadingObjectives ? "Loading..." : "-- Select an objective --"}</option>
                                            {courseObjectives.map(obj => ( <option key={obj.co_no} value={obj.co_no}> {obj.co_no}: {obj.courseObjective} </option> ))}
                                        </select>
                                    </div>

                            {isLoadingStudents ? (
                                <div className="card text-center p-8">Loading assessment data...</div>
                            ) : assessmentEntries.length === 0 && showStudentSection ? (
                                <div className="card message-card">
                                    <p>No students found for this course, or no assessment data exists.</p>
                                </div>
                            ) : (
                                assessmentEntries.map((entry) => {
                                    const isLocked = !entry.isEditing;
                                    const availableAssessmentTypes = allAssessmentTypes.filter(t => !savedAssessmentTypes.includes(t));

                                    return (
                                        <div key={entry.id} className="card">
                                            <div className="assessment-details-grid">
                                    <div>
                                                    <label htmlFor={`assessmentTypeSelector-${entry.id}`} className="form-label">4. Assessment Type</label>
                                                    {entry.isSavedInDb ? (
                                                        <p className="font-bold text-lg pt-2">{entry.assessmentType.charAt(0).toUpperCase() + entry.assessmentType.slice(1)}</p>
                                                    ) : (
                                                        <select 
                                                            id={`assessmentTypeSelector-${entry.id}`} 
                                                            className="select-field" 
                                                            value={entry.assessmentType} 
                                                            onChange={(e) => handleFieldChange(entry.id, 'assessmentType', e.target.value)} 
                                                            disabled={isLocked}
                                                        >
                                            <option value="">-- Select type --</option>
                                                            {/* For new entries, show only available types. For existing but being edited, show its own type. */}
                                                            {availableAssessmentTypes.map(type => (
                                                                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                                                            ))}
                                        </select>
                                                    )}
                                    </div>
                                    <div>
                                                    <label htmlFor={`passMarkInput-${entry.id}`} className="form-label">5. Pass Mark</label>
                                                    <input type="number" id={`passMarkInput-${entry.id}`} className="input-field" placeholder="e.g., 40" min="0" max="100" value={entry.passMark} onChange={(e) => handleFieldChange(entry.id, 'passMark', e.target.value)} disabled={isLocked} onWheel={(e) => e.currentTarget.blur()} />
                                    </div>
                                                <div className="assessment-actions">
                                                     {entry.isSavedInDb && (
                                                        <button type="button" onClick={() => handleEditToggle(entry.id)} className="btn btn-secondary">
                                                            {isLocked ? 'Edit Scores' : 'Cancel Edit'}
                                                        </button>
                                                    )}
                                </div>
                            </div>

                                            <div className="student-scores-header mt-6">
                                                <h3>Scores for <span>{selectedObjectiveText}</span></h3>
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
                                                        {students.map((student, index) => (
                                                        <tr key={student.studentId}>
                                                            <td>{index + 1}</td>
                                                            <td>{student.studentId}</td>
                                                            <td>{student.name}</td>
                                                            <td>
                                                                <input 
                                                                    type="number" 
                                                                    className="input-field" 
                                                                        value={entry.scores[student.studentId]?.mark || ''}
                                                                        onChange={(e) => handleScoreChange(entry.id, student.studentId, e.target.value)}
                                                                        disabled={isLocked || entry.scores[student.studentId]?.isAbsent}
                                                                    min="0" max="100" placeholder="Mark" 
                                                                    onWheel={(e) => e.currentTarget.blur()}
                                                                />
                                                            </td>
                                                            <td className="text-center">
                                                                <input 
                                                                    type="checkbox" 
                                                                        checked={entry.scores[student.studentId]?.isAbsent || false}
                                                                        onChange={(e) => handleAbsentChange(entry.id, student.studentId, e.target.checked)}
                                                                        disabled={isLocked}
                                                                />
                                                            </td>
                                                        </tr>
                                                        ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="actions-footer">
                                                <button type="button" onClick={() => handleSaveScores(entry)} className="btn btn-primary" disabled={isSaving || isLocked}>
                                                    {isSaving ? 'Saving...' : entry.isSavedInDb ? 'Update Scores' : 'Save Scores'}
                                        </button>
                                    </div>
                                        </div>
                                    );
                                })
                            )}
                            
                            {canAddNew && (
                                <div className="text-center mt-6">
                                    <button type="button" onClick={handleAddNewAssessment} className="btn btn-primary-outline">
                                        + Add Another Assessment
                                    </button>
                                </div>
                            )}

                            {!showStudentSection && selectedCourse && selectedSession && (
                                <div id="selectObjectiveMessage" className="card message-card">
                                    <p>Please select a Course Objective to view or enter scores.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div id="noCourseSelectedMessage" className="card message-card">
                            <p>Please select a course and session to proceed.</p>
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