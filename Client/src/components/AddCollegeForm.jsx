import { FaTimes, FaPlus, FaCloudUploadAlt } from 'react-icons/fa'
import { useState } from 'react'

const initialFormState = {
    name: '',
    desc: '',
    logo: '',
    rating: {
        overall: 0,
        educationalQuality: 0,
        faculty: 0,
        infrastructure: 0,
        placements: 0,
        facilities: 0
    },
    location: '',
    establishedYear: '',
    type: 'Public',
    website: '',
    contact: {
        email: '',
        phone: ''
    },
    keywords: [''],
    facilities: [''],
    package: {
        average: '',
        highest: ''
    },
    recruiters: [''],
    placementRate: '',
    gallery: [],
    whyChoose: [''],
    courses: [{
        title: '',
        introDesc: '',
        desc: '',
        duration: '',
        semesters: '',
        rating: 0,
        eligibility: '',
        feeStructure: {
            feePerSemester: '',
            additionals: new Map()
        },
        scholarships: [{
            name: '',
            eligibilityCriteria: '',
            benefit: '',
            howToApply: ''
        }]
    }]
}

const AddCollegeForm = ({ onClose, onSubmit }) => {
    const [formData, setFormData] = useState(initialFormState)
    const [dragActive, setDragActive] = useState(false)

    const handleFormChange = (e, section = null, subsection = null) => {
        const { name, value } = e.target;
        
        if (section) {
            if (subsection) {
                setFormData(prev => ({
                    ...prev,
                    [section]: {
                        ...prev[section],
                        [subsection]: value
                    }
                }));
            } else if (section === 'rating' && name !== 'overall') {
                // Calculate average of all ratings except overall
                setFormData(prev => {
                    const newRatings = {
                        ...prev.rating,
                        [name]: parseFloat(value) || 0
                    };
                    
                    const ratingKeys = ['educationalQuality', 'faculty', 'infrastructure', 'placements', 'facilities'];
                    const sum = ratingKeys.reduce((acc, key) => acc + (parseFloat(newRatings[key]) || 0), 0);
                    const average = (sum / ratingKeys.length).toFixed(1);
                    
                    return {
                        ...prev,
                        rating: {
                            ...newRatings,
                            overall: average
                        }
                    };
                });
            } else if (section === 'package') {
                setFormData(prev => ({
                    ...prev,
                    package: {
                        ...prev.package,
                        [name]: value
                    }
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    [section]: {
                        ...prev[section],
                        [name]: parseFloat(value) || value
                    }
                }));
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    }

    const handleArrayChange = (e, field, index) => {
        const { value } = e.target;
        setFormData(prev => {
            const newArray = [...prev[field]];
            newArray[index] = value;
            return {
                ...prev,
                [field]: newArray
            };
        });
    }

    const handleCourseChange = (index, field, value, subfield = null) => {
        setFormData(prev => {
            const newCourses = [...prev.courses];
            if (subfield) {
                newCourses[index] = {
                    ...newCourses[index],
                    [field]: {
                        ...newCourses[index][field],
                        [subfield]: value
                    }
                };
            } else {
                newCourses[index] = {
                    ...newCourses[index],
                    [field]: value
                };
            }
            return {
                ...prev,
                courses: newCourses
            };
        });
    }

    const handleScholarshipChange = (courseIndex, scholarshipIndex, field, value) => {
        setFormData(prev => {
            const newCourses = [...prev.courses];
            const newScholarships = [...newCourses[courseIndex].scholarships];
            newScholarships[scholarshipIndex] = {
                ...newScholarships[scholarshipIndex],
                [field]: value
            };
            newCourses[courseIndex] = {
                ...newCourses[courseIndex],
                scholarships: newScholarships
            };
            return {
                ...prev,
                courses: newCourses
            };
        });
    }

    const addArrayField = (field) => {
        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], '']
        }));
    }

    const removeArrayField = (field, index) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    }

    const addCourse = () => {
        setFormData(prev => ({
            ...prev,
            courses: [...prev.courses, {
                title: '',
                introDesc: '',
                desc: '',
                duration: '',
                semesters: '',
                rating: 0,
                eligibility: '',
                feeStructure: {
                    feePerSemester: '',
                    additionals: new Map()
                },
                scholarships: [{
                    name: '',
                    eligibilityCriteria: '',
                    benefit: '',
                    howToApply: ''
                }]
            }]
        }));
    }

    const removeCourse = (index) => {
        setFormData(prev => ({
            ...prev,
            courses: prev.courses.filter((_, i) => i !== index)
        }));
    }

    const addScholarship = (courseIndex) => {
        setFormData(prev => {
            const newCourses = [...prev.courses];
            newCourses[courseIndex].scholarships.push({
                name: '',
                eligibilityCriteria: '',
                benefit: '',
                howToApply: ''
            });
            return {
                ...prev,
                courses: newCourses
            };
        });
    }

    const removeScholarship = (courseIndex, scholarshipIndex) => {
        setFormData(prev => {
            const newCourses = [...prev.courses];
            newCourses[courseIndex].scholarships = newCourses[courseIndex].scholarships
                .filter((_, i) => i !== scholarshipIndex);
            return {
                ...prev,
                courses: newCourses
            };
        });
    }

    const handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleGalleryDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        const files = e.dataTransfer ? e.dataTransfer.files : e.target.files
        const validFiles = Array.from(files).filter(file => 
            file.type.startsWith('image/')
        )

        setFormData(prev => ({
            ...prev,
            gallery: [...prev.gallery, ...validFiles]
        }))
    }

    const removeGalleryImage = (index) => {
        setFormData(prev => ({
            ...prev,
            gallery: prev.gallery.filter((_, i) => i !== index)
        }))
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    }

    const renderSection = (title, children) => (
        <div className="bg-white/5 rounded-lg p-4 space-y-4">
            <h3 className="text-xl font-semibold text-thead1 border-b border-gray-300 pb-2">{title}</h3>
            {children}
        </div>
    )

    const renderField = (label, element) => (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-thead1">{label}</label>
            {element}
        </div>
    )

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-primary rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="w-fit h-fit m-0 p-0 mx-auto text-2xl text-center font-bold text-thead1">Add New College</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <FaTimes size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Institution Details */}
                    {renderSection("Institution Details", (
                        <>
                            {renderField("College Name", 
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleFormChange}
                                    className="w-full p-2 border rounded-lg bg-white"
                                    required
                                />
                            )}
                            {renderField("Logo URL",
                                <input
                                    type="text"
                                    name="logo"
                                    value={formData.logo}
                                    onChange={handleFormChange}
                                    className="w-full p-2 border rounded-lg bg-white"
                                    required
                                />
                            )}
                            {renderField("Description",
                                <textarea
                                    name="desc"
                                    value={formData.desc}
                                    onChange={handleFormChange}
                                    className="w-full p-2 border rounded-lg bg-white"
                                    rows="3"
                                    required
                                />
                            )}
                            {renderField("Location",
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleFormChange}
                                    className="w-full p-2 border rounded-lg bg-white"
                                    required
                                />
                            )}
                            {renderField("Established Year",
                                <input
                                    type="number"
                                    name="establishedYear"
                                    value={formData.establishedYear}
                                    onChange={handleFormChange}
                                    className="w-full p-2 border rounded-lg bg-white"
                                    required
                                />
                            )}
                            {renderField("Type",
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleFormChange}
                                    className="w-full p-2 border rounded-lg bg-white"
                                    required
                                >
                                    <option value="Public">Public</option>
                                    <option value="Private">Private</option>
                                </select>
                            )}
                            {renderField("Website",
                                <input
                                    type="url"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleFormChange}
                                    className="w-full p-2 border rounded-lg bg-white"
                                    required
                                />
                            )}
                        </>
                    ))}

                    {/* Ratings */}
                    {renderSection("Ratings", (
                        <div className="space-y-4">
                            {Object.keys(formData.rating).map(ratingKey => (
                                <div key={ratingKey}>
                                    {renderField(
                                        ratingKey.charAt(0).toUpperCase() + ratingKey.slice(1),
                                        <input
                                            type="number"
                                            name={ratingKey}
                                            value={formData.rating[ratingKey]}
                                            onChange={(e) => handleFormChange(e, 'rating')}
                                            min="0"
                                            max="5"
                                            step="0.1"
                                            className="w-full p-2 border rounded-lg bg-white disabled:bg-gray-200"
                                            required
                                            disabled={ratingKey === 'overall'}
                                            title={ratingKey === 'overall' ? 'Overall rating is automatically calculated' : ''}
                                        />
                                    )}
                                    {ratingKey === 'overall' && (
                                        <p className="text-sm text-gray-400 mt-1">
                                            *Overall rating is automatically calculated as average of other ratings
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}

                    {/* Contact Information */}
                    {renderSection("Contact Information", (
                        <>
                            {renderField("Email",
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.contact.email}
                                    onChange={(e) => handleFormChange(e, 'contact')}
                                    className="w-full p-2 border rounded-lg bg-white"
                                    required
                                />
                            )}
                            {renderField("Phone",
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.contact.phone}
                                    onChange={(e) => handleFormChange(e, 'contact')}
                                    className="w-full p-2 border rounded-lg bg-white"
                                    required
                                />
                            )}
                        </>
                    ))}

                    {/* Arrays */}
                    {['keywords', 'facilities', 'whyChoose', 'recruiters'].map((field, index) => (
                        renderSection(field.charAt(0).toUpperCase() + field.slice(1), (
                            <div key={index}>
                                <div className="flex justify-between items-center mb-2">
                                    <button
                                        type="button"
                                        onClick={() => addArrayField(field)}
                                        className="text-blue-500 hover:text-blue-700"
                                    >
                                        <FaPlus className="inline mr-1" /> Add More
                                    </button>
                                </div>
                                {formData[field].map((item, index) => (
                                    <div key={index} className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={item}
                                            onChange={(e) => handleArrayChange(e, field, index)}
                                            className="flex-1 p-2 border rounded-lg bg-white"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeArrayField(field, index)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ))
                    ))}

                    {/* Package Information */}
                    {renderSection("Package Information", (
                        <>
                            {renderField("Average Package",
                                <input
                                    type="text"
                                    name="average"
                                    value={formData.package.average}
                                    onChange={(e) => handleFormChange(e, 'package')}
                                    placeholder="e.g., 8 LPA"
                                    className="w-full p-2 border rounded-lg bg-white"
                                    required
                                />
                            )}
                            {renderField("Highest Package",
                                <input
                                    type="text"
                                    name="highest"
                                    value={formData.package.highest}
                                    onChange={(e) => handleFormChange(e, 'package')}
                                    placeholder="e.g., 12 LPA"
                                    className="w-full p-2 border rounded-lg bg-white"
                                    required
                                />
                            )}
                            {renderField("Placement Rate",
                                <input
                                    type="text"
                                    name="placementRate"
                                    value={formData.placementRate}
                                    onChange={handleFormChange}
                                    className="w-full p-2 border rounded-lg bg-white"
                                    required
                                />
                            )}
                        </>
                    ))}

                    {/* Gallery */}
                    {renderSection("Gallery", (
                        <div className="space-y-4">
                            <div 
                                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                                    ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
                                    hover:border-blue-500 hover:bg-blue-50`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleGalleryDrop}
                                onClick={() => document.getElementById('gallery-input').click()}
                            >
                                <input
                                    type="file"
                                    id="gallery-input"
                                    multiple
                                    accept="image/*"
                                    onChange={handleGalleryDrop}
                                    className="hidden"
                                />
                                <FaCloudUploadAlt className="mx-auto text-4xl mb-2 text-gray-400" />
                                <p className="text-gray-600">
                                    Drag and drop images here or click to select files
                                </p>
                                <p className="text-sm text-gray-400 mt-1">
                                    Only image files are accepted
                                </p>
                            </div>

                            {formData.gallery.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {formData.gallery.map((file, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={`Gallery image ${index + 1}`}
                                                className="w-full h-32 object-cover rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeGalleryImage(index)}
                                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <FaTimes size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Courses */}
                    {renderSection("Courses", (
                        <div className="space-y-6">
                            <button
                                type="button"
                                onClick={addCourse}
                                className="text-blue-500 hover:text-blue-700"
                            >
                                <FaPlus className="inline mr-1" /> Add Course
                            </button>

                            {formData.courses.map((course, courseIndex) => (
                                <div key={courseIndex} className="bg-white/10 p-4 rounded-lg space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-lg font-medium text-thead1">Course {courseIndex + 1}</h4>
                                        <button
                                            type="button"
                                            onClick={() => removeCourse(courseIndex)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>

                                    {renderField("Title",
                                        <input
                                            type="text"
                                            value={course.title}
                                            onChange={(e) => handleCourseChange(courseIndex, 'title', e.target.value)}
                                            className="w-full p-2 border rounded-lg bg-white"
                                            required
                                        />
                                    )}
                                    {renderField("Introduction",
                                        <input
                                            type="text"
                                            value={course.introDesc}
                                            onChange={(e) => handleCourseChange(courseIndex, 'introDesc', e.target.value)}
                                            className="w-full p-2 border rounded-lg bg-white"
                                            required
                                        />
                                    )}
                                    {renderField("Description",
                                        <textarea
                                            value={course.desc}
                                            onChange={(e) => handleCourseChange(courseIndex, 'desc', e.target.value)}
                                            className="w-full p-2 border rounded-lg bg-white"
                                            rows="3"
                                            required
                                        />
                                    )}
                                    {renderField("Duration (years)",
                                        <input
                                            type="number"
                                            value={course.duration}
                                            onChange={(e) => handleCourseChange(courseIndex, 'duration', e.target.value)}
                                            className="w-full p-2 border rounded-lg bg-white"
                                            required
                                        />
                                    )}
                                    {renderField("Semesters",
                                        <input
                                            type="number"
                                            value={course.semesters}
                                            onChange={(e) => handleCourseChange(courseIndex, 'semesters', e.target.value)}
                                            className="w-full p-2 border rounded-lg bg-white"
                                            required
                                        />
                                    )}
                                    {renderField("Rating",
                                        <input
                                            type="number"
                                            value={course.rating}
                                            onChange={(e) => handleCourseChange(courseIndex, 'rating', e.target.value)}
                                            min="0"
                                            max="5"
                                            step="0.1"
                                            className="w-full p-2 border rounded-lg bg-white"
                                            required
                                        />
                                    )}
                                    {renderField("Eligibility",
                                        <textarea
                                            value={course.eligibility}
                                            onChange={(e) => handleCourseChange(courseIndex, 'eligibility', e.target.value)}
                                            className="w-full p-2 border rounded-lg bg-white"
                                            rows="2"
                                            required
                                        />
                                    )}

                                    {/* Fee Structure */}
                                    <div className="bg-white/5 p-3 rounded-lg space-y-3">
                                        <h5 className="font-medium text-thead1">Fee Structure</h5>
                                        {renderField("Fee per Semester",
                                            <input
                                                type="number"
                                                value={course.feeStructure.feePerSemester}
                                                onChange={(e) => handleCourseChange(courseIndex, 'feeStructure', e.target.value, 'feePerSemester')}
                                                className="w-full p-2 border rounded-lg bg-white"
                                                required
                                            />
                                        )}
                                    </div>

                                    {/* Scholarships */}
                                    <div className="bg-white/5 p-3 rounded-lg space-y-3">
                                        <div className="flex justify-between items-center">
                                            <h5 className="font-medium text-thead1">Scholarships</h5>
                                            <button
                                                type="button"
                                                onClick={() => addScholarship(courseIndex)}
                                                className="text-blue-500 hover:text-blue-700"
                                            >
                                                <FaPlus className="inline mr-1" /> Add Scholarship
                                            </button>
                                        </div>

                                        {course.scholarships.map((scholarship, scholarshipIndex) => (
                                            <div key={scholarshipIndex} className="bg-white/5 p-3 rounded-lg space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <h6 className="font-medium text-thead1">Scholarship {scholarshipIndex + 1}</h6>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeScholarship(courseIndex, scholarshipIndex)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </div>

                                                {renderField("Name",
                                                    <input
                                                        type="text"
                                                        value={scholarship.name}
                                                        onChange={(e) => handleScholarshipChange(courseIndex, scholarshipIndex, 'name', e.target.value)}
                                                        className="w-full p-2 border rounded-lg bg-white"
                                                        required
                                                    />
                                                )}
                                                {renderField("Eligibility Criteria",
                                                    <textarea
                                                        value={scholarship.eligibilityCriteria}
                                                        onChange={(e) => handleScholarshipChange(courseIndex, scholarshipIndex, 'eligibilityCriteria', e.target.value)}
                                                        className="w-full p-2 border rounded-lg bg-white"
                                                        rows="2"
                                                        required
                                                    />
                                                )}
                                                {renderField("Benefit",
                                                    <input
                                                        type="text"
                                                        value={scholarship.benefit}
                                                        onChange={(e) => handleScholarshipChange(courseIndex, scholarshipIndex, 'benefit', e.target.value)}
                                                        className="w-full p-2 border rounded-lg bg-white"
                                                        required
                                                    />
                                                )}
                                                {renderField("How to Apply",
                                                    <textarea
                                                        value={scholarship.howToApply}
                                                        onChange={(e) => handleScholarshipChange(courseIndex, scholarshipIndex, 'howToApply', e.target.value)}
                                                        className="w-full p-2 border rounded-lg bg-white"
                                                        rows="2"
                                                        required
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AddCollegeForm 