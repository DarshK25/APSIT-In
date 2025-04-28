import axiosInstance from './axiosConfig';

export const createPost = async (postData) => {
    try {
        console.log('Creating post with data:', {
            content: postData.get('content'),
            hasImage: postData.has('image')
        }); // Debug log

        const response = await axiosInstance.post('/posts', postData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        console.log('Post creation response:', response.data); // Debug log
        return response.data;
    } catch (error) {
        console.error('Error creating post:', error.response || error);
        throw error.response?.data || error;
    }
};

export const getPost = async (postId) => {
    try {
        const response = await axiosInstance.get(`/posts/${postId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching post:', error.response || error);
        throw error.response?.data || error;
    }
};

export const getAllPosts = async () => {
    try {
        const response = await axiosInstance.get('/posts');
        return response.data;
    } catch (error) {
        console.error('Error fetching posts:', error.response || error);
        throw error.response?.data || error;
    }
};

export const updatePost = async (postId, postData) => {
    try {
        console.log('Updating post with data:', {
            postId,
            content: postData.get('content'),
            hasImage: postData.has('image')
        }); // Debug log

        const response = await axiosInstance.put(`/posts/${postId}`, postData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        console.log('Post update response:', response.data); // Debug log
        return response.data;
    } catch (error) {
        console.error('Error updating post:', error.response || error);
        throw error.response?.data || error;
    }
};

export const deletePost = async (postId) => {
    try {
        await axiosInstance.delete(`/posts/${postId}`);
    } catch (error) {
        console.error('Error deleting post:', error.response || error);
        throw error.response?.data || error;
    }
};

export const likePost = async (postId) => {
    try {
        const response = await axiosInstance.post(`/posts/${postId}/like`);
        return response.data;
    } catch (error) {
        console.error('Error liking post:', error.response || error);
        throw error.response?.data || error;
    }
};

export const sharePost = async (postId, connectionId) => {
    try {
        const response = await axiosInstance.post(`/posts/${postId}/share`, { connectionId });
        return response.data;
    } catch (error) {
        console.error('Error sharing post:', error.response || error);
        throw error.response?.data || error;
    }
}; 