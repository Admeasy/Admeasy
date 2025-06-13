import { FaTimes, FaPlus, FaCloudUploadAlt } from 'react-icons/fa'
import { useState, useEffect } from 'react'

// Tag component for keywords
const Tag = ({ text, onRemove }) => (
    <span className="inline-flex items-center bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full mr-2 mb-2">
        {text}
        <button
            onClick={onRemove}
            className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
        >
            <FaTimes size={12} />
        </button>
    </span>
);

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
    keywords: [],
    facilities: [],
    whyChoose: [],
    recruiters: [],
    placementRate: '',
    gallery: [],
    package: {
        average: '',
        highest: ''
    },
    courses: [{
        title: '',
        introDesc: '',
        desc: '',
        duration: '',
        semesters: '',
        rating: 0,
        eligibility: [{
            criteria: ''
        }],
        feeStructure: {
            feePerSemester: '',
            additionals: []
        },
        scholarships: [{
            name: '',
            eligibilityCriteria: '',
            benefit: '',
            howToApply: ''
        }]
    }],
    moreInfo: []
}

const AddCollegeForm = ({ onClose, onSubmit, editData = null }) => {
    const [formData, setFormData] = useState(initialFormState)
    const [dragActive, setDragActive] = useState(false)
    const [existingGalleryUrls, setExistingGalleryUrls] = useState([])
    const [newKeyword, setNewKeyword] = useState('')
    const [courseChangeTimer, setCourseChangeTimer] = useState(null)

    // Function to generate keywords from college data
    const generateKeywords = (data) => {
        const keywords = new Set(); // Using Set to avoid duplicates

        // Add location
        if (data.location) {
            keywords.add(data.location);
            // Add state/city separately if location contains comma
            const locationParts = data.location.split(',').map(part => part.trim());
            locationParts.forEach(part => keywords.add(part));
        }

        // Add college type
        if (data.type) {
            keywords.add(data.type + ' College');
            keywords.add(data.type + ' Institution');
        }

        // Add package related keywords
        if (data.package.average) {
            keywords.add(`${data.package.average} Average Package`);
        }
        if (data.package.highest) {
            keywords.add(`${data.package.highest} Highest Package`);
        }

        // Add placement rate
        if (data.placementRate) {
            keywords.add(`${data.placementRate} Placement Rate`);
        }

        // Add course related keywords - only add complete course information
        data.courses.forEach(course => {
            if (course.title && course.title.trim()) {
                // Only add course keywords if the title is properly set
                keywords.add(course.title.trim());
                keywords.add(course.title.trim() + ' Course');
                
                if (course.duration && course.duration.toString().trim()) {
                    keywords.add(`${course.duration} Year ${course.title} Course`);
                }
                
                // Add fee-related keywords only if they exist
                if (course.feeStructure.feePerSemester) {
                    keywords.add(`${course.title} - ${course.feeStructure.feePerSemester} per semester`);
                }
            }
        });

        // Add facilities
        data.facilities.forEach(facility => {
            if (facility.trim()) keywords.add(facility);
        });

        // Add recruiters
        data.recruiters.forEach(recruiter => {
            if (recruiter.trim()) {
                keywords.add(recruiter);
                keywords.add(recruiter + ' Recruitment');
            }
        });

        // Add why choose reasons
        data.whyChoose.forEach(reason => {
            if (reason.trim()) keywords.add(reason);
        });

        // Convert Set back to array and filter out empty strings and incomplete entries
        return Array.from(keywords)
            .filter(keyword => keyword.trim() !== '' && !keyword.includes('undefined'));
    };

    useEffect(() => {
        if (editData) {
            // Handle gallery separately since we need to keep track of existing URLs
            const { gallery, ...restData } = editData;
            if (typeof gallery === 'string' && gallery) {
                setExistingGalleryUrls([gallery]);
            }
            
            setFormData({
                ...restData,
                gallery: []
            });
        }
    }, [editData]);

    // Effect to update keywords when relevant data changes, with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            const autoKeywords = generateKeywords(formData);
            setFormData(prev => ({
                ...prev,
                keywords: Array.from(new Set([...prev.keywords, ...autoKeywords]))
            }));
        }, 1000); // Wait for 1 second of no changes before updating keywords

        return () => clearTimeout(timer);
    }, [
        formData.location,
        formData.type,
        formData.package.average,
        formData.package.highest,
        formData.placementRate,
        formData.courses,
        formData.facilities,
        formData.recruiters,
        formData.whyChoose
    ]);

    const handleKeywordAdd = (e) => {
        e.preventDefault();
        if (newKeyword.trim()) {
            setFormData(prev => ({
                ...prev,
                keywords: [...new Set([...prev.keywords, newKeyword.trim()])]
            }));
            setNewKeyword('');
        }
    };

    const handleKeywordRemove = (keywordToRemove) => {
        setFormData(prev => ({
            ...prev,
            keywords: prev.keywords.filter(keyword => keyword !== keywordToRemove)
        }));
    };

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
        } else if (['facilities', 'recruiters', 'whyChoose'].includes(name)) {
            // Store the current input value
            const items = value.endsWith(';') ? 
                value.slice(0, -1).split(';').map(item => item.trim()).filter(item => item !== '') :
                value.split(';').map(item => item.trim()).filter(item => item !== '');

            setFormData(prev => ({
                ...prev,
                [`${name}Input`]: value,
                [name]: items
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    }

    // Debounced course change handler
    const handleCourseChange = (courseIndex, field, value, subfield = null, additionalIndex = null) => {
        // Clear any existing timer
        if (courseChangeTimer) {
            clearTimeout(courseChangeTimer);
        }

        // Make the immediate UI update
        setFormData(prev => {
            const newCourses = [...prev.courses];
            if (subfield) {
                if (field === 'feeStructure' && subfield === 'additionals') {
                    const additionals = [...newCourses[courseIndex].feeStructure.additionals];
                    if (additionalIndex !== null) {
                        // Ensure proper structure for additional fees
                        if (typeof value === 'object') {
                            additionals[additionalIndex] = {
                                type: value.type,
                                amount: parseFloat(value.amount) || 0
                            };
                        }
                    }
                    newCourses[courseIndex].feeStructure.additionals = additionals;
                } else {
                    newCourses[courseIndex] = {
                        ...newCourses[courseIndex],
                        [field]: {
                            ...newCourses[courseIndex][field],
                            [subfield]: subfield === 'feePerSemester' ? parseFloat(value) || 0 : value
                        }
                    };
                }
            } else {
                newCourses[courseIndex] = {
                    ...newCourses[courseIndex],
                    [field]: field === 'rating' ? parseFloat(value) || 0 : value
                };
            }
            return {
                ...prev,
                courses: newCourses
            };
        });

        // Set a new timer for keyword generation
        const newTimer = setTimeout(() => {
            setFormData(prev => {
                const autoKeywords = generateKeywords(prev);
                return {
                    ...prev,
                    keywords: Array.from(new Set([...prev.keywords, ...autoKeywords]))
                };
            });
        }, 1500); // 1.5 seconds delay

        setCourseChangeTimer(newTimer);
    };

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
                eligibility: [],
                feeStructure: {
                    feePerSemester: '',
                    additionals: []
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

    const addAdditionalFee = (courseIndex) => {
        setFormData(prev => {
            const newCourses = [...prev.courses];
            newCourses[courseIndex].feeStructure.additionals.push({
                type: '',
                amount: 0
            });
            return {
                ...prev,
                courses: newCourses
            };
        });
    }

    const removeAdditionalFee = (courseIndex, additionalIndex) => {
        setFormData(prev => {
            const newCourses = [...prev.courses];
            newCourses[courseIndex].feeStructure.additionals = 
                newCourses[courseIndex].feeStructure.additionals.filter((_, i) => i !== additionalIndex);
            return {
                ...prev,
                courses: newCourses
            };
        });
    }

    const addMoreInfo = () => {
        setFormData(prev => ({
            ...prev,
            moreInfo: [...prev.moreInfo, { title: '', content: '' }]
        }));
    }

    const removeMoreInfo = (index) => {
        setFormData(prev => ({
            ...prev,
            moreInfo: prev.moreInfo.filter((_, i) => i !== index)
        }));
    }

    const handleMoreInfoChange = (index, field, value) => {
        setFormData(prev => {
            const newMoreInfo = [...prev.moreInfo];
            newMoreInfo[index] = {
                ...newMoreInfo[index],
                [field]: value
            };
            return {
                ...prev,
                moreInfo: newMoreInfo
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
        
        // Create FormData object for multipart/form-data submission
        const submitData = new FormData();
        
        // Add all form fields
        Object.keys(formData).forEach(key => {
            if (key === 'gallery') {
                // Add each gallery file
                formData.gallery.forEach(file => {
                    submitData.append('gallery', file);
                });
            } else if (key === 'moreInfo') {
                // Ensure moreInfo is properly formatted
                const validMoreInfo = formData.moreInfo.filter(info => info.title && info.content);
                submitData.append('moreInfo', JSON.stringify(validMoreInfo));
            } else if (typeof formData[key] === 'object') {
                // Stringify nested objects
                submitData.append(key, JSON.stringify(formData[key]));
            } else {
                submitData.append(key, formData[key]);
            }
        });

        // If we're editing and have an existing gallery URL, pass it along
        if (existingGalleryUrls.length > 0) {
            submitData.append('existingGallery', existingGalleryUrls[0]);
        }

        onSubmit(submitData, editData?._id);
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

    const addEligibilityCriteria = (courseIndex) => {
        setFormData(prev => {
            const newCourses = [...prev.courses];
            if (!Array.isArray(newCourses[courseIndex].eligibility)) {
                newCourses[courseIndex].eligibility = [];
            }
            newCourses[courseIndex].eligibility.push('');
            return {
                ...prev,
                courses: newCourses
            };
        });
    }

    const removeEligibilityCriteria = (courseIndex, criteriaIndex) => {
        setFormData(prev => {
            const newCourses = [...prev.courses];
            newCourses[courseIndex].eligibility = newCourses[courseIndex].eligibility
                .filter((_, i) => i !== criteriaIndex);
            return {
                ...prev,
                courses: newCourses
            };
        });
    }

    const handleEligibilityChange = (courseIndex, criteriaIndex, value) => {
        setFormData(prev => {
            const newCourses = [...prev.courses];
            if (!Array.isArray(newCourses[courseIndex].eligibility)) {
                newCourses[courseIndex].eligibility = [];
            }
            newCourses[courseIndex].eligibility[criteriaIndex] = value;
            return {
                ...prev,
                courses: newCourses
            };
        });
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-primary rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="w-fit h-fit m-0 p-0 mx-auto text-2xl text-center font-bold text-thead1">
                        {editData ? 'Edit College' : 'Add New College'}
                    </h2>
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
                    {['facilities', 'recruiters', 'whyChoose'].map((field) => (
                        renderSection(field.charAt(0).toUpperCase() + field.slice(1), (
                            <div key={field}>
                                {renderField(`${field.charAt(0).toUpperCase() + field.slice(1)} (separate with semicolons)`,
                                    <input
                                        type="text"
                                        name={field}
                                        value={formData[`${field}Input`] !== undefined ? formData[`${field}Input`] : formData[field].join('; ')}
                                        onChange={handleFormChange}
                                        placeholder={`Enter ${field} (separate them with a semicolon)`}
                                        className="w-full p-2 border rounded-lg bg-white"
                                        required
                                    />
                                )}
                                <p className="text-sm text-gray-400 mt-1">
                                    Enter {field} separated by semicolons (;)
                                </p>
                                {/* Preview of current items */}
                                <div className="mt-2">
                                    {formData[field].map((item, index) => (
                                        <span 
                                            key={index}
                                            className="inline-block bg-gray-100 text-gray-800 text-sm px-2 py-1 rounded mr-2 mb-2"
                                        >
                                            {item}
                                        </span>
                                    ))}
                                </div>
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

                            {/* Display existing gallery folder URL if available */}
                            {existingGalleryUrls.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-medium text-thead1 mb-2">Existing Gallery</h4>
                                    <div className="bg-white/5 p-3 rounded-lg">
                                        <p className="text-sm text-gray-600 break-all">
                                            {existingGalleryUrls[0]}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Display new images to be uploaded */}
                            {formData.gallery.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-thead1 mb-2">New Images to Upload</h4>
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
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Keywords Section */}
                    {renderSection("Keywords", (
                        <div className="space-y-4">
                            <div className="flex flex-wrap">
                                {formData.keywords.map((keyword, index) => (
                                    <Tag
                                        key={index}
                                        text={keyword}
                                        onRemove={() => handleKeywordRemove(keyword)}
                                    />
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newKeyword}
                                    onChange={(e) => setNewKeyword(e.target.value)}
                                    placeholder="Add a custom keyword"
                                    className="flex-1 p-2 border rounded-lg bg-white"
                                />
                                <button
                                    type="button"
                                    onClick={handleKeywordAdd}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                            <p className="text-sm text-gray-400">
                                Keywords are automatically generated based on college information. You can also add custom keywords.
                            </p>
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
                                        <div className="bg-white/5 p-3 rounded-lg space-y-3">
                                            <div className="flex justify-between items-center">
                                                <h5 className="font-medium text-thead1">Eligibility Criteria</h5>
                                                <button
                                                    type="button"
                                                    onClick={() => addEligibilityCriteria(courseIndex)}
                                                    className="text-blue-500 hover:text-blue-700"
                                                >
                                                    <FaPlus className="inline mr-1" /> Add Criteria
                                                </button>
                                            </div>
                                            {Array.isArray(course.eligibility) && course.eligibility.map((criteria, criteriaIndex) => (
                                                <div key={criteriaIndex} className="flex gap-2 items-start">
                                                    <div className="flex-1">
                                                        <input
                                                            type="text"
                                                            value={criteria}
                                                            onChange={(e) => handleEligibilityChange(courseIndex, criteriaIndex, e.target.value)}
                                                            placeholder="Enter eligibility criteria"
                                                            className="w-full p-2 border rounded-lg bg-white"
                                                            required
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeEligibilityCriteria(courseIndex, criteriaIndex)}
                                                        className="text-red-500 hover:text-red-700 mt-2"
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
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

                                        {/* Additional Fees */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <h6 className="font-medium text-thead1">Additional Fees</h6>
                                                <button
                                                    type="button"
                                                    onClick={() => addAdditionalFee(courseIndex)}
                                                    className="text-blue-500 hover:text-blue-700"
                                                >
                                                    <FaPlus className="inline mr-1" /> Add Fee
                                                </button>
                                            </div>
                                            {course.feeStructure.additionals.map((additional, additionalIndex) => (
                                                <div key={additionalIndex} className="flex gap-2 items-start">
                                                    <div className="flex-1 space-y-2">
                                                        <input
                                                            type="text"
                                                            value={additional.type || ''}
                                                            onChange={(e) => handleCourseChange(
                                                                courseIndex,
                                                                'feeStructure',
                                                                { type: e.target.value, amount: additional.amount },
                                                                'additionals',
                                                                additionalIndex
                                                            )}
                                                            placeholder="Fee Type (e.g., Library Fee)"
                                                            className="w-full p-2 border rounded-lg bg-white"
                                                            required
                                                        />
                                                        <input
                                                            type="number"
                                                            value={additional.amount || ''}
                                                            onChange={(e) => handleCourseChange(
                                                                courseIndex,
                                                                'feeStructure',
                                                                { type: additional.type, amount: e.target.value },
                                                                'additionals',
                                                                additionalIndex
                                                            )}
                                                            placeholder="Amount"
                                                            className="w-full p-2 border rounded-lg bg-white"
                                                            required
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeAdditionalFee(courseIndex, additionalIndex)}
                                                        className="text-red-500 hover:text-red-700 mt-2"
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
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

                    {/* More Information */}
                    {renderSection("More Information", (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h5 className="font-medium text-thead1">Additional College Information</h5>
                                <button
                                    type="button"
                                    onClick={addMoreInfo}
                                    className="text-blue-500 hover:text-blue-700"
                                >
                                    <FaPlus className="inline mr-1" /> Add Info
                                </button>
                            </div>
                            {formData.moreInfo.map((info, index) => (
                                <div key={index} className="bg-white/5 p-3 rounded-lg space-y-3">
                                    <div className="flex justify-between items-center">
                                        <h6 className="font-medium text-thead1">Information {index + 1}</h6>
                                        <button
                                            type="button"
                                            onClick={() => removeMoreInfo(index)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <input
                                            type="text"
                                            value={info.title || ''}
                                            onChange={(e) => handleMoreInfoChange(index, 'title', e.target.value)}
                                            placeholder="Title (e.g., Admission Process, Campus Life)"
                                            className="w-full p-2 border rounded-lg bg-white"
                                            required
                                        />
                                        <textarea
                                            value={info.content || ''}
                                            onChange={(e) => handleMoreInfoChange(index, 'content', e.target.value)}
                                            placeholder="Content"
                                            className="w-full p-2 border rounded-lg bg-white"
                                            rows="3"
                                            required
                                        />
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
                            {editData ? 'Save Changes' : 'Submit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AddCollegeForm