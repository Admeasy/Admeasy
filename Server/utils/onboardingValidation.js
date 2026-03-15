const User = require('../models/userSchema');

/**
 * Define required onboarding fields based on education type
 * @param {Object} user - User object
 * @returns {Object} - Validation result with missing fields
 */
const validateOnboardingCompletion = (user) => {
    const missingFields = [];

    const errors = [];

    // Helper function to check if a string is empty
    const isEmpty = (val) => !val || (typeof val === 'string' && val.trim() === '');

    // Core required fields (always required)
    if (isEmpty(user.name)) {
        missingFields.push('name');
        errors.push('Name is required');
    }

    if (isEmpty(user.city)) {
        missingFields.push('city');
        errors.push('City is required');
    }

    if (!user.phone) {
        missingFields.push('phone');
        errors.push('Phone number is required');
    }

    if (isEmpty(user.username)) {
        missingFields.push('username');
        errors.push('Username is required');
    }

    if (isEmpty(user.educationType) || !['school', 'college'].includes(user.educationType)) {
        missingFields.push('educationType');
        errors.push('Education type (school or college) is required');
    }

    // Education type specific requirements
    if (user.educationType === 'school') {
        if (isEmpty(user.board)) {
            missingFields.push('board');
            errors.push('Board is required for school');
        }
        if (isEmpty(user.class)) {
            missingFields.push('class');
            errors.push('Class is required');
        }
        // Stream required only for Class 11th and 12th
        const needsStream = user.class === '11th' || user.class === '12th';
        if (needsStream && isEmpty(user.stream)) {
            missingFields.push('stream');
            errors.push('Stream is required for Class 11th and 12th');
        }
        // universityName is NOT required for school; allow null
    } else if (user.educationType === 'college') {
        if (isEmpty(user.universityName)) {
            missingFields.push('universityName');
            errors.push('University name is required for college students');
        }
        // courseLevel and courseDetails are optional for simplified onboarding
    }

    // Optional but recommended fields
    const recommendedFields = [];
    if (!user.examsPreparingFor || user.examsPreparingFor.length === 0) {
        recommendedFields.push('examsPreparingFor');
    }
    if (isEmpty(user.reasonForAdmeasy)) {
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
