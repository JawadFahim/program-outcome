import React from 'react';
import Navbar from './Navbar';

interface LayoutProps {
    children: React.ReactNode;
    teacherName: string;
    onLogout: () => void;
    page: 'homepage' | 'assessment' | 'summary';
    title: string;
}

const Layout = ({ children, teacherName, onLogout, page, title }: LayoutProps) => {
    return (
        <div className="bg-gray-50 min-h-screen">
            <Navbar teacherName={teacherName} onLogout={onLogout} page={page} title={title} />
            <main>
                {children}
            </main>
        </div>
    );
};

export default Layout;
 