import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'https://traxpense.onrender.com/api';

const EmailVerification = ({ email, onVerificationComplete }) => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post(`${API_URL}/auth/verify-email`, {
                email,
                code
            });

            if (response.data.message === 'Email verified successfully') {
                onVerificationComplete();
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setLoading(true);
        setError('');

        try {
            await axios.post(`${API_URL}/auth/resend-verification`, {
                email
            });
            alert('Verification code resent!');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to resend code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-8 p-6 bg-white bg-opacity-80 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Verify Your Email</h2>
            <p className="mb-4">Please enter the verification code sent to {email}</p>
            
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Verification Code
                    </label>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="Enter verification code"
                        required
                    />
                </div>

                {error && (
                    <div className="mb-4 text-red-500 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                        {loading ? 'Verifying...' : 'Verify Email'}
                    </button>
                    
                    <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={loading}
                        className="text-blue-500 hover:text-blue-700"
                    >
                        Resend Code
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EmailVerification; 