"use client";

import React from 'react';
import { motion } from 'framer-motion';
import styles from './AnimatedButton.module.css';

const AnimatedButton = ({
    children,
    onClick,
    className = '',
    variant = 'primary',
    icon: Icon,
    ...props
}) => {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`${styles.btn} ${styles[variant]} ${className}`}
            onClick={onClick}
            {...props}
        >
            {Icon && <Icon className="w-4 h-4" />}
            {children}
        </motion.button>
    );
};

export default AnimatedButton;
