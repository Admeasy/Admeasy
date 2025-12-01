import { Navigate, useLocation } from "react-router-dom";
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const ProtectedRoute = ({ user, children }) => {
  const location = useLocation();
  
  // Check if OAuth is in progress - check both sessionStorage and URL parameter
  const urlParams = new URLSearchParams(location.search);
  const oauthSuccessParam = urlParams.get('oauth_success');
  const oauthInProgress = typeof window !== 'undefined' && (
    sessionStorage.getItem('oauth_in_progress') === 'true' || 
    oauthSuccessParam === 'true'
  );
  
  // If OAuth is detected in URL, set the flag immediately
  if (oauthSuccessParam === 'true' && typeof window !== 'undefined') {
    sessionStorage.setItem('oauth_in_progress', 'true');
    if (!sessionStorage.getItem('oauth_intended_path')) {
      sessionStorage.setItem('oauth_intended_path', location.pathname);
    }
  }
  
  if (!user && !oauthInProgress) {
      toast.info('Please Login to setup a profile',{
        toastId :'login-warning'
      }) 
        return <Navigate to="/login" replace />
  }
  return children;
};

export default ProtectedRoute;
