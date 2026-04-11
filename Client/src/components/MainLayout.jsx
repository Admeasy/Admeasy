import { useLocation } from'react-router-dom';
import LeftSidebar from'./LeftSidebar';
import { useState } from'react';

const MainLayout = ({ children }) => {
 const location = useLocation();
 const isAdminRoute = location.pathname.startsWith('/admin');
 const landingPage = location.pathname('/')
 const [isCollapsed,setIsCollapsed] = useState(false)
 // Hide layout on admin routes and auth pages
 const hideLayoutPages = ['/login','/mentors/login','/mentors/register','/onboarding','/forgot-password','/reset-password'];
 const shouldHideLayout = isAdminRoute || hideLayoutPages.some(path => location.pathname.startsWith(path));

 if (shouldHideLayout) {
 return children;
 }

 return (
 <div className="min-h-screen bg-gray-50 flex">
 <LeftSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
 <main className="flex-1 ml-0">
 {children}
 </main>
 </div>
 );
};

export default MainLayout;