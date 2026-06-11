"use client";

import React, { useState, useEffect, useRef } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import styles from './CustomSelect.module.css';

export default function CustomSelect({ value, onChange, options = [], className = '', placeholder = 'Select...' }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (val) => {
        onChange(val);
        setIsOpen(false);
    };

    return (
        <div className={`${styles.selectContainer} ${className}`} ref={containerRef}>
            <button
                type="button"
                className={styles.selectButton}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={styles.selectedValue}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <FiChevronDown className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} />
            </button>

            {isOpen && (
                <div className={styles.optionsDropdown}>
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            className={`${styles.optionButton} ${option.value === value ? styles.optionActive : ''}`}
                            onClick={() => handleSelect(option.value)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
