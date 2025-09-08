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
    const [searchQuery, setSearchQuery] = useState('');

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

    const filteredCourses = courses.filter(course => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        
        const codeMatch = course.courseCode.toLowerCase().includes(query);
        const titleMatch = course.courseTitle.toLowerCase().includes(query);
        
        return codeMatch || titleMatch;
    });

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
                <div className="course-offer-controls">
                    <div className="control-group">
                        <label className="control-label">Program:</label>
                        <select value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)} className="control-select">
                            <option value="">Select Program</option>
                            {programs.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    
                    {courses.length > 0 && (
                        <>
                            <div className="control-group">
                                <input
                                    type="text"
                                    placeholder="Search by course code or title..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="control-search"
                                />
                            </div>
                            
                            <button 
                                onClick={() => setIsModalOpen(true)} 
                                className="btn-preview" 
                                disabled={selectedCourses.length === 0}
                            >
                                Preview ({selectedCourses.length})
                            </button>
                        </>
                    )}
                </div>

                {filteredCourses.length > 0 ? (
                    <div className="courses-table-wrapper">
                        <table className="courses-table">
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
                                {filteredCourses.map((course, index) => (
                                    <tr key={`${course.courseCode}-${index}`}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedCourses.some(c => c.courseCode === course.courseCode)}
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
                        
                        <div className="table-footer">
                            <p className="course-count">
                                Showing {filteredCourses.length} of {courses.length} courses
                                {selectedCourses.length > 0 && ` • ${selectedCourses.length} selected`}
                            </p>
                        </div>
                    </div>
                ) : courses.length > 0 && searchQuery ? (
                    <div className="no-results">
                        <p>No courses found matching "{searchQuery}"</p>
                    </div>
                ) : courses.length === 0 && selectedProgram ? (
                    <div className="no-results">
                        <p>No courses available for the selected program.</p>
                    </div>
                ) : null}
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
