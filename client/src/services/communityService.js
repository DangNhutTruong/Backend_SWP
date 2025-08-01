import api from '../utils/api';

/**
 * Community Service - Handles community posts API calls
 */
class CommunityService {
    /**
     * Get all community posts
     * @param {Object} params - Query parameters
     * @param {number} [params.page=1] - Page number
     * @param {number} [params.limit=20] - Posts per page
     * @returns {Promise<Object>} Posts data with pagination
     */
    async getAllPosts(params = {}) {
        try {
            const { page = 1, limit = 20 } = params;
            const queryString = new URLSearchParams({ page, limit }).toString();
            const response = await api.fetch(`/api/community/posts?${queryString}`, {
                method: 'GET'
            });
            return response;
        } catch (error) {
            console.error('Error fetching community posts:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Get a single post by ID
     * @param {number} id - Post ID
     * @returns {Promise<Object>} Post data
     */
    async getPostById(id) {
        try {
            const response = await api.fetch(`/api/community/posts/${id}`, {
                method: 'GET'
            });
            return response;
        } catch (error) {
            console.error('Error fetching post:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Create a new community post
     * @param {Object} postData - Post data
     * @param {string} postData.title - Post title
     * @param {string} postData.content - Post content
     * @param {string} [postData.thumbnail_url] - Post thumbnail URL
     * @returns {Promise<Object>} Created post data
     */
    async createPost(postData) {
        try {
            const response = await api.fetch('/api/community/posts', {
                method: 'POST',
                body: JSON.stringify(postData)
            });
            return response;
        } catch (error) {
            console.error('Error creating post:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Update a community post
     * @param {number} id - Post ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated post data
     */
    async updatePost(id, updateData) {
        try {
            const response = await api.fetch(`/api/community/posts/${id}`, {
                method: 'PUT',
                body: JSON.stringify(updateData)
            });
            return response;
        } catch (error) {
            console.error('Error updating post:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Delete a community post
     * @param {number} id - Post ID
     * @returns {Promise<Object>} Deletion result
     */
    async deletePost(id) {
        try {
            const response = await api.fetch(`/api/community/posts/${id}`, {
                method: 'DELETE'
            });
            return response;
        } catch (error) {
            console.error('Error deleting post:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Get current user's posts
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} User's posts
     */
    async getCurrentUserPosts(params = {}) {
        try {
            const { page = 1, limit = 20 } = params;
            const queryString = new URLSearchParams({ page, limit }).toString();
            const response = await api.fetch(`/api/community/my-posts?${queryString}`, {
                method: 'GET'
            });
            return response;
        } catch (error) {
            console.error('Error fetching user posts:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Handle API errors
     * @param {Error} error - API error
     * @returns {Error} Formatted error
     */
    handleError(error) {
        if (error.response) {
            // Server responded with error status
            const message = error.response.data?.message || 'Có lỗi xảy ra';
            const status = error.response.status;
            return new Error(`${message} (${status})`);
        } else if (error.request) {
            // Request was made but no response received
            return new Error('Không thể kết nối đến server');
        } else {
            // Something happened in setting up the request
            return new Error(error.message || 'Có lỗi xảy ra');
        }
    }
}

export default new CommunityService();
