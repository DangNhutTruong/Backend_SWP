import api from '../utils/api';

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
            
            // Gọi API backend để lấy tin tức từ RSS feeds
            const response = await api.fetch(`/api/news/smoking?limit=${limit}`, {
                method: 'GET'
            });
            return response;
        } catch (error) {
            console.error('Error fetching news:', error);
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
            
            const response = await api.fetch(`/api/news/health?limit=${limit}`, {
                method: 'GET'
            });
            return response;
        } catch (error) {
            console.error('Error fetching health news:', error);
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
            
            const response = await api.fetch(`/api/news/search?q=${encodeURIComponent(keyword)}&limit=${limit}`, {
                method: 'GET'
            });
            return response;
        } catch (error) {
            console.error('Error searching news:', error);
            return this.getMockNews();
        }
    }

    /**
     * Get combined news from multiple sources with smoking news prioritized
     * @returns {Promise<Object>} Combined news articles
     */
    async getCombinedNews() {
        try {
            // CHỈ lấy tin tức về thuốc lá
            const smokingNews = await this.getSmokingNews({ limit: 10 }); // Lấy nhiều tin để có nhiều lựa chọn
            
            // Nếu không có tin tức về thuốc lá, sử dụng mock data
            if (!smokingNews.success || !smokingNews.data || smokingNews.data.length === 0) {
                return this.getMockNews();
            }

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
            
            // Giới hạn số lượng bài viết là 6
            const finalArticles = strictlySmokingRelated.slice(0, 6);

            return {
                success: true,
                data: finalArticles,
                total: finalArticles.length,
                message: `Hiển thị ${finalArticles.length} tin tức liên quan đến thuốc lá`
            };
        } catch (error) {
            console.error('Error fetching combined news:', error);
            return this.getMockNews();
        }
    }

    /**
     * Fallback mock news data when API is unavailable - Chỉ bài về thuốc lá
     * @returns {Object} Mock news data
     */
    getMockNews() {
        const mockArticles = [
            {
                id: 'mock-1',
                title: 'Các nước giảm tác hại thuốc lá thế nào',
                description: 'Tìm hiểu các chiến lược và chính sách hiệu quả của các quốc gia trên thế giới trong việc giảm thiểu tác hại từ thuốc lá.',
                url: 'https://vnexpress.net/cac-nuoc-giam-tac-hai-thuoc-la-the-nao-4328671.html',
                urlToImage: '/image/articles/e.jpg',
                publishedAt: new Date().toISOString(),
                source: {
                    name: 'VnExpress'
                },
            },
            {
                id: 'mock-2',
                title: 'Tọa đàm về giảm thiểu tác hại thuốc lá',
                description: 'Chuyên gia y tế thảo luận về những phương pháp tiên tiến nhất để giảm thiểu tác hại của thuốc lá đối với sức khỏe.',
                url: 'https://vnexpress.net/toa-dam-ve-giam-thieu-tac-hai-thuoc-la-4377440.html',
                urlToImage: '/image/articles/r.jpg',
                publishedAt: new Date(Date.now() - 86400000).toISOString(),
                source: {
                    name: 'VnExpress'
                },
            },
            {
                id: 'mock-3',
                title: 'Giải pháp giảm tác hại thuốc lá từ góc nhìn toàn cầu',
                description: 'Phân tích toàn diện về các giải pháp quốc tế trong cuộc chiến chống tác hại của thuốc lá và khói thuốc.',
                url: 'https://vnexpress.net/giai-phap-giam-tac-hai-thuoc-la-tu-goc-nhin-toan-cau-4551056.html',
                urlToImage: '/image/articles/OIP.jpg',
                publishedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
                source: {
                    name: 'VnExpress'
                },
            },
            {
                id: 'mock-4',
                title: 'Nhồi máu cơ tim bởi thói quen hút thuốc \'giảm căng thẳng\'',
                description: 'Cảnh báo về nguy cơ nhồi máu cơ tim ở những người có thói quen hút thuốc để giảm stress và căng thẳng.',
                url: 'https://vnexpress.net/nhoi-mau-co-tim-boi-thoi-quen-hut-thuoc-giam-cang-thang-4812409.html',
                urlToImage: '/image/articles/d.jpg',
                publishedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
                source: {
                    name: 'VnExpress'
                },
            },
            {
                id: 'mock-5',
                title: 'Mẹo bảo vệ phổi cho người đang cai thuốc lá',
                description: 'Hướng dẫn chi tiết các phương pháp hỗ trợ phục hồi và bảo vệ sức khỏe phổi trong quá trình cai thuốc lá.',
                url: 'https://vnexpress.net/meo-bao-ve-phoi-cho-nguoi-dang-cai-thuoc-la-4881240.html',
                urlToImage: '/image/articles/c.jpg',
                publishedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
                source: {
                    name: 'VnExpress'
                },
            },
            {
                id: 'mock-6',
                title: '6 triệu chứng thường gặp khi mới cai thuốc lá',
                description: 'Những dấu hiệu và triệu chứng phổ biến mà cơ thể thường trải qua trong giai đoạn đầu cai thuốc lá.',
                url: 'https://vnexpress.net/6-trieu-chung-thuong-gap-khi-moi-cai-thuoc-la-4893382.html',
                urlToImage: '/image/articles/th.jpg',
                publishedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
                source: {
                    name: 'VnExpress'
                },
            }
        ];

        return {
            success: true,
            data: mockArticles.slice(0, 6), // Đảm bảo tối đa 6 bài
            total: Math.min(mockArticles.length, 6),
            message: 'Dữ liệu mẫu về thuốc lá (API thực không khả dụng)'
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
