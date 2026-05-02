// src/pages/admin/course-offer.tsx
import { useState, useEffect } from 'react';
import AdminNavbar from '../../components/admin/AdminNavbar';
import CustomSelect from '../../components/admin/CustomSelect';
import '../../styles/admin/homepage.css';

interface Course {
    courseCode: string;
    versionCode: string;
    courseTitle: string;
    credit: number;
}

interface NewCourseForm {
    courseCode: string;
    versionCode: string;
    courseTitle: string;
    credit: string;
}

const EMPTY_COURSE_FORM: NewCourseForm = { courseCode: '', versionCode: '', courseTitle: '', credit: '' };

const CourseOfferPage = () => {
    const [programs, setPrograms] = useState<string[]>([]);
    const [selectedProgram, setSelectedProgram] = useState('');
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sessions, setSessions] = useState<string[]>([]);
    const [selectedSession, setSelectedSession] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
    const [newCourseForm, setNewCourseForm] = useState<NewCourseForm>(EMPTY_COURSE_FORM);
    const [addCourseError, setAddCourseError] = useState('');
    const [addCourseLoading, setAddCourseLoading] = useState(false);

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
    
    // Computed inline — no memoisation to avoid stale-closure issues with React 18.
    const q = searchQuery.toLowerCase().trim();
    const filteredCourses = q
        ? courses.filter(c =>
              `${c.courseCode ?? ''} ${c.versionCode ?? ''} ${c.courseTitle ?? ''}`
                  .toLowerCase()
                  .includes(q)
          )
        : courses;

    const handleCourseSelection = (course: Course, isSelected: boolean) => {
        if (isSelected) {
            setSelectedCourses([...selectedCourses, course]);
        } else {
            setSelectedCourses(selectedCourses.filter(c => c.courseCode !== course.courseCode || c.versionCode !== course.versionCode));
        }
    };

    const handleAddCourse = async () => {
        setAddCourseError('');
        const { courseCode, versionCode, courseTitle, credit } = newCourseForm;
        if (!courseCode.trim() || !versionCode.trim() || !courseTitle.trim() || !credit.trim()) {
            setAddCourseError('All fields are required.');
            return;
        }
        if (isNaN(Number(credit)) || Number(credit) <= 0) {
            setAddCourseError('Credit must be a positive number.');
            return;
        }
        setAddCourseLoading(true);
        try {
            const response = await fetch('/api/admin/add-course-to-program', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    program: selectedProgram,
                    courseCode: courseCode.trim(),
                    versionCode: versionCode.trim(),
                    courseTitle: courseTitle.trim(),
                    credit: Number(credit),
                }),
            });
            const data = await response.json();
            if (response.ok) {
                // Refresh the course list for the selected program
                const listResponse = await fetch(`/api/admin/get-courses-for-program?program=${selectedProgram}`);
                const listData = await listResponse.json();
                if (listResponse.ok) setCourses(listData.courses);
                setNewCourseForm(EMPTY_COURSE_FORM);
                setIsAddCourseModalOpen(false);
            } else {
                setAddCourseError(data.message || 'Failed to add course.');
            }
        } catch {
            setAddCourseError('An error occurred. Please try again.');
        } finally {
            setAddCourseLoading(false);
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
                        versionCode: c.versionCode,
                        courseTitle: c.courseTitle,
                        credit: c.credit
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
        <>
        <AdminNavbar page="course-offer" />
        <div className="admin-container">
            <main>
                {/* ── Toolbar row ── */}
                <div className="course-offer-toolbar">
                    <div className="toolbar-left">
                        <div className="control-group">
                            <label className="control-label">Program:</label>
                            <CustomSelect
                                value={selectedProgram}
                                onChange={(v) => { setSelectedProgram(v); setSearchQuery(''); setSelectedCourses([]); }}
                                options={programs.map(p => ({ value: p, label: p }))}
                                placeholder="Select Program"
                                className="control-select-wrap"
                            />
                        </div>
                        {selectedProgram && (
                            <button
                                onClick={() => { setNewCourseForm(EMPTY_COURSE_FORM); setAddCourseError(''); setIsAddCourseModalOpen(true); }}
                                className="btn-add-course"
                            >
                                + New Course
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-preview"
                        disabled={selectedCourses.length === 0}
                    >
                        Preview ({selectedCourses.length})
                    </button>
                </div>

                {/* ── Search bar (shown once courses are loaded) ── */}
                {courses.length > 0 && (
                    <div className="course-offer-search">
                        <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                        </svg>
                        <input
                            type="text"
                            className="course-search-input"
                            placeholder="Search by course code, version, or title…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoComplete="off"
                        />
                        {searchQuery && (
                            <button className="search-clear-btn" onClick={() => setSearchQuery('')} aria-label="Clear search">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                </svg>
                            </button>
                        )}
                    </div>
                )}

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
                                    <tr key={`${course.courseCode}-${course.versionCode}-${index}`}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedCourses.some(c => c.courseCode === course.courseCode && c.versionCode === course.versionCode)}
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
                ) : searchQuery && courses.length > 0 ? (
                    <div className="no-results">
                        <p>No courses match &ldquo;{searchQuery}&rdquo;</p>
                    </div>
                ) : selectedProgram && courses.length === 0 ? (
                    <div className="no-results">
                        <p>No courses available for <strong>{selectedProgram}</strong>.</p>
                    </div>
                ) : !selectedProgram ? (
                    <div className="no-results">
                        <p>Select a program to view its courses.</p>
                    </div>
                ) : null}
            </main>

            {isAddCourseModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-content modal-content--sm">
                        <h3>Add New Course to <em>{selectedProgram}</em></h3>
                        <div className="add-course-form">
                            <div className="form-row">
                                <div className="form-field">
                                    <label>Course Code <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="e.g. CSE101"
                                        value={newCourseForm.courseCode}
                                        onChange={(e) => setNewCourseForm({ ...newCourseForm, courseCode: e.target.value })}
                                    />
                                </div>
                                <div className="form-field">
                                    <label>Version Code <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 2024"
                                        value={newCourseForm.versionCode}
                                        onChange={(e) => setNewCourseForm({ ...newCourseForm, versionCode: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-field">
                                <label>Course Title <span className="required">*</span></label>
                                <input
                                    type="text"
                                    placeholder="e.g. Introduction to Programming"
                                    value={newCourseForm.courseTitle}
                                    onChange={(e) => setNewCourseForm({ ...newCourseForm, courseTitle: e.target.value })}
                                />
                            </div>
                            <div className="form-field form-field--half">
                                <label>Credit Hours <span className="required">*</span></label>
                                <input
                                    type="number"
                                    placeholder="e.g. 3"
                                    min="0.5"
                                    step="0.5"
                                    value={newCourseForm.credit}
                                    onChange={(e) => setNewCourseForm({ ...newCourseForm, credit: e.target.value })}
                                />
                            </div>
                            {addCourseError && (
                                <p className="add-course-error">{addCourseError}</p>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setIsAddCourseModalOpen(false)} disabled={addCourseLoading}>Cancel</button>
                            <button onClick={handleAddCourse} disabled={addCourseLoading}>
                                {addCourseLoading ? 'Saving...' : 'Save Course'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>Confirm Course Offering</h3>
                        <div className="select-group">
                            <label className="select-label">Session</label>
                            <CustomSelect
                                value={selectedSession}
                                onChange={setSelectedSession}
                                options={sessions.map(s => ({ value: s, label: s }))}
                                placeholder="Select Session"
                            />
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
        </>
    );
};

export default CourseOfferPage;
