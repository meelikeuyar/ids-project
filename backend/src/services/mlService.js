const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

class MLService {
  constructor() {
    this.client = axios.create({
      baseURL: config.mlService.url,
      timeout: config.mlService.timeout,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Send prediction request to Python ML service
   */
  async predict({ data, modelType, ipAddress, preNormalized = false }) {
    try {
      const response = await this.client.post('/predict', {
        data,
        model_type: modelType,
        ip_address: ipAddress,
        pre_normalized: preNormalized,
      });
      return response.data;
    } catch (error) {
      logger.error('ML service prediction failed', {
        error: error.message,
        modelType,
        ipAddress,
      });
      if (error.code === 'ECONNREFUSED') {
        throw new AppError('ML service is unavailable. Please try again later.', 503);
      }
      throw new AppError(
        error.response?.data?.detail || 'Prediction failed.',
        error.response?.status || 500
      );
    }
  }

  /**
   * Get SHAP explanation from ML service
   */
  async getExplanation({ data, preNormalized = false }) {
    try {
      const response = await this.client.post('/explain', {
        data,
        model_type: '1D-CNN',
        pre_normalized: preNormalized,
      });
      return response.data;
    } catch (error) {
      logger.error('ML service SHAP explanation failed', { error: error.message });
      if (error.code === 'ECONNREFUSED') {
        throw new AppError('ML service is unavailable.', 503);
      }
      throw new AppError('Explanation generation failed.', 500);
    }
  }

  /**
   * Health check for ML service
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/health', { timeout: 5000 });
      return { status: 'healthy', models: response.data.models };
    } catch {
      return { status: 'unhealthy', models: [] };
    }
  }
}

module.exports = new MLService();
