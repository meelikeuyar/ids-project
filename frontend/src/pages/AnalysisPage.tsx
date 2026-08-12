import { useState } from 'react';
import { Play, Shuffle, Activity, Brain, BarChart3, Info } from 'lucide-react';
import { predictionApi } from '@/services/api';
import { ATTACK_COLORS, getRiskLevel } from '@/utils/helpers';
import type { PredictionResult, ModelType, ShapExplanation } from '@/types';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

// ── KEY FEATURES — visible to user ──
const KEY_FEATURES = [
  'Flow Duration', 'Flow IAT Mean', 'Flow IAT Std', 'Fwd Packet Length Mean',
  'Bwd Packet Length Mean', 'Flow Bytes/s', 'Flow Packets/s', 'SYN Flag Count',
  'ACK Flag Count', 'PSH Flag Count', 'Avg Packet Size', 'Init Fwd Win Bytes',
  'Packet Length Variance', 'Bwd Packets/s', 'Fwd IAT Mean',
];

// ── FULL 45-FEATURE SCENARIOS ──
const SCENARIOS: Record<string, { label: string; emoji: string; color: string; desc: string; data: Record<string, number> }> = {
  normal: { label: 'BENIGN', emoji: '✅', color: '#00ff41', desc: 'Normal network traffic', data: {"Protocol":-0.859499,"Flow Duration":-0.516046,"Fwd Packet Length Min":-0.355259,"Fwd Packet Length Mean":-0.410641,"Bwd Packet Length Min":-0.673984,"Bwd Packet Length Mean":-0.588875,"Flow Bytes/s":-0.0672,"Flow Packets/s":-0.163228,"Flow IAT Mean":-0.326586,"Flow IAT Std":-0.417801,"Flow IAT Max":-0.4352,"Flow IAT Min":-0.062282,"Fwd IAT Total":-0.508496,"Fwd IAT Mean":-0.319958,"Fwd IAT Std":-0.392128,"Fwd IAT Min":-0.137224,"Bwd IAT Total":-0.400182,"Bwd IAT Mean":-0.237014,"Bwd IAT Std":-0.269644,"Bwd IAT Max":-0.313824,"Bwd IAT Min":-0.134215,"Bwd Header Length":0.002088,"Bwd Packets/s":-0.146967,"Packet Length Min":-0.492801,"Packet Length Variance":-0.348445,"FIN Flag Count":-0.210983,"SYN Flag Count":-0.202352,"PSH Flag Count":-0.595159,"ACK Flag Count":1.637684,"URG Flag Count":-0.300522,"ECE Flag Count":-0.018083,"Down/Up Ratio":-1.184545,"Avg Packet Size":-0.659955,"Subflow Fwd Bytes":-0.097103,"Subflow Bwd Bytes":-0.007936,"Init Fwd Win Bytes":3.573863,"Init Bwd Win Bytes":-0.254868,"Fwd Seg Size Min":0.003399,"Active Std":-0.119398,"Active Max":-0.160642,"Active Min":-0.098169,"Idle Mean":-0.411277,"Idle Std":-0.095039,"Idle Max":-0.415295,"Idle Min":-0.403009} },
  dos: { label: 'DoS', emoji: '🔴', color: '#ff0040', desc: 'Denial of Service attack', data: {"Protocol":-0.859499,"Flow Duration":2.096052,"Fwd Packet Length Min":-0.505906,"Fwd Packet Length Mean":-0.097469,"Bwd Packet Length Min":-0.673984,"Bwd Packet Length Mean":2.702184,"Flow Bytes/s":-0.06741,"Flow Packets/s":-0.165392,"Flow IAT Mean":1.244512,"Flow IAT Std":2.634056,"Flow IAT Max":3.035911,"Flow IAT Min":-0.064394,"Fwd IAT Total":2.107479,"Fwd IAT Mean":1.183539,"Fwd IAT Std":3.156253,"Fwd IAT Min":-0.137966,"Bwd IAT Total":-0.399918,"Bwd IAT Mean":-0.236847,"Bwd IAT Std":-0.269173,"Bwd IAT Max":-0.313421,"Bwd IAT Min":-0.13421,"Bwd Header Length":0.002203,"Bwd Packets/s":-0.146965,"Packet Length Min":-0.71314,"Packet Length Variance":1.9725,"FIN Flag Count":-0.210983,"SYN Flag Count":-0.202352,"PSH Flag Count":-0.595159,"ACK Flag Count":1.637684,"URG Flag Count":-0.300522,"ECE Flag Count":-0.018083,"Down/Up Ratio":-1.184545,"Avg Packet Size":2.357399,"Subflow Fwd Bytes":-0.046685,"Subflow Bwd Bytes":-0.003527,"Init Fwd Win Bytes":-0.479955,"Init Bwd Win Bytes":-0.228914,"Fwd Seg Size Min":0.003399,"Active Std":-0.119398,"Active Max":-0.158895,"Active Min":-0.094934,"Idle Mean":3.110807,"Idle Std":-0.095039,"Idle Max":3.061769,"Idle Min":3.133754} },
  portscan: { label: 'PortScan', emoji: '⚠️', color: '#ff8c00', desc: 'Port scanning reconnaissance', data: {"Protocol":-0.859499,"Flow Duration":2.062941,"Fwd Packet Length Min":-0.505906,"Fwd Packet Length Mean":-0.449236,"Bwd Packet Length Min":-0.592969,"Bwd Packet Length Mean":-0.578657,"Flow Bytes/s":-0.067426,"Flow Packets/s":-0.165393,"Flow IAT Mean":5.88481,"Flow IAT Std":5.610956,"Flow IAT Max":2.993706,"Flow IAT Min":-0.064381,"Fwd IAT Total":2.075671,"Fwd IAT Mean":8.567633,"Fwd IAT Std":-0.392128,"Fwd IAT Min":9.692326,"Bwd IAT Total":2.6072,"Bwd IAT Mean":9.298128,"Bwd IAT Std":-0.269644,"Bwd IAT Max":4.530671,"Bwd IAT Min":10.10535,"Bwd Header Length":0.002111,"Bwd Packets/s":-0.146966,"Packet Length Min":-0.71314,"Packet Length Variance":-0.348439,"FIN Flag Count":-0.210983,"SYN Flag Count":-0.202352,"PSH Flag Count":1.680222,"ACK Flag Count":-0.610618,"URG Flag Count":-0.300522,"ECE Flag Count":-0.018083,"Down/Up Ratio":0.605092,"Avg Packet Size":-0.67657,"Subflow Fwd Bytes":-0.098709,"Subflow Bwd Bytes":-0.007931,"Init Fwd Win Bytes":-0.431933,"Init Bwd Win Bytes":-0.254758,"Fwd Seg Size Min":0.003402,"Active Std":-0.119398,"Active Max":-0.160587,"Active Min":-0.098067,"Idle Mean":3.067985,"Idle Std":-0.095039,"Idle Max":3.019495,"Idle Min":3.090754} },
  bruteforce: { label: 'BruteForce', emoji: '🔴', color: '#ff4060', desc: 'Brute force login attack', data: {"Protocol":-0.859499,"Flow Duration":-0.167779,"Fwd Packet Length Min":-0.505906,"Fwd Packet Length Mean":0.247581,"Bwd Packet Length Min":-0.673984,"Bwd Packet Length Mean":-0.447215,"Flow Bytes/s":-0.067376,"Flow Packets/s":-0.16536,"Flow IAT Mean":-0.28138,"Flow IAT Std":-0.346878,"Flow IAT Max":-0.348933,"Flow IAT Min":-0.064393,"Fwd IAT Total":-0.20917,"Fwd IAT Mean":-0.271567,"Fwd IAT Std":-0.307789,"Fwd IAT Min":-0.137915,"Bwd IAT Total":0.006971,"Bwd IAT Mean":-0.196773,"Bwd IAT Std":-0.161163,"Bwd IAT Max":-0.191585,"Bwd IAT Min":-0.134214,"Bwd Header Length":0.002698,"Bwd Packets/s":-0.146885,"Packet Length Min":-0.71314,"Packet Length Variance":-0.319303,"FIN Flag Count":-0.210983,"SYN Flag Count":-0.202352,"PSH Flag Count":1.680222,"ACK Flag Count":-0.610618,"URG Flag Count":-0.300522,"ECE Flag Count":-0.018083,"Down/Up Ratio":0.605092,"Avg Packet Size":-0.402688,"Subflow Fwd Bytes":0.223391,"Subflow Bwd Bytes":-0.006892,"Init Fwd Win Bytes":1.372154,"Init Bwd Win Bytes":-0.227594,"Fwd Seg Size Min":0.003407,"Active Std":-0.119398,"Active Max":-0.160642,"Active Min":-0.098169,"Idle Mean":-0.411277,"Idle Std":-0.095039,"Idle Max":-0.415295,"Idle Min":-0.403009} },
  webattack: { label: 'WebAttack', emoji: '🔴', color: '#ff2060', desc: 'Web application attack (XSS/SQLi)', data: {"Protocol":-0.859499,"Flow Duration":1.341602,"Fwd Packet Length Min":-0.505906,"Fwd Packet Length Mean":1.385583,"Bwd Packet Length Min":-0.673984,"Bwd Packet Length Mean":2.387185,"Flow Bytes/s":-0.066967,"Flow Packets/s":-0.165358,"Flow IAT Mean":-0.284421,"Flow IAT Std":-0.371422,"Flow IAT Max":-0.302992,"Flow IAT Min":-0.064393,"Fwd IAT Total":1.35205,"Fwd IAT Mean":-0.289105,"Fwd IAT Std":-0.348622,"Fwd IAT Min":-0.13792,"Bwd IAT Total":1.765133,"Bwd IAT Mean":-0.170999,"Bwd IAT Std":-0.202581,"Bwd IAT Max":-0.126652,"Bwd IAT Min":-0.134214,"Bwd Header Length":0.004018,"Bwd Packets/s":-0.146918,"Packet Length Min":-0.71314,"Packet Length Variance":0.145841,"FIN Flag Count":-0.210983,"SYN Flag Count":-0.202352,"PSH Flag Count":1.680222,"ACK Flag Count":-0.610618,"URG Flag Count":-0.300522,"ECE Flag Count":-0.018083,"Down/Up Ratio":-1.184545,"Avg Packet Size":1.807134,"Subflow Fwd Bytes":7.719834,"Subflow Bwd Bytes":0.061833,"Init Fwd Win Bytes":1.372154,"Init Bwd Win Bytes":-0.128289,"Fwd Seg Size Min":0.003407,"Active Std":-0.119398,"Active Max":-0.160642,"Active Min":-0.098169,"Idle Mean":-0.411277,"Idle Std":-0.095039,"Idle Max":-0.415295,"Idle Min":-0.403009} },
};

