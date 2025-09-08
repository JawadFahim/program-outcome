import Head from 'next/head';
import { useState, useEffect } from 'react';
import '../../styles/admin/teacher-details.css';
import AdminNavbar from '../../components/admin/AdminNavbar';

interface CourseObjective {
    co_no: string;
    courseObjective: string;
    mappedProgramOutcome: string;
}

interface Course {
    _id: string;
    courseId: string;
    courseName: string;
    session: string;
    courseObjectives: CourseObjective[];
}

interface OfferedCourse {
    courseCode: string;
    courseTitle: string;
    credit: number;
    versionCode: string;
}

interface Teacher {
    _id: string;
    teacherId: string;
    email: string;
    name: string;
    courses: Course[];
}

const TeacherDetailsPage = () => {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [openCourseId, setOpenCourseId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [isTeacherDetailModalOpen, setIsTeacherDetailModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddCoursesModalOpen, setIsAddCoursesModalOpen] = useState(false);

    // Form state
    const [teacherId, setTeacherIdState] = useState('');
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    
    // New state for dynamic course selection
    const [sessions, setSessions] = useState<string[]>([]);
    const [programs, setPrograms] = useState<string[]>([]);
    const [selectedSession, setSelectedSession] = useState('');
    const [selectedProgram, setSelectedProgram] = useState('');
    const [offeredCourses, setOfferedCourses] = useState<OfferedCourse[]>([]);
    const [selectedCourses, setSelectedCourses] = useState<OfferedCourse[]>([]);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

    useEffect(() => {
        document.body.classList.add('admin-teacher-details');
        return () => {
            document.body.classList.remove('admin-teacher-details');
        };
    }, []);

    const fetchTeachers = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/teachers');
            if (!res.ok) throw new Error('Failed to fetch teacher data');
            const data = await res.json();
            setTeachers(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    useEffect(() => {
        const fetchProgramInfo = async () => {
            try {
                const res = await fetch('/api/admin/get-program-info');
                const data = await res.json();
                setSessions(data.sessions || []);
                setPrograms(data.programs || []);
            } catch (err) {
                console.error("Failed to fetch program info", err);
            }
        };

        if (isModalOpen || isAddCoursesModalOpen) {
            fetchProgramInfo();
        }
    }, [isModalOpen, isAddCoursesModalOpen]);

    useEffect(() => {
        const fetchOfferedCourses = async () => {
            if (selectedSession && selectedProgram) {
                try {
                    const res = await fetch(`/api/admin/get-offered-courses-details?session=${selectedSession}&program=${selectedProgram}`);
                    if (res.ok) {
                        const data = await res.json();
                        setOfferedCourses(data.courses || []);
                    } else {
                        setOfferedCourses([]);
                    }
                } catch (err) {
                    console.error("Failed to fetch offered courses", err);
                    setOfferedCourses([]);
                }
            } else {
                setOfferedCourses([]);
            }
        };
        fetchOfferedCourses();
    }, [selectedSession, selectedProgram]);

    const toggleCourse = (courseId: string) => {
        setOpenCourseId(openCourseId === courseId ? null : courseId);
    };

    const handleTeacherCardClick = (teacher: Teacher) => {
        setSelectedTeacher(teacher);
        setIsTeacherDetailModalOpen(true);
        setOpenCourseId(null); // Reset course accordion state
    };

    const filteredTeachers = teachers.filter(teacher => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        
        const nameMatch = teacher.name.toLowerCase().includes(query);
        const idMatch = teacher.teacherId.toLowerCase().includes(query);
        
        return nameMatch || idMatch;
    });

    const handleCourseSelection = (course: OfferedCourse, isSelected: boolean) => {
        if (isSelected) {
            setSelectedCourses(prev => [...prev, course]);
        } else {
            setSelectedCourses(prev => prev.filter(c => !(c.courseCode === course.courseCode && c.versionCode === course.versionCode)));
        }
    };

    const resetForm = () => {
        setTeacherIdState('');
        setName('');
        setEmail('');
        setSelectedSession('');
        setSelectedProgram('');
        setOfferedCourses([]);
        setSelectedCourses([]);
        setSubmitError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitError('');

        const teacherData = {
            teacherId,
            email,
            name,
            password: 'test', // Default password
            courses: selectedCourses.map(c => ({
                courseId: c.courseCode,
                courseName: c.courseTitle,
                session: selectedSession,
            })),
        };

        try {
            const res = await fetch('/api/admin/add-teacher', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(teacherData),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to add teacher');
            }

            setIsModalOpen(false);
            setIsPreviewModalOpen(false);
            resetForm();
            await fetchTeachers(); // Refresh teacher list
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateTeacher = async () => {
        if (!selectedTeacher) return;
        setSubmitting(true);
        try {
            const res = await fetch('/api/admin/add-courses-to-teacher', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teacherId: selectedTeacher._id,
                    newCourses: selectedCourses.map(c => ({
                        courseId: c.courseCode,
                        courseName: c.courseTitle,
                        session: selectedSession,
                    })),
                }),
            });
            if (!res.ok) throw new Error('Failed to add courses');
            setIsAddCoursesModalOpen(false);
            setIsPreviewModalOpen(false);
            await fetchTeachers();
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };


    return (
        <>
            <Head>
                <title>Teacher Details - Admin</title>
            </Head>
            <AdminNavbar page="teachers" />
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Teacher Management</h1>
                    <div className="header-actions">
                        <div className="search-container">
                            <input
                                type="text"
                                placeholder="Search by name or teacher ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        <button onClick={() => { setIsModalOpen(true); resetForm(); }} className="btn-add-teacher">
                            + Add Teacher
                        </button>
                    </div>
                </div>
                <main>
                    {loading && <p className="message">Loading teacher data...</p>}
                    {error && <p className="message" style={{color: '#ef4444'}}>{error}</p>}
                    {!loading && !error && (
                        <>
                            {filteredTeachers.length > 0 ? (
                                <div className="teacher-cards-grid">
                                    {filteredTeachers.map(teacher => (
                                        <div key={teacher._id} className="teacher-card-compact" onClick={() => handleTeacherCardClick(teacher)}>
                                            <div className="card-header-compact">
                                                <span className="teacher-id-badge-compact">{teacher.teacherId}</span>
                                                <h3 className="teacher-name-compact">{teacher.name}</h3>
                                            </div>
                                            <div className="card-body-compact">
                                                <div className="course-codes">
                                                    {teacher.courses.length > 0 ? (
                                                        teacher.courses.map(course => (
                                                            <span key={course._id} className="course-code-chip">
                                                                {course.courseId}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="no-courses-text">No courses</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="no-results-message">
                                    <p>No teachers found matching &quot;{searchQuery}&quot;</p>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
            {isModalOpen && (
                <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Add New Teacher</h2>
                            <button onClick={() => setIsModalOpen(false)} className="close-btn">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="teacherName">Full Name</label>
                                <input id="teacherName" type="text" value={name} onChange={e => setName(e.target.value)} required className="form-input" placeholder="e.g. Sazzadul Islam Prottasha" />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="teacherId">Teacher ID</label>
                                <input id="teacherId" type="text" value={teacherId} onChange={e => setTeacherIdState(e.target.value)} required className="form-input" placeholder="e.g. SIP" />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="email">Email Address</label>
                                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="form-input" placeholder="e.g. sazzadul@bup.com" />
                            </div>

                            <div className="courses-section">
                                <h3 className="courses-section-title">Courses Taught</h3>
                                <div className="session-program-selection">
                                    <div className="form-group">
                                        <label className="form-label">Session</label>
                                        <select value={selectedSession} onChange={e => setSelectedSession(e.target.value)} required className="form-input">
                                            <option value="">Select Session</option>
                                            {sessions.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Program</label>
                                        <select value={selectedProgram} onChange={e => setSelectedProgram(e.target.value)} required className="form-input">
                                            <option value="">Select Program</option>
                                            {programs.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                </div>
                                {offeredCourses.length > 0 && (
                                    <div className="offered-courses-list">
                                        <h4>Select Offered Courses</h4>
                                        <table className="score-table">
                                            <thead>
                                                <tr>
                                                    <th>Course Code</th>
                                                    <th>Course Title</th>
                                                    <th>Select</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {offeredCourses.map((course, index) => (
                                                    <tr key={`${course.courseCode}-${course.versionCode}-${index}`}>
                                                        <td>{course.courseCode}</td>
                                                        <td>{course.courseTitle}</td>
                                                        <td>
                                                            <input
                                                                type="checkbox"
                                                                id={`course-${course.courseCode}-${index}`}
                                                                checked={selectedCourses.some(c => c.courseCode === course.courseCode && c.versionCode === course.versionCode)}
                                                                onChange={(e) => handleCourseSelection(course, e.target.checked)}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                            
                            {submitError && <p className="submit-error">{submitError}</p>}

                            <div className="modal-footer">
                                <button type="button" onClick={() => setIsPreviewModalOpen(true)} className="submit-btn" disabled={selectedCourses.length === 0}>
                                    Preview
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isPreviewModalOpen && (
                <div className="modal-backdrop" onClick={() => setIsPreviewModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Preview Teacher Details</h2>
                            <button onClick={() => setIsPreviewModalOpen(false)} className="close-btn">&times;</button>
                        </div>
                        <div className="preview-details">
                            <p><strong>Name:</strong> {name}</p>
                            <p><strong>Teacher ID:</strong> {teacherId}</p>
                            <p><strong>Email:</strong> {email}</p>
                            <p><strong>Session:</strong> {selectedSession}</p>
                            <h4>Selected Courses:</h4>
                            <ul>
                                {selectedCourses.map((c, index) => <li key={`${c.courseCode}-${c.versionCode}-${index}`}>{c.courseTitle} ({c.courseCode})</li>)}
                            </ul>
                        </div>
                        <div className="modal-footer">
                            <button onClick={handleUpdateTeacher} className="submit-btn" disabled={submitting}>
                                {submitting ? 'Submitting...' : 'Apply'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isTeacherDetailModalOpen && selectedTeacher && (
                <div className="modal-backdrop" onClick={() => setIsTeacherDetailModalOpen(false)}>
                    <div className="modal-content modal-content-large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Teacher Details</h2>
                            <button onClick={() => setIsTeacherDetailModalOpen(false)} className="close-btn">&times;</button>
                        </div>
                        <div className="teacher-detail-content">
                            <div className="teacher-info-header">
                                <span className="teacher-id-badge">{selectedTeacher.teacherId}</span>
                                <div>
                                    <h3 className="teacher-name">{selectedTeacher.name}</h3>
                                    <p className="teacher-email">{selectedTeacher.email}</p>
                                </div>
                                <button onClick={() => setIsAddCoursesModalOpen(true)} className="btn-edit-teacher">Edit</button>
                            </div>
                            
                            <div className="courses-detail-section">
                                <h3 className="section-title">Courses & Objectives</h3>
                                {selectedTeacher.courses.length > 0 ? (
                                    selectedTeacher.courses.map(course => (
                                        <div key={course._id} className="course-accordion">
                                            <div className="course-header" onClick={() => toggleCourse(course._id)}>
                                                <div>
                                                    <span className="course-title">
                                                        <strong>{course.courseName}</strong> ({course.courseId})
                                                    </span>
                                                </div>
                                                <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                                                    <span className="course-session">{course.session}</span>
                                                    <span className={`arrow-icon ${openCourseId === course._id ? 'open' : ''}`}>&#9656;</span>
                                                </div>
                                            </div>
                                            {openCourseId === course._id && (
                                                <div className="objectives-container">
                                                    <table className="objectives-table">
                                                        <thead>
                                                            <tr>
                                                                <th>CO No.</th>
                                                                <th>Description</th>
                                                                <th>Mapped PO</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {course.courseObjectives && course.courseObjectives.length > 0 ? (
                                                                course.courseObjectives.map(obj => (
                                                                    <tr key={obj.co_no}>
                                                                        <td>{obj.co_no}</td>
                                                                        <td>{obj.courseObjective}</td>
                                                                        <td>{obj.mappedProgramOutcome}</td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan={3} style={{ textAlign: 'center', color: '#6b7280', padding: '1rem' }}>
                                                                        No objectives have been defined for this course.
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p>No courses found for this teacher.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isAddCoursesModalOpen && (
                <div className="modal-backdrop" onClick={() => setIsAddCoursesModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Add Courses for {selectedTeacher?.name}</h2>
                            <button onClick={() => setIsAddCoursesModalOpen(false)} className="close-btn">&times;</button>
                        </div>
                        <div className="courses-section">
                            <div className="session-program-selection">
                                <div className="form-group">
                                    <label className="form-label">Session</label>
                                    <select value={selectedSession} onChange={e => setSelectedSession(e.target.value)} required className="form-input">
                                        <option value="">Select Session</option>
                                        {sessions.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Program</label>
                                    <select value={selectedProgram} onChange={e => setSelectedProgram(e.target.value)} required className="form-input">
                                        <option value="">Select Program</option>
                                        {programs.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                            </div>
                            {offeredCourses.length > 0 && (
                                <div className="offered-courses-list">
                                    <h4>Select Offered Courses</h4>
                                    <table className="score-table">
                                        <thead>
                                            <tr>
                                                <th>Course Code</th>
                                                <th>Course Title</th>
                                                <th>Select</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {offeredCourses.map((course, index) => (
                                                <tr key={`${course.courseCode}-${course.versionCode}-${index}`}>
                                                    <td>{course.courseCode}</td>
                                                    <td>{course.courseTitle}</td>
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            id={`add-course-${course.courseCode}-${index}`}
                                                            checked={selectedCourses.some(c => c.courseCode === course.courseCode && c.versionCode === course.versionCode)}
                                                            onChange={(e) => handleCourseSelection(course, e.target.checked)}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button type="button" onClick={() => setIsPreviewModalOpen(true)} className="submit-btn" disabled={selectedCourses.length === 0}>
                                Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TeacherDetailsPage; 