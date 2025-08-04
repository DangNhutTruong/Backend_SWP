import API_CONFIG from '../config/apiConfig';

/**
 * News Service - Handles real news articles from external sources
 */
class NewsService {
    /**
     * Get smoking-related news articles from RSS feeds
     * @param {Object} params - Query parameters
     * @param {number} [params.limit=10] - Number of articles to fetch
     * @returns {Promise<Object>} News articles data
     */
    async getSmokingNews(params = {}) {
        try {
            const { limit = 10 } = params;
            
            console.log('🔍 Fetching smoking news from API...');
            // Gọi API backend để lấy tin tức từ RSS feeds
            const response = await fetch(`${API_CONFIG.baseUrl}/news/smoking?limit=${limit}`, {
                method: 'GET',
                headers: API_CONFIG.headers
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Successfully fetched smoking news from API:', data);
            return data;
        } catch (error) {
            console.error('❌ Error fetching smoking news from API:', error);
            console.log('🔄 Falling back to mock data...');
            // Fallback to mock data if API fails
            return this.getMockNews();
        }
    }

    /**
     * Get health-related news articles
     * @param {Object} params - Query parameters
     * @param {number} [params.limit=10] - Number of articles to fetch
     * @returns {Promise<Object>} News articles data
     */
    async getHealthNews(params = {}) {
        try {
            const { limit = 10 } = params;
            
            console.log('🔍 Fetching health news from API...');
            const response = await fetch(`${API_CONFIG.baseUrl}/news/health?limit=${limit}`, {
                method: 'GET',
                headers: API_CONFIG.headers
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Successfully fetched health news from API:', data);
            return data;
        } catch (error) {
            console.error('❌ Error fetching health news from API:', error);
            return this.getMockNews();
        }
    }

    /**
     * Search news by keyword
     * @param {string} keyword - Search keyword
     * @param {Object} params - Query parameters
     * @param {number} [params.limit=10] - Number of articles to fetch
     * @returns {Promise<Object>} News articles data
     */
    async searchNews(keyword, params = {}) {
        try {
            const { limit = 10 } = params;
            
            console.log('🔍 Searching news with keyword:', keyword);
            const response = await fetch(`${API_CONFIG.baseUrl}/news/search?q=${encodeURIComponent(keyword)}&limit=${limit}`, {
                method: 'GET',
                headers: API_CONFIG.headers
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Successfully searched news from API:', data);
            return data;
        } catch (error) {
            console.error('❌ Error searching news from API:', error);
            return this.getMockNews();
        }
    }

    /**
     * Get combined news from multiple sources with smoking news prioritized
     * @returns {Promise<Object>} Combined news articles
     */
    async getCombinedNews() {
        try {
            console.log('📰 getCombinedNews: Starting to fetch news...');
            console.log('📰 API Base URL:', API_CONFIG.baseUrl);
            
            // CHỈ lấy tin tức về thuốc lá từ API (đã có cache)
            const smokingNews = await this.getSmokingNews({ limit: 6 });
            
            console.log('📰 smokingNews response:', smokingNews);
            
            // Kiểm tra dữ liệu trả về
            if (!smokingNews.success || !smokingNews.data || smokingNews.data.length === 0) {
                console.log('⚠️ No real news data available, using mock data');
                return this.getMockNews();
            }

            console.log('✅ Found news data:', smokingNews.data.length, 'articles');
            console.log('📊 News source:', smokingNews.source || 'Unknown');

            // Sắp xếp theo ngày mới nhất
            const sortedArticles = smokingNews.data
                .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

            // Kiểm tra thêm một lần nữa xem bài viết có liên quan đến thuốc lá không
            const smokingKeywords = [
                'thuốc lá', 'hút thuốc', 'cai thuốc', 'nicotine',
                'khói thuốc', 'phổi', 'ung thư phổi', 'sức khỏe hô hấp',
                'cai nghiện', 'bỏ thuốc', 'thuốc lá điện tử', 'vape'
            ];

            const strictlySmokingRelated = sortedArticles.filter(article => {
                const title = (article.title || '').toLowerCase();
                const description = (article.description || '').toLowerCase();
                
                return smokingKeywords.some(keyword => 
                    title.includes(keyword) || description.includes(keyword)
                );
            });
            
            console.log('🔍 Filtered articles (smoking-related only):', strictlySmokingRelated.length);
            
            // Giới hạn số lượng bài viết là 6
            const finalArticles = strictlySmokingRelated.slice(0, 6);

            console.log('📰 Final articles to return:', finalArticles.length);

            return {
                success: true,
                data: finalArticles,
                total: finalArticles.length,
                source: smokingNews.source // Truyền thông tin nguồn
            };
        } catch (error) {
            console.error('❌ Error in getCombinedNews:', error);
            console.log('🔄 Falling back to mock data due to error');
            return this.getMockNews();
        }
    }

    /**
     * Get cache statistics
     * @returns {Promise<Object>} Cache statistics
     */
    async getCacheStats() {
        try {
            console.log('📊 Fetching cache statistics...');
            const response = await fetch(`${API_CONFIG.baseUrl}/news/cache/stats`, {
                method: 'GET',
                headers: API_CONFIG.headers
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Cache stats:', data);
            return data;
        } catch (error) {
            console.error('❌ Error fetching cache stats:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Refresh news cache
     * @returns {Promise<Object>} Refresh result
     */
    async refreshCache() {
        try {
            console.log('🔄 Refreshing news cache...');
            const response = await fetch(`${API_CONFIG.baseUrl}/news/cache/refresh`, {
                method: 'POST',
                headers: API_CONFIG.headers
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Cache refreshed:', data);
            return data;
        } catch (error) {
            console.error('❌ Error refreshing cache:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Fallback mock news data when API is unavailable - Chỉ bài về thuốc lá
     * @returns {Object} Mock news data
     */
    getMockNews() {
        const mockArticles = [
            {
                id: 'local-mock-1',
                title: 'Tin tức về thuốc lá đang được cập nhật',
                description: 'Hệ thống đang cập nhật tin tức mới nhất về thuốc lá từ các nguồn báo chí uy tín. Vui lòng quay lại sau.',
                url: '#',
                urlToImage: '/image/articles/e.jpg',
                publishedAt: new Date().toISOString(),
                source: {
                    name: 'Hệ thống'
                },
            },
            {
                id: 'local-mock-2',
                title: 'Đang tải tin tức từ VnExpress, Tuổi Trẻ, Thanh Niên',
                description: 'Chúng tôi đang thu thập tin tức mới nhất về tác hại thuốc lá và cách cai thuốc hiệu quả từ các trang báo uy tín.',
                url: '#',
                urlToImage: '/image/articles/r.jpg',
                publishedAt: new Date(Date.now() - 86400000).toISOString(),
                source: {
                    name: 'Hệ thống'
                },
            }
        ];

        return {
            success: true,
            data: mockArticles,
            total: mockArticles.length,
            source: 'Local fallback'
        };
    }

    /**
     * Handle API errors
     * @param {Error} error - The error object
     * @returns {Error} Formatted error
     */
    handleError(error) {
        if (error.response) {
            return new Error(error.response.data?.message || 'Lỗi server');
        } else if (error.request) {
            return new Error('Không thể kết nối đến server');
        } else {
            return new Error('Đã xảy ra lỗi không xác định');
        }
    }
}

export default new NewsService();