// ── Generate random perturbation of a scenario ──
function randomizeScenario(base: Record<string, number>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, val] of Object.entries(base)) {
    const noise = (Math.random() - 0.5) * 0.6; // +/- 30% noise
    result[key] = parseFloat((val + noise).toFixed(6));
  }
  return result;
}

const TOOLTIP_STYLE = {
  contentStyle: {
    background: 'rgba(3,7,18,0.95)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace',
  },
};

export default function AnalysisPage() {
  const [activeScenario, setActiveScenario] = useState('normal');
  const [modelType, setModelType] = useState<ModelType>('1D-CNN');
  const [ipAddress, setIpAddress] = useState('10.0.0.5');
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentData, setCurrentData] = useState<Record<string, number>>(SCENARIOS.normal.data);
  const [shapData, setShapData] = useState<ShapExplanation[] | null>(null);
  const [shapLoading, setShapLoading] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);

  const runAnalysis = async (data?: Record<string, number>) => {
    const inputData = data || currentData;
    setLoading(true);
    setShapData(null);
    try {
      const { data: res } = await predictionApi.predict({
        data: inputData, modelType, ipAddress, preNormalized: true,
      });
      setResult(res.data);
      setCurrentData(inputData);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Analysis failed');
    } finally { setLoading(false); }
  };

  const runRandom = () => {
    const base = SCENARIOS[activeScenario].data;
    const randomized = randomizeScenario(base);
    setCurrentData(randomized);
    runAnalysis(randomized);
  };

  const runShap = async () => {
    setShapLoading(true);
    try {
      const { data: res } = await predictionApi.explain({ data: currentData, preNormalized: true });
      if (res.data && res.data.explanations) {
        setShapData(res.data.explanations);
      } else {
        toast.error('SHAP analysis failed');
      }
    } catch { toast.error('SHAP analysis failed'); }
    finally { setShapLoading(false); }
  };

  const riskInfo = result ? getRiskLevel(result.riskScore) : null;
  const probData = result
    ? Object.entries(result.probabilities).map(([name, value]) => ({ name, value, color: ATTACK_COLORS[name] || '#666' }))
    : [];

  const keyFeatureData = KEY_FEATURES.map(f => ({
    name: f.length > 20 ? f.substring(0, 18) + '..' : f,
    fullName: f,
    value: parseFloat((currentData[f] || 0).toFixed(3)),
    color: (currentData[f] || 0) > 1 ? '#ff4060' : (currentData[f] || 0) > 0 ? '#ff8c00' : '#00ff41',
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 animate-fade-up">
        <Activity className="w-5 h-5 text-cyber-green" />
        <h1 className="text-xl font-semibold text-gray-100">Traffic Analysis</h1>
      </div>

      {/* Scenario Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 animate-fade-up delay-1">
        {Object.entries(SCENARIOS).map(([key, s]) => (
          <button key={key} onClick={() => { setActiveScenario(key); setCurrentData(s.data); setResult(null); setShapData(null); }}
            className="py-4 px-3 rounded-xl text-center transition-all duration-300"
            style={activeScenario === key ? {
              background: `linear-gradient(135deg, ${s.color}15, ${s.color}05)`,
              border: `1px solid ${s.color}40`,
              boxShadow: `0 0 20px ${s.color}10`,
            } : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-lg mb-1">{s.emoji}</div>
            <div className={`text-xs font-semibold tracking-wider ${activeScenario === key ? '' : 'text-gray-400'}`}
              style={activeScenario === key ? { color: s.color } : {}}>{s.label}</div>
            <div className="text-[9px] text-gray-500 mt-1">{s.desc}</div>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="glass-card p-5 animate-fade-up delay-2">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-[10px] text-gray-400 tracking-wider uppercase font-medium mb-1.5 block">Model</label>
            <select value={modelType} onChange={(e) => setModelType(e.target.value as ModelType)} className="cyber-input text-sm">
              <option value="1D-CNN">1D-CNN (Deep Learning)</option>
              <option value="RF">Random Forest</option>
              <option value="XGB">XGBoost</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-gray-400 tracking-wider uppercase font-medium mb-1.5 block">Source IP</label>
            <input type="text" value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} className="cyber-input text-sm" />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={() => runAnalysis()} disabled={loading} className="glow-btn flex-1 flex items-center justify-center gap-2 py-3">
              {loading ? <div className="w-4 h-4 border-2 border-cyber-green/30 border-t-cyber-green rounded-full animate-spin" />
                : <><Play className="w-4 h-4" /><span>Analyze</span></>}
            </button>
          </div>
          <div className="flex items-end gap-2">
            <button onClick={runRandom} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all"
              style={{ background: 'linear-gradient(135deg, rgba(0,170,255,0.1), rgba(0,170,255,0.03))', border: '1px solid rgba(0,170,255,0.3)', color: '#00aaff' }}>
              <Shuffle className="w-4 h-4" /> Random Sim
            </button>
          </div>
        </div>
      </div>

      {/* Feature Values Toggle */}
      <div className="animate-fade-up delay-3">
        <button onClick={() => setShowFeatures(!showFeatures)}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-cyber-blue transition mb-3">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>{showFeatures ? 'Hide' : 'Show'} Key Feature Values ({KEY_FEATURES.length} features)</span>
        </button>
        {showFeatures && (
          <div className="glass-card p-5">
            <h3 className="text-xs font-semibold text-gray-300 tracking-wider mb-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyber-blue" />
              Critical Network Features (Normalized)
              <span className="ml-auto text-[9px] text-gray-500 font-normal flex items-center gap-1">
                <Info className="w-3 h-3" /> Green=normal, Orange=elevated, Red=anomalous
              </span>
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={keyFeatureData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis type="number" tick={{ fill: '#374151', fontSize: 9 }} axisLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#9ca3af', fontSize: 9, fontFamily: 'JetBrains Mono' }} width={130} axisLine={false} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div style={{ background: 'rgba(3,7,18,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', fontSize: 11 }}>
                      <div style={{ color: '#00ff41', fontWeight: 600 }}>{d.fullName}</div>
                      <div style={{ color: '#9ca3af', marginTop: 4 }}>Value: <span style={{ color: d.color, fontWeight: 600 }}>{d.value}</span></div>
                    </div>
                  );
                }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
                  {keyFeatureData.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.7} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-5 animate-fade-up">
          {/* Banner */}
          <div className="glass-card p-5" style={{
            borderLeft: `3px solid ${result.prediction === 'BENIGN' ? '#00ff41' : '#ff0040'}`,
            background: result.prediction === 'BENIGN'
              ? 'linear-gradient(135deg, rgba(0,255,65,0.04), transparent)'
              : 'linear-gradient(135deg, rgba(255,0,64,0.04), transparent)',
          }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-wider" style={{ color: ATTACK_COLORS[result.prediction] }}>
                  {result.prediction === 'BENIGN' ? '✓ Normal Traffic Detected' : `⚠ ${result.prediction} Attack Detected`}
                </h2>
                <p className="text-xs text-gray-400 mt-1 font-mono">
                  Confidence: {result.confidence.toFixed(1)}% | Model: {modelType} | Response: {result.responseTimeMs}ms
                  {result.blocked && ' | 🚫 IP BLOCKED'}
                </p>
              </div>
              {result.prediction !== 'BENIGN' && modelType === '1D-CNN' && (
                <button onClick={runShap} disabled={shapLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all"
                  style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(168,85,247,0.03))', border: '1px solid rgba(168,85,247,0.3)', color: '#a855f7' }}>
                  {shapLoading ? <div className="w-3 h-3 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                    : <Brain className="w-4 h-4" />}
                  <span>Explain AI Decision</span>
                </button>
              )}
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Prediction', value: result.prediction, color: ATTACK_COLORS[result.prediction] },
              { label: 'Confidence', value: `${result.confidence.toFixed(1)}%`, color: ATTACK_COLORS[result.prediction] },
              { label: 'Risk Level', value: riskInfo?.level || '', color: riskInfo?.color || '#fff' },
              { label: 'Response', value: `${result.responseTimeMs}ms`, color: '#00aaff' },
              { label: 'Blocked', value: result.blocked ? 'YES' : 'NO', color: result.blocked ? '#ff0040' : '#00ff41' },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-card p-4 text-center">
                <p className="text-[10px] text-gray-500 tracking-wider uppercase mb-1">{label}</p>
                <p className="text-lg font-bold font-mono" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Probability Chart */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-gray-300 tracking-wider mb-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyber-green" /> Class Probabilities
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={probData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#374151', fontSize: 10 }} axisLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#9ca3af', fontFamily: 'JetBrains Mono', fontSize: 11 }} width={90} axisLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
                  {probData.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.8} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* SHAP Explanation */}
          {shapData && (
            <div className="glass-card p-5" style={{ borderTop: '2px solid rgba(168,85,247,0.3)' }}>
              <h3 className="text-sm font-semibold text-gray-300 tracking-wider mb-2 flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                AI Decision Explanation (SHAP Analysis)
              </h3>
              <p className="text-[10px] text-gray-500 mb-4">
                Why did the model classify this as <span className="font-bold" style={{ color: ATTACK_COLORS[result.prediction] }}>{result.prediction}</span>?
                Positive values (right) push toward this class. Negative values (left) push away.
              </p>
              <ResponsiveContainer width="100%" height={Math.max(250, shapData.length * 28)}>
                <BarChart data={shapData.map(s => ({
                  name: s.feature.length > 25 ? s.feature.substring(0, 23) + '..' : s.feature,
                  value: parseFloat(s.shap_value.toFixed(4)),
                  color: s.direction === 'positive' ? '#a855f7' : '#3b82f6',
                }))} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis type="number" tick={{ fill: '#374151', fontSize: 9 }} axisLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#9ca3af', fontSize: 9, fontFamily: 'JetBrains Mono' }} width={160} axisLine={false} />
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div style={{ background: 'rgba(3,7,18,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', fontSize: 11 }}>
                        <div style={{ color: '#a855f7', fontWeight: 600 }}>{d.name}</div>
                        <div style={{ color: '#9ca3af', marginTop: 4 }}>
                          SHAP: <span style={{ color: d.color, fontWeight: 600 }}>{d.value > 0 ? '+' : ''}{d.value}</span>
                        </div>
                        <div style={{ color: '#6b7280', fontSize: 10, marginTop: 2 }}>
                          {d.value > 0 ? '→ Pushes toward this prediction' : '← Pushes against this prediction'}
                        </div>
                      </div>
                    );
                  }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                    {shapData.map((s, i) => (
                      <Cell key={i} fill={s.direction === 'positive' ? '#a855f7' : '#3b82f6'} fillOpacity={0.75} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-6 mt-3 text-[10px] text-gray-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-2 rounded-sm bg-purple-500/75" /> Positive (supports prediction)
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-2 rounded-sm bg-blue-500/75" /> Negative (opposes prediction)
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
