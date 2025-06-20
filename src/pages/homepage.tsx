import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';
import { getTeacherIdFromAuth, removeAuthTokenCookie } from '../lib/jwt';
import Layout from '../components/Layout';

interface CourseObjective {
    id: string;
    description: string;
    programOutcome: string;
    displayNumber: number;
}

interface CourseTaught {
    course_id: string;
    courseName: string;
    session: string;
}

interface ApiCourseObjective {
    courseObjective: string;
    mappedProgramOutcome: string;
}

interface Teacher {
    id: string;
    name: string;
    coursesTaught: CourseTaught[];
}

const HomePage = () => {
    const router = useRouter();
    const [teacherId, setTeacherId] = useState<string | null>(null);
    const [teacherName, setTeacherName] = useState<string>('Loading...');
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [sessions, setSessions] = useState<string[]>([]);
    const [selectedSession, setSelectedSession] = useState<string>('');
    const [courses, setCourses] = useState<CourseTaught[]>([]);
    const [courseObjectives, setCourseObjectives] = useState<CourseObjective[]>([]);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isLoadingObjectives, setIsLoadingObjectives] = useState<boolean>(false);
    
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [modalTitle, setModalTitle] = useState<string>('');
    const [modalMessage, setModalMessage] = useState<string>('');
    const [modalConfirmAction, setModalConfirmAction] = useState<() => void>(() => {});
    const [modalConfirmText, setModalConfirmText] = useState<string>('Confirm');
    const [modalConfirmClassName, setModalConfirmClassName] = useState<string>('btn-primary');
    const [showModalCancel, setShowModalCancel] = useState<boolean>(true);

    const [isToastVisible, setIsToastVisible] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string>('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');

    const createObjectiveBlock = useCallback(() => {
        setCourseObjectives(prevObjectives => [
            ...prevObjectives,
            {
                id: `objectiveBlock_${Date.now()}`,
                description: '',
                programOutcome: '',
                displayNumber: prevObjectives.length + 1,
            }
        ]);
    }, []);

    useEffect(() => {
        const id = getTeacherIdFromAuth();
        if (id) {
            setTeacherId(id);
        } else {
            // This case should be handled by middleware, but as a fallback
            router.replace('/login');
        }
    }, [router]);

    useEffect(() => {
        const fetchTeacherData = async () => {
            if (!teacherId) return;
            
            try {
                const response = await fetch(`/api/teachers/${teacherId}`);
                if (!response.ok) throw new Error('Failed to fetch teacher data');
                
                const data: Teacher = await response.json();
                setTeacherName(data.name || 'Teacher Not Found');
                setCourses(data.coursesTaught || []);
                
                if (!data.coursesTaught || data.coursesTaught.length === 0) {
                    showToast(`Teacher ${data.name} has no courses assigned.`, 'warning');
                }
            } catch (error) {
                console.error("Error fetching teacher data:", error);
                setTeacherName('Error fetching data');
                showToast('An error occurred while loading teacher information.', 'error');
            }
        };

        fetchTeacherData();
    }, [teacherId]);

    useEffect(() => {
        const fetchObjectives = async () => {
            if (selectedCourse && teacherId && selectedSession) {
                setIsLoadingObjectives(true);
                setCourseObjectives([]);

                try {
                    const response = await fetch(`/api/getCourseObjectives?teacherId=${teacherId}&courseId=${selectedCourse}&session=${selectedSession}`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch objectives');
                    }
                    const data: ApiCourseObjective[] = await response.json();
                    
                    if (data && data.length > 0) {
                        const loadedObjectives = data.map((obj: ApiCourseObjective, index: number) => ({
                            id: `loaded_objective_${index}`,
                            description: obj.courseObjective,
                            programOutcome: obj.mappedProgramOutcome,
                            displayNumber: index + 1
                        }));
                        setCourseObjectives(loadedObjectives);
                    } else {
                        createObjectiveBlock();
                    }
                } catch (error) {
                    console.error("Failed to load course objectives:", error);
                    showToast("Could not load existing course objectives.", "error");
                    createObjectiveBlock();
                } finally {
                    setIsLoadingObjectives(false);
                }
            } else {
                setCourseObjectives([]); // Clear objectives if no session is selected
            }
        };

        fetchObjectives();
    }, [selectedCourse, selectedSession, teacherId, createObjectiveBlock]);

    useEffect(() => {
        if (selectedCourse && selectedSession && !isLoadingObjectives && courseObjectives.length === 0) {
            createObjectiveBlock();
        }
    }, [selectedCourse, selectedSession, courseObjectives, isLoadingObjectives, createObjectiveBlock]);

    const BICE_PROGRAM_OUTCOMES: string[] = [
        "PO1: Engineering knowledge",
        "PO2: Problem analysis",
        "PO3: Design/development of solutions",
        "PO4: Conduct investigations of complex problems",
        "PO5: Modern tool usage",
        "PO6: The engineer and society",
        "PO7: Environment and sustainability",
        "PO8: Ethics",
        "PO9: Individual and team work",
        "PO10: Communication",
        "PO11: Project management and finance",
        "PO12: Life-long learning"
    ];

    const getCourseLabel = (value: string): string => {
        const course = courses.find(c => c.course_id === value);
        return course ? course.courseName : '';
    };

    const showModal = (title: string, message: string, onConfirm: () => void, confirmText: string = 'Confirm', confirmClass: string = 'btn-primary', showCancel: boolean = true) => {
        setModalTitle(title);
        setModalMessage(message);
        setModalConfirmAction(() => onConfirm); 
        setModalConfirmText(confirmText);
        setModalConfirmClassName(confirmClass);
        setShowModalCancel(showCancel);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalConfirmAction(() => () => {}); 
    };

    const handleModalConfirm = () => {
        if (modalConfirmAction) {
            modalConfirmAction();
        }
        closeModal();
    };
    
    const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setIsToastVisible(true);
        setTimeout(() => {
            setIsToastVisible(false);
        }, 3300); 
    };

    const handleCourseSelectionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newCourseValue = event.target.value;
        setCourseObjectives([]);
        setSelectedCourse(newCourseValue);
        setSelectedSession(''); // Reset session on new course selection

        if (newCourseValue) {
            const courseSessions = courses
                .filter(c => c.course_id === newCourseValue)
                .map(c => c.session)
                // Filter out duplicate sessions
                .filter((session, index, self) => self.indexOf(session) === index);
            setSessions(courseSessions);
        } else {
            setSessions([]); // Clear sessions if no course is selected
        }
    };

    const handleSessionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedSession(event.target.value);
    };
    
    const handleObjectiveChange = (id: string, field: keyof Pick<CourseObjective, 'description' | 'programOutcome'>, value: string) => {
        setCourseObjectives(prevObjectives =>
            prevObjectives.map(obj =>
                obj.id === id ? { ...obj, [field]: value } : obj
            )
        );
    };

    const handleSaveAllObjectives = async () => {
        if (!selectedCourse || !teacherId || !selectedSession) {
            showToast("Please select a course and session before saving.", "error");
            return;
        }
        
        setIsSaving(true);

        let allValid = true;
        const objectivesData = courseObjectives.map((obj) => {
            const description = obj.description.trim();
            const programOutcome = obj.programOutcome;

            if (!description || !programOutcome) {
                allValid = false;
            }
            return {
                co_no: `CO${obj.displayNumber}`,
                courseObjective: description,
                mappedProgramOutcome: programOutcome,
            };
        });

        if (!allValid) {
            showModal("Validation Error", "Please fill in all required fields for each course objective.", () => {}, 'OK', 'btn-primary', false);
            setIsSaving(false);
            return;
        }

        if (objectivesData.length === 0) {
            showToast("No course objectives to save.", "warning");
            setIsSaving(false);
            return;
        }

        try {
            const response = await fetch('/api/courseObjectives', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teacherId: teacherId,
                    courseId: selectedCourse,
                    session: selectedSession,
                    objectives: objectivesData,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                showToast(result.message || 'Objectives saved successfully!', 'success');
            } else {
                showToast(result.message || 'Failed to save objectives.', 'error');
            }
        } catch (error) {
            console.error('Failed to save objectives:', error);
            showToast('An unexpected network error occurred.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveObjective = (blockId: string) => {
        if (courseObjectives.length <= 1) {
            showToast("At least one course objective is required.", "warning");
            return;
        }
        showModal(
            'Confirm Removal',
            'Are you sure you want to remove this course objective?',
            () => {
                setCourseObjectives(prevObjectives => prevObjectives.filter(obj => obj.id !== blockId));
                showToast('Course objective removed.', 'success');
            },
            'Confirm',
            'btn-danger'
        );
    };

    const handleLogout = () => {
        removeAuthTokenCookie();
        router.push('/login');
    };

    return (
        <Layout teacherName={teacherName} onLogout={handleLogout} page="homepage" title="Course Outcome">
            <Head>
                <title>Course Objective Management</title>
            </Head>

            <div className="container">
                    <div className="card">
                        <label htmlFor="courseSelector" className="form-label">Select Course:</label>
                        <select 
                            id="courseSelector" 
                            className="select-field" 
                            value={selectedCourse} 
                            onChange={handleCourseSelectionChange}
                            disabled={courses.length === 0}
                        >
                            <option value="">-- Please select a course --</option>
                        {Array.from(new Map(courses.map(course => [course.course_id, course])).values()).map(course => (
                                <option key={course.course_id} value={course.course_id}>
                                    {course.courseName} ({course.course_id})
                            </option>
                        ))}
                    </select>
                </div>

                {selectedCourse && (
                    <div className="card">
                        <label htmlFor="sessionSelector" className="form-label">Select Session:</label>
                        <select
                            id="sessionSelector"
                            className="select-field"
                            value={selectedSession}
                            onChange={handleSessionChange}
                            disabled={sessions.length === 0}
                        >
                            <option value="">-- Please select a session --</option>
                            {sessions.map(session => (
                                <option key={session} value={session}>
                                    {session}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {selectedCourse && selectedSession ? (
                        <div id="courseObjectivesSection">
                            <div className="objectives-header">
                            <h2>Define Course Objectives for <span>{getCourseLabel(selectedCourse)}</span> ({selectedSession})</h2>
                                <p>For each course objective, select one primary BICE Program Outcome it aligns with.</p>
                            </div>

                            {isLoadingObjectives ? (
                                <div className="loading-message">Loading objectives...</div>
                            ) : (
                                <div id="courseObjectivesContainer" className="objectives-container">
                                    {courseObjectives.map((obj) => (
                                        <div key={obj.id} className="card objective-entry-item">
                                            <div className="objective-entry-header">
                                                <h4 className="objective-title">Course Objective {obj.displayNumber}</h4>
                                            </div>
                                            <div className="course-objective-block">
                                                <textarea 
                                                    className="textarea-field" 
                                                    name={`course_objective_desc_${obj.id}`} 
                                                    placeholder="Enter course objective description..."
                                                    value={obj.description}
                                                    onChange={(e) => handleObjectiveChange(obj.id, 'description', e.target.value)}
                                                ></textarea>
                                                <select 
                                                    className="select-field" 
                                                    name={`program_outcome_map_${obj.id}`}
                                                    value={obj.programOutcome}
                                                    onChange={(e) => handleObjectiveChange(obj.id, 'programOutcome', e.target.value)}
                                                >
                                                    <option value="">-- Select Program Outcome --</option>
                                                    {BICE_PROGRAM_OUTCOMES.map((outcome, i) => (
                                                        <option key={`po-${i}`} value={`PO${i + 1}`}>{outcome}</option>
                                                    ))}
                                                </select>
                                                 <div className="remove-btn-container">
                                                    {courseObjectives.length > 1 && (
                                                        <button 
                                                            type="button" 
                                                            className="btn btn-danger" 
                                                            onClick={() => handleRemoveObjective(obj.id)}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="action-buttons">
                                <button type="button" className="btn btn-secondary" onClick={createObjectiveBlock}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                    Add Objective
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div id="noCourseSelectedMessage" className="card no-course-message">
                            {courses.length > 0 ?
                            <p>Please select a course and session to begin defining objectives.</p> :
                                <p>No courses are assigned to this teacher, or they are still loading.</p>
                            }
                        </div>
                    )}

                {selectedCourse && selectedSession && (
                         <div id="overallActionButtons" className="action-buttons">
                    <button
                                type="button" 
                                className="btn btn-primary" 
                                onClick={handleSaveAllObjectives}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <>
                                        <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle style={{opacity: 0.25}} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path style={{opacity: 0.75}} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                        </svg>
                                        Save All Objectives
                                    </>
                                )}
                            </button>
                        </div>
                    )}
            </div>

                {isModalOpen && (
                    <div id="confirmationModal" className="modal-backdrop">
                        <div className="modal-content">
                            <div className="modal-header"><h3 className="modal-title">{modalTitle}</h3></div>
                            <div className="modal-body"><p>{modalMessage}</p></div>
                            <div className="modal-footer">
                                {showModalCancel && <button className="btn btn-outline" onClick={closeModal}>Cancel</button>}
                                <button className={`btn ${modalConfirmClassName}`} onClick={handleModalConfirm}>{modalConfirmText}</button>
                            </div>
                        </div>
                    </div>
                )}
                
                <div 
                    id="notificationToast" 
                    className={`notification-toast ${isToastVisible ? 'visible' : ''} ${
                        toastType === 'success' ? 'toast-success' : 
                        toastType === 'error' ? 'toast-error' : 'toast-warning'
                    }`}
                >
                    <p>{toastMessage}</p>
                </div>
        </Layout>
    );
};

export default HomePage; 