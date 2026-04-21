import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Star, Award, AlertCircle } from 'lucide-react';
import { useMentor } from '../context/MentorContext';
import { useNavigate } from 'react-router-dom';

const MentorLeaderboard = () => {
    const navigate = useNavigate();
    const { mentor } = useMentor();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchLeaderboard = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/mentors/stats/leaderboard', {
                method: 'GET',
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setLeaderboard(data.leaderboard);
            } else {
                setError(data.message || 'Failed to fetch leaderboard');
            }
        } catch (err) {
            setError('An error occurred while fetching the leaderboard.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
        // Auto refresh every 5 minutes
        const interval = setInterval(() => {
            fetchLeaderboard();
        }, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const getBadgeColor = (rank) => {
        switch (rank) {
            case 1:
                return 'from-yellow-300 to-yellow-600 border-yellow-400 text-yellow-900';
            case 2:
                return 'from-gray-300 to-gray-500 border-gray-400 text-gray-900';
            case 3:
                return 'from-amber-600 to-amber-800 border-amber-700 text-white';
            default:
                return 'from-gray-100 to-gray-200 border-gray-200 text-gray-600';
        }
    };

    const getRankIcon = (rank) => {
        if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
        if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
        if (rank === 3) return <Award className="w-5 h-5 text-amber-700" />;
        return <span className="font-bold text-gray-500">#{rank}</span>;
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50/50 pb-20 md:pb-0">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm px-4 md:px-6 py-2.5 md:py-4 lg:px-10 flex items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-admeasy-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <Trophy className="w-6 h-6 text-[#9f3562]" />
                        Mentor Leaderboard
                    </h1>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-12 space-y-4">
                        <div className="w-10 h-10 border-4 border-[#9f3562]/30 border-t-[#9f3562] rounded-full animate-spin"></div>
                        <p className="text-gray-500 font-medium animate-pulse">Loading rankings...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-600 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                        <p className="font-semibold">{error}</p>
                        <button
                            onClick={fetchLeaderboard}
                            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-bold transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                ) : leaderboard.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center shadow-lg shadow-gray-200/50 border border-gray-100 flex flex-col items-center">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                            <Trophy className="w-12 h-12 text-gray-300" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">No Mentors Found</h2>
                        <p className="text-gray-500">Check back later when mentors start posting and receiving ratings.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Top 3 Showcase */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 pt-4">
                            {/* Spot 2 */}
                            {leaderboard[1] && (
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="hidden md:flex flex-col items-center justify-end cursor-pointer"
                                    onClick={() => navigate(`/${leaderboard[1].username}`)}
                                >
                                    <div className="relative mb-4 group cursor-pointer">
                                        <div className="w-24 h-24 rounded-full border-4 border-gray-300 bg-white p-1 shadow-lg z-10 relative">
                                            <img
                                                src={leaderboard[1].image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leaderboard[1].name}`}
                                                alt={leaderboard[1].name}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        </div>
                                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-gray-300 to-gray-500 text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-white shadow-md z-20 whitespace-nowrap">
                                            #2
                                        </div>
                                    </div>
                                    <div className="bg-white w-full rounded-2xl p-4 pt-6 mt-[-1rem] shadow-xl border border-gray-100 text-center relative hover:-translate-y-1 transition-transform duration-300">
                                        <h3 className="font-bold text-gray-900 truncate" title={leaderboard[1].name}>{leaderboard[1].name}</h3>
                                        <p className="text-xs text-gray-500 mb-3">@{leaderboard[1].username || 'mentor'}</p>
                                        <div className="inline-flex items-center justify-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 gap-2">
                                            <span className="font-bold text-[#9f3562]">{leaderboard[1].score.toFixed(1)}</span>
                                            <span className="text-xs text-gray-400 font-medium uppercase">Score</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Spot 1 */}
                            {leaderboard[0] && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.1, type: "spring" }}
                                    className="flex flex-col items-center justify-end z-10 cursor-pointer w-full max-w-[200px] mx-auto md:max-w-none"
                                    onClick={() => navigate(`/${leaderboard[0].username}`)}
                                >
                                    <div className="relative mb-3 md:mb-5 group cursor-pointer mt-2 md:mt-0">
                                        {/* Crown Icon */}
                                        <div className="absolute -top-6 md:-top-8 left-1/2 -translate-x-1/2 z-30">
                                            <Trophy className="w-8 h-8 md:w-10 md:h-10 text-yellow-400 drop-shadow-md" fill="currentColor" />
                                        </div>
                                        <div className="w-20 h-20 md:w-32 md:h-32 rounded-full border-4 border-yellow-400 bg-white p-1 shadow-[0_0_20px_rgba(250,204,21,0.3)] md:shadow-[0_0_30px_rgba(250,204,21,0.4)] z-10 relative">
                                            <img
                                                src={leaderboard[0].image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leaderboard[0].name}`}
                                                alt={leaderboard[0].name}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        </div>
                                        <div className="absolute -bottom-2 md:-bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-950 font-bold px-3 py-0.5 md:px-4 md:py-1.5 rounded-full border-2 border-white shadow-lg z-20 whitespace-nowrap text-[10px] md:text-sm">
                                            #1
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-b from-yellow-50 to-white w-full rounded-t-2xl rounded-b-xl md:rounded-t-3xl md:rounded-b-2xl p-3 pt-5 md:p-5 md:pt-8 mt-[-1rem] md:mt-[-1.5rem] shadow-lg md:shadow-2xl border border-yellow-100 text-center relative hover:-translate-y-2 transition-transform duration-300">
                                        <h3 className="font-extrabold text-sm md:text-lg text-gray-900 truncate" title={leaderboard[0].name}>{leaderboard[0].name}</h3>
                                        <p className="text-[10px] md:text-sm text-yellow-700 font-medium mb-1.5 md:mb-3">@{leaderboard[0].username || 'top_mentor'}</p>
                                        <div className="inline-flex items-center justify-center bg-white px-2.5 py-1 md:px-4 md:py-2 rounded-lg md:rounded-xl border border-yellow-200 shadow-sm gap-1 md:gap-2">
                                            <span className="font-black text-[#9f3562] text-sm md:text-lg">{leaderboard[0].score.toFixed(1)}</span>
                                            <span className="text-[9px] md:text-xs text-yellow-700 font-bold uppercase tracking-wider hidden md:inline">Score</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Spot 3 */}
                            {leaderboard[2] && (
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="hidden md:flex flex-col items-center justify-end cursor-pointer"
                                    onClick={() => navigate(`/${leaderboard[2].username}`)}
                                >
                                    <div className="relative mb-4 group cursor-pointer">
                                        <div className="w-24 h-24 rounded-full border-4 border-amber-600 bg-white p-1 shadow-lg z-10 relative">
                                            <img
                                                src={leaderboard[2].image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leaderboard[2].name}`}
                                                alt={leaderboard[2].name}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        </div>
                                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-600 to-amber-800 text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-white shadow-md z-20 whitespace-nowrap">
                                            #3
                                        </div>
                                    </div>
                                    <div className="bg-white w-full rounded-2xl p-4 pt-6 mt-[-1rem] shadow-xl border border-gray-100 text-center relative hover:-translate-y-1 transition-transform duration-300">
                                        <h3 className="font-bold text-gray-900 truncate" title={leaderboard[2].name}>{leaderboard[2].name}</h3>
                                        <p className="text-xs text-gray-500 mb-3">@{leaderboard[2].username || 'mentor'}</p>
                                        <div className="inline-flex items-center justify-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 gap-2">
                                            <span className="font-bold text-[#9f3562]">{leaderboard[2].score.toFixed(1)}</span>
                                            <span className="text-xs text-gray-400 font-medium uppercase">Score</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* List format starting from #1 for mobile, or #4 for desktop */}
                        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                            <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 p-4 border-b border-gray-100 bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-wider items-center px-6">
                                <span className="w-10 text-center">Rank</span>
                                <span>Mentor</span>
                                <span className="w-24 text-center">Posts</span>
                                <span className="w-24 text-center">Rating</span>
                                <span className="w-24 text-right">Score</span>
                            </div>
                            
                            <div className="divide-y divide-gray-50">
                                <AnimatePresence>
                                    {leaderboard.slice(0, 10).map((m, index) => {
                                        const rank = index + 1;
                                        // Hide top 3 on desktop since they are shown in the podium
                                        const isTop3 = rank <= 3;
                                        const isCurrentUser = mentor && mentor._id === m._id;

                                        return (
                                            <motion.div
                                                key={m._id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                onClick={() => navigate(`/${m.username}`)}
                                                className={`
                                                    ${isTop3 ? 'md:hidden' : ''} 
                                                    flex flex-row md:grid md:grid-cols-[auto_1fr_auto_auto_auto] gap-3 md:gap-4 p-3 md:p-4 md:px-6 items-center
                                                    transition-colors hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0
                                                    ${isCurrentUser ? 'bg-[#9f3562]/5 border-l-4 border-l-[#9f3562]' : 'border-l-4 border-l-transparent'}
                                                `}
                                            >
                                                {/* Rank */}
                                                <div className="w-6 md:w-10 flex justify-center flex-shrink-0">
                                                    {isTop3 ? (
                                                        <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br ${getBadgeColor(rank)} flex items-center justify-center text-[10px] md:text-xs font-bold shadow-sm`}>
                                                            {rank}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 font-bold text-sm md:text-lg">{rank}</span>
                                                    )}
                                                </div>

                                                {/* Mentor Info */}
                                                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                                                        <img
                                                            src={m.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`}
                                                            alt={m.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <span className="font-bold text-gray-900 text-sm md:text-base truncate flex items-center gap-1.5">
                                                            {m.name}
                                                            {isCurrentUser && <span className="bg-[#9f3562] text-white text-[9px] md:text-[10px] px-1.5 py-0 rounded-full lowercase tracking-wider hidden md:inline-block">You</span>}
                                                        </span>
                                                        <div className="flex items-center text-[10px] md:text-xs text-gray-500 gap-1.5 mt-0.5">
                                                            <span className="truncate">@{m.username || 'mentor'}</span>
                                                            <span className="md:hidden flex items-center gap-1 text-gray-400 font-medium whitespace-nowrap">
                                                                • <Star className="w-2.5 h-2.5 text-yellow-400 -mt-0.5" fill="currentColor" /> {Number(m.rating).toFixed(1)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Desktop Stats Only */}
                                                <div className="hidden md:flex flex-col md:w-24 md:items-center">
                                                    <span className="font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">
                                                        {m.postsCount}
                                                    </span>
                                                </div>
                                                <div className="hidden md:flex flex-col items-center md:w-24">
                                                    <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-lg">
                                                        <Star className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" />
                                                        <span className="font-semibold text-gray-700">{Number(m.rating).toFixed(1)}</span>
                                                    </div>
                                                </div>

                                                {/* Score */}
                                                <div className="flex flex-col items-end md:w-24 md:items-end flex-shrink-0">
                                                    <span className="text-[9px] text-gray-400 font-bold uppercase md:hidden tracking-wider mb-0.5">Score</span>
                                                    <span className="text-sm md:text-lg font-black text-[#9f3562]">
                                                        {m.score.toFixed(1)}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MentorLeaderboard;
