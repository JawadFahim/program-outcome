import Head from 'next/head';
import { useState, useEffect } from 'react';
import AdminNavbar from '../../components/admin/AdminNavbar';
import '../../styles/admin/homepage.css';

interface StudentResult {
    _id: string;
    teacherId: string;
    courseId: string;
    co_no: string;
    assessmentType: string;
    passMark: number;
    po_no: string;
    session: string;
    obtainedMark: number | string;
    studentName: string;
}

const StudentInfoPage = () => {
    const [studentId, setStudentId] = useState('');
    const [studentData, setStudentData] = useState<StudentResult[]>([]);
    const [studentName, setStudentName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        document.body.classList.add('admin-homepage');
        return () => {
            document.body.classList.remove('admin-homepage');
        }
    }, []);

    const handleFetchData = async () => {
        if (!studentId) {
            setError('Please enter a Student ID.');
            return;
        }
        setLoading(true);
        setError('');
        setStudentData([]);
        setStudentName('');

        try {
            const res = await fetch(`/api/admin/student?studentId=${studentId}`, { cache: 'no-store' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to fetch student data');
            }
            const data: StudentResult[] = await res.json();
            setStudentData(data);
            if (data.length > 0) {
                setStudentName(data[0].studentName);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Student Information - BICE Course Outcome</title>
            </Head>
            <AdminNavbar page="student" />
            <div className="admin-container">
                <main>
                    <div className="card filters">
                        <div className="select-group" style={{ flexGrow: 1 }}>
                            <label htmlFor="student-id-input" className="select-label">Enter Student ID</label>
                            <input
                                type="text"
                                id="student-id-input"
                                className="select-dropdown" // Reusing style
                                value={studentId}
                                onChange={e => setStudentId(e.target.value)}
                                placeholder="e.g., 2254901027"
                            />
                        </div>
                        <button onClick={handleFetchData} className="btn-fetch" disabled={loading}>
                            {loading ? 'Loading...' : 'Get Data'}
                        </button>
                    </div>

                    {error && <p className="message error-message">{error}</p>}
                    
                    {studentData.length > 0 && (
                        <div className="results-header">
                            <h2 className="po-title">Showing results for: {studentName} ({studentId})</h2>
                            <p className="po-name">Found {studentData.length} assessment records.</p>
                        </div>
                    )}

                    {loading && <p className="message">Loading data...</p>}

                    {!loading && studentData.length > 0 && (
                         <div className="results-grid">
                            {studentData.map(entry => (
                                <div key={entry._id} className="result-card">
                                    <div className="card-header">
                                        <h3 className="course-id">{entry.courseId} - {entry.co_no}</h3>
                                        <div className="card-details">
                                            <span className="detail-pill">Teacher: <strong>{entry.teacherId}</strong></span>
                                            <span className="detail-pill">Assessment: <strong>{entry.assessmentType}</strong></span>
                                            <span className="detail-pill">Session: <strong>{entry.session}</strong></span>
                                            <span className="detail-pill">PO: <strong>{entry.po_no}</strong></span>
                                        </div>
                                    </div>
                                    <div className="student-result-details">
                                        <p>Mark Obtained: 
                                            <strong className={`score-badge ${
                                                typeof entry.obtainedMark === 'number' 
                                                    ? (entry.obtainedMark >= entry.passMark ? 'score-pass' : 'score-fail')
                                                    : 'score-absent'
                                            }`}>
                                                {String(entry.obtainedMark)}
                                            </strong>
                                        </p>
                                        <p>Pass Mark: <strong>{entry.passMark}</strong></p>
                                        <p>Verdict: 
                                            <strong className={
                                                typeof entry.obtainedMark === 'number' 
                                                    ? (entry.obtainedMark >= entry.passMark ? 'text-green-600' : 'text-red-600')
                                                    : 'text-gray-500'
                                            }>
                                                {typeof entry.obtainedMark === 'number' 
                                                    ? (entry.obtainedMark >= entry.passMark ? 'Pass' : 'Fail')
                                                    : 'Absent'
                                                }
                                            </strong>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && studentData.length === 0 && !error && studentId.length > 0 && (
                         <div className="card message">
                            <p>No data found for the student ID: {studentId}</p>
                        </div>
                    )}

                    {!loading && studentData.length === 0 && !error && studentId.length === 0 && (
                        <div className="card message">
                            <p>Enter a student ID to see their assessment results.</p>
                        </div>
                    )}
                </main>
            </div>
            <style jsx>{`
                .student-result-details {
                    padding: 15px;
                    border-top: 1px solid #eee;
                }
                .student-result-details p {
                    margin: 0 0 8px 0;
                    display: flex;
                    justify-content: space-between;
                }
                .score-badge {
                    padding: 3px 8px;
                    border-radius: 12px;
                    color: white;
                    font-weight: bold;
                }
                .score-pass {
                    background-color: #28a745;
                }
                .score-fail {
                    background-color: #dc3545;
                }
                .score-absent {
                    background-color: #6c757d;
                }
                .text-green-600 { color: #28a745; }
                .text-red-600 { color: #dc3545; }
                .text-gray-500 { color: #6c757d; }
            `}</style>
        </>
    );
};

export default StudentInfoPage; 