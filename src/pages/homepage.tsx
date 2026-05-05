import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { getTeacherIdFromAuth, removeAuthTokenCookie } from '../lib/jwt';
import TeacherDashboardLayout from '../components/teacher/TeacherDashboardLayout';
import { SkeletonTable } from '../components/Skeleton';

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
        { code: 'C1', text: 'Remembering' },
        { code: 'C2', text: 'Understanding' },
        { code: 'C3', text: 'Applying' },
        { code: 'C4', text: 'Analyzing' },
        { code: 'C5', text: 'Evaluating' },
        { code: 'C6', text: 'Creating' },
    ],
    'Affective Domain': [
        { code: 'A1', text: 'Receiving' },
        { code: 'A2', text: 'Responding' },
        { code: 'A3', text: 'Valuing' },
        { code: 'A4', text: 'Organizing' },
        { code: 'A5', text: 'Characterizing' },
    ],
    'Psychomotor Domain (Simpson)': [
        { code: 'P1', text: 'Perception' },
        { code: 'P2', text: 'Set' },
        { code: 'P3', text: 'Guided Response' },
        { code: 'P4', text: 'Mechanism' },
        { code: 'P5', text: 'Complex Overt Response' },
        { code: 'P6', text: 'Adaptation' },
        { code: 'P7', text: 'Origination' },
    ],
};

const KNOWLEDGE_PROFILE = [
    { code: 'K1', text: 'Natural sciences' },
    { code: 'K2', text: 'Mathematics & computer science' },
    { code: 'K3', text: 'Engineering fundamentals' },
    { code: 'K4', text: 'Engineering specialist knowledge' },
    { code: 'K5', text: 'Engineering design' },
    { code: 'K6', text: 'Engineering practice' },
    { code: 'K7', text: 'Engineering in society' },
    { code: 'K8', text: 'Research literature' },
];

const COMPLEX_ENGINEERING_PROBLEM = [
    { code: 'P1', text: 'Depth of knowledge required' },
    { code: 'P2', text: 'Conflicting requirements' },
    { code: 'P3', text: 'Depth of analysis' },
    { code: 'P4', text: 'Familiarity of issues' },
    { code: 'P5', text: 'Applicable codes' },
    { code: 'P6', text: 'Stakeholder involvement' },
    { code: 'P7', text: 'Interdependence' },
];

const COMPLEX_ENGINEERING_ACTIVITY = [
    { code: 'A1', text: 'Range of resources' },
    { code: 'A2', text: 'Level of interaction' },
    { code: 'A3', text: 'Innovation' },
    { code: 'A4', text: 'Societal/environmental consequences' },
    { code: 'A5', text: 'Familiarity' },
];

function splitBloomTaxonomy(codes: string[]) {
    const c = codes.filter((x) => x.startsWith('C'));
    const a = codes.filter((x) => x.startsWith('A'));
    const pPsych = codes.filter((x) => /^P\d+$/.test(x));
    return { c, a, pPsych };
}

function bloomBadgeClass(code: string): string {
    const map: Record<string, string> = {
        C1: 'bg-sky-100 text-sky-900 ring-sky-200',
        C2: 'bg-cyan-100 text-cyan-900 ring-cyan-200',
        C3: 'bg-emerald-100 text-emerald-900 ring-emerald-200',
        C4: 'bg-indigo-100 text-indigo-900 ring-indigo-200',
        C5: 'bg-amber-100 text-amber-900 ring-amber-200',
        C6: 'bg-violet-100 text-violet-900 ring-violet-200',
        A1: 'bg-teal-100 text-teal-900 ring-teal-200',
        A2: 'bg-teal-100 text-teal-900 ring-teal-200',
        A3: 'bg-teal-100 text-teal-900 ring-teal-200',
        A4: 'bg-teal-100 text-teal-900 ring-teal-200',
        A5: 'bg-teal-100 text-teal-900 ring-teal-200',
        P1: 'bg-slate-100 text-slate-900 ring-slate-200',
        P2: 'bg-slate-100 text-slate-900 ring-slate-200',
        P3: 'bg-slate-100 text-slate-900 ring-slate-200',
        P4: 'bg-slate-100 text-slate-900 ring-slate-200',
        P5: 'bg-slate-100 text-slate-900 ring-slate-200',
        P6: 'bg-slate-100 text-slate-900 ring-slate-200',
        P7: 'bg-slate-100 text-slate-900 ring-slate-200',
    };
    return map[code] ?? 'bg-gray-100 text-gray-800 ring-gray-200';
}

function computeRowCompleteness(obj: CourseObjective): number {
    let n = 0;
    const checks = [
        obj.description.trim().length > 0,
        !!obj.programOutcome,
        obj.bloomsTaxonomy.length > 0,
        obj.knowledgeProfile.length > 0,
        obj.complexEngineeringProblem.length > 0,
        obj.complexEngineeringActivity.length > 0,
    ];
    checks.forEach((x) => {
        if (x) n++;
    });
    return n / checks.length;
}

function computeMappingStrengthPercent(objectives: CourseObjective[]): number {
    if (objectives.length === 0) return 0;
    const avg = objectives.reduce((acc, o) => acc + computeRowCompleteness(o), 0) / objectives.length;
    return Math.round(avg * 100);
}

