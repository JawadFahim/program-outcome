import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';

interface CourseObjective {
    id: string;
    description: string;
    programOutcome: string;
    displayNumber: number;
}

interface CourseTaught {
    course_id: string;
    courseName: string;
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

const fetchTeacherData = async (teacherId: string): Promise<Teacher | null> => {
    try {
        const response = await fetch(`/api/teachers/${teacherId}`);
        if (!response.ok) {
            console.error(`API Error: Failed to fetch teacher data for ${teacherId}. Status: ${response.status}`);
            return null;
        }
        const data: Teacher = await response.json();
        return data;
    } catch (error) {
        console.error(`Network or other error in fetchTeacherData for ${teacherId}:`, error);
        return null;
    }
};

const HomePage = () => {
    const router = useRouter();

    const [teacherName, setTeacherName] = useState<string>('Loading...');
    const [selectedCourse, setSelectedCourse] = useState<string>('');
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
        if (router.isReady) {
            const currentTeacherId = router.query.teacherId as string;
            if (currentTeacherId) {
                setTeacherName('Loading...');
                setCourses([]);
                fetchTeacherData(currentTeacherId).then(apiTeacherData => {
                    if (apiTeacherData) {
                        setTeacherName(apiTeacherData.name);
                        setCourses(apiTeacherData.coursesTaught || []);
                        if (!apiTeacherData.coursesTaught || apiTeacherData.coursesTaught.length === 0) {
                            showToast(`Teacher ${apiTeacherData.name} has no courses assigned.`, 'warning');
                        }
                    } else {
                        setTeacherName('Teacher Not Found');
                        showToast(`Details for teacher ID "${currentTeacherId}" could not be retrieved.`, 'error');
                    }
                }).catch(error => {
                    console.error("Error processing teacher data fetch:", error);
                    setTeacherName('Error fetching data');
                    showToast('An error occurred while loading teacher information.', 'error');
                });
            } else {
                setTeacherName('Teacher ID not provided');
            }
        }
    }, [router.isReady, router.query.teacherId]);

    useEffect(() => {
        const fetchObjectives = async () => {
            const teacherId = router.query.teacherId as string;
            if (selectedCourse && teacherId) {
                setIsLoadingObjectives(true);
                setCourseObjectives([]);

                try {
                    const response = await fetch(`/api/getCourseObjectives?teacherId=${teacherId}&courseId=${selectedCourse}`);
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
            }
        };

        fetchObjectives();
    }, [selectedCourse, createObjectiveBlock, router.query.teacherId]);

    useEffect(() => {
        if (selectedCourse && !isLoadingObjectives && courseObjectives.length === 0) {
            createObjectiveBlock();
        }
    }, [selectedCourse, courseObjectives, isLoadingObjectives, createObjectiveBlock]);

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
    };
    
    const handleObjectiveChange = (id: string, field: keyof Pick<CourseObjective, 'description' | 'programOutcome'>, value: string) => {
        setCourseObjectives(prevObjectives =>
            prevObjectives.map(obj =>
                obj.id === id ? { ...obj, [field]: value } : obj
            )
        );
    };

    const handleSaveAllObjectives = async () => {
        const teacherId = router.query.teacherId as string;
        if (!selectedCourse || !teacherId) {
            showToast("Please select a course and ensure a teacher is logged in.", "error");
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

    const handleAssessmentScore = () => {
        const teacherId = router.query.teacherId as string;
        if (!selectedCourse) {
            showToast("Please select a course first to enter scores.", "error");
            return;
        }
        if (!teacherId) {
            showToast("Teacher ID not found. Cannot proceed.", "error");
            return;
        }
        // Navigate to the assessment page, passing the teacherId
        router.push(`/assessment_score?teacherId=${teacherId}`);
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

    return (
        <div className="bg-gray-50 min-h-screen">
            <Head>
                <title>Course Objective Management</title>
            </Head>

            <style jsx global>{`
                :root {
                    --primary-color: #4f46e5;
                    --primary-hover: #4338ca;
                    --secondary-color: #6b7280;
                    --secondary-hover: #4b5563;
                    --danger-color: #ef4444;
                    --danger-hover: #dc2626;
                    --success-color: #10b981;
                    --warning-color: #f59e0b;
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
                    font-size: 1.125rem;
                    font-weight: 500;
                    color: var(--text-primary);
                    margin-bottom: 0.75rem;
                }

                .input-field, .select-field, .textarea-field {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border: 1px solid var(--border-color);
                    border-radius: 0.5rem;
                    font-size: 1rem;
                    transition: all 0.2s ease-in-out;
                    box-sizing: border-box;
                    background-color: #fff;
                }

                .input-field:focus, .select-field:focus, .textarea-field:focus {
                    outline: none;
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
                }
                
                .select-field:disabled {
                    background-color: #f3f4f6;
                    cursor: not-allowed;
                }

                .textarea-field {
                    min-height: 100px;
                    resize: vertical;
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
                    transform: translateY(0);
                }
                .btn:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-lg);
                }
                .btn svg {
                    margin-right: 0.5rem;
                    height: 1.25em;
                    width: 1.25em;
                }

                .btn-primary { background-color: var(--primary-color); color: white; }
                .btn-primary:hover { background-color: var(--primary-hover); }
                .btn-secondary { background-color: var(--secondary-color); color: white; }
                .btn-secondary:hover { background-color: var(--secondary-hover); }
                .btn-danger { background-color: var(--danger-color); color: white; }
                .btn-danger:hover { background-color: var(--danger-hover); }
                .btn-outline { background-color: transparent; color: var(--primary-color); border-color: var(--primary-color); }
                .btn-outline:hover { background-color: rgba(79, 70, 229, 0.05); }
                
                .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: translateY(0); box-shadow: none; }
                .btn .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

                .objectives-header h2 { font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem; }
                .objectives-header h2 span { color: var(--primary-color); }
                .objectives-header p { color: var(--text-secondary); margin-bottom: 2rem; }
                
                .objectives-container { display: flex; flex-direction: column; gap: 1.5rem; }
                .objective-entry-item { padding: 1.5rem; }
                .objective-entry-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
                .objective-title { font-size: 1.125rem; font-weight: 500; }

                .course-objective-block { display: flex; flex-direction: column; gap: 1rem; }
                @media (min-width: 768px) {
                    .course-objective-block { flex-direction: row; align-items: center; }
                    .course-objective-block > * { flex: 1; }
                    .course-objective-block .remove-btn-container { flex: 0 0 auto; margin-left: 1rem; }
                }
                
                .action-buttons { margin-top: 2rem; display: flex; flex-wrap: wrap; gap: 0.75rem; }
                .loading-message, .no-course-message { text-align: center; padding: 4rem 2rem; color: var(--text-secondary); }

                .modal-backdrop { position: fixed; inset: 0; background-color: rgba(17, 24, 39, 0.6); display: flex; align-items: center; justify-content: center; padding: 1rem; z-index: 1000; }
                .modal-content { background-color: var(--bg-card); padding: 2rem; border-radius: var(--border-radius); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); width: 100%; max-width: 32rem; transform: scale(0.95); opacity: 0; animation: modal-enter 0.2s ease-out forwards; }
                @keyframes modal-enter { to { transform: scale(1); opacity: 1; } }
                .modal-header { padding-bottom: 1rem; border-bottom: 1px solid var(--border-color); margin-bottom: 1rem; }
                .modal-title { font-size: 1.25rem; font-weight: 600; }
                .modal-body { margin-bottom: 1.5rem; color: var(--text-secondary); }
                .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; }

                .notification-toast { position: fixed; bottom: 2rem; right: 2rem; color: white; padding: 1rem 1.5rem; border-radius: 0.5rem; box-shadow: var(--shadow-lg); transition: all 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55); opacity: 0; visibility: hidden; transform: translateY(50px); z-index: 2000; display: flex; align-items: center; }
                .notification-toast.visible { opacity: 1; visibility: visible; transform: translateY(0); }
                .toast-success { background-color: var(--success-color); }
                .toast-error { background-color: var(--danger-color); }
                .toast-warning { background-color: var(--warning-color); }
            `}</style>

            <div className="container">
                <header className="page-header">
                    <h1 className="page-title">Course Objective Mapping</h1>
                    <div className="teacher-info">Teacher: <span>{teacherName}</span></div>
                </header>

                <main>
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
                            {courses.map(course => (
                                <option key={course.course_id} value={course.course_id}>
                                    {course.courseName} ({course.course_id})
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedCourse ? (
                        <div id="courseObjectivesSection">
                            <div className="objectives-header">
                                <h2>Define Course Objectives for <span>{getCourseLabel(selectedCourse)}</span></h2>
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
                                <p>Please select a course above to begin defining its objectives.</p> :
                                <p>No courses are assigned to this teacher, or they are still loading.</p>
                            }
                        </div>
                    )}

                    {selectedCourse && (
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
                            <button type="button" className="btn btn-outline" onClick={handleAssessmentScore}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Assessment Score
                            </button>
                        </div>
                    )}
                </main>

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
            </div>
        </div>
    );
};

export default HomePage; 