const History = require("../models/History");
const mongoose = require("mongoose");

// Utility function to sanitize NoSQL inputs
const sanitizeInput = (v) => {
  if (v instanceof Object) {
    for (let key in v) {
      if (/^\$/.test(key)) {
        delete v[key];
      } else {
        sanitizeInput(v[key]);
      }
    }
  }
  return v;
};

const getSafeUserId = (req) => sanitizeInput(req.user.id);

// Get logged-in user's history
const getHistory = async (req, res) => {
  try {
    // Sanitize user ID to prevent NoSQL injection payload
    const safeUserId = getSafeUserId(req);

    //Get pagination parameters from query
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = parseInt(req.query.limit) || 10;
    const safeLimit = Math.min(limit, 100); // Limit to 100 items per page
    const skip = (page - 1) * safeLimit;

    //Get total count and Paginated data using sanitized ID
    const total = await History.countDocuments({ user: safeUserId });
    const history = await History.find({ user: safeUserId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit);

    const totalPages = Math.ceil(total / safeLimit);

    res.json({
      success: true,
      data: history,
      pagination: {
        total,
        page,
        limit: safeLimit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Server error",
      },
    });
  }
};

// Delete a single history item
const deleteHistoryItem = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      error: "Invalid history id",
    });
  }
  
  try {
    // Sanitize parameters
    const safeHistoryId = sanitizeInput(req.params.id);
    const safeUserId = getSafeUserId(req);

    const historyItem = await History.findOneAndDelete({
      _id: safeHistoryId,
      user: safeUserId,
    });

    if (!historyItem) {
      return res.status(404).json({ error: "History item not found" });
    }

    res.json({ message: "History item deleted" });
  } catch (err) {
    console.error("Delete history error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Clear all history for logged-in user
const clearHistory = async (req, res) => {
  try {
    // Sanitize user ID before bulk delete
    const safeUserId = getSafeUserId(req);
    await History.deleteMany({ user: safeUserId });

    res.json({ message: "History cleared successfully" });
  } catch (err) {
    console.error("Clear history error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const searchHistory = async (req, res) => {
  try {
    const safeUserId = getSafeUserId(req);
    const { q, type, startDate, endDate } = req.query;
    
    let query = { user: safeUserId };
    
    if (q) {
      const escapeRegex = (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      };
      query.query = { $regex: escapeRegex(q), $options: 'i' };
    }
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        // Set to end of the day to ensure we include all items on that date
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }
    
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = parseInt(req.query.limit) || 50; // History page might fetch many
    const safeLimit = Math.min(limit, 100);
    const skip = (page - 1) * safeLimit;

    const total = await History.countDocuments(query);
    const history = await History.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit);

    const totalPages = Math.ceil(total / safeLimit);

    res.json({
      success: true,
      data: history,
      pagination: {
        total,
        page,
        limit: safeLimit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    console.error("Search history error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

 const  bulkDeleteHistory = async (req, res) => {
  try {
    const { ids } = req.body; // Expecting an array of IDs in the request body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid request. 'ids' must be a non-empty array."
      });
    }

    const result = await History.deleteMany({
      _id: { $in: ids },
      user: req.user.id
    });

    res.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `${result.deletedCount} items deleted successfully`
    });
  } catch (error) {
    console.error("Bulk delete history error: ", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports = {
  getHistory,
  searchHistory,
  deleteHistoryItem,
  clearHistory,
  bulkDeleteHistory
};

//  New bulk delete function
