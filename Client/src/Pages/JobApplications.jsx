import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaArrowLeft, FaSearch, FaLock } from 'react-icons/fa';
import { SiTicktick } from 'react-icons/si'

const JobApplications = () => {
    const { job } = useParams();
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedApp, setSelectedApp] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showInterviewModal, setShowInterviewModal] = useState(false);
    const [unlockedImages, setUnlockedImages] = useState({});
    const [unlockingImage, setUnlockingImage] = useState(null);
    const [interviewData, setInterviewData] = useState({
        applicantName: '',
        applicantEmail: '',
        startDateTime: '',
        endDateTime: '',
        guests: []
    });
    const [dept, setDept] = useState('');

    useEffect(() => {
        if (!job) return console.log('No job name');
        fetchApplications();
    }, [job]);

    const fetchApplications = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const decoded = decodeURIComponent(job);
            const res = await fetch(`/api/apply/applications/${decoded}`, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch applications');
            const data = await res.json();
            setApplications(data);
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleShowModal = (app) => {
        setSelectedApp(app);
        setShowModal(true);
    };
    const closeModal = () => {
        setShowModal(false);
        setSelectedApp(null);
    };

    const closeInterviewModal = () => {
        setShowInterviewModal(false);
    };

    // Image unlocking system (simulate fetch for now)
    const unlockImage = async (appId) => {
        if (unlockedImages[appId]) return; // Already unlocked
        setUnlockingImage(appId);
        try {
            const res = await fetch(`/api/apply/mentorship/${appId}/pic`, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch image');
            const data = await res.json();
            setUnlockedImages(prev => ({ ...prev, [appId]: data }));
        } catch (err) {
            toast.error('Failed to unlock image');
        } finally {
            setUnlockingImage(null);
        }
    };

    const scheduleInterview = async () => {
        try {
            // Validate required fields
            if (!interviewData.startDateTime || !interviewData.endDateTime) {
                toast.error('Please select both start and end date/time');
                return;
            }

            if (!dept) {
                toast.error('Please select a department');
                return;
            }

            let guests = [];

            switch (dept) {
                case 'Tech Department':
                    console.log('tech');
                    guests = ['aadesh.panwar@admeasy.in', 'nitish@admeasy.in', 'ahsan@admeasy.in', interviewData.applicantEmail];
                    break;
                case 'Marketing Department':
                    console.log('mkt');
                    guests = ['aadesh.panwar@admeasy.in', 'divy@admeasy.in', 'parthtiwari7205@gmail.com', interviewData.applicantEmail];
                    break;
                case 'HR Department':
                    console.log('hr');
                    guests = ['aadesh.panwar@admeasy.in', 'divy@admeasy.in', 'meeralbabani25@gmail.com', interviewData.applicantEmail];
                    break;
                case 'Content Department':
                    console.log('content');
                    guests = ['aadesh.panwar@admeasy.in', 'divy@admeasy.in', 'parthtiwari7205@gmail.com', interviewData.applicantEmail];
                    break;
                case 'Operations Department':
                    console.log('ops');
                    guests = ['aadesh.panwar@admeasy.in', 'divy@admeasy.in', interviewData.applicantEmail];
                    break;
                default:
                    toast.error('Please select a valid department');
                    return;
            }

            // Update interviewData with guests using functional setState to ensure latest state
            const finalInterviewData = {
                ...interviewData,
                guests: guests
            };

            setInterviewData(finalInterviewData);

            console.log('Interview Data:', finalInterviewData);
            console.log(interviewData);

            const res = await fetch('/api/apply/schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(interviewData),
            });

            if (!res.ok) {
                throw new Error('Failed to schedule an Interview.');
            }

            toast.success('Interview Scheduled!');
            closeInterviewModal();
            closeModal();
        } catch (err) {
            toast.error(err.message);
            console.log(err);
        }
    };

    const handleAccept = async () => {
        try {
            const res = await fetch(`/api/apply/mentorship/accept/${selectedApp._id}`, {
                method: 'POST',
                credentials: 'include'
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || 'Failed to accept application');
            }
            
            // Consume the response body
            await res.json();
            
            closeModal();
            // Use setTimeout to ensure modal closes first, then show toast
            setTimeout(() => {
                toast.success('Application accepted and Email sent');
            }, 100);
            fetchApplications();
        } catch (e) {
            console.error(e);
            toast.error(e.message || 'An Error Occurred');
        }
    };

    const handleReject = async () => {
        try {
            const res = await fetch(`/api/apply/mentorship/${selectedApp._id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to reject application');
            fetchApplications();
            toast.success('Application Rejected.');
            closeModal();
        } catch (err) {
            toast.error(err.message);
            console.log(err);
        }
    };

    const filteredApps = applications.filter(app => {
        return (
            (app.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (app.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
        );
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen p-4 sm:p-6 lg:p-8">
            <button className="admin-back-button" onClick={() => navigate(-1)}>
                <FaArrowLeft />
            </button>
            <h1 className="admin-heading">Job Applications</h1>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            <div className="max-w-6xl mx-auto">
                <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaSearch className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search applications..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 text-tprimary placeholder:text-tsecondary border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {filteredApps.map((app, idx) => (
                        <div
                            key={app._id || idx}
                            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col" onClick={() => handleShowModal(app)}
                        >
                            <div className="p-4 sm:p-6 flex-1">
                                <div className="flex items-center space-x-3 mb-4 relative">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                        {app.image ? (
                                            <img
                                                src={app.image}
                                                alt={app.name || 'Applicant'}
                                                className="w-full h-full object-cover"
                                                onError={e => { e.target.style.display = 'none'; }}
                                            />
                                        ) : null}
                                        <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg sm:text-xl">
                                            {(app.name || 'A').charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                    {app.isAccepted && <SiTicktick className='max-w-4 max-h-4 text-green-500 absolute top-1 right-1' />}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                                            {app.name || 'No Name'}
                                        </h3>
                                        <p className="text-sm text-gray-600 truncate">
                                            {app.email || 'No Email'}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    {app.course && (
                                        <div className="flex items-center text-gray-600">
                                            <span className="truncate">{app.course}</span>
                                        </div>
                                    )}
                                    {app.institute && (
                                        <div className="flex items-center text-gray-600">
                                            <span className="truncate">{app.institute}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                className="w-9/10 mx-auto mb-3 px-3 py-2 rounded-lg text-white bg-blue-500 hover:bg-blue-600 transition-colors flex items-center justify-center"
                                onClick={() => handleShowModal(app)}
                            >
                                View Full Application
                            </button>
                        </div>
                    ))}
                </div>
                {filteredApps.length === 0 && !isLoading && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No applications found</p>
                    </div>
                )}
            </div>
            {/* Modal */}
            {showModal && selectedApp && (
                <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 sm:p-6 pb-0">
                            <h2 className="text-xl sm:text-2xl font-bold text-thead1">Application Details</h2>
                            <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 text-4xl font-bold">×</button>
                        </div>
                        <div className="p-4 sm:p-6 flex-grow overflow-y-auto">
                            <div className="flex flex-col items-center mb-6">
                                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden bg-gray-200 mb-4 flex-shrink-0 relative">
                                    {selectedApp.image ? (
                                        !unlockedImages[selectedApp._id] ? (
                                            <div className="w-full h-full relative cursor-pointer group" onClick={() => unlockImage(selectedApp._id)}>
                                                <img src={selectedApp.image} alt={selectedApp.name || 'Applicant'} className="w-full h-full object-cover blur-sm" />
                                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                                                    <FaLock className="text-white text-2xl sm:text-3xl mb-2" />
                                                    <span className="text-white text-sm sm:text-base font-medium text-center">
                                                        {unlockingImage === selectedApp._id ? 'Unlocking...' : 'View Image'}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <img src={unlockedImages[selectedApp._id]} alt={selectedApp.name || 'Applicant'} className="w-full h-full object-cover" />
                                        )
                                    ) : (
                                        <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-bold text-4xl sm:text-5xl">
                                            {(selectedApp.name || 'A').charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">
                                    {selectedApp.name || 'No Name'}
                                </h3>
                            </div>
                            <div className="space-y-4">
                                {/* Render all fields dynamically */}
                                {Object.entries(selectedApp).map(([key, value]) => {
                                    if ([
                                        '_id', 'image', 'isAccepted', '__v'
                                    ].includes(key)) return null;
                                    return (
                                        <div key={key} className="flex items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="font-medium">{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                                            <span className="ml-2">{String(value)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="w-full p-4 sm:p-6 pt-0 border-t border-gray-100 flex max-[400px]:flex-col flex-row gap-4">
                            <button
                                onClick={() => { setShowInterviewModal(true); setInterviewData({ applicantName: selectedApp.name, applicantEmail: selectedApp.email, startDateTime: '', endDateTime: '', guests: [] }); }}
                                disabled={selectedApp.isAccepted}
                                className={`max-[400px]:w-full max-[400px]:text-center w-1/3 px-4 py-3 text-white font-medium rounded-lg transition-colors ${
                                    selectedApp.isAccepted 
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : 'bg-blue-500 hover:bg-blue-700 cursor-pointer'
                                }`}>
                                Schedule Interview
                            </button>
                            <button
                                onClick={handleAccept}
                                disabled={selectedApp.isAccepted}
                                className={`max-[400px]:w-full max-[400px]:text-center w-1/3 px-4 py-3 text-white font-medium rounded-lg transition-colors ${
                                    selectedApp.isAccepted 
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : 'bg-green-500 hover:bg-green-700 cursor-pointer'
                                }`}>
                                Accept
                            </button>
                            <button
                                onClick={handleReject}
                                className="max-[400px]:w-full max-[400px]:text-center w-1/3 px-4 py-3 bg-red-500 hover:bg-red-700 text-white font-medium rounded-lg transition-colors cursor-pointer">
                                Reject
                            </button>
                        </div>
                    </div>
                    {/* Interview scheduling modal */}
                    {showInterviewModal && (
                        <div className="fixed inset-0 bg-black/25 flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
                                <div className="flex items-center justify-between p-4 sm:p-4 pb-0">
                                    <h2 className="w-full text-center text-xl sm:text-2xl font-bold text-thead1">Schedule Interview</h2>
                                    <button onClick={closeInterviewModal} className="text-gray-500 hover:text-gray-700 text-3xl font-bold">×</button>
                                </div>
                                <div className="p-4 sm:p-6 flex-grow overflow-y-auto">
                                    <div className="space-y-2">
                                        <div className="flex justify-around items-center p-1.5">
                                            <span className="font-medium">Start:</span>
                                            <input
                                                type="datetime-local"
                                                className="ml-2 border border-gray-300 rounded-lg p-2"
                                                value={interviewData.startDateTime}
                                                onChange={(e) => setInterviewData({ ...interviewData, startDateTime: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex justify-around items-center p-1.5">
                                            <span className="font-medium">End:</span>
                                            <input
                                                type="datetime-local"
                                                className="ml-2 border border-gray-300 rounded-lg p-2"
                                                value={interviewData.endDateTime}
                                                onChange={(e) => setInterviewData({ ...interviewData, endDateTime: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex justify-around items-center p-1.5">
                                            <span className="font-medium">Choose Department:</span>
                                            <select className="ml-2 border border-gray-300 rounded-lg p-2" onChange={(e) => setDept(e.target.value)}>
                                                <option value="">Select Department</option>
                                                <option value="Tech Department">Tech Dept.</option>
                                                <option value="Marketing Department">Marketing Dept.</option>
                                                <option value="HR Department">HR Dept.</option>
                                                <option value="Content Department">Content Dept.</option>
                                                <option value="Operations Department">Operations Dept.</option>
                                                {/* <option value="Finance Department">Finance Dept</option>
                                                <option value="Customer Service Department">Customer Service Dept</option>
                                                <option value="Product Department">Product Dept</option>
                                                <option value="Design Department">Design Dept</option>
                                                <option value="Sales Department">Sales Dept</option> */}
                                            </select>
                                        </div>
                                        <div className="flex items-center p-3">
                                            <button className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors cursor-pointer" onClick={scheduleInterview}>Schedule Interview</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )
            }
        </main >
    );
};

export default JobApplications;
