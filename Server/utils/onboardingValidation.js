const User = require('../models/userSchema');

/**
 * Define required onboarding fields based on education type
 * @param {Object} user - User object
 * @returns {Object} - Validation result with missing fields
 */
const validateOnboardingCompletion = (user) => {
    const missingFields = [];
    const errors = [];

    // Core required fields (always required)
    if (!user.name || user.name.trim() === '') {
        missingFields.push('name');
        errors.push('Name is required');
    }



    if (!user.city || user.city.trim() === '') {
        missingFields.push('city');
        errors.push('City is required');
    }

    if (!user.phone) {
        missingFields.push('phone');
        errors.push('Phone number is required');
    }

    if (!user.username || user.username.trim() === '') {
        missingFields.push('username');
        errors.push('Username is required');
    }

    if (!user.educationType || !['school', 'college'].includes(user.educationType)) {
        missingFields.push('educationType');
        errors.push('Education type (school or college) is required');
    }

    // Education type specific requirements
    if (user.educationType === 'school') {

        if (!user.class || user.class.trim() === '') {
            missingFields.push('class');
            errors.push('Class is required');
        }
        if (!user.board || user.board.trim() === '') {
            missingFields.push('board');
            errors.push('Board is required');
        }
    } else if (user.educationType === 'college') {
        if (!user.universityName || user.universityName.trim() === '') {
            missingFields.push('universityName');
            errors.push('University name is required');
        }
        if (!user.courseDetails || user.courseDetails.trim() === '') {
            missingFields.push('courseDetails');
            errors.push('Course details are required');
        }
    }

    // Optional but recommended fields
    const recommendedFields = [];
    if (!user.examsPreparingFor || user.examsPreparingFor.length === 0) {
        recommendedFields.push('examsPreparingFor');
    }
    if (!user.reasonForAdmeasy || user.reasonForAdmeasy.trim() === '') {
        recommendedFields.push('reasonForAdmeasy');
    }

    const isComplete = missingFields.length === 0;
    const hasRecommendedFields = recommendedFields.length === 0;

    return {
        isComplete,
        hasCompletedOnboarding: user.hasCompletedOnboarding || false,
        missingFields,
        recommendedFields,
        errors,
        hasRecommendedFields
    };
};

/**
 * Check if user has completed mandatory onboarding
 * @param {Object} user - User object from database
 * @returns {Object} - Validation result
 */
const checkOnboardingStatus = (user) => {
    if (!user) {
        return {
            isComplete: false,
            hasCompletedOnboarding: false,
            missingFields: [],
            errors: ['User not found'],
            requiresOnboarding: true
        };
    }

    // If hasCompletedOnboarding flag is true, consider it complete
    // But still validate required fields for data integrity
    const validation = validateOnboardingCompletion(user);

    return {
        ...validation,
        requiresOnboarding: user.hasCompletedOnboarding ? false : !validation.isComplete,
        userId: user._id
    };
};

module.exports = {
    validateOnboardingCompletion,
    checkOnboardingStatus
};
