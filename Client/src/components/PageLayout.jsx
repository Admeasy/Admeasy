import { useLocation } from 'react-router-dom';
import LeftSidebar from './LeftSidebar';

const PageLayout = ({ children, showSidebar = true }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const hideSidebarPages = ['/login', '/mentors/login', '/mentors/register', '/onboarding', '/forgot-password', '/reset-password'];
  const shouldShowSidebar = showSidebar && !isAdminRoute && !hideSidebarPages.some(path => location.pathname.startsWith(path));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {shouldShowSidebar && <LeftSidebar />}
      <main className={`${shouldShowSidebar ? 'ml-20' : ''} flex-1 transition-all duration-300`}>
        {children}
      </main>
    </div>
  );
};

export default PageLayout;