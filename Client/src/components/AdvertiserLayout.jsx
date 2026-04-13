import { useState } from'react';
import { Outlet, useNavigate } from'react-router-dom';
import { useEffect } from'react';
import AdvertiserSidebar from'./AdvertiserSidebar';
import { toast } from'react-toastify';

const AdvertiserLayout = () => {
 const navigate = useNavigate();
 const [isCollapsed, setIsCollapsed] = useState(false);
 const [showMobileMenu, setShowMobileMenu] = useState(false);
 const [isAuthenticated, setIsAuthenticated] = useState(false);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const checkAuth = async () => {
 try {
 const res = await fetch('/api/advertisers/me', {
 credentials:'include'
 });

 if (res.ok) {
 setIsAuthenticated(true);
 } else {
 toast.info('Please log in to continue');
 navigate('/advertiser/login');
 }
 } catch (error) {
 console.error('Auth check error:', error);
 navigate('/advertiser/login');
 } finally {
 setLoading(false);
 }
 };

 checkAuth();
 }, [navigate]);

 if (loading) {
 return (
 <div className="min-h-screen flex items-center justify-center">
 <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9f3562]"></div>
 </div>
 );
 }

 if (!isAuthenticated) {
 return null;
 }

 return (
 <div className="min-h-screen bg-gray-50 flex">
 <AdvertiserSidebar
 isCollapsed={isCollapsed}
 setIsCollapsed={setIsCollapsed}
 showMobileMenu={showMobileMenu}
 setShowMobileMenu={setShowMobileMenu}
 />
 <main
 className={`flex-1 transition-all duration-300 w-full ${
 isCollapsed ?'xl:ml-[88px]':'xl:ml-[288px]'
 }`}
 >
 <div className="px-3 pb-3 pt-4 sm:px-4 sm:pb-4 sm:pt-6 md:px-6 md:pb-6 md:pt-6 lg:px-8 lg:pb-8 lg:pt-8">
 <Outlet context={{ showMobileMenu, setShowMobileMenu }} />
 </div>
 </main>
 </div>
 );
};

export default AdvertiserLayout;
