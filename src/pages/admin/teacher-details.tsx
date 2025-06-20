import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Link from 'next/link';

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
            <style jsx>{`
                body {
                    background-color: #f9fafb;
                    font-family: 'Inter', sans-serif;
                }
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 2rem 2rem;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background-color: #fff;
                    border-bottom: 1px solid #e5e7eb;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    padding: 1rem 2rem;
                    margin: 0 -2rem; /* Extend to full width */
                }
                .header-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                }
                .nav-link {
                    font-weight: 500;
                    color: #10b981;
                    text-decoration: none;
                }
                .nav-link:hover {
                    text-decoration: underline;
                }
                .teacher-list {
                    margin-top: 2rem;
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                }
                .teacher-card {
                    background-color: #fff;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
                    overflow: hidden; /* To contain children border-radius */
                }
                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    padding: 1.5rem;
                    background-color: #f8f9fa;
                }
                .teacher-id-badge {
                    background-color: #e0f2f1;
                    color: #047857;
                    padding: 0.75rem 1rem;
                    border-radius: 9999px;
                    font-weight: 700;
                    font-size: 1rem;
                }
                .teacher-name {
                    font-size: 1.5rem;
                    font-weight: 700;
                }
                .teacher-email {
                    color: #6b7280;
                    font-size: 1rem;
                }
                .card-body {
                    padding: 1.5rem;
                }
                .section-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin-bottom: 1rem;
                    border-bottom: 2px solid #10b981;
                    padding-bottom: 0.5rem;
                    display: inline-block;
                }
                .course-accordion {
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    margin-bottom: 1rem;
                }
                .course-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem;
                    cursor: pointer;
                    background-color: #fff;
                }
                .course-header:hover {
                    background-color: #f9fafb;
                }
                .course-title {
                    font-weight: 600;
                }
                .course-session {
                    font-size: 0.9rem;
                    color: #4b5563;
                    background-color: #e5e7eb;
                    padding: 0.25rem 0.5rem;
                    border-radius: 6px;
                }
                .arrow-icon {
                    transition: transform 0.2s;
                }
                .arrow-icon.open {
                    transform: rotate(90deg);
                }
                .objectives-container {
                    padding: 0 1rem 1rem;
                }
                .objectives-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .objectives-table th, .objectives-table td {
                    text-align: left;
                    padding: 0.75rem;
                    border-bottom: 1px solid #e5e7eb;
                }
                .objectives-table th {
                    background-color: #f3f4f6;
                    font-size: 0.875rem;
                }
                .message {
                    text-align: center;
                    padding: 4rem;
                    font-size: 1.25rem;
                }
                .header-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    width: 100%;
                }
                .header-actions {
                    display: flex;
                    gap: 1.5rem;
                    align-items: center;
                }
                .add-teacher-btn {
                    background-color: #10b981;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                .add-teacher-btn:hover {
                    background-color: #059669;
                }

                /* Modal Styles */
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                .modal-content {
                    background-color: white;
                    padding: 2.5rem;
                    border-radius: 12px;
                    width: 100%;
                    max-width: 600px;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }
                .modal-title {
                    font-size: 1.75rem;
                    font-weight: 700;
                }
                .close-btn {
                    background: none;
                    border: none;
                    font-size: 2rem;
                    cursor: pointer;
                    color: #9ca3af;
                }
                .close-btn:hover {
                    color: #1f2937;
                }
                .form-group {
                    margin-bottom: 1.5rem;
                }
                .form-label {
                    display: block;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    color: #374151;
                }
                .form-input {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    font-size: 1rem;
                }
                .courses-section {
                    margin-top: 2rem;
                    border-top: 1px solid #e5e7eb;
                    padding-top: 1.5rem;
                }
                 .courses-section-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin-bottom: 1rem;
                }
                .course-entry {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr auto;
                    gap: 1rem;
                    align-items: center;
                    margin-bottom: 1rem;
                    background-color: #f9fafb;
                    padding: 1rem;
                    border-radius: 8px;
                }
                .remove-course-btn {
                    background-color: #fee2e2;
                    color: #ef4444;
                    border: none;
                    width: 38px;
                    height: 38px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1rem;
                }
                .add-course-btn {
                    background: none;
                    border: 1px dashed #10b981;
                    color: #10b981;
                    width: 100%;
                    padding: 0.75rem;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background-color 0.2s, color 0.2s;
                }
                 .add-course-btn:hover {
                    background-color: #e0f2f1;
                }
                .modal-footer {
                    margin-top: 2rem;
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                }
                .submit-btn {
                    background-color: #10b981;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                }
                .submit-btn:disabled {
                    background-color: #d1d5db;
                    cursor: not-allowed;
                }
                .submit-error {
                    color: #ef4444;
                    text-align: right;
                    margin-top: 1rem;
                    margin-bottom: -1rem;
                }
            `}</style>
            <div className="container">
                <header className="header">
                     <div className="header-content">
                        <h1 className="header-title">Teacher Details</h1>
                        <div className="header-actions">
                            <button onClick={() => { setIsModalOpen(true); resetForm(); }} className="add-teacher-btn">
                                + Add Teacher
                            </button>
                            <Link href="/admin/homepage" legacyBehavior>
                                <a className="nav-link">Back to Dashboard</a>
                            </Link>
                        </div>
                    </div>
                </header>
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
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
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