function AttainmentRing({ value }: { value: number }) {
    const stroke = 8;
    const r = 52;
    const c = 2 * Math.PI * r;
    const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;
    return (
        <div className="relative mx-auto h-36 w-36 shrink-0">
            <svg className="-rotate-90" viewBox="0 0 120 120" aria-hidden>
                <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
                <circle
                    cx="60"
                    cy="60"
                    r={r}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth={stroke}
                    strokeDasharray={c}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-[stroke-dashoffset] duration-500 ease-out"
                />
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold tracking-tight text-[#334155]">{value}%</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#7928ca]">Strength</span>
            </div>
        </div>
    );
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

    const [objectiveModalId, setObjectiveModalId] = useState<string | null>(null);

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
    const [validationAttempted, setValidationAttempted] = useState<boolean>(false);
    const [openSelects, setOpenSelects] = useState<Record<string, boolean>>({});

    const modalObjective = useMemo(
        () => (objectiveModalId ? courseObjectives.find((o) => o.id === objectiveModalId) : undefined),
        [courseObjectives, objectiveModalId],
    );

    const mappingStrength = useMemo(() => computeMappingStrengthPercent(courseObjectives), [courseObjectives]);

    const validationOk = useMemo(() => {
        if (courseObjectives.length === 0) return false;
        return courseObjectives.every((o) => o.description.trim() && o.programOutcome);
    }, [courseObjectives]);

    const poCoverage = useMemo(() => {
        const counts = Array.from({ length: 12 }, () => 0);
        for (const o of courseObjectives) {
            const m = /^PO(\d+)$/.exec(o.programOutcome?.trim() ?? '');
            if (m) {
                const idx = parseInt(m[1], 10) - 1;
                if (idx >= 0 && idx < 12) counts[idx]++;
            }
        }
        const max = Math.max(1, ...counts);
        return counts.map((c, i) => ({
            po: i + 1,
            label: `PO${i + 1}`,
            pct: Math.round((c / max) * 100),
            count: c,
        }));
    }, [courseObjectives]);

    const incompleteCos = useMemo(
        () =>
            courseObjectives
                .filter((o) => !o.description.trim() || !o.programOutcome)
                .map((o) => `CO${o.displayNumber}`)
                .slice(0, 4),
        [courseObjectives],
    );

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

    useOutsideAlerter(courseSelectRef, () => setOpenSelects((prev) => ({ ...prev, course: false })));
    useOutsideAlerter(sessionSelectRef, () => setOpenSelects((prev) => ({ ...prev, session: false })));

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.multiselect-dropdown')) {
                setOpenDropdowns({});
            }
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
        setOpenDropdowns((prev) => ({
            [id]: !prev[id],
        }));
    };

    const toggleSelect = (id: string) => {
        setOpenSelects((prev) => ({
            ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
            [id]: !prev[id],
        }));
    };

    const createObjectiveBlock = useCallback((opts?: { openModal?: boolean }) => {
        const newId = `objectiveBlock_${Date.now()}`;
        setCourseObjectives((prevObjectives) => {
            const next = [
                ...prevObjectives,
                {
                    id: newId,
                    description: '',
                    programOutcome: '',
                    displayNumber: prevObjectives.length + 1,
                    bloomsTaxonomy: [],
                    knowledgeProfile: [],
                    complexEngineeringProblem: [],
                    complexEngineeringActivity: [],
                },
            ];
            return next;
        });
        if (opts?.openModal) {
            setObjectiveModalId(newId);
        }
        return newId;
    }, []);

    useEffect(() => {
        const id = getTeacherIdFromAuth();
        if (id) {
            setTeacherId(id);
        } else {
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
                console.error('Error fetching teacher data:', error);
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
                setObjectiveModalId(null);

                try {
                    const response = await fetch(
                        `/api/getCourseObjectives?teacherId=${teacherId}&courseId=${selectedCourse}&session=${selectedSession}`,
                    );
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
                    console.error('Failed to load course objectives:', error);
                    showToast('Could not load existing course objectives.', 'error');
                    createObjectiveBlock();
                } finally {
                    setIsLoadingObjectives(false);
                }
            } else {
                setCourseObjectives([]);
            }
        };

        fetchObjectives();
    }, [selectedCourse, selectedSession, teacherId, createObjectiveBlock]);

    useEffect(() => {
        if (selectedCourse && selectedSession && !isLoadingObjectives && courseObjectives.length === 0) {
            createObjectiveBlock();
        }
    }, [selectedCourse, selectedSession, courseObjectives, isLoadingObjectives, createObjectiveBlock]);

    const getCourseLabel = (value: string): string => {
        const course = courses.find((c) => c.course_id === value);
        return course ? course.courseName : '';
    };

    const showModal = (
        title: string,
        message: string,
        onConfirm: () => void,
        confirmText: string = 'Confirm',
        confirmClass: string = 'btn-primary',
        showCancel: boolean = true,
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
        setSelectedSession('');
        setObjectiveModalId(null);

        if (newCourseValue) {
            const courseSessions = courses
                .filter((c) => c.course_id === newCourseValue)
                .map((c) => c.session)
                .filter((session, index, self) => self.indexOf(session) === index);
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
        value: string,
    ) => {
        setCourseObjectives((prevObjectives) =>
            prevObjectives.map((obj) => (obj.id === id ? { ...obj, [field]: value } : obj)),
        );
        if (field === 'programOutcome') {
            setOpenSelects({});
        }
    };

    const handleMultiSelectChange = (
        objectiveId: string,
        field: 'bloomsTaxonomy' | 'knowledgeProfile' | 'complexEngineeringProblem' | 'complexEngineeringActivity',
        value: string,
    ) => {
        setCourseObjectives((prev) =>
            prev.map((obj) => {
                if (obj.id === objectiveId) {
                    const newValues = obj[field].includes(value)
                        ? obj[field].filter((v) => v !== value)
                        : [...obj[field], value];
                    return { ...obj, [field]: newValues };
                }
                return obj;
            }),
        );
    };

    const handleSaveAllObjectives = async () => {
        if (!selectedCourse || !teacherId || !selectedSession) {
            showToast('Please select a course and session before saving.', 'error');
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
            setValidationAttempted(true);
            showModal(
                'Validation Error',
                'Please fill in the highlighted fields — each objective needs a description and a Program Outcome.',
                () => {},
                'OK',
                'btn-primary',
                false,
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
                    teacherId: teacherId,
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
                setCourseObjectives((prevObjectives) => prevObjectives.filter((obj) => obj.id !== blockId));
                setObjectiveModalId((prev) => (prev === blockId ? null : prev));
                showToast('Course objective removed.', 'success');
            },
            'Confirm',
            'btn-danger',
        );
    };

    const handleDiscardChanges = () => {
        showModal(
            'Discard changes?',
            'This will reload the page and lose any unsaved edits.',
            () => {
                window.location.reload();
            },
            'Reload',
            'btn-danger',
        );
    };

    const handleLogout = () => {
        removeAuthTokenCookie();
        router.push('/login');
    };

    const renderObjectiveFields = (obj: CourseObjective) => (
        <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
                <div>
                    <label className="mb-1 block text-xs font-semibold text-[#475569]">
                        Description
                        {validationAttempted && !obj.description.trim() && (
                            <span className="ml-2 font-medium text-red-600">Required</span>
                        )}
                    </label>
                    <textarea
                        className={`min-h-[88px] w-full resize-y rounded-lg px-3 py-2 text-sm shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08)] outline-none ring-[#7928ca] ring-offset-2 focus:ring-2 ${
                            validationAttempted && !obj.description.trim() ? 'ring-2 ring-red-400' : ''
                        }`}
                        name={`course_objective_desc_${obj.id}`}
                        placeholder="Enter course objective description..."
                        value={obj.description}
                        onChange={(e) => handleObjectiveChange(obj.id, 'description', e.target.value)}
                        rows={3}
                        maxLength={300}
                    />
                    <div className="mt-1 text-right text-[11px] font-medium text-[#64748b]">{obj.description.length}/300</div>
                </div>
                <div>
                    <label className="mb-1 block text-xs font-semibold text-[#475569]">
                        Program Outcome
                        {validationAttempted && !obj.programOutcome && (
                            <span className="ml-2 font-medium text-red-600">Required</span>
                        )}
                    </label>
                    <div className="custom-select relative">
                        <button
                            type="button"
                            className={`flex w-full items-center justify-between rounded-lg bg-white px-3 py-2 text-left text-sm shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08)] outline-none ring-[#7928ca] ring-offset-2 focus:ring-2 ${
                                validationAttempted && !obj.programOutcome ? 'ring-2 ring-red-400' : ''
                            }`}
                            onClick={() => toggleSelect(`po-${obj.id}`)}
                        >
                            <span className={!obj.programOutcome ? 'text-[#94a3b8]' : 'text-[#334155]'}>
                                {(() => {
                                    if (!obj.programOutcome) return '-- Select PO --';
                                    const n = parseInt(obj.programOutcome.replace(/\D/g, ''), 10);
                                    if (n >= 1 && n <= 12) return BICE_PROGRAM_OUTCOMES[n - 1];
                                    return obj.programOutcome;
                                })()}
                            </span>
                            <span aria-hidden className="text-[#64748b]">
                                ▾
                            </span>
                        </button>
                        {openSelects[`po-${obj.id}`] && (
                            <ul className="absolute z-[80] mt-1 max-h-56 w-full overflow-auto rounded-lg bg-white py-1 shadow-[0px_8px_24px_-8px_rgba(15,23,42,0.25),0px_0px_0px_1px_rgba(0,0,0,0.08)]">
                                <li
                                    className="cursor-pointer px-3 py-2 text-sm hover:bg-[#f8fafc]"
                                    onClick={() => handleObjectiveChange(obj.id, 'programOutcome', '')}
                                >
                                    -- Select PO --
                                </li>
                                {BICE_PROGRAM_OUTCOMES.map((outcome, i) => (
                                    <li
                                        key={`po-${i}`}
                                        className={`cursor-pointer px-3 py-2 text-sm hover:bg-[#f8fafc] ${
                                            obj.programOutcome === `PO${i + 1}` ? 'bg-[#ede9fe] font-semibold text-[#5b21b6]' : ''
                                        }`}
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

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div>
                    <label className="mb-1 block text-xs font-semibold text-[#475569]">Bloom taxonomy (C / A / P)</label>
                    <div className="multiselect-dropdown relative">
                        <button
                            type="button"
                            className="flex w-full items-center justify-between rounded-lg bg-white px-3 py-2 text-sm shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08)]"
                            onClick={() => toggleDropdown(`${obj.id}-blooms`)}
                        >
                            <span className={obj.bloomsTaxonomy.length === 0 ? 'text-[#94a3b8]' : 'text-[#334155]'}>
                                {obj.bloomsTaxonomy.length ? obj.bloomsTaxonomy.join(', ') : 'Select'}
                            </span>
                            <span aria-hidden className="text-[#64748b]">
                                ▾
                            </span>
                        </button>
                        {openDropdowns[`${obj.id}-blooms`] && (
                            <div className="absolute left-0 right-0 z-[80] mt-1 max-h-64 overflow-auto rounded-lg bg-white p-2 shadow-[0px_8px_24px_-8px_rgba(15,23,42,0.25),0px_0px_0px_1px_rgba(0,0,0,0.08)]">
                                {Object.entries(BLOOMS_TAXONOMY).map(([domain, levels]) => (
                                    <div key={domain} className="mb-2">
                                        <div className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wide text-[#7928ca]">
                                            {domain.split(' ')[0]}
                                        </div>
                                        {levels.map((level) => (
                                            <label key={level.code} className="flex cursor-pointer items-center gap-2 px-2 py-1 text-sm hover:bg-[#f8fafc]">
                                                <input
                                                    type="checkbox"
                                                    checked={obj.bloomsTaxonomy.includes(level.code)}
                                                    onChange={() => handleMultiSelectChange(obj.id, 'bloomsTaxonomy', level.code)}
                                                />
                                                <span>
                                                    {level.code} — {level.text}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold text-[#475569]">Knowledge profile (K1–K8)</label>
                    <div className="multiselect-dropdown relative">
                        <button
                            type="button"
                            className="flex w-full items-center justify-between rounded-lg bg-white px-3 py-2 text-sm shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08)]"
                            onClick={() => toggleDropdown(`${obj.id}-knowledge`)}
                        >
                            <span className={obj.knowledgeProfile.length === 0 ? 'text-[#94a3b8]' : 'text-[#334155]'}>
                                {obj.knowledgeProfile.length ? obj.knowledgeProfile.join(', ') : 'Select'}
                            </span>
                            <span aria-hidden className="text-[#64748b]">
                                ▾
                            </span>
                        </button>
                        {openDropdowns[`${obj.id}-knowledge`] && (
                            <div className="absolute left-0 right-0 z-[80] mt-1 max-h-56 overflow-auto rounded-lg bg-white p-2 shadow-[0px_8px_24px_-8px_rgba(15,23,42,0.25),0px_0px_0px_1px_rgba(0,0,0,0.08)]">
                                {KNOWLEDGE_PROFILE.map((k) => (
                                    <label key={k.code} className="flex cursor-pointer items-center gap-2 px-2 py-1 text-sm hover:bg-[#f8fafc]" title={k.text}>
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

                <div>
                    <label className="mb-1 block text-xs font-semibold text-[#475569]">Complex engineering problem (P1–P7)</label>
                    <div className="multiselect-dropdown relative">
                        <button
                            type="button"
                            className="flex w-full items-center justify-between rounded-lg bg-white px-3 py-2 text-sm shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08)]"
                            onClick={() => toggleDropdown(`${obj.id}-problem`)}
                        >
                            <span className={obj.complexEngineeringProblem.length === 0 ? 'text-[#94a3b8]' : 'text-[#334155]'}>
                                {obj.complexEngineeringProblem.length ? obj.complexEngineeringProblem.join(', ') : 'Select'}
                            </span>
                            <span aria-hidden className="text-[#64748b]">
                                ▾
                            </span>
                        </button>
                        {openDropdowns[`${obj.id}-problem`] && (
                            <div className="absolute left-0 right-0 z-[80] mt-1 max-h-56 overflow-auto rounded-lg bg-white p-2 shadow-[0px_8px_24px_-8px_rgba(15,23,42,0.25),0px_0px_0px_1px_rgba(0,0,0,0.08)]">
                                {COMPLEX_ENGINEERING_PROBLEM.map((p) => (
                                    <label key={p.code} className="flex cursor-pointer items-center gap-2 px-2 py-1 text-sm hover:bg-[#f8fafc]" title={p.text}>
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

                <div>
                    <label className="mb-1 block text-xs font-semibold text-[#475569]">Complex engineering activity (A1–A5)</label>
                    <div className="multiselect-dropdown relative">
                        <button
                            type="button"
                            className="flex w-full items-center justify-between rounded-lg bg-white px-3 py-2 text-sm shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08)]"
                            onClick={() => toggleDropdown(`${obj.id}-activity`)}
                        >
                            <span className={obj.complexEngineeringActivity.length === 0 ? 'text-[#94a3b8]' : 'text-[#334155]'}>
                                {obj.complexEngineeringActivity.length ? obj.complexEngineeringActivity.join(', ') : 'Select'}
                            </span>
                            <span aria-hidden className="text-[#64748b]">
                                ▾
                            </span>
                        </button>
                        {openDropdowns[`${obj.id}-activity`] && (
                            <div className="absolute left-0 right-0 z-[80] mt-1 max-h-56 overflow-auto rounded-lg bg-white p-2 shadow-[0px_8px_24px_-8px_rgba(15,23,42,0.25),0px_0px_0px_1px_rgba(0,0,0,0.08)]">
                                {COMPLEX_ENGINEERING_ACTIVITY.map((a) => (
                                    <label key={a.code} className="flex cursor-pointer items-center gap-2 px-2 py-1 text-sm hover:bg-[#f8fafc]" title={a.text}>
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
    );

    const breadcrumbs =
        selectedCourse && selectedSession ? (
            <>
                <span className="font-semibold text-[#7928ca]">BUP OBE System</span>
                <span className="mx-2 text-[#cbd5e1]" aria-hidden>
                    /
                </span>
                <span className="text-[#475569]">Course: {getCourseLabel(selectedCourse)}</span>
                <span className="mx-2 text-[#cbd5e1]" aria-hidden>
                    /
                </span>
                <span className="text-[#475569]">Session: {selectedSession}</span>
            </>
        ) : (
            <>
                <span className="font-semibold text-[#7928ca]">BUP OBE System</span>
                <span className="mx-2 text-[#cbd5e1]" aria-hidden>
                    /
                </span>
                <span className="text-[#475569]">Course Management</span>
            </>
        );

    return (
        <>
            <Head>
                <title>Course Objective Management</title>
            </Head>
            <TeacherDashboardLayout teacherName={teacherName} onLogout={handleLogout} activePage="homepage" breadcrumbs={breadcrumbs}>
                <div className="mx-auto max-w-[1280px] space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-[#334155] sm:text-3xl">Course Management</h1>
                            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#64748b]">
                                Define course objectives, map them to program outcomes, and review alignment strength for your accredited OBE portfolio.
                            </p>
                        </div>
                        <button
                            type="button"
                            disabled
                            title="Export report (coming soon)"
                            className="inline-flex items-center justify-center rounded-lg bg-[#1e293b] px-4 py-2.5 text-sm font-semibold text-white opacity-60 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08)]"
                        >
                            Export report
                        </button>
                    </div>

                    <section className="rounded-xl bg-white p-4 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08),0px_2px_2px_rgba(0,0,0,0.04)] sm:p-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div ref={courseSelectRef}>
                                <label htmlFor="courseSelector" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                                    Select course
                                </label>
                                <div className="custom-select relative">
                                    <button
                                        id="courseSelector"
                                        type="button"
                                        className={`flex w-full items-center justify-between rounded-lg bg-[#fafafa] px-3 py-2.5 text-left text-sm shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08)] ${
                                            courses.length === 0 ? 'cursor-not-allowed opacity-60' : ''
                                        }`}
                                        onClick={() => courses.length && toggleSelect('course')}
                                        disabled={courses.length === 0}
                                    >
                                        <span className={!selectedCourse ? 'text-[#94a3b8]' : 'font-medium text-[#334155]'}>
                                            {selectedCourse
                                                ? `${courses.find((c) => c.course_id === selectedCourse)?.courseName} (${selectedCourse})`
                                                : '— Choose a course —'}
                                        </span>
                                        <span aria-hidden className="text-[#64748b]">
                                            ▾
                                        </span>
                                    </button>
                                    {openSelects.course && (
                                        <ul className="absolute z-[60] mt-1 max-h-56 w-full overflow-auto rounded-lg bg-white py-1 shadow-[0px_8px_24px_-8px_rgba(15,23,42,0.25),0px_0px_0px_1px_rgba(0,0,0,0.08)]">
                                            {Array.from(new Map(courses.map((course) => [course.course_id, course])).values()).map((course) => (
                                                <li
                                                    key={course.course_id}
                                                    className={`cursor-pointer px-3 py-2 text-sm hover:bg-[#f8fafc] ${
                                                        selectedCourse === course.course_id ? 'bg-[#d1fae5] font-semibold text-[#065f46]' : ''
                                                    }`}
                                                    onClick={() => handleCourseSelectionChange(course.course_id)}
                                                >
                                                    {course.courseName} ({course.course_id})
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            <div ref={sessionSelectRef}>
                                <label htmlFor="sessionSelector" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                                    Academic session
                                </label>
                                <div className="custom-select relative">
                                    <button
                                        id="sessionSelector"
                                        type="button"
                                        className={`flex w-full items-center justify-between rounded-lg bg-[#fafafa] px-3 py-2.5 text-left text-sm shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08)] ${
                                            !selectedCourse || sessions.length === 0 ? 'cursor-not-allowed opacity-60' : ''
                                        }`}
                                        onClick={() => selectedCourse && sessions.length && toggleSelect('session')}
                                        disabled={!selectedCourse || sessions.length === 0}
                                    >
                                        <span className={!selectedSession ? 'text-[#94a3b8]' : 'font-medium text-[#334155]'}>
                                            {selectedCourse ? selectedSession || '— Choose session —' : '— Select a course first —'}
                                        </span>
                                        <span aria-hidden className="text-[#64748b]">
                                            ▾
                                        </span>
                                    </button>
                                    {openSelects.session && selectedCourse && (
                                        <ul className="absolute z-[60] mt-1 max-h-56 w-full overflow-auto rounded-lg bg-white py-1 shadow-[0px_8px_24px_-8px_rgba(15,23,42,0.25),0px_0px_0px_1px_rgba(0,0,0,0.08)]">
                                            <li
                                                className={`cursor-pointer px-3 py-2 text-sm hover:bg-[#f8fafc] ${selectedSession === '' ? 'bg-[#ede9fe]' : ''}`}
                                                onClick={() => handleSessionChange('')}
                                            >
                                                — Choose session —
                                            </li>
                                            {sessions.map((session) => (
                                                <li
                                                    key={session}
                                                    className={`cursor-pointer px-3 py-2 text-sm hover:bg-[#f8fafc] ${
                                                        selectedSession === session ? 'bg-[#d1fae5] font-semibold text-[#065f46]' : ''
                                                    }`}
                                                    onClick={() => handleSessionChange(session)}
                                                >
                                                    {session}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {selectedCourse && selectedSession ? (
                        <>
                            <section className="grid gap-4 rounded-xl bg-white p-4 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08),0px_2px_2px_rgba(0,0,0,0.04)] sm:grid-cols-3 sm:p-5">
                                <div className="flex flex-col justify-center border-b border-black/[0.06] pb-4 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Mapping strength</p>
                                    <p className="mt-1 text-3xl font-semibold tracking-tight text-[#10b981]">{mappingStrength}%</p>
                                    <p className="text-xs font-medium text-[#7928ca]">
                                        {mappingStrength >= 85 ? 'Strong PO alignment' : mappingStrength >= 60 ? 'Moderate alignment' : 'Build coverage'}
                                    </p>
                                </div>
                                <div className="flex flex-col justify-center border-b border-black/[0.06] pb-4 sm:border-b-0 sm:border-r sm:pb-0 sm:px-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Total COs</p>
                                    <p className="mt-1 text-3xl font-semibold tracking-tight text-[#334155]">{String(courseObjectives.length).padStart(2, '0')}</p>
                                    <p className="text-xs text-[#64748b]">{isLoadingObjectives ? 'Loading…' : 'Draft on this screen'}</p>
                                </div>
                                <div className="flex flex-col justify-center sm:pl-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Validation status</p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span
                                            className={`inline-flex h-2.5 w-2.5 rounded-full ${validationOk ? 'bg-emerald-500' : 'bg-amber-400'}`}
                                            aria-hidden
                                        />
                                        <p className="text-sm font-semibold text-[#334155]">
                                            {validationOk ? 'Meets OBE criteria' : 'Incomplete objectives'}
                                        </p>
                                    </div>
                                    <p className="mt-1 text-xs text-[#64748b]">Requires description + PO on every CO before save.</p>
                                </div>
                            </section>

                            <section className="rounded-xl bg-white shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08),0px_2px_2px_rgba(0,0,0,0.04)]">
                                <div className="flex flex-col gap-3 border-b border-black/[0.06] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                                    <div>
                                        <h2 className="text-lg font-semibold tracking-tight text-[#334155]">Course objectives (CO)</h2>
                                        <p className="text-xs text-[#64748b]">{getCourseLabel(selectedCourse)} · {selectedSession}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => createObjectiveBlock({ openModal: true })}
                                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#10b981] bg-white px-4 py-2 text-sm font-semibold text-[#047857] shadow-[0px_0px_0px_1px_rgba(16,185,129,0.25)] hover:bg-[#ecfdf5]"
                                    >
                                        + Add CO
                                    </button>
                                </div>

                                <div className="overflow-x-auto px-2 pb-4 pt-2 sm:px-4">
                                    {isLoadingObjectives ? (
                                        <div className="px-2 py-4">
                                            <SkeletonTable rows={4} cols={8} />
                                        </div>
                                    ) : (
                                        <table className="min-w-[1100px] w-full border-separate border-spacing-0 text-left text-sm">
                                            <thead>
                                                <tr className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                                                    <th className="sticky left-0 z-10 bg-white px-3 py-3 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)]">CO</th>
                                                    <th className="px-3 py-3 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)]">Description</th>
                                                    <th className="px-3 py-3 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)]">Bloom (C)</th>
                                                    <th className="px-3 py-3 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)]">Affective (A)</th>
                                                    <th className="px-3 py-3 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)]">Psych (P)</th>
                                                    <th className="px-3 py-3 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)]">Knowledge (K)</th>
                                                    <th className="px-3 py-3 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)]">PO</th>
                                                    <th className="px-3 py-3 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)]">CEP (P)</th>
                                                    <th className="px-3 py-3 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)]">CEA (A)</th>
                                                    <th className="px-3 py-3 text-right shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)]">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {courseObjectives.map((obj, idx) => {
                                                    const { c, a, pPsych } = splitBloomTaxonomy(obj.bloomsTaxonomy);
                                                    const desc = obj.description.trim();
                                                    const short =
                                                        desc.length > 96 ? `${desc.slice(0, 93)}…` : desc || '—';
                                                    const poNum = obj.programOutcome?.replace(/\D/g, '') || '';
                                                    return (
                                                        <tr
                                                            key={obj.id}
                                                            className={`${idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'} hover:bg-[#f8fafc]`}
                                                        >
                                                            <td className={`sticky left-0 z-10 px-3 py-3 font-mono text-xs font-semibold ${idx % 2 === 1 ? 'bg-slate-50/90' : 'bg-white'}`}>
                                                                CO{obj.displayNumber}
                                                            </td>
                                                            <td className="max-w-[280px] px-3 py-3 align-top text-[13px] text-[#475569]" title={desc || undefined}>
                                                                {short}
                                                            </td>
                                                            <td className="px-3 py-3 align-top">
                                                                <div className="flex flex-wrap gap-1">
                                                                    {c.length ? (
                                                                        c.map((code) => (
                                                                            <span
                                                                                key={code}
                                                                                className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${bloomBadgeClass(code)}`}
                                                                            >
                                                                                {code}
                                                                            </span>
                                                                        ))
                                                                    ) : (
                                                                        <span className="text-xs text-[#94a3b8]">—</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-3 align-top">
                                                                <div className="flex flex-wrap gap-1">
                                                                    {a.length ? (
                                                                        a.map((code) => (
                                                                            <span
                                                                                key={code}
                                                                                className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${bloomBadgeClass(code)}`}
                                                                            >
                                                                                {code}
                                                                            </span>
                                                                        ))
                                                                    ) : (
                                                                        <span className="text-xs text-[#94a3b8]">—</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-3 align-top">
                                                                <div className="flex flex-wrap gap-1">
                                                                    {pPsych.length ? (
                                                                        pPsych.map((code) => (
                                                                            <span
                                                                                key={code}
                                                                                className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-800 ring-1 ring-inset ring-slate-200"
                                                                            >
                                                                                {code}
                                                                            </span>
                                                                        ))
                                                                    ) : (
                                                                        <span className="text-xs text-[#94a3b8]">—</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-3 align-top">
                                                                <div className="flex flex-wrap gap-1">
                                                                    {obj.knowledgeProfile.length ? (
                                                                        obj.knowledgeProfile.map((code) => (
                                                                            <span
                                                                                key={code}
                                                                                className="inline-flex rounded-full bg-[#f5f3ff] px-2 py-0.5 text-[11px] font-semibold text-[#5b21b6] ring-1 ring-inset ring-[#ddd6fe]"
                                                                            >
                                                                                {code}
                                                                            </span>
                                                                        ))
                                                                    ) : (
                                                                        <span className="text-xs text-[#94a3b8]">—</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-3 align-top">
                                                                {poNum ? (
                                                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#10b981] text-xs font-bold text-white shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06)]">
                                                                        {poNum}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs text-[#94a3b8]">—</span>
                                                                )}
                                                            </td>
                                                            <td className="px-3 py-3 align-top">
                                                                <div className="flex flex-wrap gap-1">
                                                                    {obj.complexEngineeringProblem.length ? (
                                                                        obj.complexEngineeringProblem.map((code) => (
                                                                            <span
                                                                                key={code}
                                                                                className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900 ring-1 ring-inset ring-amber-200"
                                                                            >
                                                                                {code}
                                                                            </span>
                                                                        ))
                                                                    ) : (
                                                                        <span className="text-xs text-[#94a3b8]">—</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-3 align-top">
                                                                <div className="flex flex-wrap gap-1">
                                                                    {obj.complexEngineeringActivity.length ? (
                                                                        obj.complexEngineeringActivity.map((code) => (
                                                                            <span
                                                                                key={code}
                                                                                className="inline-flex rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-900 ring-1 ring-inset ring-cyan-200"
                                                                            >
                                                                                {code}
                                                                            </span>
                                                                        ))
                                                                    ) : (
                                                                        <span className="text-xs text-[#94a3b8]">—</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-3 align-top text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    <button
                                                                        type="button"
                                                                        className="rounded-lg px-2 py-1 text-xs font-semibold text-[#7928ca] hover:bg-[#f5f3ff]"
                                                                        onClick={() => setObjectiveModalId(obj.id)}
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                                                                        disabled={courseObjectives.length <= 1}
                                                                        onClick={() => handleRemoveObjective(obj.id)}
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </section>

                            <section className="grid gap-4 lg:grid-cols-5">
                                <div className="lg:col-span-3 rounded-xl bg-white p-4 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08),0px_2px_2px_rgba(0,0,0,0.04)] sm:p-6">
                                    <div className="mb-4 flex items-center justify-between gap-2">
                                        <h3 className="text-base font-semibold text-[#334155]">Program outcome coverage</h3>
                                        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#7928ca]">Relative bars</span>
                                    </div>
                                    <div className="max-h-[340px] space-y-3 overflow-y-auto pr-1">
                                        {poCoverage.map((row) => (
                                            <div key={row.po}>
                                                <div className="mb-1 flex items-center justify-between text-xs font-medium text-[#475569]">
                                                    <span>
                                                        {row.label}{' '}
                                                        <span className="font-normal text-[#94a3b8]">({row.count} COs)</span>
                                                    </span>
                                                    <span className="tabular-nums text-[#64748b]">{row.pct}%</span>
                                                </div>
                                                <div className="h-2 overflow-hidden rounded-full bg-[#e2e8f0]">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-[#10b981] to-[#059669] transition-all duration-500"
                                                        style={{ width: `${row.pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="lg:col-span-2 flex flex-col gap-4">
                                    <div className="rounded-xl bg-white p-4 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08),0px_2px_2px_rgba(0,0,0,0.04)] sm:p-6">
                                        <h3 className="text-center text-sm font-semibold text-[#334155]">Alignment attainment</h3>
                                        <AttainmentRing value={mappingStrength} />
                                        <p className="text-center text-xs text-[#64748b]">Weighted by taxonomy, knowledge, WA tags, and PO mapping completeness.</p>
                                    </div>

                                    <div className="rounded-xl bg-gradient-to-br from-[#047857] to-[#065f46] p-5 text-white shadow-[0px_8px_24px_-12px_rgba(6,95,70,0.55)]">
                                        <p className="text-sm font-semibold">Review required</p>
                                        <p className="mt-2 text-sm leading-relaxed text-emerald-50">
                                            {incompleteCos.length
                                                ? `Outstanding drafts: ${incompleteCos.join(', ')}. Complete descriptions and PO mappings.`
                                                : 'All objectives include a description and primary PO. Save to persist.'}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const target = courseObjectives.find((o) => !o.description.trim() || !o.programOutcome);
                                                if (target) setObjectiveModalId(target.id);
                                                else showToast('Everything looks complete. Save when ready.', 'success');
                                            }}
                                            className="mt-4 w-full rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#065f46] shadow-[0px_0px_0px_1px_rgba(255,255,255,0.25)] hover:bg-emerald-50"
                                        >
                                            Complete draft
                                        </button>
                                    </div>
                                </div>
                            </section>

                            <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-xl border border-black/[0.06] bg-white/95 p-4 shadow-[0px_8px_30px_-12px_rgba(15,23,42,0.35)] backdrop-blur sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={handleDiscardChanges}
                                    className="inline-flex flex-1 items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#475569] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08)] hover:bg-[#f8fafc] sm:flex-none"
                                >
                                    Discard changes
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveAllObjectives}
                                    disabled={isSaving}
                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#1e293b] px-5 py-2.5 text-sm font-semibold text-white shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08)] hover:bg-[#0f172a] disabled:opacity-60 sm:flex-none"
                                >
                                    {isSaving ? 'Saving…' : 'Save changes'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <section className="rounded-xl bg-white p-8 text-center shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08)]">
                            <p className="text-sm text-[#64748b]">
                                {courses.length > 0
                                    ? 'Select a course and academic session to load objectives.'
                                    : 'No courses are assigned to this teacher, or they are still loading.'}
                            </p>
                        </section>
                    )}
                </div>

                {objectiveModalId && modalObjective && (
                    <div
                        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center"
                        onClick={() => setObjectiveModalId(null)}
                        role="presentation"
                    >
                        <div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="co-modal-title"
                            className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white shadow-[0px_24px_48px_-24px_rgba(15,23,42,0.45),0px_0px_0px_1px_rgba(0,0,0,0.08)]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-black/[0.06] bg-white px-5 py-4">
                                <div>
                                    <h3 id="co-modal-title" className="text-lg font-semibold text-[#334155]">
                                        {getCourseLabel(selectedCourse)} — CO{modalObjective.displayNumber}
                                    </h3>
                                    <p className="text-xs text-[#64748b]">{selectedSession}</p>
                                </div>
                                <button
                                    type="button"
                                    className="rounded-lg p-2 text-[#64748b] hover:bg-[#f8fafc]"
                                    onClick={() => setObjectiveModalId(null)}
                                    aria-label="Close"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="space-y-4 px-5 py-5">{renderObjectiveFields(modalObjective)}</div>
                            <div className="flex flex-col gap-2 border-t border-black/[0.06] bg-[#fafafa] px-5 py-4 sm:flex-row sm:justify-between">
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                                        disabled={courseObjectives.length <= 1}
                                        onClick={() => handleRemoveObjective(modalObjective.id)}
                                    >
                                        Delete CO
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    className="rounded-lg bg-[#1e293b] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0f172a]"
                                    onClick={() => setObjectiveModalId(null)}
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {isModalOpen && (
                    <div id="confirmationModal" className="modal-backdrop">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h3 className="modal-title">{modalTitle}</h3>
                            </div>
                            <div className="modal-body">
                                <p>{modalMessage}</p>
                            </div>
                            <div className="modal-footer">
                                {showModalCancel && (
                                    <button className="btn btn-outline" onClick={closeModal}>
                                        Cancel
                                    </button>
                                )}
                                <button className={`btn ${modalConfirmClassName}`} onClick={handleModalConfirm}>
                                    {modalConfirmText}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div
                    id="notificationToast"
                    className={`notification-toast ${isToastVisible ? 'visible' : ''} ${
                        toastType === 'success' ? 'toast-success' : toastType === 'error' ? 'toast-error' : 'toast-warning'
                    }`}
                >
                    <p>{toastMessage}</p>
                </div>
            </TeacherDashboardLayout>
        </>
    );
};

export default HomePage;
