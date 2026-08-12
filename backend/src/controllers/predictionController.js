const predictionService = require('../services/predictionService');
const mlService = require('../services/mlService');

const predict = async (req, res, next) => {
  try {
    const { data, modelType, ipAddress, preNormalized } = req.body;
    const result = await predictionService.predict({
      data,
      modelType,
      ipAddress,
      preNormalized,
      analystId: req.user?.id,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const batchAnalysis = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'CSV file is required.' });
    }
    // Forward file to ML service for batch processing
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: 'text/csv',
    });

    const modelType = req.body.modelType || '1D-CNN';
    const axios = require('axios');
    const config = require('../config');

    const response = await axios.post(
      `${config.mlService.url}/batch-analysis?model_type=${modelType}`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 120000,
      }
    );

    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    next(error);
  }
};

const getLogs = async (req, res, next) => {
  try {
    const { page, limit, prediction, ipAddress, startDate, endDate } = req.query;
    const result = await predictionService.getLogs({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      prediction,
      ipAddress,
      startDate,
      endDate,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getStatistics = async (req, res, next) => {
  try {
    const stats = await predictionService.getStatistics();
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

const getHourlyTrend = async (req, res, next) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const trend = await predictionService.getHourlyTrend(hours);
    res.status(200).json({ success: true, data: trend });
  } catch (error) {
    next(error);
  }
};

const clearLogs = async (req, res, next) => {
  try {
    const result = await predictionService.clearLogs();
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getExplanation = async (req, res, next) => {
  try {
    const { data, preNormalized } = req.body;
    const result = await mlService.getExplanation({ data, preNormalized });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  predict,
  batchAnalysis,
  getLogs,
  getStatistics,
  getHourlyTrend,
  clearLogs,
  getExplanation,
};
