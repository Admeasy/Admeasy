import { useNavigate } from 'react-router-dom'
import { FaArrowLeft, FaEdit, FaTrash, FaSearch, FaPlus } from 'react-icons/fa'
import { useState, useEffect } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import AddPlanModal from '../components/AddPlanModal'
import { getAdminAuthHeaders } from '../utils/adminAuth'

const ManageSubscriptionPlans = () => {
    const navigate = useNavigate()
    const [plans, setPlans] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingPlan, setEditingPlan] = useState(null)
    const [deletingPlanId, setDeletingPlanId] = useState(null)

    const showError = (error) => { toast.error(error); return "" }
    const showSuccess = (message) => toast.success(message)

    useEffect(() => {
        verifyAuth()
    }, [])

    const verifyAuth = async () => {
        try {
            const response = await fetch('/api/admin/verify', {
                credentials: 'include',
                headers: getAdminAuthHeaders()
            })

            if (!response.ok) {
                throw new Error('Not authenticated')
            }

            fetchPlans()
        } catch (error) {
            console.error('Authentication failed:', error)
            navigate('/admin')
        }
    }

    const fetchPlans = async () => {
        try {
            const response = await fetch('/api/subscription-plans/admin', {
                credentials: 'include',
                headers: getAdminAuthHeaders()
            })
            if (!response.ok) {
                throw new Error('Failed to fetch subscription plans')
            }
            const data = await response.json()
            setPlans(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleEdit = (plan) => {
        setEditingPlan(plan)
        setShowAddModal(true)
    }

    const handleDelete = async (planId) => {
        if (window.confirm('Are you sure you want to delete this subscription plan?')) {
            setDeletingPlanId(planId)
            try {
                const response = await fetch(`/api/subscription-plans/${planId}`, {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: getAdminAuthHeaders()
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.error || 'Failed to delete plan')
                }

                showSuccess('Subscription plan deleted successfully')
                await fetchPlans()
            } catch (err) {
                console.error('Delete error:', err)
                showError(err.message)
            } finally {
                setDeletingPlanId(null)
            }
        }
    }

    const handleAddNew = () => {
        setEditingPlan(null)
        setShowAddModal(true)
    }

    const handleSubmitPlan = async (planData) => {
        try {
            const url = editingPlan ? `/api/subscription-plans/${editingPlan._id}` : '/api/subscription-plans'
            const method = editingPlan ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method: method,
                headers: getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
                credentials: 'include',
                body: JSON.stringify(planData)
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || (editingPlan ? 'Failed to update plan' : 'Failed to add plan'))
            }

            await fetchPlans()
            setShowAddModal(false)
            setEditingPlan(null)
            showSuccess(editingPlan ? 'Subscription plan updated successfully' : 'Subscription plan added successfully')
        } catch (err) {
            console.error('Error submitting plan:', err)
            showError(err.message)
        }
    }

    const handleCloseModal = () => {
        setShowAddModal(false)
        setEditingPlan(null)
    }

    const filteredPlans = plans
        .filter(plan =>
            plan.name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => a.name?.localeCompare(b.name || '', undefined, { sensitivity: 'base' }))

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 flex justify-center items-center relative overflow-hidden selection:bg-[#9f3562]/20 selection:text-[#9f3562]">
                <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#9f3562]/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="relative z-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9f3562]"></div>
                </div>
            </div>
        )
    }

    return (
        <main className='min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 relative overflow-x-hidden p-6 sm:p-8 transition-all duration-300 selection:bg-[#9f3562]/20 selection:text-[#9f3562]'>
            {/* Enhanced Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#9f3562]/8 to-pink-300/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/8 to-pink-200/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
                <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[#b14270]/6 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]" />
            </div>

            <button 
                className='absolute top-6 left-6 z-10 flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-sm hover:bg-white rounded-xl transition-all duration-300 shadow-sm border border-gray-200 hover:shadow-md hover:border-[#9f3562]/30 text-gray-700 hover:text-[#9f3562]' 
                onClick={() => navigate(-1)}
            >
                <FaArrowLeft />
                Back
            </button>
            
            <h1 className="w-fit h-fit m-0 p-0 mx-auto text-gray-900 font-admeasy-bold text-3xl sm:text-5xl text-center mb-8 relative z-10">
                Manage Subscription Plans
            </h1>

            <ToastContainer className='hidden'/>

            {error && (
                showError(error)
            )}

            <div className="max-w-6xl mx-auto relative z-10">
                <button
                    onClick={handleAddNew}
                    className="mb-6 px-4 py-2.5 bg-gradient-to-r from-[#9f3562] to-[#b14270] hover:shadow-lg hover:shadow-[#9f3562]/30 text-white rounded-xl transition-all duration-300 flex items-center hover:scale-105 active:scale-95"
                >
                    <FaPlus className="mr-2" />
                    Add Plan
                </button>

                <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaSearch className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search plans..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 bg-white/95 backdrop-blur-sm text-gray-900 placeholder:text-gray-500 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/50 focus:border-[#9f3562]/50 transition-all duration-300 shadow-sm"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {filteredPlans.map((plan) => (
                        <div 
                            key={plan._id} 
                            className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-[#9f3562]/30 p-6 flex flex-col"
                        >
                            <div className="flex-1 mb-4">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                                <div className="space-y-3 mb-4">
                                    {/* Monthly Pricing */}
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <div className="text-xs font-semibold text-gray-500 mb-2">MONTHLY</div>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm text-gray-600">Price:</span>
                                            <span className="text-base font-bold text-[#9f3562]">₹{plan.price?.monthly || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Original:</span>
                                            <span className="text-sm font-medium text-gray-500 line-through">₹{plan.originalPrice?.monthly || 'N/A'}</span>
                                        </div>
                                    </div>
                                    {/* Yearly Pricing */}
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <div className="text-xs font-semibold text-gray-500 mb-2">YEARLY</div>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm text-gray-600">Price:</span>
                                            <span className="text-base font-bold text-[#9f3562]">₹{plan.price?.yearly || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Original:</span>
                                            <span className="text-sm font-medium text-gray-500 line-through">₹{plan.originalPrice?.yearly || 'N/A'}</span>
                                        </div>
                                    </div>
                                    {plan.features && plan.features.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                            <span className="text-sm font-medium text-gray-700">Features:</span>
                                            <ul className="mt-2 space-y-1">
                                                {plan.features.slice(0, 3).map((feature, idx) => (
                                                    <li key={idx} className="text-sm text-gray-600 flex items-start">
                                                        <span className="mr-2">•</span>
                                                        <span>{feature}</span>
                                                    </li>
                                                ))}
                                                {plan.features.length > 3 && (
                                                    <li className="text-sm text-gray-500 italic">
                                                        +{plan.features.length - 3} more...
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 mt-auto">
                                <button
                                    onClick={() => handleEdit(plan)}
                                    className="flex-1 px-4 py-2.5 flex items-center justify-center gap-2 bg-gradient-to-r from-[#9f3562] to-[#b14270] hover:shadow-lg hover:shadow-[#9f3562]/30 text-white rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
                                >
                                    <FaEdit className="inline" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(plan._id)}
                                    disabled={deletingPlanId === plan._id}
                                    className={`px-4 py-2.5 flex items-center justify-center gap-2 ${deletingPlanId === plan._id ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'} text-white rounded-xl transition-all duration-300 hover:scale-105 active:scale-95`}
                                >
                                    {deletingPlanId === plan._id ? (
                                        <>
                                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <FaTrash className="inline" />
                                            Delete
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredPlans.length === 0 && !isLoading && (
                    <div className="text-center py-12 bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50">
                        <p className="text-gray-700 text-lg font-medium">No subscription plans found</p>
                    </div>
                )}

                {showAddModal && (
                    <AddPlanModal
                        onClose={handleCloseModal}
                        onSubmit={handleSubmitPlan}
                        editData={editingPlan}
                    />
                )}
            </div>
        </main>
    )
}

export default ManageSubscriptionPlans
