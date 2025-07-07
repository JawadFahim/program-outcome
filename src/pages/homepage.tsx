import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState, useCallback, useRef } from 'react';
import { getTeacherIdFromAuth, removeAuthTokenCookie } from '../lib/jwt';
import Layout from '../components/Layout';

interface CourseObjective {
    id: string;
    description: string;
    programOutcome: string;
    displayNumber: number;
    bloomsTaxonomy: string[];
    knowledgeProfile: string[];
    complexEngineeringProblem: string[];
    complexEngineeringActivity: string[];
}

interface CourseTaught {
    course_id: string;
    courseName: string;
    session: string;
}

interface ApiCourseObjective {
    courseObjective: string;
    mappedProgramOutcome: string;
    bloomsTaxonomy?: string[];
    knowledgeProfile?: string[];
    complexEngineeringProblem?: string[];
    complexEngineeringActivity?: string[];
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
    const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
    const [openSelects, setOpenSelects] = useState<Record<string, boolean>>({});

    const useOutsideAlerter = (ref: React.RefObject<HTMLElement | null>, close: () => void) => {
        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (ref.current && !ref.current.contains(event.target as Node)) {
                    close();
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }, [ref, close]);
    };

    const courseSelectRef = useRef<HTMLDivElement>(null);
    const sessionSelectRef = useRef<HTMLDivElement>(null);

    useOutsideAlerter(courseSelectRef, () => setOpenSelects(prev => ({ ...prev, course: false })));
    useOutsideAlerter(sessionSelectRef, () => setOpenSelects(prev => ({ ...prev, session: false })));
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.multiselect-dropdown')) {
                setOpenDropdowns({});
            }
             // Close all custom selects if clicked outside
            if (!target.closest('.custom-select')) {
                setOpenSelects({});
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleDropdown = (id: string) => {
        setOpenDropdowns(prev => ({
            [id]: !prev[id],
        }));
    };

    const toggleSelect = (id: string) => {
        setOpenSelects(prev => ({
            ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
            [id]: !prev[id],
        }));
    };

    const createObjectiveBlock = useCallback(() => {
        setCourseObjectives(prevObjectives => [
            ...prevObjectives,
            {
                id: `objectiveBlock_${Date.now()}`,
                description: '',
                programOutcome: '',
                displayNumber: prevObjectives.length + 1,
                bloomsTaxonomy: [],
                knowledgeProfile: [],
                complexEngineeringProblem: [],
                complexEngineeringActivity: [],
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
                            displayNumber: index + 1,
                            bloomsTaxonomy: obj.bloomsTaxonomy || [],
                            knowledgeProfile: obj.knowledgeProfile || [],
                            complexEngineeringProblem: obj.complexEngineeringProblem || [],
                            complexEngineeringActivity: obj.complexEngineeringActivity || [],
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

    const BLOOMS_TAXONOMY = {
      'Cognitive Domain': [
        { code: 'C1', text: 'Remembering' }, { code: 'C2', text: 'Understanding' },
        { code: 'C3', text: 'Applying' }, { code: 'C4', text: 'Analyzing' },
        { code: 'C5', text: 'Evaluating' }, { code: 'C6', text: 'Creating' },
      ],
      'Affective Domain': [
        { code: 'A1', text: 'Receiving' }, { code: 'A2', text: 'Responding' },
        { code: 'A3', text: 'Valuing' }, { code: 'A4', text: 'Organizing' },
        { code: 'A5', text: 'Characterizing' },
      ],
      'Psychomotor Domain (Simpson)': [
        { code: 'P1', text: 'Perception' }, { code: 'P2', text: 'Set' },
        { code: 'P3', text: 'Guided Response' }, { code: 'P4', text: 'Mechanism' },
        { code: 'P5', text: 'Complex Overt Response' }, { code: 'P6', text: 'Adaptation' },
        { code: 'P7', text: 'Origination' },
      ],
    };

    const KNOWLEDGE_PROFILE = [
      { code: 'K1', text: 'Natural sciences' }, { code: 'K2', text: 'Mathematics & computer science' },
      { code: 'K3', text: 'Engineering fundamentals' }, { code: 'K4', text: 'Engineering specialist knowledge' },
      { code: 'K5', text: 'Engineering design' }, { code: 'K6', text: 'Engineering practice' },
      { code: 'K7', text: 'Engineering in society' }, { code: 'K8', text: 'Research literature' },
    ];

    const COMPLEX_ENGINEERING_PROBLEM = [
        { code: 'P1', text: 'Depth of knowledge required' }, { code: 'P2', text: 'Conflicting requirements' },
        { code: 'P3', text: 'Depth of analysis' }, { code: 'P4', text: 'Familiarity of issues' },
        { code: 'P5', text: 'Applicable codes' }, { code: 'P6', text: 'Stakeholder involvement' },
        { code: 'P7', text: 'Interdependence' },
    ];

    const COMPLEX_ENGINEERING_ACTIVITY = [
        { code: 'A1', text: 'Range of resources' }, { code: 'A2', text: 'Level of interaction' },
        { code: 'A3', text: 'Innovation' }, { code: 'A4', text: 'Societal/environmental consequences' },
        { code: 'A5', text: 'Familiarity' },
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

    const handleCourseSelectionChange = (newCourseValue: string) => {
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
        setOpenSelects({});
    };

    const handleSessionChange = (newSession: string) => {
        setSelectedSession(newSession);
        setOpenSelects({});
    };
    
    const handleObjectiveChange = (id: string, field: keyof Pick<CourseObjective, 'description' | 'programOutcome'>, value: string) => {
        setCourseObjectives(prevObjectives =>
            prevObjectives.map(obj =>
                obj.id === id ? { ...obj, [field]: value } : obj
            )
        );
        if (field === 'programOutcome') {
            setOpenSelects({});
        }
    };

    const handleMultiSelectChange = (
        objectiveId: string, 
        field: 'bloomsTaxonomy' | 'knowledgeProfile' | 'complexEngineeringProblem' | 'complexEngineeringActivity', 
        value: string
    ) => {
        setCourseObjectives(prev => prev.map(obj => {
            if (obj.id === objectiveId) {
                const newValues = obj[field].includes(value)
                    ? obj[field].filter(v => v !== value)
                    : [...obj[field], value];
                return { ...obj, [field]: newValues };
            }
            return obj;
        }));
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
                bloomsTaxonomy: obj.bloomsTaxonomy,
                knowledgeProfile: obj.knowledgeProfile,
                complexEngineeringProblem: obj.complexEngineeringProblem,
                complexEngineeringActivity: obj.complexEngineeringActivity,
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
        <Layout teacherName={teacherName} onLogout={handleLogout} page="homepage" title="Outcome Mapper">
            <Head>
                <title>Course Objective Management</title>
            </Head>

            <div className="container">
                    <div className="card">
                        <label htmlFor="courseSelector" className="form-label">Select Course:</label>
                        <div className="custom-select" ref={courseSelectRef}>
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
                                        : '-- Please select a course --'
                                    }
                                </span>
                            </button>
                            {openSelects['course'] && (
                                <ul className="custom-select-options">
                                    {Array.from(new Map(courses.map(course => [course.course_id, course])).values()).map(course => (
                                        <li 
                                            key={course.course_id} 
                                            className={`custom-select-option ${selectedCourse === course.course_id ? 'selected' : ''}`}
                                            onClick={() => handleCourseSelectionChange(course.course_id)}
                                        >
                                    {course.courseName} ({course.course_id})
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                </div>

                {selectedCourse && (
                    <div className="card">
                        <label htmlFor="sessionSelector" className="form-label">Select Session:</label>
                        <div className="custom-select" ref={sessionSelectRef}>
                            <button
                                id="sessionSelector"
                                type="button"
                                className={`custom-select-toggle ${sessions.length === 0 ? 'disabled' : ''}`}
                                onClick={() => toggleSelect('session')}
                                disabled={sessions.length === 0}
                            >
                                <span className={!selectedSession ? 'placeholder' : ''}>
                                    {selectedSession || '-- Please select a session --'}
                                </span>
                            </button>
                            {openSelects['session'] && (
                                <ul className="custom-select-options">
                                     <li 
                                        className={`custom-select-option placeholder ${selectedSession === '' ? 'selected' : ''}`}
                                        onClick={() => handleSessionChange('')}
                                    >
                                        -- Please select a session --
                                    </li>
                                    {sessions.map(session => (
                                        <li 
                                            key={session} 
                                            className={`custom-select-option ${selectedSession === session ? 'selected' : ''}`}
                                            onClick={() => handleSessionChange(session)}
                                        >
                                            {session}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
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
                                                <div className="remove-btn-container">
                                                    {courseObjectives.length > 1 && (
                                                        <button 
                                                            type="button" 
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => handleRemoveObjective(obj.id)}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="course-objective-block">
                                                <div className="form-group full-width">
                                                    <label>Objective Description</label>
                                                <textarea 
                                                    className="textarea-field" 
                                                    name={`course_objective_desc_${obj.id}`} 
                                                    placeholder="Enter course objective description..."
                                                    value={obj.description}
                                                    onChange={(e) => handleObjectiveChange(obj.id, 'description', e.target.value)}
                                                ></textarea>
                                                </div>

                                                <div className="grid-2-cols">
                                                    <div className="form-group">
                                                        <label>Program Outcome (PO)</label>
                                                        <div className="custom-select">
                                                        <button 
                                                            type="button" 
                                                                className="custom-select-toggle"
                                                                onClick={() => toggleSelect(`po-${obj.id}`)}
                                                            >
                                                                <span className={!obj.programOutcome ? 'placeholder' : ''}>
                                                                    {obj.programOutcome
                                                                        ? BICE_PROGRAM_OUTCOMES.find((_, i) => `PO${i+1}` === obj.programOutcome) || '-- Select Program Outcome --'
                                                                        : '-- Select Program Outcome --'
                                                                    }
                                                                </span>
                                                            </button>
                                                            {openSelects[`po-${obj.id}`] && (
                                                                <ul className="custom-select-options">
                                                                    <li
                                                                        className={`custom-select-option placeholder ${obj.programOutcome === '' ? 'selected' : ''}`}
                                                                        onClick={() => handleObjectiveChange(obj.id, 'programOutcome', '')}
                                                                    >
                                                                        -- Select Program Outcome --
                                                                    </li>
                                                                    {BICE_PROGRAM_OUTCOMES.map((outcome, i) => (
                                                                        <li 
                                                                            key={`po-${i}`} 
                                                                            className={`custom-select-option ${obj.programOutcome === `PO${i + 1}` ? 'selected' : ''}`}
                                                                            onClick={() => handleObjectiveChange(obj.id, 'programOutcome', `PO${i + 1}`)}
                                                                        >
                                                                            {outcome}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="form-group">
                                                        <label>Bloom&apos;s Taxonomy</label>
                                                        <div className="multiselect-dropdown">
                                                            <button type="button" className="multiselect-toggle" onClick={() => toggleDropdown(`${obj.id}-blooms`)}>
                                                                <span className={!obj.bloomsTaxonomy || obj.bloomsTaxonomy.length === 0 ? 'placeholder' : ''}>
                                                                    {obj.bloomsTaxonomy.length > 0 
                                                                        ? obj.bloomsTaxonomy.length > 2 
                                                                            ? `${obj.bloomsTaxonomy.slice(0, 2).join(', ')}...` 
                                                                            : obj.bloomsTaxonomy.join(', ')
                                                                        : "-- Select --"
                                                                    }
                                                                </span>
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" height="20" width="20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                                            </button>
                                                            {openDropdowns[`${obj.id}-blooms`] && (
                                                                <div className="multiselect-options">
                                                                    {Object.entries(BLOOMS_TAXONOMY).map(([domain, levels]) => (
                                                                        <div key={domain}>
                                                                            <strong>{domain}</strong>
                                                                            {levels.map(level => (
                                                                                <label key={level.code} className="multiselect-option">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={obj.bloomsTaxonomy.includes(level.code)}
                                                                                        onChange={() => handleMultiSelectChange(obj.id, 'bloomsTaxonomy', level.code)}
                                                                                    />
                                                                                    {level.code}: {level.text}
                                                                                </label>
                                                                            ))}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid-3-cols">
                                                    <div className="form-group">
                                                        <label>Knowledge Profile (K)</label>
                                                        <div className="multiselect-dropdown">
                                                            <button type="button" className="multiselect-toggle" onClick={() => toggleDropdown(`${obj.id}-knowledge`)}>
                                                                <span className={!obj.knowledgeProfile || obj.knowledgeProfile.length === 0 ? 'placeholder' : ''}>
                                                                    {obj.knowledgeProfile.length > 0 
                                                                        ? obj.knowledgeProfile.length > 2
                                                                            ? `${obj.knowledgeProfile.slice(0, 2).join(', ')}...`
                                                                            : obj.knowledgeProfile.join(', ')
                                                                        : "-- Select --"
                                                                    }
                                                                </span>
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" height="20" width="20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                                            </button>
                                                            {openDropdowns[`${obj.id}-knowledge`] && (
                                                                <div className="multiselect-options">
                                                                    {KNOWLEDGE_PROFILE.map(k => (
                                                                        <label key={k.code} className="multiselect-option" title={k.text}>
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={obj.knowledgeProfile.includes(k.code)}
                                                                                onChange={() => handleMultiSelectChange(obj.id, 'knowledgeProfile', k.code)}
                                                                            />
                                                                            {k.code}: {k.text.split(':')[0]}
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="form-group">
                                                        <label>Complex Problem (P)</label>
                                                        <div className="multiselect-dropdown">
                                                            <button type="button" className="multiselect-toggle" onClick={() => toggleDropdown(`${obj.id}-problem`)}>
                                                                <span className={!obj.complexEngineeringProblem || obj.complexEngineeringProblem.length === 0 ? 'placeholder' : ''}>
                                                                    {obj.complexEngineeringProblem.length > 0 
                                                                        ? obj.complexEngineeringProblem.length > 2
                                                                            ? `${obj.complexEngineeringProblem.slice(0, 2).join(', ')}...`
                                                                            : obj.complexEngineeringProblem.join(', ')
                                                                        : "-- Select --"
                                                                    }
                                                                </span>
                                                                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" height="20" width="20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                                            </button>
                                                            {openDropdowns[`${obj.id}-problem`] && (
                                                                <div className="multiselect-options">
                                                                    {COMPLEX_ENGINEERING_PROBLEM.map(p => (
                                                                        <label key={p.code} className="multiselect-option" title={p.text}>
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={obj.complexEngineeringProblem.includes(p.code)}
                                                                                onChange={() => handleMultiSelectChange(obj.id, 'complexEngineeringProblem', p.code)}
                                                                            />
                                                                            {p.code}: {p.text.split(':')[0]}
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="form-group">
                                                        <label>Complex Activity (A)</label>
                                                        <div className="multiselect-dropdown">
                                                            <button type="button" className="multiselect-toggle" onClick={() => toggleDropdown(`${obj.id}-activity`)}>
                                                                <span className={!obj.complexEngineeringActivity || obj.complexEngineeringActivity.length === 0 ? 'placeholder' : ''}>
                                                                    {obj.complexEngineeringActivity.length > 0 
                                                                        ? obj.complexEngineeringActivity.length > 2
                                                                            ? `${obj.complexEngineeringActivity.slice(0, 2).join(', ')}...`
                                                                            : obj.complexEngineeringActivity.join(', ')
                                                                        : "-- Select --"
                                                                    }
                                                                </span>
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" height="20" width="20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                                        </button>
                                                            {openDropdowns[`${obj.id}-activity`] && (
                                                                <div className="multiselect-options">
                                                                    {COMPLEX_ENGINEERING_ACTIVITY.map(a => (
                                                                        <label key={a.code} className="multiselect-option" title={a.text}>
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={obj.complexEngineeringActivity.includes(a.code)}
                                                                                onChange={() => handleMultiSelectChange(obj.id, 'complexEngineeringActivity', a.code)}
                                                                            />
                                                                            {a.code}: {a.text.split(':')[0]}
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
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
                        </div>
                    ) : (
                        <div id="noCourseSelectedMessage" className="card no-course-message">
                            {courses.length > 0 ?
                            <p>Please select a course and session to begin defining objectives.</p> :
                                <p>No courses are assigned to this teacher, or they are still loading.</p>
                            }
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