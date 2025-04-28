import axiosInstance from './axiosConfig';

export const addComment = async (postId, content) => {
    try {
        const response = await axiosInstance.post(`/comments/posts/${postId}/comments`, { content });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const updateComment = async (commentId, content) => {
    try {
        const response = await axiosInstance.put(`/comments/${commentId}`, { content });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const deleteComment = async (commentId) => {
    try {
        const response = await axiosInstance.delete(`/comments/${commentId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const likeComment = async (commentId) => {
    try {
        const response = await axiosInstance.post(`/comments/${commentId}/like`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const createReply = async (commentId, { content }) => {
    try {
        const response = await axiosInstance.post(`/comments/${commentId}/replies`, { content });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const deleteReply = async (replyId) => {
    try {
        const response = await axiosInstance.delete(`/comments/replies/${replyId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const likeReply = async (replyId) => {
    try {
        const response = await axiosInstance.post(`/comments/replies/${replyId}/like`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
}; 

export const getCommentsByPostId = async (postId) => {
    try {
        const response = await axiosInstance.get(`/comments/posts/${postId}/comments`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};
