interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    itemsPerPage?: number;
    totalItems?: number;
}

const Pagination = ({ currentPage, totalPages, onPageChange, itemsPerPage, totalItems }: PaginationProps) => {
    if (totalPages <= 1) return null;

    const buildPages = (): (number | '...')[] => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        const pages: (number | '...')[] = [1];
        if (currentPage > 3) pages.push('...');
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        if (currentPage < totalPages - 2) pages.push('...');
        pages.push(totalPages);
        return pages;
    };

    const pages = buildPages();
    const from = itemsPerPage != null ? Math.min((currentPage - 1) * itemsPerPage + 1, totalItems ?? 0) : null;
    const to = itemsPerPage != null ? Math.min(currentPage * itemsPerPage, totalItems ?? 0) : null;

    return (
        <div className="pagination-wrapper">
            {from !== null && to !== null && totalItems !== undefined && (
                <p className="pagination-info">
                    Showing {from}–{to} of {totalItems} results
                </p>
            )}
            <nav className="pagination-controls" aria-label="Pagination navigation">
                <button
                    className="pagination-btn"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                >
                    ‹
                </button>
                {pages.map((page, idx) =>
                    page === '...' ? (
                        <span key={`dots-${idx}`} className="pagination-ellipsis">…</span>
                    ) : (
                        <button
                            key={page}
                            className={`pagination-btn${currentPage === page ? ' active' : ''}`}
                            onClick={() => onPageChange(page as number)}
                            aria-current={currentPage === page ? 'page' : undefined}
                        >
                            {page}
                        </button>
                    )
                )}
                <button
                    className="pagination-btn"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                >
                    ›
                </button>
            </nav>
        </div>
    );
};

export default Pagination;
