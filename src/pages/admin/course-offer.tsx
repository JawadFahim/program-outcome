// src/pages/admin/course-offer.tsx
import { useState, useEffect } from 'react';
import AdminNavbar from '../../components/admin/AdminNavbar';
import '../../styles/admin/homepage.css';

interface Course {
    courseCode: string;
    versionCode: string;
    courseTitle: string;
    credit: number;
}

const CourseOfferPage = () => {
    const [programs, setPrograms] = useState<string[]>([]);
    const [selectedProgram, setSelectedProgram] = useState('');
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sessions, setSessions] = useState<string[]>([]);
    const [selectedSession, setSelectedSession] = useState('');

    useEffect(() => {
        const fetchPrograms = async () => {
            try {
                const response = await fetch('/api/admin/get-course-programs');
                const data = await response.json();
                if (response.ok) {
                    setPrograms(data.programs);
                }
            } catch (error) {
                console.error('Failed to fetch programs:', error);
            }
        };
        fetchPrograms();
    }, []);

    useEffect(() => {
        if (isModalOpen) {
            const fetchSessions = async () => {
                try {
                    const response = await fetch('/api/admin/get-program-info');
                    const data = await response.json();
                    if (response.ok) {
                        setSessions(data.sessions);
                    }
                } catch (error) {
                    console.error('Failed to fetch sessions:', error);
                }
            };
            fetchSessions();
        }
    }, [isModalOpen]);

    useEffect(() => {
        if (selectedProgram) {
            const fetchCourses = async () => {
                try {
                    const response = await fetch(`/api/admin/get-courses-for-program?program=${selectedProgram}`);
                    const data = await response.json();
                    if (response.ok) {
                        setCourses(data.courses);
                    } else {
                        setCourses([]);
                    }
                } catch (error) {
                    console.error('Failed to fetch courses:', error);
                    setCourses([]);
                }
            };
            fetchCourses();
        } else {
            setCourses([]);
        }
    }, [selectedProgram]);
    
    const handleCourseSelection = (course: Course, isSelected: boolean) => {
        if (isSelected) {
            setSelectedCourses([...selectedCourses, course]);
        } else {
            setSelectedCourses(selectedCourses.filter(c => c.courseCode !== course.courseCode));
        }
    };

    const handleOfferCourses = async () => {
        try {
            const response = await fetch('/api/admin/offer-courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session: selectedSession,
                    program: selectedProgram,
                    offeredCourses: selectedCourses.map(c => ({
                        courseCode: c.courseCode,
                        versionCode: c.versionCode
                    })),
                }),
            });
            const data = await response.json();
            if (response.ok) {
                alert('Courses offered successfully!');
                setIsModalOpen(false);
                setSelectedCourses([]);
            } else {
                alert(`Failed to offer courses: ${data.message}`);
            }
        } catch (error) {
            console.error('Failed to offer courses:', error);
            alert('An error occurred while offering courses.');
        }
    };

    return (
        <div className="admin-container">
            <AdminNavbar page="course-offer" />
            <main>
                <div className="results-header">
                    <h1 className="po-title">Offer Courses</h1>
                </div>

                <div className="card">
                    <div className="filters">
                        <div className="select-group">
                            <label className="select-label">Program</label>
                            <select value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)} className="select-dropdown">
                                <option value="">Select Program</option>
                                {programs.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>

                    {courses.length > 0 && (
                        <div className="table-container" style={{ marginTop: '2rem' }}>
                            <table className="score-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Select</th>
                                        <th>Course Code</th>
                                        <th>Version Code</th>
                                        <th>Course Title</th>
                                        <th>Credit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courses.map((course, index) => (
                                        <tr key={`${course.courseCode}-${index}`}>
                                            <td>{index + 1}</td>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    onChange={(e) => handleCourseSelection(course, e.target.checked)}
                                                />
                                            </td>
                                            <td>{course.courseCode}</td>
                                            <td>{course.versionCode}</td>
                                            <td>{course.courseTitle}</td>
                                            <td>{course.credit}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>Total Courses: {courses.length}</p>
                                <button onClick={() => setIsModalOpen(true)} className="btn-fetch" disabled={selectedCourses.length === 0}>
                                    Preview
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {isModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>Confirm Course Offering</h3>
                        <div className="select-group">
                            <label className="select-label">Session</label>
                            <select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} className="select-dropdown">
                                <option value="">Select Session</option>
                                {sessions.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="table-container" style={{ marginTop: '1rem' }}>
                            <p>You are about to offer the following courses to <strong>{selectedProgram}</strong> for the <strong>{selectedSession}</strong> session:</p>
                            <table className="score-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Course Code</th>
                                        <th>Version Code</th>
                                        <th>Course Title</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedCourses.map((c, index) => (
                                        <tr key={`${c.courseCode}-${index}`}>
                                            <td>{index + 1}</td>
                                            <td>{c.courseCode}</td>
                                            <td>{c.versionCode}</td>
                                            <td>{c.courseTitle}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setIsModalOpen(false)}>Cancel</button>
                            <button onClick={handleOfferCourses} disabled={!selectedSession}>Apply</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseOfferPage;
