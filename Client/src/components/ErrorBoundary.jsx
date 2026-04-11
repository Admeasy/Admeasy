import React from'react';

class ErrorBoundary extends React.Component {
 constructor(props) {
 super(props);
 this.state = { hasError: false, error: null, errorInfo: null };
 }

 static getDerivedStateFromError(error) {
 // Update state so the next render will show the fallback UI.
 return { hasError: true };
 }

 componentDidCatch(error, errorInfo) {
 // You can also log the error to an error reporting service
 console.error("ErrorBoundary caught an error:", error, errorInfo);
 this.setState({
 error: error,
 errorInfo: errorInfo
 });
 }

 render() {
 if (this.state.hasError) {
 // You can render any custom fallback UI
 return (
 <div style={{ padding:'20px', textAlign:'center', marginTop:'50px'}}>
 <h2>Something went wrong.</h2>
 <p style={{ color:'gray'}}>We are sorry for the inconvenience. Please refresh the page.</p>
 <button
 onClick={() => window.location.reload()}
 style={{ padding:'10px 20px', marginTop:'20px', cursor:'pointer', background:'#9f3562', color:'white', border:'none', borderRadius:'5px'}}
 >
 Refresh Page
 </button>
 </div>
 );
 }

 return this.props.children;
 }
}

export default ErrorBoundary;
