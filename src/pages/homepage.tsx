import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { getTeacherIdFromAuth, removeAuthTokenCookie } from '../lib/jwt';
import Layout from '../components/Layout';
import { SkeletonObjectiveCards } from '../components/Skeleton';

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

const BICE_PROGRAM_OUTCOMES: string[] = [
    'PO1: Engineering knowledge',
    'PO2: Problem analysis',
    'PO3: Design/development of solutions',
    'PO4: Conduct investigations of complex problems',
    'PO5: Modern tool usage',
    'PO6: The engineer and society',
    'PO7: Environment and sustainability',
    'PO8: Ethics',
    'PO9: Individual and team work',
    'PO10: Communication',
    'PO11: Project management and finance',
    'PO12: Life-long learning',
];

const BLOOMS_TAXONOMY = {
    'Cognitive Domain': [
        { code: 'C1', text: 'Remembering' }, { code: 'C2', text: 'Understanding' },
        { code: 'C3', text: 'Applying' },    { code: 'C4', text: 'Analyzing' },
        { code: 'C5', text: 'Evaluating' },  { code: 'C6', text: 'Creating' },
    ],
    'Affective Domain': [
        { code: 'A1', text: 'Receiving' }, { code: 'A2', text: 'Responding' },
        { code: 'A3', text: 'Valuing' },   { code: 'A4', text: 'Organizing' },
        { code: 'A5', text: 'Characterizing' },
    ],
    'Psychomotor Domain (Simpson)': [
        { code: 'P1', text: 'Perception' },             { code: 'P2', text: 'Set' },
        { code: 'P3', text: 'Guided Response' },        { code: 'P4', text: 'Mechanism' },
        { code: 'P5', text: 'Complex Overt Response' }, { code: 'P6', text: 'Adaptation' },
        { code: 'P7', text: 'Origination' },
    ],
};

const KNOWLEDGE_PROFILE = [
    { code: 'K1', text: 'Natural sciences' },               { code: 'K2', text: 'Mathematics & computer science' },
    { code: 'K3', text: 'Engineering fundamentals' },       { code: 'K4', text: 'Engineering specialist knowledge' },
    { code: 'K5', text: 'Engineering design' },             { code: 'K6', text: 'Engineering practice' },
    { code: 'K7', text: 'Engineering in society' },         { code: 'K8', text: 'Research literature' },
];

const COMPLEX_ENGINEERING_PROBLEM = [
    { code: 'P1', text: 'Depth of knowledge required' }, { code: 'P2', text: 'Conflicting requirements' },
    { code: 'P3', text: 'Depth of analysis' },           { code: 'P4', text: 'Familiarity of issues' },
    { code: 'P5', text: 'Applicable codes' },             { code: 'P6', text: 'Stakeholder involvement' },
    { code: 'P7', text: 'Interdependence' },
];

const COMPLEX_ENGINEERING_ACTIVITY = [
    { code: 'A1', text: 'Range of resources' },          { code: 'A2', text: 'Level of interaction' },
    { code: 'A3', text: 'Innovation' },                   { code: 'A4', text: 'Societal/environmental consequences' },
    { code: 'A5', text: 'Familiarity' },
];

