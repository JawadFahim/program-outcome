import { useState, useRef, useEffect } from 'react';

export interface SelectOption {
    value: string;
    label: string;
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    disabled?: boolean;
    id?: string;
    className?: string;
}

const CustomSelect = ({
    value,
    onChange,
    options,
    placeholder = 'Select...',
    disabled = false,
    id,
    className = '',
}: CustomSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    const selectedLabel = options.find(o => o.value === value)?.label;

    const handleSelect = (optValue: string) => {
        onChange(optValue);
        setIsOpen(false);
    };

    return (
        <div className={`custom-select${className ? ` ${className}` : ''}`} ref={ref}>
            <button
                type="button"
                id={id}
                className="custom-select-toggle"
                onClick={() => !disabled && setIsOpen(prev => !prev)}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className={!value ? 'placeholder' : ''}>
                    {selectedLabel || placeholder}
                </span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    height="16"
                    width="16"
                    style={{
                        transition: 'transform 0.15s ease',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        flexShrink: 0,
                    }}
                >
                    <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>
            {isOpen && !disabled && (
                <div className="custom-select-options" role="listbox">
                    {options.map(opt => (
                        <div
                            key={opt.value}
                            role="option"
                            aria-selected={value === opt.value}
                            className={`custom-select-option${value === opt.value ? ' selected' : ''}`}
                            onClick={() => handleSelect(opt.value)}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
