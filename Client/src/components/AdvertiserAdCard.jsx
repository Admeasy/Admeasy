import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Eye, MousePointerClick, Edit, Trash2, MoreVertical, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { processMentions } from '../utils/processMentions';

const AdvertiserAdCard = ({ ad, onAdUpdate, showEditDelete = false, onDelete, isPreview = false }) => {
    const navigate = useNavigate();
    const [adState, setAdState] = useState(ad);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        setAdState(ad);
    }, [ad]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    const handleAdvertiserClick = (e) => {
        e.stopPropagation();
        if (advertiser.username) {
            navigate(`/${advertiser.username}`);
        }
    };

    const fallbackProfilePic = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
    const advertiser = ad.advertiser || (ad.advertiserId && typeof ad.advertiserId === 'object' ? ad.advertiserId : null) || { name: 'Advertiser', username: 'advertiser', image: null };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-sm hover:shadow-md hover:shadow-gray-200/30 transition-all duration-500 border border-gray-100 hover:border-[#9f3562]/10 group relative"
        >
            <style>{`
        .ad-content h1, .ad-content h2, .ad-content h3 {
          font-weight: 700;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .ad-content p {
          margin-bottom: 0.75rem;
          line-height: 1.6;
        }
        .ad-content ul, .ad-content ol {
          margin-left: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .ad-content a {
          color: #9f3562;
          text-decoration: underline;
        }
      `}</style>

            {/* Content */}
            <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-5 md:p-6 advertiser-info" onClick={handleAdvertiserClick}>
                <img
                    src={advertiser.image || fallbackProfilePic}
                    alt={advertiser.name || 'Advertiser'}
                    className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl object-cover ring-2 ring-gray-100 shadow-md cursor-pointer hover:ring-[#9f3562]/30 transition-all flex-shrink-0"
                    onError={(e) => {
                        e.target.src = fallbackProfilePic;
                    }}
                />
                <div className="flex-1 min-w-0 cursor-pointer">
                    <h3 className="font-bold text-gray-900 text-xs sm:text-sm md:text-base truncate hover:text-[#9f3562] transition-colors">
                        {advertiser.name || 'Advertiser'}
                    </h3>
                    {advertiser.username && (
                        <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 truncate hover:text-[#9f3562] transition-colors">
                            @{advertiser.username}
                        </p>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="pb-3 sm:pb-4">
                <div
                    className="text-gray-800 break-words leading-relaxed text-xs sm:text-sm md:text-[15px] ad-content px-3 sm:px-5 md:px-6"
                    dangerouslySetInnerHTML={{ __html: processMentions(adState.content || ad.content) }}
                />
            </div>

                {/* Image */}
                {(adState.image || ad.image) && (
                    <div className="relative w-full overflow-hidden">
                        <motion.img
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.4 }}
                            src={adState.image || ad.image}
                            alt="Ad"
                            className="w-full aspect-square object-cover"
                            loading="lazy"
                        />
                    </div>
                )}

                {/* Link Preview */}
                {adState.externalLink && adState.externalLink.url && (
                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="mx-3 sm:mx-5 md:mx-6 mb-3 sm:mb-4 md:mb-5 mt-2 sm:mt-3 md:mt-4 border-2 border-gray-100 rounded-xl sm:rounded-2xl overflow-hidden hover:border-[#9f3562]/30 hover:shadow-md transition-all group/link"
                    >
                        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-white group-hover/link:from-[#9f3562]/5 group-hover/link:to-pink-50/50 transition-all duration-300">
                            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg sm:rounded-xl flex items-center justify-center overflow-hidden border border-gray-200">
                                {adState.externalLink.preview?.favicon ? (
                                    <img
                                        src={adState.externalLink.preview.favicon}
                                        alt="Link"
                                        className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 object-contain"
                                    />
                                ) : (
                                    <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-600" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-xs sm:text-sm text-gray-900 truncate">
                                    {adState.externalLink.linkText || adState.externalLink.preview?.title || adState.externalLink.preview?.domain || 'External Link'}
                                </p>
                                {adState.externalLink.preview?.domain && (
                                    <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                                        {adState.externalLink.preview.domain}
                                    </p>
                                )}
                            </div>
                            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0 group-hover/link:text-[#9f3562] transition-colors" />
                        </div>
                        {adState.externalLink.preview?.image && (
                            <img
                                src={adState.externalLink.preview.image}
                                alt="Link preview"
                                className="w-full h-32 sm:h-44 md:h-52 object-contain"
                                loading="lazy"
                            />
                        )}
                    </motion.div>
                )}

                {/* Actions - Stats Only (No Like/Click Tracking) */}
                <div className="flex items-center justify-between px-3 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 border-t border-gray-100">
                    <div className="flex items-center gap-3 sm:gap-4 md:gap-5 lg:gap-7 flex-wrap">
                        <div className="flex items-center gap-1.5 sm:gap-2 text-gray-500">
                            <Heart className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0" />
                            <span className="text-xs sm:text-sm md:text-base font-bold">{adState.likesCount || 0}</span>
                        </div>
                        {!isPreview && (
                            <>
                                <div className="flex items-center gap-1.5 sm:gap-2 text-gray-500">
                                    <Eye className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0" />
                                    <span className="text-xs sm:text-sm md:text-base font-bold">{adState.viewsCount || 0}</span>
                                </div>
                                <div className="flex items-center gap-1.5 sm:gap-2 text-gray-500">
                                    <MousePointerClick className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0" />
                                    <span className="text-xs sm:text-sm md:text-base font-bold">{adState.clicksCount || 0}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Edit/Delete Menu */}
                    {showEditDelete && (
                        <div className="relative" ref={menuRef}>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu(!showMenu);
                                }}
                                className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                            >
                                <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                            </motion.button>
                            <AnimatePresence>
                                {showMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                        className="absolute right-0 top-full mt-2 w-40 sm:w-48 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowMenu(false);
                                                navigate(`/advertiser/ads/${ad._id}/edit`);
                                            }}
                                            className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-gray-50 transition-colors text-gray-700 text-sm"
                                        >
                                            <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                            <span className="font-medium">Edit ad</span>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowMenu(false);
                                                if (onDelete) {
                                                    onDelete(ad._id);
                                                }
                                            }}
                                            className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-red-50 transition-colors text-red-600 text-sm"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                            <span className="font-medium">Delete ad</span>
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default AdvertiserAdCard;
