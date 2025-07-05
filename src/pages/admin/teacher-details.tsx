import Head from 'next/head';
import { useState, useEffect } from 'react';
import Link from 'next/link';
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

    const [teacherId, setTeacherIdState] = useState('');
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [courses, setCourses] = useState([{ courseId: '', courseName: '', session: '2021-22' }]);

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

    const toggleCourse = (courseId: string) => {
        setOpenCourseId(openCourseId === courseId ? null : courseId);
    };

    const handleAddCourse = () => {
        setCourses([...courses, { courseId: '', courseName: '', session: '2021-22' }]);
    };

    const handleCourseChange = (index: number, field: string, value: string) => {
        const newCourses = [...courses];
        newCourses[index] = { ...newCourses[index], [field]: value };
        setCourses(newCourses);
    };

    const handleRemoveCourse = (index: number) => {
        const newCourses = courses.filter((_, i) => i !== index);
        setCourses(newCourses);
    };

    const resetForm = () => {
        setTeacherIdState('');
        setName('');
        setEmail('');
        setCourses([{ courseId: '', courseName: '', session: '2021-22' }]);
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
            password: 'test',
            courses,
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
            resetForm();
            await fetchTeachers(); // Refresh teacher list
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    const sessionOptions = Array.from({ length: 10 }, (_, i) => `${2021 + i}-${(2022 + i).toString().slice(2)}`);

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
                                {courses.map((course, index) => (
                                    <div key={index} className="course-entry">
                                        <div>
                                            <label className="form-label" style={{fontSize: '0.875rem'}}>Course ID</label>
                                            <input type="text" value={course.courseId} onChange={(e) => handleCourseChange(index, 'courseId', e.target.value)} required className="form-input" placeholder="e.g. CS101" />
                                        </div>
                                        <div>
                                            <label className="form-label" style={{fontSize: '0.875rem'}}>Course Name</label>
                                            <input type="text" value={course.courseName} onChange={(e) => handleCourseChange(index, 'courseName', e.target.value)} required className="form-input" placeholder="e.g. Intro to Programming" />
                                        </div>
                                        <div>
                                            <label className="form-label" style={{fontSize: '0.875rem'}}>Session</label>
                                            <select value={course.session} onChange={(e) => handleCourseChange(index, 'session', e.target.value)} required className="form-input">
                                                {sessionOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div style={{ alignSelf: 'flex-end' }}>
                                            {courses.length > 1 && (
                                                <button type="button" onClick={() => handleRemoveCourse(index)} className="remove-course-btn">
                                                    &times;
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={handleAddCourse} className="add-course-btn">
                                    + Add Another Course
                                </button>
                            </div>
                            
                            {submitError && <p className="submit-error">{submitError}</p>}

                            <div className="modal-footer">
                                <button type="submit" className="submit-btn" disabled={submitting}>
                                    {submitting ? 'Submitting...' : 'Save Teacher'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default TeacherDetailsPage; 