const HomePage = () => {
    const router = useRouter();
    const [teacherId, setTeacherId]       = useState<string | null>(null);
    const [teacherName, setTeacherName]   = useState<string>('Loading...');
    const [selectedCourse, setSelectedCourse]   = useState<string>('');
    const [sessions, setSessions]               = useState<string[]>([]);
    const [selectedSession, setSelectedSession] = useState<string>('');
    const [courses, setCourses]                 = useState<CourseTaught[]>([]);
    const [courseObjectives, setCourseObjectives] = useState<CourseObjective[]>([]);
    const [isSaving, setIsSaving]               = useState<boolean>(false);
    const [isLoadingObjectives, setIsLoadingObjectives] = useState<boolean>(false);

    const [isModalOpen, setIsModalOpen]             = useState<boolean>(false);
    const [modalTitle, setModalTitle]               = useState<string>('');
    const [modalMessage, setModalMessage]           = useState<string>('');
    const [modalConfirmAction, setModalConfirmAction] = useState<() => void>(() => {});
    const [modalConfirmText, setModalConfirmText]   = useState<string>('Confirm');
    const [modalConfirmClassName, setModalConfirmClassName] = useState<string>('btn-primary');
    const [showModalCancel, setShowModalCancel]     = useState<boolean>(true);

    const [isToastVisible, setIsToastVisible] = useState<boolean>(false);
    const [toastMessage, setToastMessage]     = useState<string>('');
    const [toastType, setToastType]           = useState<'success' | 'error' | 'warning'>('success');
    const [openDropdowns, setOpenDropdowns]   = useState<Record<string, boolean>>({});
    const [validationAttempted, setValidationAttempted] = useState<boolean>(false);
    const [openSelects, setOpenSelects]       = useState<Record<string, boolean>>({});

    const courseSelectRef  = useRef<HTMLDivElement>(null);
    const sessionSelectRef = useRef<HTMLDivElement>(null);

    // ── Outside click handlers ──────────────────────────────────────────────
    const useOutsideAlerter = (ref: React.RefObject<HTMLElement | null>, close: () => void) => {
        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (ref.current && !ref.current.contains(event.target as Node)) close();
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, [ref, close]);
    };

    useOutsideAlerter(courseSelectRef,  () => setOpenSelects(prev => ({ ...prev, course: false })));
    useOutsideAlerter(sessionSelectRef, () => setOpenSelects(prev => ({ ...prev, session: false })));

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.multiselect-dropdown')) setOpenDropdowns({});
            if (!target.closest('.custom-select'))        setOpenSelects({});
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDropdown = (id: string) => {
        setOpenDropdowns(prev => ({ [id]: !prev[id] }));
    };

    const toggleSelect = (id: string) => {
        setOpenSelects(prev => ({
            ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
            [id]: !prev[id],
        }));
    };

    // ── Computed metrics ────────────────────────────────────────────────────
    const mappingStrength = useMemo(() => {
        if (courseObjectives.length === 0) return 0;
        const fullyMapped = courseObjectives.filter(obj =>
            obj.description.trim() && obj.programOutcome && obj.bloomsTaxonomy.length > 0
        ).length;
        return Math.round((fullyMapped / courseObjectives.length) * 100);
    }, [courseObjectives]);

    const validationStatus = useMemo(() => {
        if (courseObjectives.length === 0) return { label: 'No COs', cls: 'validation-warn' };
        const incomplete = courseObjectives.filter(obj => !obj.description.trim() || !obj.programOutcome).length;
        if (incomplete === 0) return { label: 'Meets OBE Criteria', cls: 'validation-ok' };
        return { label: `${incomplete} CO${incomplete > 1 ? 's' : ''} incomplete`, cls: 'validation-warn' };
    }, [courseObjectives]);

    const poCoverage = useMemo(() => {
        const total = courseObjectives.length;
        return BICE_PROGRAM_OUTCOMES.map((label, i) => {
            const poKey = `PO${i + 1}`;
            const count = courseObjectives.filter(obj => obj.programOutcome === poKey).length;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return { key: poKey, label: label.replace(/^PO\d+:\s*/, ''), pct, count };
        });
    }, [courseObjectives]);

    const hasReviewRequired = useMemo(() => {
        return courseObjectives.some(obj => !obj.programOutcome || obj.bloomsTaxonomy.length === 0);
    }, [courseObjectives]);

    // ── Data operations ─────────────────────────────────────────────────────
    const createObjectiveBlock = useCallback(() => {
        setCourseObjectives(prev => [
            ...prev,
            {
                id: `objectiveBlock_${Date.now()}`,
                description: '',
                programOutcome: '',
                displayNumber: prev.length + 1,
                bloomsTaxonomy: [],
                knowledgeProfile: [],
                complexEngineeringProblem: [],
                complexEngineeringActivity: [],
            },
        ]);
    }, []);

    useEffect(() => {
        const id = getTeacherIdFromAuth();
        if (id) { setTeacherId(id); } else { router.replace('/login'); }
    }, [router]);

    useEffect(() => {
        if (!teacherId) return;
        const fetchTeacherData = async () => {
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
                console.error('Error fetching teacher data:', error);
                setTeacherName('Error fetching data');
                showToast('An error occurred while loading teacher information.', 'error');
            }
        };
        fetchTeacherData();
    }, [teacherId]);

    useEffect(() => {
        const fetchObjectives = async () => {
            if (!selectedCourse || !teacherId || !selectedSession) {
                setCourseObjectives([]);
                return;
            }
            setIsLoadingObjectives(true);
            setCourseObjectives([]);
            try {
                const response = await fetch(
                    `/api/getCourseObjectives?teacherId=${teacherId}&courseId=${selectedCourse}&session=${selectedSession}`
                );
                if (!response.ok) throw new Error('Failed to fetch objectives');
                const data: ApiCourseObjective[] = await response.json();
                if (data && data.length > 0) {
                    setCourseObjectives(data.map((obj, index) => ({
                        id: `loaded_objective_${index}`,
                        description: obj.courseObjective,
                        programOutcome: obj.mappedProgramOutcome,
                        displayNumber: index + 1,
                        bloomsTaxonomy: obj.bloomsTaxonomy || [],
                        knowledgeProfile: obj.knowledgeProfile || [],
                        complexEngineeringProblem: obj.complexEngineeringProblem || [],
                        complexEngineeringActivity: obj.complexEngineeringActivity || [],
                    })));
                } else {
                    createObjectiveBlock();
                }
            } catch (error) {
                console.error('Failed to load course objectives:', error);
                showToast('Could not load existing course objectives.', 'error');
                createObjectiveBlock();
            } finally {
                setIsLoadingObjectives(false);
            }
        };
        fetchObjectives();
    }, [selectedCourse, selectedSession, teacherId, createObjectiveBlock]);

    // Auto-create a blank card if objectives array is empty after loading
    useEffect(() => {
        if (selectedCourse && selectedSession && !isLoadingObjectives && courseObjectives.length === 0) {
            createObjectiveBlock();
        }
    }, [selectedCourse, selectedSession, courseObjectives, isLoadingObjectives, createObjectiveBlock]);

    // ── Event handlers ──────────────────────────────────────────────────────
    const getCourseLabel = (value: string): string => {
        const course = courses.find(c => c.course_id === value);
        return course ? `${course.courseName} (${course.course_id})` : '';
    };

    const showModal = (
        title: string, message: string, onConfirm: () => void,
        confirmText = 'Confirm', confirmClass = 'btn-primary', showCancel = true
    ) => {
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
        modalConfirmAction();
        closeModal();
    };

    const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setIsToastVisible(true);
        setTimeout(() => setIsToastVisible(false), 3300);
    };

    const handleCourseSelectionChange = (newCourseValue: string) => {
        setCourseObjectives([]);
        setSelectedCourse(newCourseValue);
        setSelectedSession('');
        if (newCourseValue) {
            const courseSessions = courses
                .filter(c => c.course_id === newCourseValue)
                .map(c => c.session)
                .filter((s, i, self) => self.indexOf(s) === i);
            setSessions(courseSessions);
        } else {
            setSessions([]);
        }
        setOpenSelects({});
    };

    const handleSessionChange = (newSession: string) => {
        setSelectedSession(newSession);
        setOpenSelects({});
    };

    const handleObjectiveChange = (
        id: string,
        field: keyof Pick<CourseObjective, 'description' | 'programOutcome'>,
        value: string
    ) => {
        setCourseObjectives(prev => prev.map(obj => obj.id === id ? { ...obj, [field]: value } : obj));
        if (field === 'programOutcome') setOpenSelects({});
    };

    const handleMultiSelectChange = (
        objectiveId: string,
        field: 'bloomsTaxonomy' | 'knowledgeProfile' | 'complexEngineeringProblem' | 'complexEngineeringActivity',
        value: string
    ) => {
        setCourseObjectives(prev => prev.map(obj => {
            if (obj.id !== objectiveId) return obj;
            const newValues = obj[field].includes(value)
                ? obj[field].filter(v => v !== value)
                : [...obj[field], value];
            return { ...obj, [field]: newValues };
        }));
    };

    const handleSaveAllObjectives = async () => {
        if (!selectedCourse || !teacherId || !selectedSession) {
            showToast('Please select a course and session before saving.', 'error');
            return;
        }
        setIsSaving(true);
        let allValid = true;
        const objectivesData = courseObjectives.map(obj => {
            const description   = obj.description.trim();
            const programOutcome = obj.programOutcome;
            if (!description || !programOutcome) allValid = false;
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
            setValidationAttempted(true);
            showModal(
                'Validation Error',
                'Please fill in the highlighted fields — each objective needs a description and a Program Outcome.',
                () => {}, 'OK', 'btn-primary', false
            );
            setIsSaving(false);
            return;
        }
        setValidationAttempted(false);

        if (objectivesData.length === 0) {
            showToast('No course objectives to save.', 'warning');
            setIsSaving(false);
            return;
        }

        try {
            const response = await fetch('/api/courseObjectives', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teacherId,
                    courseId: selectedCourse,
                    session: selectedSession,
                    objectives: objectivesData,
                }),
            });
            const result = await response.json();
            if (response.ok) {
                showToast(result.message || 'Objectives saved successfully!', 'success');
                fetch('/api/audit-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        teacherId,
                        action: 'save_course_objectives',
                        details: { courseId: selectedCourse, session: selectedSession, count: objectivesData.length },
                    }),
                }).catch(() => {});
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
            showToast('At least one course objective is required.', 'warning');
            return;
        }
        showModal(
            'Confirm Removal',
            'Are you sure you want to remove this course objective?',
            () => {
                setCourseObjectives(prev => prev.filter(obj => obj.id !== blockId));
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

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <Layout teacherName={teacherName} onLogout={handleLogout} page="homepage" title="Outcome Mapper">
            <Head>
                <title>Course Management — BUP OBE</title>
            </Head>

            {/* Page header */}
            <div className="page-header-row">
                <div>
                    <h1 className="page-header-title">Course Management</h1>
                    <p className="page-header-subtitle">
                        Define and map Course Objectives (CO) to ensure alignment with Program Outcomes (PO) and Bloom&apos;s Taxonomy levels.
                    </p>
                </div>
            </div>

            {/* ── Course Selection ───────────────────────────────────── */}
            <div className="section-card">
                <div className="section-card-header">
                    <div>
                        <h2 className="section-card-title">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16" className="section-card-title-icon">
                                <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
                            </svg>
                            Course Selection
                        </h2>
                    </div>
                </div>
                <div className="section-card-body">
                    <div className="dropdown-grid">
                        {/* Select Course */}
                        <div className="dropdown-item">
                            <label className="form-label">1. Select Course</label>
                            <div className="custom-select" ref={courseSelectRef}>
                                <button
                                    type="button"
                                    className={`custom-select-toggle ${courses.length === 0 ? 'disabled' : ''}`}
                                    onClick={() => toggleSelect('course')}
                                    disabled={courses.length === 0}
                                >
                                    <span className={!selectedCourse ? 'placeholder' : ''}>
                                        {selectedCourse
                                            ? getCourseLabel(selectedCourse)
                                            : '-- Please select a course --'}
                                    </span>
                                </button>
                                {openSelects['course'] && (
                                    <ul className="custom-select-options">
                                        {Array.from(new Map(courses.map(c => [c.course_id, c])).values()).map(course => (
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

                        {/* Select Session */}
                        <div className="dropdown-item">
                            <label className="form-label">2. Select Session</label>
                            <div className="custom-select" ref={sessionSelectRef}>
                                <button
                                    type="button"
                                    className={`custom-select-toggle ${!selectedCourse || sessions.length === 0 ? 'disabled' : ''}`}
                                    onClick={() => toggleSelect('session')}
                                    disabled={!selectedCourse || sessions.length === 0}
                                >
                                    <span className={!selectedSession ? 'placeholder' : ''}>
                                        {selectedCourse
                                            ? selectedSession || '-- Please select a session --'
                                            : '-- Select a course first --'}
                                    </span>
                                </button>
                                {openSelects['session'] && selectedCourse && (
                                    <ul className="custom-select-options">
                                        <li
                                            className={`custom-select-option placeholder ${selectedSession === '' ? 'selected' : ''}`}
                                            onClick={() => handleSessionChange('')}
                                        >
                                            -- Please select a session --
                                        </li>
                                        {sessions.map(s => (
                                            <li
                                                key={s}
                                                className={`custom-select-option ${selectedSession === s ? 'selected' : ''}`}
                                                onClick={() => handleSessionChange(s)}
                                            >
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── CO Cards ──────────────────────────────────────────── */}
            {selectedCourse && selectedSession ? (
                <div className="section-card">
                    <div className="section-card-header">
                        <div>
                            <h2 className="section-card-title">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16" className="section-card-title-icon">
                                    <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z" />
                                </svg>
                                Course Objectives (CO)
                            </h2>
                            <p className="section-card-subtitle">
                                Define objectives for <strong>{getCourseLabel(selectedCourse)}</strong> — {selectedSession}
                            </p>
                        </div>
                    </div>

                    <div className="section-card-body">
                        {isLoadingObjectives ? (
                            <SkeletonObjectiveCards count={3} />
                        ) : (
                            <div id="courseObjectivesContainer" className="objectives-container">
                                {courseObjectives.map((obj) => (
                                    <div key={obj.id} className="co-card">
                                        {/* Card header */}
                                        <div className="co-card-header">
                                            <div className="co-card-number">CO{obj.displayNumber}</div>
                                            {courseObjectives.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="co-card-remove"
                                                    onClick={() => handleRemoveObjective(obj.id)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    Remove
                                                </button>
                                            )}
                                        </div>

                                        {/* Description + PO row */}
                                        <div className="objective-main-row">
                                            <div className="objective-description">
                                                <label className="label-compact">
                                                    Description
                                                    {validationAttempted && !obj.description.trim() && (
                                                        <span className="field-error-msg" style={{ marginLeft: '0.5rem' }}>Required</span>
                                                    )}
                                                </label>
                                                <textarea
                                                    className={`textarea-compact${validationAttempted && !obj.description.trim() ? ' input-error-border' : ''}`}
                                                    placeholder="Enter course objective description..."
                                                    value={obj.description}
                                                    onChange={e => handleObjectiveChange(obj.id, 'description', e.target.value)}
                                                    rows={2}
                                                    maxLength={300}
                                                />
                                                <div className={`textarea-char-counter${obj.description.length > 260 ? ' near-limit' : ''}`}>
                                                    {obj.description.length}/300
                                                </div>
                                            </div>

                                            <div className="objective-po">
                                                <label className="label-compact">
                                                    Program Outcome
                                                    {validationAttempted && !obj.programOutcome && (
                                                        <span className="field-error-msg" style={{ marginLeft: '0.5rem' }}>Required</span>
                                                    )}
                                                </label>
                                                <div className="custom-select">
                                                    <button
                                                        type="button"
                                                        className={`custom-select-toggle compact${validationAttempted && !obj.programOutcome ? ' input-error-border' : ''}`}
                                                        onClick={() => toggleSelect(`po-${obj.id}`)}
                                                    >
                                                        <span className={!obj.programOutcome ? 'placeholder' : ''}>
                                                            {obj.programOutcome || '-- Select PO --'}
                                                        </span>
                                                    </button>
                                                    {openSelects[`po-${obj.id}`] && (
                                                        <ul className="custom-select-options">
                                                            <li
                                                                className={`custom-select-option placeholder ${obj.programOutcome === '' ? 'selected' : ''}`}
                                                                onClick={() => handleObjectiveChange(obj.id, 'programOutcome', '')}
                                                            >
                                                                -- Select PO --
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
                                        </div>

                                        {/* Taxonomy selectors */}
                                        <div className="objective-taxonomy-grid">
                                            {/* Bloom's */}
                                            <div className="taxonomy-item">
                                                <label className="label-compact">Bloom&apos;s</label>
                                                <div className="multiselect-dropdown compact">
                                                    <button type="button" className="multiselect-toggle compact" onClick={() => toggleDropdown(`${obj.id}-blooms`)}>
                                                        <span className={obj.bloomsTaxonomy.length === 0 ? 'placeholder' : ''}>
                                                            {obj.bloomsTaxonomy.length > 0 ? obj.bloomsTaxonomy.join(', ') : 'Select'}
                                                        </span>
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" height="16" width="16">
                                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                    {openDropdowns[`${obj.id}-blooms`] && (
                                                        <div className="multiselect-options compact">
                                                            {Object.entries(BLOOMS_TAXONOMY).map(([domain, levels]) => (
                                                                <div key={domain} className="domain-group">
                                                                    <div className="domain-header">{domain.split(' ')[0]}</div>
                                                                    {levels.map(level => (
                                                                        <label key={level.code} className="multiselect-option compact">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={obj.bloomsTaxonomy.includes(level.code)}
                                                                                onChange={() => handleMultiSelectChange(obj.id, 'bloomsTaxonomy', level.code)}
                                                                            />
                                                                            {level.code}
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Knowledge */}
                                            <div className="taxonomy-item">
                                                <label className="label-compact">Knowledge (K)</label>
                                                <div className="multiselect-dropdown compact">
                                                    <button type="button" className="multiselect-toggle compact" onClick={() => toggleDropdown(`${obj.id}-knowledge`)}>
                                                        <span className={obj.knowledgeProfile.length === 0 ? 'placeholder' : ''}>
                                                            {obj.knowledgeProfile.length > 0 ? obj.knowledgeProfile.join(', ') : 'Select'}
                                                        </span>
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" height="16" width="16">
                                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                    {openDropdowns[`${obj.id}-knowledge`] && (
                                                        <div className="multiselect-options compact">
                                                            {KNOWLEDGE_PROFILE.map(k => (
                                                                <label key={k.code} className="multiselect-option compact" title={k.text}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={obj.knowledgeProfile.includes(k.code)}
                                                                        onChange={() => handleMultiSelectChange(obj.id, 'knowledgeProfile', k.code)}
                                                                    />
                                                                    {k.code}
                                                                </label>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Problem */}
                                            <div className="taxonomy-item">
                                                <label className="label-compact">Problem (P)</label>
                                                <div className="multiselect-dropdown compact">
                                                    <button type="button" className="multiselect-toggle compact" onClick={() => toggleDropdown(`${obj.id}-problem`)}>
                                                        <span className={obj.complexEngineeringProblem.length === 0 ? 'placeholder' : ''}>
                                                            {obj.complexEngineeringProblem.length > 0 ? obj.complexEngineeringProblem.join(', ') : 'Select'}
                                                        </span>
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" height="16" width="16">
                                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                    {openDropdowns[`${obj.id}-problem`] && (
                                                        <div className="multiselect-options compact">
                                                            {COMPLEX_ENGINEERING_PROBLEM.map(p => (
                                                                <label key={p.code} className="multiselect-option compact" title={p.text}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={obj.complexEngineeringProblem.includes(p.code)}
                                                                        onChange={() => handleMultiSelectChange(obj.id, 'complexEngineeringProblem', p.code)}
                                                                    />
                                                                    {p.code}
                                                                </label>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Activity */}
                                            <div className="taxonomy-item">
                                                <label className="label-compact">Activity (A)</label>
                                                <div className="multiselect-dropdown compact">
                                                    <button type="button" className="multiselect-toggle compact" onClick={() => toggleDropdown(`${obj.id}-activity`)}>
                                                        <span className={obj.complexEngineeringActivity.length === 0 ? 'placeholder' : ''}>
                                                            {obj.complexEngineeringActivity.length > 0 ? obj.complexEngineeringActivity.join(', ') : 'Select'}
                                                        </span>
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" height="16" width="16">
                                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                    {openDropdowns[`${obj.id}-activity`] && (
                                                        <div className="multiselect-options compact">
                                                            {COMPLEX_ENGINEERING_ACTIVITY.map(a => (
                                                                <label key={a.code} className="multiselect-option compact" title={a.text}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={obj.complexEngineeringActivity.includes(a.code)}
                                                                        onChange={() => handleMultiSelectChange(obj.id, 'complexEngineeringActivity', a.code)}
                                                                    />
                                                                    {a.code}
                                                                </label>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="action-buttons-compact">
                            <button type="button" className="btn btn-secondary btn-compact" onClick={createObjectiveBlock}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Add Objective
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary btn-compact"
                                onClick={handleSaveAllObjectives}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <>
                                        <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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

                    {/* Metrics row */}
                    <div className="co-metrics-row">
                        <div className="co-metric-item">
                            <div className="co-metric-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z" />
                                </svg>
                            </div>
                            <div>
                                <div className="co-metric-value">{mappingStrength}%</div>
                                <div className="co-metric-label">Mapping Strength</div>
                                <div className="co-metric-sub">
                                    {mappingStrength >= 75 ? 'Strong PO Alignment' : mappingStrength >= 50 ? 'Moderate Alignment' : 'Needs Improvement'}
                                </div>
                            </div>
                        </div>
                        <div className="co-metric-item">
                            <div className="co-metric-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                    <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z" />
                                </svg>
                            </div>
                            <div>
                                <div className="co-metric-value">{String(courseObjectives.length).padStart(2, '0')}</div>
                                <div className="co-metric-label">Total COs</div>
                                <div className="co-metric-sub">Draft Active</div>
                            </div>
                        </div>
                        <div className="co-metric-item">
                            <div className="co-metric-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                </svg>
                            </div>
                            <div>
                                <div className="co-metric-value">
                                    <span className={`validation-badge ${validationStatus.cls}`}>{validationStatus.label}</span>
                                </div>
                                <div className="co-metric-label" style={{ marginTop: '0.25rem' }}>Validation</div>
                            </div>
                        </div>
                        <div className="co-metric-item">
                            <div className="co-metric-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                    <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />
                                </svg>
                            </div>
                            <div>
                                <div className="co-metric-value">Active</div>
                                <div className="co-metric-label">Last Audit</div>
                                <div className="co-metric-sub">Session {selectedSession}</div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="section-card">
                    <div className="no-course-state">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48" style={{ opacity: 0.25, color: 'var(--primary-color)', marginBottom: '0.75rem' }}>
                            <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z" />
                        </svg>
                        <p>
                            {courses.length > 0
                                ? 'Please select a course and session to begin defining objectives.'
                                : 'No courses are assigned to this teacher, or they are still loading.'}
                        </p>
                    </div>
                </div>
            )}

            {/* ── Program Outcome Coverage ───────────────────────────── */}
            {selectedCourse && selectedSession && courseObjectives.length > 0 && (
                <div className="section-card">
                    <div className="section-card-header">
                        <div>
                            <h2 className="section-card-title">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16" className="section-card-title-icon">
                                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                                </svg>
                                Program Outcome Coverage
                            </h2>
                            <p className="section-card-subtitle">Distribution of Course Objectives across Program Outcomes.</p>
                        </div>
                        {hasReviewRequired && (
                            <div className="review-inline-badge">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                                </svg>
                                Some COs are incomplete
                            </div>
                        )}
                    </div>
                    <div className="section-card-body">
                        <div className="po-coverage-grid">
                            {poCoverage.filter(po => po.count > 0).map(po => (
                                <div key={po.key} className="po-coverage-item">
                                    <span className="po-coverage-label">{po.key}: {po.label}</span>
                                    <div className="po-coverage-bar-wrap">
                                        <div className="po-coverage-bar-fill" style={{ width: `${Math.max(po.pct, 4)}%` }} />
                                    </div>
                                    <span className="po-coverage-pct">{po.pct}%</span>
                                </div>
                            ))}
                            {poCoverage.every(po => po.count === 0) && (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                                    No Program Outcomes mapped yet. Add a PO to each CO above.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal ────────────────────────────────────────────────── */}
            {isModalOpen && (
                <div className="modal-backdrop">
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

            {/* ── Toast ────────────────────────────────────────────────── */}
            <div className={`notification-toast ${isToastVisible ? 'visible' : ''} ${toastType === 'success' ? 'toast-success' : toastType === 'error' ? 'toast-error' : 'toast-warning'}`}>
                <p>{toastMessage}</p>
            </div>
        </Layout>
    );
};

export default HomePage;
