import React from 'react';
import styles from './LoadingSpinner.module.css';

const LoadingSpinner = ({ text = 'Loading...' }) => {
    return (
        <div className={styles.container}>
            <div className={styles.spinner}></div>
            {text && <p className={styles.text}>{text}</p>}
        </div>
    );
};

export default LoadingSpinner;
