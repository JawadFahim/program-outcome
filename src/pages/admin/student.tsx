import Head from 'next/head';
import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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

    const handleGeneratePdf = () => {
        if (studentData.length === 0 || !studentId) return;
    
        const doc = new jsPDF({ orientation: 'landscape' });
    
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Student Assessment Report', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Student: ${studentName} (${studentId})`, 14, 35);
    
        const generationDate = new Date().toLocaleString();
        doc.text(`Generated on: ${generationDate}`, doc.internal.pageSize.getWidth() - 14, 35, { align: 'right' });
    
        const groupedData = studentData.reduce((acc, entry) => {
            if (!acc[entry.courseId]) {
                acc[entry.courseId] = [];
            }
            acc[entry.courseId].push(entry);
            return acc;
        }, {} as Record<string, StudentResult[]>);
    
        let startY = 45;
    
        Object.keys(groupedData).sort().forEach(courseId => {
            const courseEntries = groupedData[courseId];
            
            if (startY > 45) {
                startY += 8;
            }
            
            const tableHeight = 15 + courseEntries.length * 8; 
            if (startY + tableHeight > doc.internal.pageSize.getHeight() - 20) {
                doc.addPage();
                startY = 20;
            }

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(courseId, 14, startY);
    
            const tableBody = courseEntries.map(entry => {
                const verdict = typeof entry.obtainedMark === 'number'
                    ? (entry.obtainedMark >= entry.passMark ? 'Pass' : 'Fail')
                    : 'Absent';
                return [
                    entry.co_no,
                    entry.assessmentType,
                    entry.session,
                    entry.teacherId,
                    entry.po_no,
                    entry.passMark.toString(),
                    String(entry.obtainedMark),
                    verdict,
                ];
            });
    
            autoTable(doc, {
                startY: startY + 5,
                head: [['CO', 'Assessment', 'Session', 'Teacher', 'PO', 'Pass Mark', 'Obtained', 'Verdict']],
                body: tableBody,
                theme: 'grid',
                headStyles: { fillColor: [39, 174, 96] },
                styles: { fontSize: 9, cellPadding: 2 },
                didDrawPage: (data) => {
                    if (data.pageNumber > 1) {
                        doc.setFontSize(12);
                        doc.setFont('helvetica', 'bold');
                        doc.text('Student Assessment Report (Continued)', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
                    }
                }
            });
    
            startY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
        });
    
        doc.save(`student-report-${studentId}-${new Date().toISOString().slice(0,10)}.pdf`);
    };

    return (
        <>
            <Head>
                <title>Student Information - BICE Course Outcome</title>
            </Head>
            <AdminNavbar page="student" />
            <div className="admin-container">
                <main>
                    <div className="card">
                        <div className="select-group">
                            <label htmlFor="student-id-input" className="select-label">Enter Student ID</label>
                            <div className="input-with-btn">
                            <input
                                type="text"
                                id="student-id-input"
                                    className="search-input"
                                value={studentId}
                                onChange={e => setStudentId(e.target.value)}
                                placeholder="e.g., 2254901027"
                            />
                                <button onClick={handleFetchData} className="btn-inside" disabled={loading}>
                                    {loading ? 'Loading...' : 'Get Data'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {error && <p className="message error-message">{error}</p>}
                    
                    {studentData.length > 0 && (
                        <div className="results-header">
                            <div>
                            <h2 className="po-title">Showing results for: {studentName} ({studentId})</h2>
                            <p className="po-name">Found {studentData.length} assessment records.</p>
                            </div>
                            <button onClick={handleGeneratePdf} className="btn-primary" disabled={loading}>
                                Generate PDF
                            </button>
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
                .input-with-btn {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .search-input {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border: 1px solid #e5e7eb;
                    border-radius: 0.5rem;
                    font-size: 1rem;
                    box-sizing: border-box;
                    padding-right: 120px;
                }
                .search-input:focus {
                    outline: none;
                    border-color: #10b981;
                    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
                }
                .btn-inside {
                    position: absolute;
                    right: 5px;
                    top: 50%;
                    transform: translateY(-50%);
                    background-color: #10b981;
                    color: white;
                    border: none;
                    padding: 0.5rem 1.2rem;
                    border-radius: 0.375rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                .btn-inside:hover:not(:disabled) {
                    background-color: #059669;
                }
                .btn-inside:disabled {
                    background-color: #6ee7b7;
                    cursor: not-allowed;
                }
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
                .results-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }
                .btn-primary {
                    background-color: #10b981;
                    color: white;
                    border: none;
                    padding: 0.6rem 1.2rem;
                    border-radius: 0.375rem;
                    font-weight: 600;
                    cursor: pointer;
                    height: fit-content;
                    transition: background-color 0.2s;
                }
                .btn-primary:hover:not(:disabled) {
                    background-color: #059669;
                }
                .btn-primary:disabled {
                    background-color: #d1d5db;
                    cursor: not-allowed;
                }
            `}</style>
        </>
    );
};

export default StudentInfoPage; 