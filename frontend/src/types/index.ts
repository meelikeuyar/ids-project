// ── Auth ──
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'viewer' | 'analyst' | 'admin';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
}

// ── Prediction ──
export type AttackClass = 'BENIGN' | 'DoS' | 'BruteForce' | 'PortScan' | 'WebAttack';
export type ModelType = '1D-CNN' | 'RF' | 'XGB';
export type RiskLevel = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface PredictionRequest {
  data: Record<string, number>;
  modelType: ModelType;
  ipAddress: string;
  preNormalized?: boolean;
}

export interface PredictionResult {
  id: string;
  prediction: AttackClass;
  confidence: number;
  riskScore: number;
  responseTimeMs: number;
  probabilities: Record<string, number>;
  blocked: boolean;
  timestamp: string;
}

export interface PredictionLog {
  id: string;
  ipAddress: string;
  model: ModelType;
  prediction: AttackClass;
  confidence: number;
  riskScore: number;
  responseTimeMs: number;
  blocked: boolean;
  createdAt: string;
}

// ── Statistics ──
export interface Statistics {
  totalPredictions: number;
  classDistribution: Record<string, number>;
  modelDistribution: Record<string, number>;
  avgResponseMs: number;
  last24hAttacks: number;
}

export interface HourlyTrend {
  hour: string;
  total: number;
  attacks: number;
}

// ── Blocked IPs ──
export interface BlockedIP {
  id: string;
  ipAddress: string;
  reason: string;
  attackType: AttackClass;
  confidence: number;
  blockedBy: 'auto' | 'manual';
  isActive: boolean;
  createdAt: string;
}

// ── Alerts ──
export type AlertType = 'critical' | 'high' | 'medium' | 'low';

export interface Alert {
  id: string;
  type: AlertType;
  attackType: AttackClass;
  ipAddress: string;
  confidence: number;
  riskScore: number;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// ── API Response ──
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  logs: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ── SHAP ──
export interface ShapExplanation {
  feature: string;
  shap_value: number;
  direction: 'positive' | 'negative';
}

export interface ExplanationResult {
  prediction: string;
  confidence: number;
  explanations: ShapExplanation[];
}
