import axiosInstance from './axiosClient';

const campaignApi = {
    // PUBLIC: Get active campaigns
    getActiveCampaigns(params) {
        return axiosInstance.get('/campaigns/active', { params });
    },

    // ADMIN: Get all campaigns
    getCampaigns(params) {
        return axiosInstance.get('/campaigns', { params });
    },

    // ADMIN: Get campaign by ID
    getCampaignById(id) {
        return axiosInstance.get(`/campaigns/${id}`);
    },

    // ADMIN: Create campaign
    createCampaign(data) {
        return axiosInstance.post('/campaigns', data);
    },

    // ADMIN: Update campaign
    updateCampaign(id, data) {
        return axiosInstance.put(`/campaigns/${id}`, data);
    },

    // ADMIN: Delete campaign
    deleteCampaign(id) {
        return axiosInstance.delete(`/campaigns/${id}`);
    }
};

export default campaignApi;
