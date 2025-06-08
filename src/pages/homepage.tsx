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
    const [objectiveCounter, setObjectiveCounter] = useState<number>(0);
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
        setObjectiveCounter(prevCounter => {
            const newCounter = prevCounter + 1;
            setCourseObjectives(prevObjectives => [
                ...prevObjectives,
                {
                    id: `objectiveBlock_${newCounter}`,
                    description: '',
                    programOutcome: '',
                    displayNumber: prevObjectives.length + 1,
                }
            ]);
            return newCounter;
        });
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
                    const data = await response.json();
                    
                    if (data && data.length > 0) {
                        const loadedObjectives = data.map((obj: any, index: number) => ({
                            id: `loaded_objective_${index}`,
                            description: obj.courseObjective,
                            programOutcome: obj.mappedProgramOutcome,
                            displayNumber: index + 1
                        }));
                        setCourseObjectives(loadedObjectives);
                        setObjectiveCounter(loadedObjectives.length);
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
    }, [selectedCourse, createObjectiveBlock]);

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
        setObjectiveCounter(0);
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
        if (!selectedCourse) {
            showToast("Please select a course first.", "error");
            return;
        }
        showModal(
            'Assessment Score',
            `Functionality for 'Assessment Score' for ${getCourseLabel(selectedCourse)} is not yet implemented.`,
            () => {}, 
            'OK',
            'btn-primary',
            false
        );
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
        <>
            <Head>
                <title>Course Objective Mapping</title>
            </Head>

            <style jsx global>{`
                body {
                    font-family: 'Inter', sans-serif;
                    background-color: #f3f4f6;
                }
                .btn {
                    padding: 0.65rem 1.25rem;
                    border-radius: 0.375rem;
                    font-weight: 500;
                    transition: background-color 0.3s ease;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }
                .btn-primary {
                    background-color: #3b82f6;
                    color: white;
                }
                .btn-primary:hover {
                    background-color: #2563eb;
                }
                .btn-secondary {
                    background-color: #6b7280;
                    color: white;
                }
                .btn-secondary:hover {
                    background-color: #4b5563;
                }
                .btn-danger {
                    background-color: #ef4444;
                    color: white;
                }
                .btn-danger:hover {
                    background-color: #dc2626;
                }
                .btn-outline {
                    background-color: transparent;
                    color: #4b5563;
                    border: 1px solid #d1d5db;
                }
                .btn-outline:hover {
                    background-color: #f9fafb;
                    border-color: #9ca3af;
                }
                .card {
                    background-color: white;
                    padding: 1.5rem;
                    border-radius: 0.5rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    margin-bottom: 1.5rem;
                }
                .input-field, .select-field {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #d1d5db;
                    border-radius: 0.375rem;
                    box-sizing: border-box;
                }
                .select-field:disabled {
                    background-color: #e5e7eb;
                    cursor: not-allowed;
                }
                .textarea-field {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #d1d5db;
                    border-radius: 0.375rem;
                    min-height: 80px;
                }
                .course-objective-block {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    align-items: flex-start; 
                }
                @media (min-width: 768px) {
                    .course-objective-block {
                        flex-direction: row;
                        align-items: center;
                    }
                    .course-objective-block .textarea-field,
                    .course-objective-block .select-field {
                        flex: 1 1 0%; 
                    }
                    .course-objective-block .remove-objective-btn-container {
                        margin-left: 0.5rem; 
                        flex-shrink: 0; 
                    }
                }
                .modal {
                    position: fixed; z-index: 1000;
                    left: 0; top: 0; width: 100%; height: 100%;
                    overflow: auto; background-color: rgba(0,0,0,0.4);
                }
                .modal-content {
                    background-color: #fefefe; margin: 10% auto; padding: 2rem;
                    border: 1px solid #888; width: 90%; max-width: 500px;
                    border-radius: 0.5rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
                }
                .modal-header {
                    padding-bottom: 1rem; border-bottom: 1px solid #e5e7eb; margin-bottom: 1rem;
                }
                .modal-title { font-size: 1.25rem; font-weight: 600; }
                .modal-body { margin-bottom: 1.5rem; }
                .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; }

                .notification-toast {
                    position: fixed;
                    bottom: 1.25rem;
                    right: 1.25rem;
                    color: white;
                    padding: 0.75rem 1.5rem;
                    border-radius: 0.5rem;
                    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
                    transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out, transform 0.3s ease-in-out;
                    opacity: 0;
                    visibility: hidden;
                    transform: translateY(20px);
                    z-index: 2000;
                }
                .notification-toast.visible {
                    opacity: 1;
                    visibility: visible;
                    transform: translateY(0);
                }
                .toast-success { background-color: #10b981; }
                .toast-error { background-color: #ef4444; }
                .toast-warning { background-color: #f59e0b; }
            `}</style>

            <div className="bg-gray-100 text-gray-800 p-4 sm:p-6 md:p-8 min-h-screen">
                <header className="bg-white shadow-md rounded-lg p-4 mb-6">
                    <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
                        <h1 className="text-2xl font-semibold text-blue-600">Course Objective Mapping</h1>
                        <div className="text-lg text-gray-700 mt-2 sm:mt-0">Teacher: <span className="font-medium">{teacherName}</span></div>
                    </div>
                </header>

                <div className="container mx-auto">
                    <div className="card">
                        <label htmlFor="courseSelector" className="block text-lg font-medium text-gray-700 mb-2">Select Course:</label>
                        <select 
                            id="courseSelector" 
                            className="select-field text-base" 
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
                            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Define Course Objectives for <span className="text-blue-600">{getCourseLabel(selectedCourse)}</span></h2>
                            <p className="text-gray-600 mb-6">For each course objective, select one primary BICE Program Outcome it aligns with.</p>

                            {isLoadingObjectives ? (
                                <div className="text-center p-8 text-gray-500">Loading objectives...</div>
                            ) : (
                                <div id="courseObjectivesContainer" className="space-y-6">
                                    {courseObjectives.map((obj) => (
                                        <div key={obj.id} className="card objective-entry-item p-4">
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="objective-title text-lg font-medium text-gray-700">Course Objective {obj.displayNumber}</h4>
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
                                                 <div className="remove-objective-btn-container">
                                                    {courseObjectives.length > 1 && (
                                                        <button 
                                                            type="button" 
                                                            className="btn btn-danger btn-sm remove-objective-btn" 
                                                            onClick={() => handleRemoveObjective(obj.id)}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-8 flex flex-wrap gap-3">
                                <button type="button" className="btn btn-secondary" onClick={createObjectiveBlock}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                    Add Course Objective
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div id="noCourseSelectedMessage" className="card text-center text-gray-500">
                            {courses.length > 0 ?
                                <p>Please select a course above to begin defining its objectives.</p> :
                                <p>No courses are assigned to this teacher, or they are still loading.</p>
                            }
                        </div>
                    )}

                    {selectedCourse && (
                         <div id="overallActionButtons" className="mt-8 flex flex-wrap gap-3">
                            <button 
                                type="button" 
                                className="btn btn-primary" 
                                onClick={handleSaveAllObjectives}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                        </svg>
                                        Save All Objectives
                                    </>
                                )}
                            </button>
                            <button type="button" className="btn btn-outline" onClick={handleAssessmentScore}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Assessment Score
                            </button>
                        </div>
                    )}
                </div>

                {isModalOpen && (
                    <div id="confirmationModal" className="modal" style={{ display: isModalOpen ? 'block' : 'none' }}>
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
        </>
    );
};

export default HomePage; 