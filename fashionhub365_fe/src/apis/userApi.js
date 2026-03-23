import axiosClient from './axiosClient';

/**
 * User API - Handle profile updates and user settings
 */
const userApi = {
    /**
     * Get current user profile
     */
    getProfile: () => {
        return axiosClient.get('/users/profile');
    },

    /**
     * Update user profile (includes avatar upload)
     * @param {FormData} formData - Contains full_name, phone, bio, gender, dob, avatar
     */
    updateProfile: (formData) => {
        return axiosClient.put('/users/profile', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    /**
     * Update basic account info (email, username - via /me patch)
     */
    updateMe: (data) => {
        return axiosClient.patch('/users/me', data);
    },
};

export default userApi;
