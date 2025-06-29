import SmokingStatus from '../models/SmokingStatus.js';
import { Op } from 'sequelize';

// Get user smoking status
export const getUserSmokingStatus = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const { startDate, endDate, limit = 30 } = req.query;

    let whereCondition = { UserID: userId };

    if (startDate && endDate) {
      whereCondition.Date = {
        [Op.between]: [startDate, endDate]
      };
    } else if (startDate) {
      whereCondition.Date = {
        [Op.gte]: startDate
      };
    } else if (endDate) {
      whereCondition.Date = {
        [Op.lte]: endDate
      };
    }

    const smokingStatus = await SmokingStatus.findAll({
      where: whereCondition,
      order: [['Date', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: smokingStatus
    });

  } catch (error) {
    console.error('Error getting user smoking status:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy trạng thái hút thuốc'
    });
  }
};

// Record smoking status
export const recordSmokingStatus = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const { 
      date, 
      cigarettesSmoked, 
      cravingLevel, 
      moodRating, 
      stressLevel, 
      triggers, 
      notes, 
      quitDay 
    } = req.body;

    // Validate required fields
    if (!date || cigarettesSmoked === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc: date, cigarettesSmoked'
      });
    }

    // Check if record already exists for this date
    const existingRecord = await SmokingStatus.findOne({
      where: {
        UserID: userId,
        Date: date
      }
    });

    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message: 'Đã có bản ghi cho ngày này. Vui lòng sử dụng API cập nhật.'
      });
    }

    // Parse triggers if it's a string
    let parsedTriggers = triggers;
    if (typeof triggers === 'string') {
      try {
        parsedTriggers = JSON.parse(triggers);
      } catch (e) {
        parsedTriggers = [triggers];
      }
    }

    const smokingStatus = await SmokingStatus.create({
      UserID: userId,
      Date: date,
      CigarettesSmoked: cigarettesSmoked,
      CravingLevel: cravingLevel || null,
      MoodRating: moodRating || null,
      StressLevel: stressLevel || null,
      Triggers: parsedTriggers || null,
      Notes: notes || null,
      QuitDay: quitDay || false
    });

    res.status(201).json({
      success: true,
      data: smokingStatus,
      message: 'Ghi nhận trạng thái hút thuốc thành công'
    });

  } catch (error) {
    console.error('Error recording smoking status:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi ghi nhận trạng thái hút thuốc'
    });
  }
};

// Update smoking status record
export const updateSmokingStatusRecord = async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.user.UserID;
    const updateData = req.body;

    const smokingStatus = await SmokingStatus.findOne({
      where: {
        UserID: userId,
        Date: date
      }
    });

    if (!smokingStatus) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bản ghi cho ngày này'
      });
    }

    // Parse triggers if it's a string
    if (updateData.triggers && typeof updateData.triggers === 'string') {
      try {
        updateData.triggers = JSON.parse(updateData.triggers);
      } catch (e) {
        updateData.triggers = [updateData.triggers];
      }
    }

    // Map fields to database columns
    const mappedData = {};
    if (updateData.cigarettesSmoked !== undefined) mappedData.CigarettesSmoked = updateData.cigarettesSmoked;
    if (updateData.cravingLevel !== undefined) mappedData.CravingLevel = updateData.cravingLevel;
    if (updateData.moodRating !== undefined) mappedData.MoodRating = updateData.moodRating;
    if (updateData.stressLevel !== undefined) mappedData.StressLevel = updateData.stressLevel;
    if (updateData.triggers !== undefined) mappedData.Triggers = updateData.triggers;
    if (updateData.notes !== undefined) mappedData.Notes = updateData.notes;
    if (updateData.quitDay !== undefined) mappedData.QuitDay = updateData.quitDay;

    await smokingStatus.update(mappedData);

    res.json({
      success: true,
      data: smokingStatus,
      message: 'Cập nhật trạng thái hút thuốc thành công'
    });

  } catch (error) {
    console.error('Error updating smoking status record:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cập nhật trạng thái hút thuốc'
    });
  }
};

// Delete smoking status record
export const deleteSmokingStatusRecord = async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.user.UserID;

    const smokingStatus = await SmokingStatus.findOne({
      where: {
        UserID: userId,
        Date: date
      }
    });

    if (!smokingStatus) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bản ghi cho ngày này'
      });
    }

    await smokingStatus.destroy();

    res.json({
      success: true,
      message: 'Xóa bản ghi trạng thái hút thuốc thành công'
    });

  } catch (error) {
    console.error('Error deleting smoking status record:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xóa bản ghi trạng thái hút thuốc'
    });
  }
};

// Get smoking status analytics
export const getSmokingStatusAnalytics = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const { period = '30' } = req.query;

    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const smokingStatusRecords = await SmokingStatus.findAll({
      where: {
        UserID: userId,
        Date: {
          [Op.gte]: startDate.toISOString().split('T')[0]
        }
      },
      order: [['Date', 'ASC']]
    });

    // Calculate analytics
    const totalDays = smokingStatusRecords.length;
    const totalCigarettes = smokingStatusRecords.reduce((sum, record) => sum + record.CigarettesSmoked, 0);
    const smokeFreedays = smokingStatusRecords.filter(record => record.CigarettesSmoked === 0).length;
    const quitDays = smokingStatusRecords.filter(record => record.QuitDay === true).length;
    
    const avgCigarettesPerDay = totalDays > 0 ? (totalCigarettes / totalDays) : 0;
    const avgCravingLevel = smokingStatusRecords.length > 0 
      ? smokingStatusRecords.reduce((sum, record) => sum + (record.CravingLevel || 0), 0) / smokingStatusRecords.length
      : 0;
    const avgMoodRating = smokingStatusRecords.length > 0
      ? smokingStatusRecords.reduce((sum, record) => sum + (record.MoodRating || 0), 0) / smokingStatusRecords.length
      : 0;

    // Collect all triggers
    const allTriggers = smokingStatusRecords.reduce((triggers, record) => {
      if (record.Triggers && Array.isArray(record.Triggers)) {
        return triggers.concat(record.Triggers);
      }
      return triggers;
    }, []);

    // Count trigger frequency
    const triggerFrequency = allTriggers.reduce((freq, trigger) => {
      freq[trigger] = (freq[trigger] || 0) + 1;
      return freq;
    }, {});

    const analytics = {
      period: `${daysAgo} days`,
      totalDays,
      totalCigarettes,
      smokeFreedays,
      quitDays,
      avgCigarettesPerDay: Math.round(avgCigarettesPerDay * 100) / 100,
      avgCravingLevel: Math.round(avgCravingLevel * 100) / 100,
      avgMoodRating: Math.round(avgMoodRating * 100) / 100,
      triggerFrequency,
      smokeFreePercentage: totalDays > 0 ? Math.round((smokeFreedays / totalDays) * 100) : 0,
      recentTrend: smokingStatusRecords.slice(-7) // Last 7 days
    };

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Error getting smoking status analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy phân tích trạng thái hút thuốc'
    });
  }
};
