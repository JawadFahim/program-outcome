interface SkeletonLineProps {
    width?: string;
    height?: string;
}

export const SkeletonLine = ({ width = '100%', height = '1rem' }: SkeletonLineProps) => (
    <div className="skeleton-pulse" style={{ width, height, borderRadius: '0.375rem' }} />
);

export const SkeletonCard = () => (
    <div className="card" style={{ padding: '1.25rem' }}>
        <SkeletonLine height="1.5rem" width="55%" />
        <div style={{ marginTop: '0.75rem' }}>
            <SkeletonLine height="0.875rem" />
        </div>
        <div style={{ marginTop: '0.5rem' }}>
            <SkeletonLine height="0.875rem" width="75%" />
        </div>
    </div>
);

interface SkeletonTableProps {
    rows?: number;
    cols?: number;
}

export const SkeletonTable = ({ rows = 5, cols = 4 }: SkeletonTableProps) => (
    <div className="skeleton-table-wrapper">
        <div className="skeleton-table-header-row">
            {Array.from({ length: cols }).map((_, i) => (
                <SkeletonLine key={i} height="1rem" width="70%" />
            ))}
        </div>
        {Array.from({ length: rows }).map((_, rowIdx) => (
            <div key={rowIdx} className="skeleton-table-data-row">
                {Array.from({ length: cols }).map((_, colIdx) => (
                    <SkeletonLine key={colIdx} height="0.875rem" width={colIdx === 2 ? '85%' : '55%'} />
                ))}
            </div>
        ))}
    </div>
);

interface SkeletonObjectiveCardsProps {
    count?: number;
}

export const SkeletonObjectiveCards = ({ count = 3 }: SkeletonObjectiveCardsProps) => (
    <div className="objectives-container">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="card objective-card-compact">
                <div className="objective-header-compact">
                    <SkeletonLine height="1.5rem" width="3.5rem" />
                </div>
                <div className="objective-content-compact" style={{ marginTop: '1rem' }}>
                    <div className="objective-main-row">
                        <div className="objective-description">
                            <SkeletonLine height="0.7rem" width="5rem" />
                            <div style={{ marginTop: '0.5rem' }}>
                                <SkeletonLine height="3.5rem" />
                            </div>
                        </div>
                        <div className="objective-po">
                            <SkeletonLine height="0.7rem" width="6rem" />
                            <div style={{ marginTop: '0.5rem' }}>
                                <SkeletonLine height="2.5rem" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ))}
    </div>
);
