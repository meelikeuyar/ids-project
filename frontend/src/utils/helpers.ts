import type { AttackClass, RiskLevel } from '@/types';

export const ATTACK_COLORS: Record<AttackClass | string, string> = {
  BENIGN: '#00ff41',
  DoS: '#ff0040',
  BruteForce: '#ff4060',
  PortScan: '#ff8c00',
  WebAttack: '#ff2060',
};

export function calculateRiskScore(prediction: AttackClass, confidence: number): number {
  const weights: Record<string, number> = {
    BENIGN: 0, PortScan: 3, BruteForce: 6, DoS: 10, WebAttack: 10,
  };
  return Math.min(100, Math.round(((weights[prediction] || 5) * confidence) / 10));
}

export function getRiskLevel(score: number): { level: RiskLevel; color: string } {
  if (score === 0) return { level: 'SAFE', color: '#00ff41' };
  if (score < 30) return { level: 'LOW', color: '#00aaff' };
  if (score < 60) return { level: 'MEDIUM', color: '#ff8c00' };
  if (score < 85) return { level: 'HIGH', color: '#ff4060' };
  return { level: 'CRITICAL', color: '#ff0040' };
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('tr-TR');
}

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
