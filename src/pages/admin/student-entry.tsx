// src/pages/admin/student-entry.tsx
import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import AdminNavbar from '../../components/admin/AdminNavbar';
import '../../styles/admin/homepage.css'; // Reusing styles for consistency

interface Student {
    id: string;
    name: string;
}

interface ProgramInfo {
    sessions: string[];
    programs: string[];
}

const StudentEntryPage = () => {
    // State for student upload
    const [session, setSession] = useState('');
    const [program, setProgram] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    // State for student management
    const [programInfo, setProgramInfo] = useState<ProgramInfo>({ sessions: [], programs: [] });
    const [selectedLoadSession, setSelectedLoadSession] = useState('');
    const [selectedLoadProgram, setSelectedLoadProgram] = useState('');
    const [loadedStudents, setLoadedStudents] = useState<Student[]>([]);
    
    // State for the "Add Individual" modal
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [sourceStudents, setSourceStudents] = useState<Student[]>([]);
    const [selectedStudentsToMove, setSelectedStudentsToMove] = useState<Student[]>([]);
    const [sourceSession, setSourceSession] = useState('');

    // State for confirmation modal
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    useEffect(() => {
        const fetchProgramInfo = async () => {
            try {
                const response = await fetch('/api/admin/get-program-info');
                const data = await response.json();
                if (response.ok) {
                    setProgramInfo(data);
                }
            } catch (error) {
                console.error('Failed to fetch program info:', error);
            }
        };
        fetchProgramInfo();
    }, []);

    useEffect(() => {
        const fetchSourceStudents = async () => {
            if (sourceSession && selectedLoadProgram) {
                try {
                    const response = await fetch(`/api/admin/get-students?session=${sourceSession}&program=${selectedLoadProgram}`);
                    const data = await response.json();
                    if (response.ok) {
                        setSourceStudents(data.students);
                    } else {
                        alert(`Failed to load source students: ${data.message}`);
                    }
                } catch (error) {
                    console.error('Failed to load source students:', error);
                    alert('An error occurred while loading source students.');
                }
            }
        };
        fetchSourceStudents();
    }, [sourceSession, selectedLoadProgram]);

    const handleLoadStudents = async () => {
        if (!selectedLoadSession || !selectedLoadProgram) {
            alert('Please select session and program to load students.');
            return;
        }
        try {
            const response = await fetch(`/api/admin/get-students?session=${selectedLoadSession}&program=${selectedLoadProgram}`);
            const data = await response.json();
            if (response.ok) {
                setLoadedStudents(data.students);
            } else {
                alert(`Failed to load students: ${data.message}`);
            }
        } catch (error) {
            console.error('Failed to load students:', error);
            alert('An error occurred while loading students.');
        }
    };

    const handleMoveStudents = async () => {
        const source = { session: sourceSession, program: selectedLoadProgram };
        const target = { session: selectedLoadSession, program: selectedLoadProgram };
        
        try {
            const response = await fetch('/api/admin/move-students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source, target, studentsToMove: selectedStudentsToMove }),
            });

            const data = await response.json();
            if (response.ok) {
                alert('Students moved successfully!');
                window.location.reload();
            } else {
                alert(`Failed to move students: ${data.message}`);
            }
        } catch (error) {
            console.error('Failed to move students:', error);
            alert('An error occurred while moving students.');
        } finally {
            setIsConfirmModalOpen(false);
            setIsMoveModalOpen(false);
        }
    };


    const handleStudentSelection = (student: Student, isSelected: boolean) => {
        if (isSelected) {
            setSelectedStudentsToMove([...selectedStudentsToMove, student]);
        } else {
            setSelectedStudentsToMove(selectedStudentsToMove.filter(s => s.id !== student.id));
        }
    };


    const onDrop = (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        const reader = new FileReader();

        reader.onload = (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

            // Heuristic to find header row and student data
            let studentIdCol = -1;
            let nameCol = -1;
            let startRow = -1;

            for (let i = 0; i < json.length; i++) {
                const row = json[i];
                for (let j = 0; j < row.length; j++) {
                    const cell = String(row[j]).toLowerCase();
                    if (cell.includes('studentid')) studentIdCol = j;
                    if (cell.includes('full name')) nameCol = j;
                }
                if (studentIdCol !== -1 && nameCol !== -1) {
                    startRow = i + 1;
                    break;
                }
            }

            if (startRow !== -1) {
                const parsedStudents: Student[] = [];
                for (let i = startRow; i < json.length; i++) {
                    const row = json[i];
                    const studentId = row[studentIdCol];
                    const name = row[nameCol];
                    if (studentId && name) {
                        parsedStudents.push({ id: String(studentId), name: String(name) });
                    }
                }
                setStudents(parsedStudents);
                setIsUploadModalOpen(true);
            } else {
                alert('Could not find "StudentID" and "Full Name" columns in the Excel file.');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, disabled: !session || !program });

    const handleSave = async () => {
        try {
            const response = await fetch('/api/admin/upload-student-list', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ session, program, students }),
            });

            if (response.ok) {
                alert('Student list saved successfully!');
                setIsUploadModalOpen(false);
            } else {
                const data = await response.json();
                alert(`Failed to save student list: ${data.message}`);
            }
        } catch (error) {
            console.error('Failed to save student list:', error);
            alert('An error occurred while saving the student list.');
        }
    };

    return (
        <div className="admin-container">
            <AdminNavbar page="student-entry" />
            <main>
                <div className="results-header">
                    <h1 className="po-title">Manage Student Lists</h1>
                </div>

                <div className="card">
                    <h2>Load Existing Student List</h2>
                    <div className="filters">
                        <div className="select-group">
                            <label className="select-label">Session</label>
                            <select value={selectedLoadSession} onChange={(e) => setSelectedLoadSession(e.target.value)} className="select-dropdown">
                                <option value="">Select Session</option>
                                {programInfo.sessions.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="select-group">
                            <label className="select-label">Program</label>
                            <select value={selectedLoadProgram} onChange={(e) => setSelectedLoadProgram(e.target.value)} className="select-dropdown">
                                <option value="">Select Program</option>
                                {programInfo.programs.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <button onClick={handleLoadStudents} className="btn-fetch">Load Students</button>
                    </div>

                    {loadedStudents.length > 0 && (
                        <div className="table-container" style={{ marginTop: '2rem' }}>
                            <button onClick={() => setIsMoveModalOpen(true)} className="btn-fetch" style={{ marginBottom: '1rem' }}>Add Individual Student</button>
                            <table className="score-table">
                                <thead>
                                    <tr>
                                        <th>Student ID</th>
                                        <th>Full Name</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadedStudents.map((student) => (
                                        <tr key={student.id}>
                                            <td>{student.id}</td>
                                            <td>{student.name}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="card">
                    <h2 style={{ marginTop: 0 }}>Upload New Student List</h2>
                    <div className="form-group">
                        <label>Session</label>
                        <input type="text" value={session} onChange={(e) => setSession(e.target.value)} placeholder="e.g., 2021-2022" />
                    </div>
                    <div className="form-group">
                        <label>Program</label>
                        <input type="text" value={program} onChange={(e) => setProgram(e.target.value)} placeholder="e.g., ICE" />
                    </div>

                    <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''} ${(!session || !program) ? 'disabled' : ''}`}>
                        <input {...getInputProps()} />
                        {isDragActive ? <p>Drop the files here ...</p> : <p>Drag &apos;n&apos; drop an Excel file here, or click to select files</p>}
                    </div>
                </div>
            </main>

            {isUploadModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>Confirm Student List</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Student ID</th>
                                    <th>Full Name</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student, index) => (
                                    <tr key={index}>
                                        <td><input type="text" value={student.id} onChange={(e) => {
                                            const newStudents = [...students];
                                            newStudents[index].id = e.target.value;
                                            setStudents(newStudents);
                                        }} /></td>
                                        <td><input type="text" value={student.name} onChange={(e) => {
                                            const newStudents = [...students];
                                            newStudents[index].name = e.target.value;
                                            setStudents(newStudents);
                                        }} /></td>
                                        <td><button onClick={() => {
                                            const newStudents = students.filter((_, i) => i !== index);
                                            setStudents(newStudents);
                                        }}>Delete</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button onClick={() => setStudents([...students, { id: '', name: '' }])}>Add Student</button>
                        <div className="modal-footer">
                            <button onClick={() => setIsUploadModalOpen(false)}>Cancel</button>
                            <button onClick={handleSave}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {isMoveModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>Add Students from Another Session</h3>
                        <div className="filters">
                            <div className="select-group">
                                <label className="select-label">From Session</label>
                                <select value={sourceSession} onChange={(e) => setSourceSession(e.target.value)} className="select-dropdown">
                                    <option value="">Select Session</option>
                                    {programInfo.sessions.filter(s => s !== selectedLoadSession).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="select-group">
                                <label className="select-label">Program</label>
                                <input type="text" value={selectedLoadProgram} disabled />
                            </div>
                        </div>

                        {sourceStudents.length > 0 && (
                            <div className="table-container" style={{ marginTop: '2rem' }}>
                                <table className="score-table">
                                    <thead>
                                        <tr>
                                            <th>Select</th>
                                            <th>Student ID</th>
                                            <th>Full Name</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sourceStudents.map((student) => (
                                            <tr key={student.id}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        onChange={(e) => handleStudentSelection(student, e.target.checked)}
                                                    />
                                                </td>
                                                <td>{student.id}</td>
                                                <td>{student.name}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="modal-footer">
                            <button onClick={() => setIsMoveModalOpen(false)}>Cancel</button>
                            <button onClick={() => setIsConfirmModalOpen(true)} disabled={selectedStudentsToMove.length === 0}>Apply</button>
                        </div>
                    </div>
                </div>
            )}

            {isConfirmModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>Confirm Move</h3>
                        <p>Are you sure you want to move the following students?</p>
                        <ul>
                            {selectedStudentsToMove.map(s => <li key={s.id}>{s.name} ({s.id})</li>)}
                        </ul>
                        <div className="modal-footer">
                            <button onClick={() => setIsConfirmModalOpen(false)}>Cancel</button>
                            <button onClick={handleMoveStudents}>OK</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentEntryPage;
