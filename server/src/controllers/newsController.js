import RssParser from 'rss-parser';
import axios from 'axios';
import { decode } from 'html-entities';
import newsCache from '../services/newsCache.js';

/**
 * News Controller - Handles real news fetching from RSS feeds and APIs with caching
 */
class NewsController {
    constructor() {
        // Parser cho RSS thông thường (VnExpress, Tuổi Trẻ...)
        this.parser = new RssParser({
            customFields: {
                item: ['media:content', 'enclosure']
            },
            defaultRSS: 2.0,
            xml2js: {
                normalize: true,
                normalizeTags: false,
                explicitArray: false
            }
        });
        
        // Parser đơn giản cho Google News RSS
        this.googleNewsParser = new RssParser();
    }

    /**
     * Get smoking-related news from RSS feeds with caching fallback
     */
    async getSmokingNews(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const actualLimit = Math.min(6, limit); // Đảm bảo tối đa 6 bài

            console.log('🔍 Đang lấy tin tức về thuốc lá từ Google News...');
            
            // Thử lấy tin mới từ Google News trực tiếp
            console.log('📡 Đang crawl tin mới từ Google News...');
            const freshArticles = await this.crawlSmokingNews();
            
            if (freshArticles.length > 0) {
                // Lưu vào cache để backup
                newsCache.saveToCache('smoking', freshArticles);
                console.log(`✅ Lấy được ${freshArticles.length} bài mới từ Google News`);
                
                return res.json({
                    success: true,
                    data: freshArticles.slice(0, actualLimit),
                    total: freshArticles.length,
                    source: 'Google News (Fresh)'
                });
            }

            // Nếu không lấy được từ Google News, dùng cache
            console.log('⚠️ Không lấy được tin từ Google News, dùng cache...');
            const cachedArticles = newsCache.getSmokingNewsFromCache(actualLimit);
            
            if (cachedArticles.length > 0) {
                console.log(`✅ Trả về ${cachedArticles.length} bài từ cache`);
                return res.json({
                    success: true,
                    data: cachedArticles,
                    total: cachedArticles.length,
                    source: 'Cache (fallback)'
                });
            }

            // Cuối cùng mới thông báo không có tin
            console.log('❌ Không có tin tức khả dụng');
            return res.json({
                success: false,
                data: [],
                total: 0,
                message: 'Hiện tại không có tin tức về thuốc lá khả dụng. Vui lòng thử lại sau.'
            });

        } catch (error) {
            console.error('❌ Lỗi khi lấy tin tức thuốc lá:', error);
            
            // Thử lấy từ cache như fallback cuối cùng
            const cachedArticles = newsCache.getSmokingNewsFromCache(actualLimit);
            if (cachedArticles.length > 0) {
                return res.json({
                    success: true,
                    data: cachedArticles,
                    total: cachedArticles.length,
                    source: 'Cache (error fallback)'
                });
            }
            
            // Cuối cùng thông báo không có tin khả dụng
            return res.json({
                success: false,
                data: [],
                total: 0,
                message: 'Hiện tại không có tin tức về thuốc lá khả dụng. Vui lòng thử lại sau.'
            });
        }
    }

    /**
     * Crawl smoking news from RSS feeds
     * @returns {Array} Array of smoking-related articles
     */
    /**
     * Crawl smoking news from RSS feeds
     * @returns {Array} Array of smoking-related articles
     */
    async crawlSmokingNews() {
        try {
            // Chỉ lấy từ Google News RSS với từ khóa thuốc lá cụ thể
            const rssFeeds = [
                // Google News RSS feeds với từ khóa thuốc lá tiếng Việt (URL encoded)
                'https://news.google.com/rss/search?q=thu%E1%BB%91c%20l%C3%A1&hl=vi&gl=VN&ceid=VN:vi',
                'https://news.google.com/rss/search?q=h%C3%BAt%20thu%E1%BB%91c&hl=vi&gl=VN&ceid=VN:vi',
                'https://news.google.com/rss/search?q=cai%20thu%E1%BB%91c%20l%C3%A1&hl=vi&gl=VN&ceid=VN:vi',
                'https://news.google.com/rss/search?q=thu%E1%BB%91c%20l%C3%A1%20%C4%91i%E1%BB%87n%20t%E1%BB%AD&hl=vi&gl=VN&ceid=VN:vi'
            ];

            const allArticles = [];

            // Lấy tin tức từ Google News RSS feeds
            for (const feedUrl of rssFeeds) {
                try {
                    console.log(`📡 Parsing Google News RSS: ${feedUrl}`);
                    
                    // Dùng Google News parser
                    const feed = await this.googleNewsParser.parseURL(feedUrl);
                    
                    if (!feed || !feed.items || !Array.isArray(feed.items) || feed.items.length === 0) {
                        console.warn(`📭 Feed ${feedUrl} không có items`);
                        continue;
                    }
                    
                    console.log(`✅ Lấy được ${feed.items.length} bài từ Google News`);
                    
                    // Lấy tất cả bài từ Google News (đã được filter theo từ khóa)
                    const articlesToAdd = feed.items.map(item => this.formatArticle(item, 'smoking'));
                    allArticles.push(...articlesToAdd);
                    
                } catch (feedError) {
                    console.warn(`❌ Không thể lấy tin từ ${feedUrl}:`, feedError.message);
                }
            }

            // Loại bỏ duplicate và sắp xếp theo ngày mới nhất, chỉ lấy 6 bài
            const uniqueArticles = allArticles.filter((article, index, self) => 
                index === self.findIndex((a) => a.url === article.url || a.title === article.title)
            );
            
            const sortedArticles = uniqueArticles
                .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
                .slice(0, 6); // Chỉ lấy 6 bài mới nhất

            console.log(`✅ Tổng cộng lấy được ${sortedArticles.length} bài về thuốc lá từ Google News`);
            return sortedArticles;

        } catch (error) {
            console.error('❌ Lỗi khi crawl tin tức thuốc lá từ Google News:', error);
            return [];
        }
    }

    /**
     * Get health-related news from RSS feeds
     */
    async getHealthNews(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;

            const rssFeeds = [
                // RSS sức khỏe tổng quát đáng tin cậy
                'https://vnexpress.net/rss/suc-khoe.rss',
                'https://tuoitre.vn/rss/suc-khoe.rss',
                'https://thanhnien.vn/rss/suc-khoe.rss',
                'https://vietnamnet.vn/rss/suc-khoe.rss',
                'https://dantri.com.vn/rss/suc-khoe.rss'
            ];

            const allArticles = [];

            for (const feedUrl of rssFeeds) {
                try {
                    // Khai báo biến feed ở đầu để có thể truy cập từ bất kỳ đâu trong block
                    let feed;
                    
                    // Thử tải feed với Axios trước để xử lý trực tiếp XML
                    try {
                        const feedResponse = await axios.get(feedUrl, {
                            headers: {
                                'Accept': 'application/rss+xml, application/xml, text/xml',
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                            },
                            responseType: 'text',
                            timeout: 5000 // Timeout 5 giây
                        });
                        
                        // Đảm bảo XML được encode đúng cách
                        const xmlContent = feedResponse.data
                            .replace(/[\u00A0-\u9999<>&]/gim, function(i) {
                                return '&#'+i.charCodeAt(0)+';';
                            })
                            .replace(/&#60;/g, '<')
                            .replace(/&#62;/g, '>');
                            
                        // Parse XML đã được xử lý
                        feed = await this.parser.parseString(xmlContent);
                    } catch (xmlError) {
                        console.warn(`Không thể xử lý XML trực tiếp, dùng parseURL: ${xmlError.message}`);
                        // Fallback to standard parsing
                        feed = await this.parser.parseURL(feedUrl);
                    }
                    
                    const healthArticles = feed.items
                        .slice(0, 5) // Lấy 5 bài mới nhất từ mỗi nguồn
                        .map(item => this.formatArticle(item, 'health'));

                    allArticles.push(...healthArticles);
                } catch (feedError) {
                    console.warn(`Không thể lấy tin từ ${feedUrl}:`, feedError.message);
                }
            }

            const sortedArticles = allArticles
                .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
                .slice(0, limit);

            if (sortedArticles.length === 0) {
                return res.json({
                    success: false,
                    data: [],
                    total: 0,
                    message: 'Hiện tại không có tin tức sức khỏe khả dụng. Vui lòng thử lại sau.'
                });
            }

            res.json({
                success: true,
                data: sortedArticles,
                total: sortedArticles.length,
                source: 'RSS feeds'
            });

        } catch (error) {
            console.error('Lỗi khi lấy tin tức sức khỏe:', error);
            res.json({
                success: false,
                data: [],
                total: 0,
                message: 'Lỗi server khi lấy tin tức sức khỏe. Vui lòng thử lại sau.'
            });
        }
    }

    /**
     * Search news by keyword
     */
    async searchNews(req, res) {
        try {
            const keyword = req.query.q;
            const limit = parseInt(req.query.limit) || 10;

            if (!keyword) {
                return res.status(400).json({
                    success: false,
                    message: 'Từ khóa tìm kiếm không được để trống'
                });
            }

            // Tìm kiếm trong các RSS feeds sức khỏe
            const rssFeeds = [
                'https://vnexpress.net/rss/suc-khoe.rss',
                'https://tuoitre.vn/rss/suc-khoe.rss',
                'https://thanhnien.vn/rss/suc-khoe.rss',
                'https://vietnamnet.vn/rss/suc-khoe.rss',
                'https://dantri.com.vn/rss/suc-khoe.rss'
            ];

            const allArticles = [];

            for (const feedUrl of rssFeeds) {
                try {
                    // Khai báo biến feed ở đầu để có thể truy cập từ bất kỳ đâu trong block
                    let feed;
                    
                    // Thử tải feed với Axios trước để xử lý trực tiếp XML
                    try {
                        const feedResponse = await axios.get(feedUrl, {
                            headers: {
                                'Accept': 'application/rss+xml, application/xml, text/xml',
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                            },
                            responseType: 'text',
                            timeout: 5000 // Timeout 5 giây
                        });
                        
                        // Đảm bảo XML được encode đúng cách
                        const xmlContent = feedResponse.data
                            .replace(/[\u00A0-\u9999<>&]/gim, function(i) {
                                return '&#'+i.charCodeAt(0)+';';
                            })
                            .replace(/&#60;/g, '<')
                            .replace(/&#62;/g, '>');
                            
                        // Parse XML đã được xử lý
                        feed = await this.parser.parseString(xmlContent);
                    } catch (xmlError) {
                        console.warn(`Không thể xử lý XML trực tiếp, dùng parseURL: ${xmlError.message}`);
                        // Fallback to standard parsing
                        feed = await this.parser.parseURL(feedUrl);
                    }
                    
                    const matchingArticles = feed.items.filter(item => {
                        // Giải mã HTML entities trước khi tìm kiếm
                        const title = decode(item.title?.toLowerCase() || '');
                        const description = decode(item.contentSnippet?.toLowerCase() || '');
                        const searchKeyword = keyword.toLowerCase();
                        
                        return title.includes(searchKeyword) || description.includes(searchKeyword);
                    }).map(item => this.formatArticle(item, 'search'));

                    allArticles.push(...matchingArticles);
                } catch (feedError) {
                    console.warn(`Không thể tìm kiếm trong ${feedUrl}:`, feedError.message);
                }
            }

            const sortedArticles = allArticles
                .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
                .slice(0, limit);

            res.json({
                success: true,
                data: sortedArticles,
                total: sortedArticles.length,
                keyword: keyword,
                source: 'RSS search'
            });

        } catch (error) {
            console.error('Lỗi khi tìm kiếm tin tức:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi tìm kiếm tin tức'
            });
        }
    }

    /**
     * Format RSS item to standardized article format
     */
    formatArticle(item, category = 'general') {
        // Lấy hình ảnh từ RSS item với fallback tốt hơn
        let imageUrl = null;
        
        // Thử các nguồn hình ảnh khác nhau
        if (item['media:content'] && item['media:content'].$?.url) {
            imageUrl = item['media:content'].$.url;
        } else if (item.enclosure && item.enclosure.url) {
            imageUrl = item.enclosure.url;
        } else if (item.content && item.content.includes('<img')) {
            // Tìm URL hình ảnh trong content HTML
            const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
            if (imgMatch) {
                imageUrl = imgMatch[1];
            }
        } else if (item.description && item.description.includes('<img')) {
            // Tìm URL hình ảnh trong description HTML
            const imgMatch = item.description.match(/<img[^>]+src="([^">]+)"/);
            if (imgMatch) {
                imageUrl = imgMatch[1];
            }
        }
        
        // Sử dụng hình mặc định nếu không tìm được hình
        if (!imageUrl) {
            // Random hình ảnh mặc định liên quan đến thuốc lá
            const defaultImages = [
                '/image/articles/e.jpg',
                '/image/articles/r.jpg',
                '/image/articles/th.jpg',
                '/image/articles/c.jpg',
                '/image/articles/d.jpg',
                '/image/articles/nm.png'
            ];
            imageUrl = defaultImages[Math.floor(Math.random() * defaultImages.length)];
        }

        // Hàm giải mã các HTML entities trong văn bản
        const decodeHtmlEntities = (text) => {
            if (!text) return '';
            try {
                // Sử dụng thư viện html-entities để decode
                return decode(text, { level: 'html5' });
            } catch (e) {
                console.error('Lỗi khi giải mã HTML entities:', e);
                return text; // Trả về văn bản gốc nếu có lỗi
            }
        };

        // Hàm loại bỏ các thẻ HTML
        const stripHtml = (html) => {
            if (!html) return '';
            return html
                .replace(/<\/?[^>]+(>|$)/g, ' ') // Loại bỏ các thẻ HTML
                .replace(/\s+/g, ' ')            // Giảm khoảng trắng liên tiếp thành một
                .trim();                          // Loại bỏ khoảng trắng đầu và cuối
        };

        // Áp dụng giải mã và làm sạch cho title và description
        const title = decodeHtmlEntities(item.title) || 'Tiêu đề không có';
        
        // Ưu tiên contentSnippet vì nó thường đã được tách khỏi HTML
        let cleanDescription = item.contentSnippet || stripHtml(item.content) || stripHtml(item.description) || '';
        const description = decodeHtmlEntities(cleanDescription) || 'Mô tả không có';
        
        // Tạo đoạn trích ngắn gọn
        const excerpt = description.length > 200 ? 
            description.substring(0, 200).trim() + '...' : 
            description;

        return {
            id: `rss-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: title,
            description: description,
            excerpt: excerpt,
            url: item.link || '#',
            urlToImage: imageUrl,
            publishedAt: item.pubDate || new Date().toISOString(),
            source: {
                name: this.extractSourceName(item.link || '')
            },
            author: item.creator || item.author || 'Tác giả không rõ',
            category: category,
            views: Math.floor(Math.random() * 10000) + 1000,
            likes: Math.floor(Math.random() * 500) + 50,
            comments: Math.floor(Math.random() * 100) + 10
        };
    }

    /**
     * Extract source name from URL
     */
    extractSourceName(url) {
        try {
            const hostname = new URL(url).hostname;
            if (hostname.includes('vnexpress')) return 'VnExpress';
            if (hostname.includes('tuoitre')) return 'Tuổi Trẻ';
            if (hostname.includes('thanhnien')) return 'Thanh Niên';
            if (hostname.includes('vietnamnet')) return 'VietNamNet';
            if (hostname.includes('dantri')) return 'Dân Trí';
            if (hostname.includes('suckhoedoisong')) return 'Sức khỏe & Đời sống';
            if (hostname.includes('news.google.com')) return 'Google News';
            if (hostname.includes('laodong')) return 'Lao Động';
            if (hostname.includes('baomoi')) return 'Báo Mới';
            if (hostname.includes('zing')) return 'Zing News';
            return hostname;
        } catch {
            return 'Nguồn không rõ';
        }
    }

    /**
     * Get cache statistics
     */
    async getCacheStats(req, res) {
        try {
            const stats = newsCache.getCacheStats();
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Lỗi khi lấy thống kê cache:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi lấy thống kê cache'
            });
        }
    }

    /**
     * Force refresh cache
     */
    async refreshCache(req, res) {
        try {
            console.log('🔄 Đang làm mới cache...');
            
            // Crawl tin mới về thuốc lá
            const smokingArticles = await this.crawlSmokingNews();
            if (smokingArticles.length > 0) {
                newsCache.saveToCache('smoking', smokingArticles);
                console.log(`✅ Đã cập nhật ${smokingArticles.length} bài về thuốc lá vào cache`);
            }

            // Lấy thống kê mới
            const stats = newsCache.getCacheStats();
            
            res.json({
                success: true,
                message: 'Cache đã được làm mới',
                data: {
                    crawled: smokingArticles.length,
                    stats: stats
                }
            });
        } catch (error) {
            console.error('Lỗi khi làm mới cache:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi làm mới cache'
            });
        }
    }

    /**
     * Seed cache with sample articles (for testing)
     */
    async seedCache(req, res) {
        try {
            console.log('🌱 Đang seed cache với tin mẫu...');
            
            // Tạo tin mẫu giống như tin thật từ RSS
            const sampleArticles = [
                {
                    id: 'rss-sample-1',
                    title: 'VnExpress: Thuốc lá điện tử gây tổn hại phổi nghiêm trọng hơn thuốc lá thường',
                    description: 'Nghiên cứu mới từ Đại học Stanford cho thấy thuốc lá điện tử có thể gây viêm phổi cấp tính và tổn thương niêm mạc đường hô hấp nhanh hơn thuốc lá truyền thống.',
                    excerpt: 'Nghiên cứu mới từ Đại học Stanford cho thấy thuốc lá điện tử có thể gây viêm phổi cấp tính...',
                    url: 'https://vnexpress.net/thuoc-la-dien-tu-gay-ton-hai-phoi-nghiem-trong-4520123.html',
                    urlToImage: '/image/articles/e.jpg',
                    publishedAt: new Date(Date.now() - 3600000).toISOString(), // 1 giờ trước
                    source: { name: 'VnExpress' },
                    author: 'BS. Nguyễn Minh Hạnh',
                    category: 'smoking',
                    views: 15234,
                    likes: 987,
                    comments: 156
                },
                {
                    id: 'rss-sample-2',
                    title: 'Tuổi Trẻ: Cai thuốc lá thành công nhờ liệu pháp tâm lý nhận thức',
                    description: 'Bệnh viện Bạch Mai áp dụng liệu pháp tâm lý nhận thức giúp 85% bệnh nhân cai thuốc lá thành công trong vòng 6 tháng.',
                    excerpt: 'Bệnh viện Bạch Mai áp dụng liệu pháp tâm lý nhận thức giúp 85% bệnh nhân cai thuốc lá thành công...',
                    url: 'https://tuoitre.vn/cai-thuoc-la-thanh-cong-nho-lieu-phap-tam-ly-nhan-thuc-2024080412345.htm',
                    urlToImage: '/image/articles/r.jpg',
                    publishedAt: new Date(Date.now() - 7200000).toISOString(), // 2 giờ trước
                    source: { name: 'Tuổi Trẻ' },
                    author: 'PGS.TS. Vũ Thành Công',
                    category: 'smoking',
                    views: 12876,
                    likes: 654,
                    comments: 89
                },
                {
                    id: 'rss-sample-3',
                    title: 'Thanh Niên: Chính phủ tăng thuế thuốc lá lên 75% để giảm tỷ lệ hút thuốc',
                    description: 'Quốc hội thông qua đề xuất tăng thuế thuốc lá từ 65% lên 75%, dự kiến giảm 20% người hút thuốc trong 2 năm tới.',
                    excerpt: 'Quốc hội thông qua đề xuất tăng thuế thuốc lá từ 65% lên 75%, dự kiến giảm 20% người hút thuốc...',
                    url: 'https://thanhnien.vn/chinh-phu-tang-thue-thuoc-la-len-75-de-giam-ty-le-hut-thuoc-185240804.html',
                    urlToImage: '/image/articles/th.jpg',
                    publishedAt: new Date(Date.now() - 10800000).toISOString(), // 3 giờ trước
                    source: { name: 'Thanh Niên' },
                    author: 'Phóng viên Hồng Loan',
                    category: 'smoking',
                    views: 18956,
                    likes: 1205,
                    comments: 234
                },
                {
                    id: 'rss-sample-4',
                    title: 'VnExpress: Nghiên cứu về tác hại của khói thuốc thụ động đối với trẻ em',
                    description: 'Viện Sức khỏe Trẻ em công bố nghiên cứu cho thấy khói thuốc thụ động làm tăng 40% nguy cơ hen suyễn ở trẻ dưới 5 tuổi.',
                    excerpt: 'Viện Sức khỏe Trẻ em công bố nghiên cứu cho thấy khói thuốc thụ động làm tăng 40% nguy cơ hen suyễn...',
                    url: 'https://vnexpress.net/nghien-cuu-ve-tac-hai-cua-khoi-thuoc-thu-dong-4520987.html',
                    urlToImage: '/image/articles/c.jpg',
                    publishedAt: new Date(Date.now() - 14400000).toISOString(), // 4 giờ trước
                    source: { name: 'VnExpress' },
                    author: 'BS. CKI Phạm Thị Lan',
                    category: 'smoking',
                    views: 9876,
                    likes: 543,
                    comments: 67
                },
                {
                    id: 'rss-sample-5',
                    title: 'Sức khỏe & Đời sống: Bộ Y tế khuyến cáo về tác hại của thuốc lá điện tử',
                    description: 'Bộ Y tế phát hành khuyến cáo mới về thuốc lá điện tử, cảnh báo nguy cơ nghiện nicotine cao và tác động xấu đến não bộ thanh thiếu niên.',
                    excerpt: 'Bộ Y tế phát hành khuyến cáo mới về thuốc lá điện tử, cảnh báo nguy cơ nghiện nicotine cao...',
                    url: 'https://suckhoedoisong.vn/bo-y-te-khuyen-cao-ve-tac-hai-cua-thuoc-la-dien-tu-n234567.htm',
                    urlToImage: '/image/articles/d.jpg',
                    publishedAt: new Date(Date.now() - 18000000).toISOString(), // 5 giờ trước
                    source: { name: 'Sức khỏe & Đời sống' },
                    author: 'Bác sĩ Nguyễn Văn Minh',
                    category: 'smoking',
                    views: 11234,
                    likes: 789,
                    comments: 112
                },
                {
                    id: 'rss-sample-6',
                    title: 'Tuổi Trẻ: Ứng dụng AI giúp theo dõi quá trình cai thuốc lá',
                    description: 'Startup Việt Nam phát triển ứng dụng sử dụng AI để theo dõi và hỗ trợ người dùng trong quá trình cai thuốc lá với tỷ lệ thành công 70%.',
                    excerpt: 'Startup Việt Nam phát triển ứng dụng sử dụng AI để theo dõi và hỗ trợ người dùng trong quá trình cai thuốc lá...',
                    url: 'https://tuoitre.vn/ung-dung-ai-giup-theo-doi-qua-trinh-cai-thuoc-la-2024080413456.htm',
                    urlToImage: '/image/articles/OIP.jpg',
                    publishedAt: new Date(Date.now() - 21600000).toISOString(), // 6 giờ trước
                    source: { name: 'Tuổi Trẻ' },
                    author: 'Kỹ sư Lê Hoàng Nam',
                    category: 'smoking',
                    views: 8765,
                    likes: 432,
                    comments: 78
                }
            ];

            // Lưu vào cache
            newsCache.saveToCache('smoking', sampleArticles);
            
            // Lấy thống kê mới
            const stats = newsCache.getCacheStats();
            
            res.json({
                success: true,
                message: 'Cache đã được seed với tin mẫu',
                data: {
                    seeded: sampleArticles.length,
                    stats: stats
                }
            });
        } catch (error) {
            console.error('Lỗi khi seed cache:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi seed cache'
            });
        }
    }
}

export default new NewsController();
