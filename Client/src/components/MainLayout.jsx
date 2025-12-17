import { useLocation } from 'react-router-dom';
import LeftSidebar from './LeftSidebar';

const MainLayout = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Hide layout on admin routes and auth pages
  const hideLayoutPages = ['/login', '/mentors/login', '/mentors/register', '/onboarding', '/forgot-password', '/reset-password'];
  const shouldHideLayout = isAdminRoute || hideLayoutPages.some(path => location.pathname.startsWith(path));

  if (shouldHideLayout) {
    return children;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <LeftSidebar />
      <main className="flex-1 ml-0">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;