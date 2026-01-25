import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Loader2, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';

const EmailVerificationModal = ({ isOpen, email, onVerified }) => {
    const [isResending, setIsResending] = useState(false);
    const [timer, setTimer] = useState(0);
    const [resendCount, setResendCount] = useState(0);
    const [isInitialSent, setIsInitialSent] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    // Get session storage keys
    const getCountKey = useCallback(() => `verify_resend_count_${email}`, [email]);
    const getTimerKey = useCallback(() => `verify_timer_expiry_${email}`, [email]);

    // Initialize state from sessionStorage
    useEffect(() => {
        if (isOpen && email) {
            const savedCount = parseInt(sessionStorage.getItem(getCountKey()) || '0');
            setResendCount(savedCount);

            const savedExpiry = parseInt(sessionStorage.getItem(getTimerKey()) || '0');
            const now = Date.now();
            if (savedExpiry > now) {
                setTimer(Math.ceil((savedExpiry - now) / 1000));
            }
        }
    }, [isOpen, email, getCountKey, getTimerKey]);

    // Timer countdown effect
    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => {
                    if (prev <= 1) {
                        sessionStorage.removeItem(getTimerKey());
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer, getTimerKey]);

    // Polling for verification status
    useEffect(() => {
        if (!isOpen || !email) return;

        const checkStatus = async () => {
            try {
                const res = await fetch('/api/users/me/verification-status', {
                    credentials: 'include'
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.isVerified) {
                        toast.success('Email verified successfully!');
                        if (onVerified) onVerified();
                    }
                }
            } catch (error) {
                // Silent error for polling
                console.error('Verification check failed', error);
            }
        };

        const pollInterval = setInterval(checkStatus, 3000);
        return () => clearInterval(pollInterval);
    }, [isOpen, email, onVerified]);

    const handleResend = async (isManual = true) => {
        if (!email) return;

        // Check limits for manual resends
        if (isManual && resendCount >= 2) {
            toast.error("Maximum resend attempts reached for this session.");
            return;
        }

        if (timer > 0) return;

        setIsResending(true);
        try {
            const res = await fetch('/api/users/send-verification-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.ok) {
                if (isManual) {
                    const newCount = resendCount + 1;
                    setResendCount(newCount);
                    sessionStorage.setItem(getCountKey(), newCount.toString());
                }

                // Start 30s timer
                const expiry = Date.now() + 30 * 1000;
                setTimer(30);
                sessionStorage.setItem(getTimerKey(), expiry.toString());

                toast.success(isManual ? "Verification email resent!" : "Verification email sent!");
            } else {
                toast.error(data.message || "Failed to send verification email.");
            }
        } catch (error) {
            toast.error("An error occurred. Please try again.");
        } finally {
            setIsResending(false);
        }
    };

    // Auto-send on first open if not already sent in this session
    useEffect(() => {
        if (isOpen && email && !isInitialSent) {
            const hasSentInitially = sessionStorage.getItem(`verify_initial_sent_${email}`);
            if (!hasSentInitially) {
                handleResend(false); // false means it's the 1st automatic send, not counting towards the 2 resends
                sessionStorage.setItem(`verify_initial_sent_${email}`, 'true');
            }
            setIsInitialSent(true);
        }
    }, [isOpen, email, isInitialSent]);

    if (!isOpen) return null;

    const resendsRemaining = 2 - resendCount;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md cursor-not-allowed">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-md bg-white rounded-xl sm:rounded-[2rem] shadow-2xl overflow-hidden cursor-default"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Progress Bar (Timer) */}
                    {timer > 0 && (
                        <motion.div
                            initial={{ width: '100%' }}
                            animate={{ width: '0%' }}
                            transition={{ duration: timer, ease: "linear" }}
                            className="absolute top-0 left-0 h-1.5 bg-brand-light z-10"
                        />
                    )}

                    <div className="p-4 sm:p-6 md:p-8 lg:p-10 text-center">
                        <div className="flex justify-center mb-4 sm:mb-6 md:mb-8">
                            <div className="relative">
                                <div className="absolute inset-0 bg-brand-light/20 rounded-full animate-ping scale-150 shrink-0" />
                                <div className="relative p-4 sm:p-5 md:p-6 bg-brand-light/10 rounded-full">
                                    <Mail size={32} className="sm:w-10 sm:h-10 md:w-12 md:h-12 text-brand-light" />
                                </div>
                            </div>
                        </div>

                        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 mb-3 sm:mb-4">
                            Verify Your Email
                        </h2>
                        <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-4 sm:mb-6 md:mb-8 leading-relaxed px-2 sm:px-0">
                            We've sent a verification link to<br className="hidden sm:block" />
                            <span className="font-bold text-gray-900 break-words block sm:inline mt-1 sm:mt-0">{email}</span>.<br className="hidden sm:block" />
                            <span className="block mt-1 sm:mt-0">Click the link in your email to continue.</span>
                        </p>

                        <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6 md:mb-8 text-xs sm:text-sm text-blue-600 bg-blue-50 py-2 px-3 sm:px-4 rounded-full animate-pulse">
                            <Loader2 size={14} className="sm:w-4 sm:h-4 animate-spin shrink-0" />
                            <span>Waiting for verification...</span>
                        </div>

                        <div className="space-y-3 sm:space-y-4">
                            <button
                                onClick={() => handleResend(true)}
                                disabled={isResending || timer > 0 || resendCount >= 2}
                                className={`w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 md:py-4.5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base md:text-lg transition-all duration-300 shadow-xl ${timer > 0 || resendCount >= 2
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                    : 'bg-[#9f3562] text-white hover:bg-[#b24a78] hover:-translate-y-1 active:translate-y-0 active:shadow-lg'
                                    }`}
                            >
                                {isResending ? (
                                    <>
                                        <Loader2 size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6 animate-spin" />
                                        <span className="hidden sm:inline">Sending...</span>
                                        <span className="sm:hidden">Sending</span>
                                    </>
                                ) : timer > 0 ? (
                                    <>
                                        <RotateCcw size={16} className="sm:w-5 sm:h-5 animate-spin-slow shrink-0" />
                                        <span>Resend in {timer}s</span>
                                    </>
                                ) : resendCount >= 2 ? (
                                    <>
                                        <AlertTriangle size={16} className="sm:w-5 sm:h-5 shrink-0" />
                                        <span>Limit Reached</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="hidden sm:inline">Resend Verification Email</span>
                                        <span className="sm:hidden">Resend Email</span>
                                    </>
                                )}
                            </button>

                            <div className="flex flex-col items-center gap-2">
                                {resendCount < 2 && (
                                    <p className="text-xs sm:text-sm text-gray-400 font-medium">
                                        {resendsRemaining} {resendsRemaining === 1 ? 'attempt' : 'attempts'} remaining
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Info Section */}
                    <div className="bg-gray-50/80 backdrop-blur-sm p-3 sm:p-4 md:p-5 border-t border-gray-100 text-center">
                        <p className="text-xs sm:text-sm font-medium text-gray-500">
                            Didn't get the email? <br className="sm:hidden" />
                            <span className="text-gray-400 text-[10px] sm:text-xs italic block sm:inline mt-1 sm:mt-0">Please check your spam or promotions folder.</span>
                        </p>
                        <p className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-red-400 font-medium">
                            Do not close this tab until verified.
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default EmailVerificationModal;
