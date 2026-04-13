import { FaTimes, FaPlus, FaTrash } from'react-icons/fa'
import { useState, useEffect } from'react'

const AddPlanModal = ({ onClose, onSubmit, editData = null }) => {
 const [formData, setFormData] = useState({
 name:'',
 price: {
 monthly:'',
 yearly:''
 },
 originalPrice: {
 monthly:'',
 yearly:''
 },
 features: ['']
 })
 const [isSubmitting, setIsSubmitting] = useState(false)

 useEffect(() => {
 if (editData) {
 setFormData({
 name: editData.name ||'',
 price: {
 monthly: editData.price?.monthly ||'',
 yearly: editData.price?.yearly ||''
 },
 originalPrice: {
 monthly: editData.originalPrice?.monthly ||'',
 yearly: editData.originalPrice?.yearly ||''
 },
 features: editData.features && editData.features.length > 0 
 ? editData.features 
 : ['']
 })
 }
 }, [editData])

 const handleChange = (e) => {
 const { name, value } = e.target
 setFormData(prev => ({
 ...prev,
 [name]: value
 }))
 }

 const handlePriceChange = (period, field, value) => {
 setFormData(prev => ({
 ...prev,
 [field]: {
 ...prev[field],
 [period]: value
 }
 }))
 }

 const handleFeatureChange = (index, value) => {
 setFormData(prev => {
 const newFeatures = [...prev.features]
 newFeatures[index] = value
 return {
 ...prev,
 features: newFeatures
 }
 })
 }

 const addFeature = () => {
 setFormData(prev => ({
 ...prev,
 features: [...prev.features,'']
 }))
 }

 const removeFeature = (index) => {
 if (formData.features.length > 1) {
 setFormData(prev => ({
 ...prev,
 features: prev.features.filter((_, i) => i !== index)
 }))
 }
 }

 const handleSubmit = async (e) => {
 e.preventDefault()
 setIsSubmitting(true)

 // Filter out empty features
 const filteredFeatures = formData.features.filter(f => f.trim() !=='')

 if (filteredFeatures.length === 0) {
 alert('Please add at least one feature')
 setIsSubmitting(false)
 return
 }

 const planData = {
 name: formData.name.trim(),
 price: {
 monthly: Number(formData.price.monthly),
 yearly: Number(formData.price.yearly)
 },
 originalPrice: {
 monthly: Number(formData.originalPrice.monthly),
 yearly: Number(formData.originalPrice.yearly)
 },
 features: filteredFeatures
 }

 try {
 await onSubmit(planData)
 } catch (error) {
 console.error('Error submitting plan:', error)
 } finally {
 setIsSubmitting(false)
 }
 }

 return (
 <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
 <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
 <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-gray-200 p-6 flex justify-between items-center">
 <h2 className="text-2xl font-admeasy-bold text-gray-900">
 {editData ?'Edit Subscription Plan':'Add New Subscription Plan'}
 </h2>
 <button
 onClick={onClose}
 className="text-gray-500 hover:text-gray-700 transition-colors"
 >
 <FaTimes size={24} />
 </button>
 </div>

 <form onSubmit={handleSubmit} className="p-6 space-y-6">
 {/* Name Field */}
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-2">
 Plan Name <span className="text-red-500">*</span>
 </label>
 <input
 type="text"
 name="name"
 value={formData.name}
 onChange={handleChange}
 className="w-full px-4 py-2.5 bg-white/95 backdrop-blur-sm text-gray-900 placeholder:text-gray-500 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/50 focus:border-[#9f3562]/50 transition-all duration-300"
 placeholder="Enter plan name"
 required
 />
 </div>

 {/* Price Fields */}
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-3">
 Price (₹) <span className="text-red-500">*</span>
 </label>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-medium text-gray-600 mb-2">
 Monthly Price
 </label>
 <input
 type="number"
 value={formData.price.monthly}
 onChange={(e) => handlePriceChange('monthly','price', e.target.value)}
 className="w-full px-4 py-2.5 bg-white/95 backdrop-blur-sm text-gray-900 placeholder:text-gray-500 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/50 focus:border-[#9f3562]/50 transition-all duration-300"
 placeholder="Monthly price"
 min="0"
 step="0.01"
 required
 />
 </div>
 <div>
 <label className="block text-xs font-medium text-gray-600 mb-2">
 Yearly Price
 </label>
 <input
 type="number"
 value={formData.price.yearly}
 onChange={(e) => handlePriceChange('yearly','price', e.target.value)}
 className="w-full px-4 py-2.5 bg-white/95 backdrop-blur-sm text-gray-900 placeholder:text-gray-500 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/50 focus:border-[#9f3562]/50 transition-all duration-300"
 placeholder="Yearly price"
 min="0"
 step="0.01"
 required
 />
 </div>
 </div>
 </div>

 {/* Original Price Fields */}
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-3">
 Original Price (₹) <span className="text-red-500">*</span>
 </label>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-medium text-gray-600 mb-2">
 Monthly Original Price
 </label>
 <input
 type="number"
 value={formData.originalPrice.monthly}
 onChange={(e) => handlePriceChange('monthly','originalPrice', e.target.value)}
 className="w-full px-4 py-2.5 bg-white/95 backdrop-blur-sm text-gray-900 placeholder:text-gray-500 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/50 focus:border-[#9f3562]/50 transition-all duration-300"
 placeholder="Monthly original price"
 min="0"
 step="0.01"
 required
 />
 </div>
 <div>
 <label className="block text-xs font-medium text-gray-600 mb-2">
 Yearly Original Price
 </label>
 <input
 type="number"
 value={formData.originalPrice.yearly}
 onChange={(e) => handlePriceChange('yearly','originalPrice', e.target.value)}
 className="w-full px-4 py-2.5 bg-white/95 backdrop-blur-sm text-gray-900 placeholder:text-gray-500 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/50 focus:border-[#9f3562]/50 transition-all duration-300"
 placeholder="Yearly original price"
 min="0"
 step="0.01"
 required
 />
 </div>
 </div>
 </div>

 {/* Features Field */}
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-2">
 Features <span className="text-red-500">*</span>
 </label>
 <div className="space-y-3">
 {formData.features.map((feature, index) => (
 <div key={index} className="flex items-center gap-2">
 <input
 type="text"
 value={feature}
 onChange={(e) => handleFeatureChange(index, e.target.value)}
 className="flex-1 px-4 py-2.5 bg-white/95 backdrop-blur-sm text-gray-900 placeholder:text-gray-500 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9f3562]/50 focus:border-[#9f3562]/50 transition-all duration-300"
 placeholder={`Feature ${index + 1}`}
 />
 {formData.features.length > 1 && (
 <button
 type="button"
 onClick={() => removeFeature(index)}
 className="px-3 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
 >
 <FaTrash />
 </button>
 )}
 </div>
 ))}
 <button
 type="button"
 onClick={addFeature}
 className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
 >
 <FaPlus />
 Add Feature
 </button>
 </div>
 </div>

 {/* Submit Buttons */}
 <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
 <button
 type="button"
 onClick={onClose}
 className="px-6 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={isSubmitting}
 className={`px-6 py-2.5 bg-gradient-to-r from-[#9f3562] to-[#b14270] hover:shadow-lg hover:shadow-[#9f3562]/30 text-white rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 ${isSubmitting ?'opacity-75 cursor-not-allowed':''}`}
 >
 {isSubmitting ?'Saving...': (editData ?'Update Plan':'Add Plan')}
 </button>
 </div>
 </form>
 </div>
 </div>
 )
}

export default AddPlanModal
