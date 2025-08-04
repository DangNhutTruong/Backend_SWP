/**
 * Xử lý response từ API
 * @param {Response} response - Response object từ fetch
 * @returns {Promise<Object>} - Parsed response data
 */
export const handleApiResponse = async (response) => {
  try {
    const data = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        data: data.data || data,
        message: data.message || 'Success'
      };
    } else {
      return {
        success: false,
        data: null,
        message: data.message || `HTTP Error: ${response.status}`
      };
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      message: 'Invalid JSON response'
    };
  }
};
