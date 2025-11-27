import { Navigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const ProtectedRoute = ({ user, children }) => {
  if (!user) {
      toast.info('Please Login to setup a profile',{
        toastId :'login-warning'
      }) 
        return <Navigate to="/login" replace />
  }
  return children;
};

export default ProtectedRoute;
