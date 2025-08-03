import RssParser from 'rss-parser';
import axios from 'axios';
import { decode } from 'html-entities';

/**
 * News Controller - Handles real news fetching from RSS feeds and APIs
 */
class NewsController {
    constructor() {
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
    }

    /**
     * Get smoking-related news from RSS feeds
     */
    async getSmokingNews(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;

            // RSS feeds về thuốc lá và sức khỏe
            const rssFeeds = [
                'https://vnexpress.net/rss/suc-khoe.rss',
                'https://tuoitre.vn/rss/suc-khoe.rss',
                'https://thanhnien.vn/rss/suc-khoe.rss'
            ];

            const allArticles = [];

            // Lấy tin tức từ các RSS feeds
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
                    
                    // Lọc các bài viết liên quan đến thuốc lá với danh sách từ khóa phong phú hơn
                    const smokingKeywords = [
                        'thuốc lá', 'hút thuốc', 'cai thuốc', 'nicotine', 
                        'khói thuốc', 'phổi', 'ung thư phổi', 'sức khỏe hô hấp',
                        'cai nghiện', 'bỏ thuốc', 'hút thuốc lá', 'thuốc lá điện tử',
                        'vape', 'thuốc lào', 'shisha', 'hookah', 'thuốc lá thế hệ mới',
                        'bệnh phổi', 'bệnh hô hấp', 'nghiện thuốc', 'tác hại thuốc lá',
                        'hậu quả hút thuốc', 'sức khỏe phổi'
                    ];
                    
                    const smokingRelated = feed.items.filter(item => {
                        const title = item.title?.toLowerCase() || '';
                        const description = item.contentSnippet?.toLowerCase() || '';
                        const content = item.content?.toLowerCase() || '';
                        
                        // Kiểm tra xem bài viết có chứa các từ khóa liên quan đến thuốc lá không
                        return smokingKeywords.some(keyword => 
                            title.includes(keyword) || 
                            description.includes(keyword) || 
                            content.includes(keyword)
                        );
                    }).map(item => this.formatArticle(item, 'smoking'));

                    allArticles.push(...smokingRelated);
                } catch (feedError) {
                    console.warn(`Không thể lấy tin từ ${feedUrl}:`, feedError.message);
                }
            }

            // Sắp xếp theo ngày mới nhất và giới hạn số lượng (tối đa 6 bài)
            const actualLimit = Math.min(6, limit); // Đảm bảo giới hạn tối đa 6 bài
            const sortedArticles = allArticles
                .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
                .slice(0, actualLimit);

            // Nếu không có tin tức thật, trả về mock data (cũng giới hạn 6 bài)
            if (sortedArticles.length === 0) {
                return res.json(this.getMockSmokingNews(Math.min(6, limit)));
            }

            res.json({
                success: true,
                data: sortedArticles,
                total: sortedArticles.length,
                source: 'RSS feeds'
            });

        } catch (error) {
            console.error('Lỗi khi lấy tin tức thuốc lá:', error);
            // Fallback to mock data
            res.json(this.getMockSmokingNews(parseInt(req.query.limit) || 10));
        }
    }

    /**
     * Get health-related news from RSS feeds
     */
    async getHealthNews(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;

            const rssFeeds = [
                'https://vnexpress.net/rss/suc-khoe.rss',
                'https://tuoitre.vn/rss/suc-khoe.rss',
                'https://suckhoedoisong.vn/rss/trang-chu.rss'
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
                return res.json(this.getMockHealthNews(limit));
            }

            res.json({
                success: true,
                data: sortedArticles,
                total: sortedArticles.length,
                source: 'RSS feeds'
            });

        } catch (error) {
            console.error('Lỗi khi lấy tin tức sức khỏe:', error);
            res.json(this.getMockHealthNews(parseInt(req.query.limit) || 10));
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

            // Tìm kiếm trong các RSS feeds
            const rssFeeds = [
                'https://vnexpress.net/rss/suc-khoe.rss',
                'https://tuoitre.vn/rss/suc-khoe.rss'
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
        // Lấy hình ảnh từ RSS item
        let imageUrl = '/image/articles/default.jpg'; // Default image
        
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
        let cleanDescription = item.contentSnippet || stripHtml(item.content) || '';
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
            if (hostname.includes('suckhoedoisong')) return 'Sức khỏe & Đời sống';
            return hostname;
        } catch {
            return 'Nguồn không rõ';
        }
    }

    /**
     * Mock smoking news data
     */
    getMockSmokingNews(limit = 10) {
        const mockArticles = [
            {
                id: 'mock-smoking-1',
                title: 'WHO cảnh báo: Thuốc lá điện tử không an toàn như nhiều người nghĩ',
                description: 'Tổ chức Y tế Thế giới phát hiện thuốc lá điện tử chứa nhiều chất độc hại và có thể gây nghiện mạnh hơn thuốc lá thông thường.',
                excerpt: 'Tổ chức Y tế Thế giới phát hiện thuốc lá điện tử chứa nhiều chất độc hại và có thể gây nghiện mạnh hơn thuốc lá thông thường...',
                url: 'https://vnexpress.net/who-canh-bao-thuoc-la-dien-tu-khong-an-toan',
                urlToImage: '/image/articles/e.jpg',
                publishedAt: new Date().toISOString(),
                source: { name: 'VnExpress' },
                author: 'BS. Nguyễn Văn A',
                category: 'smoking',
                views: '12.456',
                likes: '1.234',
                comments: '89'
            },
            {
                id: 'mock-smoking-2',
                title: 'Nghiên cứu mới: Cai thuốc lá trước 40 tuổi giúp tăng tuổi thọ 9 năm',
                description: 'Một nghiên cứu kéo dài 10 năm tại Đại học Y Harvard cho thấy việc cai thuốc lá trước 40 tuổi có thể kéo dài tuổi thọ đáng kể.',
                excerpt: 'Một nghiên cứu kéo dài 10 năm tại Đại học Y Harvard cho thấy việc cai thuốc lá trước 40 tuổi có thể kéo dài tuổi thọ đáng kể...',
                url: 'https://tuoitre.vn/cai-thuoc-la-truoc-40-tuoi-giup-tang-tuoi-tho-9-nam',
                urlToImage: '/image/articles/r.jpg',
                publishedAt: new Date(Date.now() - 86400000).toISOString(),
                source: { name: 'Tuổi Trẻ' },
                author: 'ThS. BS. Lê Thị B',
                category: 'smoking',
                views: '8.921',
                likes: '756',
                comments: '67'
            },
            {
                id: 'mock-smoking-3',
                title: 'Chương trình hỗ trợ cai thuốc lá miễn phí cho người lao động',
                description: 'Bộ Y tế phối hợp với các doanh nghiệp triển khai chương trình hỗ trợ cai thuốc lá miễn phí tại nơi làm việc.',
                excerpt: 'Bộ Y tế phối hợp với các doanh nghiệp triển khai chương trình hỗ trợ cai thuốc lá miễn phí tại nơi làm việc...',
                url: 'https://suckhoedoisong.vn/chuong-trinh-ho-tro-cai-thuoc-la-mien-phi',
                urlToImage: '/image/articles/d.jpg',
                publishedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
                source: { name: 'Sức khỏe & Đời sống' },
                author: 'BS. Trần Văn C',
                category: 'smoking',
                views: '6.543',
                likes: '432',
                comments: '45'
            }
        ];

        return {
            success: true,
            data: mockArticles.slice(0, limit),
            total: mockArticles.length,
            source: 'Mock data',
            message: 'Dữ liệu mẫu (RSS feeds không khả dụng)'
        };
    }

    /**
     * Mock health news data
     */
    getMockHealthNews(limit = 10) {
        const mockArticles = [
            {
                id: 'mock-health-1',
                title: 'Tác động tích cực của việc ngưng hút thuốc đến hệ hô hấp',
                description: 'Các bác sĩ chuyên khoa phổi chia sẻ về những thay đổi tích cực của phổi sau khi ngưng hút thuốc lá.',
                excerpt: 'Các bác sĩ chuyên khoa phổi chia sẻ về những thay đổi tích cực của phổi sau khi ngưng hút thuốc lá...',
                url: 'https://vnexpress.net/tac-dong-tich-cuc-ngung-hut-thuoc-den-he-ho-hap',
                urlToImage: '/image/articles/OIP.jpg',
                publishedAt: new Date().toISOString(),
                source: { name: 'VnExpress' },
                author: 'PGS.TS. Nguyễn Văn D',
                category: 'health',
                views: '9.876',
                likes: '654',
                comments: '78'
            },
            {
                id: 'mock-health-2',
                title: 'Chế độ dinh dưỡng hỗ trợ quá trình cai thuốc lá hiệu quả',
                description: 'Chuyên gia dinh dưỡng khuyên dùng các thực phẩm giàu vitamin C và omega-3 để hỗ trợ cai thuốc lá.',
                excerpt: 'Chuyên gia dinh dưỡng khuyên dùng các thực phẩm giàu vitamin C và omega-3 để hỗ trợ cai thuốc lá...',
                url: 'https://suckhoedoisong.vn/che-do-dinh-duong-ho-tro-cai-thuoc-la',
                urlToImage: '/image/articles/c.jpg',
                publishedAt: new Date(Date.now() - 86400000).toISOString(),
                source: { name: 'Sức khỏe & Đời sống' },
                author: 'ThS. Phạm Thị E',
                category: 'health',
                views: '7.234',
                likes: '543',
                comments: '56'
            }
        ];

        return {
            success: true,
            data: mockArticles.slice(0, limit),
            total: mockArticles.length,
            source: 'Mock data',
            message: 'Dữ liệu mẫu (RSS feeds không khả dụng)'
        };
    }
}

export default NewsController;
