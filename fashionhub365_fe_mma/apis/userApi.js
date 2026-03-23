import axiosClient from './axiosClient';

const userApi = {
    /** Lấy thông tin profile chi tiết */
    getProfile: () => {
        return axiosClient.get('/users/profile');
    },

    /** Cập nhật thông tin profile (Hỗ trợ upload file nếu cần) */
    updateProfile: (data) => {
        return axiosClient.put('/users/profile', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }
};

export default userApi;
