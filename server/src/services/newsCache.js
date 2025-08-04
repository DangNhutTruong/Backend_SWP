import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * News Cache Service - Lưu trữ và quản lý cache tin tức
 */
class NewsCache {
    constructor() {
        this.cacheDir = path.join(__dirname, '../../cache');
        this.smokingCacheFile = path.join(this.cacheDir, 'smoking-news.json');
        this.healthCacheFile = path.join(this.cacheDir, 'health-news.json');
        
        // Tạo thư mục cache nếu chưa có
        this.ensureCacheDir();
    }

    /**
     * Đảm bảo thư mục cache tồn tại
     */
    ensureCacheDir() {
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
    }

    /**
     * Lưu tin tức vào cache
     * @param {string} type - Loại tin tức ('smoking' hoặc 'health')
     * @param {Array} articles - Danh sách bài viết
     */
    saveToCache(type, articles) {
        try {
            const cacheFile = type === 'smoking' ? this.smokingCacheFile : this.healthCacheFile;
            
            // Đọc cache hiện tại
            let existingCache = this.readFromCache(type);
            
            // Kết hợp với bài mới, loại bỏ trùng lặp
            const allArticles = [...articles, ...existingCache.articles];
            const uniqueArticles = this.removeDuplicates(allArticles);
            
            // Chỉ giữ lại 100 bài mới nhất
            const sortedArticles = uniqueArticles
                .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
                .slice(0, 100);

            const cacheData = {
                lastUpdated: new Date().toISOString(),
                articles: sortedArticles,
                total: sortedArticles.length
            };

            fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2), 'utf8');
            console.log(`✅ Đã lưu ${sortedArticles.length} bài ${type} vào cache`);
            
            return true;
        } catch (error) {
            console.error(`❌ Lỗi khi lưu cache ${type}:`, error);
            return false;
        }
    }

    /**
     * Đọc tin tức từ cache
     * @param {string} type - Loại tin tức ('smoking' hoặc 'health')
     * @returns {Object} Dữ liệu cache
     */
    readFromCache(type) {
        try {
            const cacheFile = type === 'smoking' ? this.smokingCacheFile : this.healthCacheFile;
            
            if (!fs.existsSync(cacheFile)) {
                return { articles: [], total: 0, lastUpdated: null };
            }

            const cacheData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
            return cacheData;
        } catch (error) {
            console.error(`❌ Lỗi khi đọc cache ${type}:`, error);
            return { articles: [], total: 0, lastUpdated: null };
        }
    }

    /**
     * Lấy tin tức từ cache theo từ khóa thuốc lá
     * @param {number} limit - Số lượng bài cần lấy
     * @returns {Array} Danh sách bài viết về thuốc lá
     */
    getSmokingNewsFromCache(limit = 10) {
        const cache = this.readFromCache('smoking');
        
        if (cache.articles.length === 0) {
            return [];
        }

        // Lọc các bài liên quan đến thuốc lá
        const smokingKeywords = [
            'thuốc lá', 'hút thuốc', 'cai thuốc', 'nicotine', 
            'khói thuốc', 'phổi', 'ung thư phổi', 'sức khỏe hô hấp',
            'cai nghiện', 'bỏ thuốc', 'hút thuốc lá', 'thuốc lá điện tử',
            'vape', 'thuốc lào', 'shisha', 'hookah', 'thuốc lá thế hệ mới',
            'bệnh phổi', 'bệnh hô hấp', 'nghiện thuốc', 'tác hại thuốc lá',
            'hậu quả hút thuốc', 'sức khỏe phổi'
        ];

        const smokingArticles = cache.articles.filter(article => {
            const title = (article.title || '').toLowerCase();
            const description = (article.description || '').toLowerCase();
            
            return smokingKeywords.some(keyword => 
                title.includes(keyword) || description.includes(keyword)
            );
        });

        // Sắp xếp theo ngày và giới hạn số lượng
        return smokingArticles
            .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
            .slice(0, Math.min(limit, 6)); // Tối đa 6 bài
    }

    /**
     * Lấy tin tức sức khỏe từ cache
     * @param {number} limit - Số lượng bài cần lấy
     * @returns {Array} Danh sách bài viết sức khỏe
     */
    getHealthNewsFromCache(limit = 10) {
        const cache = this.readFromCache('health');
        
        return cache.articles
            .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
            .slice(0, limit);
    }

    /**
     * Kiểm tra cache có cũ không (quá 2 giờ)
     * @param {string} type - Loại tin tức
     * @returns {boolean} True nếu cache cũ hoặc không tồn tại
     */
    isCacheStale(type) {
        const cache = this.readFromCache(type);
        
        if (!cache.lastUpdated) {
            return true;
        }

        const cacheAge = Date.now() - new Date(cache.lastUpdated).getTime();
        const twoHours = 2 * 60 * 60 * 1000; // 2 giờ
        
        return cacheAge > twoHours;
    }

    /**
     * Loại bỏ bài viết trùng lặp
     * @param {Array} articles - Danh sách bài viết
     * @returns {Array} Danh sách không trùng lặp
     */
    removeDuplicates(articles) {
        const seen = new Set();
        return articles.filter(article => {
            // Sử dụng URL hoặc title làm key để phát hiện trùng lặp
            const key = article.url || article.title || article.id;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    /**
     * Xóa cache cũ
     * @param {string} type - Loại tin tức cần xóa cache
     */
    clearCache(type) {
        try {
            const cacheFile = type === 'smoking' ? this.smokingCacheFile : this.healthCacheFile;
            
            if (fs.existsSync(cacheFile)) {
                fs.unlinkSync(cacheFile);
                console.log(`✅ Đã xóa cache ${type}`);
            }
        } catch (error) {
            console.error(`❌ Lỗi khi xóa cache ${type}:`, error);
        }
    }

    /**
     * Lấy thống kê cache
     * @returns {Object} Thông tin thống kê
     */
    getCacheStats() {
        const smokingCache = this.readFromCache('smoking');
        const healthCache = this.readFromCache('health');

        return {
            smoking: {
                total: smokingCache.total,
                lastUpdated: smokingCache.lastUpdated,
                isStale: this.isCacheStale('smoking')
            },
            health: {
                total: healthCache.total,
                lastUpdated: healthCache.lastUpdated,
                isStale: this.isCacheStale('health')
            }
        };
    }
}

export default new NewsCache();
