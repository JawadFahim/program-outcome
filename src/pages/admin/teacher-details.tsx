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

        if (isModalOpen) {
            fetchProgramInfo();
        }
    }, [isModalOpen]);

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


    return (
        <>
            <Head>
                <title>Teacher Details - Admin</title>
            </Head>
            <AdminNavbar page="teachers" />
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Teacher Management</h1>
                    <button onClick={() => { setIsModalOpen(true); resetForm(); }} className="btn-add-teacher">
                                + Add Teacher
                            </button>
                    </div>
                <main>
                    {loading && <p className="message">Loading teacher data...</p>}
                    {error && <p className="message" style={{color: '#ef4444'}}>{error}</p>}
                    {!loading && !error && (
                        <div className="teacher-list">
                            {teachers.map(teacher => (
                                <div key={teacher._id} className="teacher-card">
                                    <div className="card-header">
                                        <span className="teacher-id-badge">{teacher.teacherId}</span>
                                        <div>
                                            <h2 className="teacher-name">{teacher.name}</h2>
                                            <p className="teacher-email">{teacher.email}</p>
                                        </div>
                                    </div>
                                    <div className="card-body">
                                        <h3 className="section-title">Courses & Objectives</h3>
                                        {teacher.courses.length > 0 ? (
                                            teacher.courses.map(course => (
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
                            ))}
                        </div>
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
                                <input id="teacherName" type="text" value={name} onChange={e => setName(e.target.value)} required className="form-input" placeholder="e.g. John Doe" />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="teacherId">Teacher ID</label>
                                <input id="teacherId" type="text" value={teacherId} onChange={e => setTeacherIdState(e.target.value)} required className="form-input" placeholder="e.g. T-123" />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="email">Email Address</label>
                                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="form-input" placeholder="e.g. john.doe@example.com" />
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
                            <button onClick={handleSubmit} className="submit-btn" disabled={submitting}>
                                {submitting ? 'Submitting...' : 'Apply'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TeacherDetailsPage; 