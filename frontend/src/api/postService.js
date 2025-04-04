import axiosInstance from './axiosConfig';

export const createPost = async (postData) => {
    try {
        const response = await axiosInstance.post('/posts', postData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const getPost = async (postId) => {
    try {
        const response = await axiosInstance.get(`/posts/${postId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const getAllPosts = async () => {
    try {
        const response = await axiosInstance.get('/posts');
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const updatePost = async (postId, postData) => {
    try {
        const response = await axiosInstance.put(`/posts/${postId}`, postData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const deletePost = async (postId) => {
    try {
        const response = await axiosInstance.delete(`/posts/${postId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const likePost = async (postId) => {
    try {
        const response = await axiosInstance.post(`/posts/${postId}/like`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const sharePost = async (postId) => {
    try {
        const response = await axiosInstance.post(`/posts/${postId}/share`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
}; 