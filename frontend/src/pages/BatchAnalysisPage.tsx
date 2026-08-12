import { useState, useRef } from 'react';
import { Upload, FileText, Play, AlertTriangle, CheckCircle } from 'lucide-react';
import { ATTACK_COLORS } from '@/utils/helpers';
import type { ModelType } from '@/types';
import toast from 'react-hot-toast';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

export default function BatchAnalysisPage() {
  const [file, setFile] = useState<File | null>(null);
  const [modelType, setModelType] = useState<ModelType>('RF');
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [classDist, setClassDist] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [rows, setRows] = useState<Array<{ prediction: string; confidence: number }>>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const runBatch = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('modelType', modelType);
      const token = localStorage.getItem('accessToken');
      const res = await axios.post('/api/v1/predictions/batch', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: 'Bearer ' + token },
        timeout: 120000,
      });
      const d = res.data.data;
      setTotalRows(d.total_rows);
      setAccuracy(d.accuracy);
      setRows(d.results || []);
      const cd: Array<{ name: string; value: number; color: string }> = [];
      for (const k of Object.keys(d.class_distribution)) {
        cd.push({ name: k, value: d.class_distribution[k], color: ATTACK_COLORS[k] || '#666' });
      }
      setClassDist(cd);
      toast.success(d.total_rows + ' rows analyzed');
    } catch {
      toast.error('Batch analysis failed');
    }
    setLoading(false);
  };

  const totalAttacks = totalRows - (classDist.find(c => c.name === 'BENIGN')?.value || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="w-5 h-5 text-cyber-green" />
        <h1 className="text-xl font-semibold text-gray-100">Batch CSV Analysis</h1>
      </div>

      <div className="glass-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2">
            <div onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all hover:border-cyber-green/30"
              style={{ borderColor: file ? 'rgba(0,255,65,0.3)' : 'rgba(255,255,255,0.08)' }}>
              <input ref={fileRef} type="file" accept=".csv" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setTotalRows(0); setClassDist([]); setRows([]); } }} />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle className="w-6 h-6 text-cyber-green" />
                  <div>
                    <p className="text-sm font-medium text-cyber-green">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Click to upload CSV</p>
                  <p className="text-[10px] text-gray-600 mt-1">CIC-IDS 2017 format</p>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-gray-400 tracking-wider uppercase font-medium mb-2 block">Model</label>
              <select value={modelType} onChange={(e) => setModelType(e.target.value as ModelType)} className="cyber-input text-sm">
                <option value="1D-CNN">1D-CNN</option>
                <option value="RF">Random Forest</option>
                <option value="XGB">XGBoost</option>
              </select>
            </div>
            <button onClick={runBatch} disabled={loading || !file} className="glow-btn w-full flex items-center justify-center gap-2 py-3.5">
              {loading ? <div className="w-4 h-4 border-2 border-cyber-green/30 border-t-cyber-green rounded-full animate-spin" />
                : <><Play className="w-4 h-4" /><span>Analyze</span></>}
            </button>
          </div>
        </div>
      </div>

      {totalRows > 0 && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-card p-5 text-center">
              <p className="text-[10px] text-gray-500 tracking-wider uppercase mb-1">Total Rows</p>
              <p className="text-2xl font-bold font-mono text-cyber-green">{totalRows}</p>
            </div>
            <div className="glass-card p-5 text-center">
              <p className="text-[10px] text-gray-500 tracking-wider uppercase mb-1">Attacks</p>
              <p className="text-2xl font-bold font-mono" style={{ color: '#ff0040' }}>{totalAttacks}</p>
            </div>
            <div className="glass-card p-5 text-center">
              <p className="text-[10px] text-gray-500 tracking-wider uppercase mb-1">Attack Rate</p>
              <p className="text-2xl font-bold font-mono" style={{ color: '#ff8c00' }}>{totalRows > 0 ? ((totalAttacks / totalRows) * 100).toFixed(1) : 0}%</p>
            </div>
            <div className="glass-card p-5 text-center">
              <p className="text-[10px] text-gray-500 tracking-wider uppercase mb-1">{accuracy !== null ? 'Accuracy' : 'Model'}</p>
              <p className="text-2xl font-bold font-mono" style={{ color: '#00aaff' }}>{accuracy !== null ? accuracy + '%' : modelType}</p>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Class Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={classDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: '#374151', fontSize: 10 }} axisLine={false} />
                <Tooltip contentStyle={{ background: 'rgba(3,7,18,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {classDist.map((e, i) => <Cell key={i} fill={e.color} fillOpacity={0.8} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Prediction Logs (first {Math.min(rows.length, 100)})</h3>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0" style={{ background: 'rgba(3,7,18,0.98)' }}>
                  <tr>
                    <th className="px-4 py-2.5 text-left text-[10px] text-gray-500 tracking-wider uppercase">#</th>
                    <th className="px-4 py-2.5 text-left text-[10px] text-gray-500 tracking-wider uppercase">Prediction</th>
                    <th className="px-4 py-2.5 text-left text-[10px] text-gray-500 tracking-wider uppercase">Confidence</th>
                    <th className="px-4 py-2.5 text-left text-[10px] text-gray-500 tracking-wider uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 100).map((row, i) => (
                    <tr key={i} className="border-t border-white/[0.03]">
                      <td className="px-4 py-2 text-xs text-gray-500 font-mono">{i + 1}</td>
                      <td className="px-4 py-2 text-xs font-bold font-mono" style={{ color: ATTACK_COLORS[row.prediction] || '#666' }}>{row.prediction}</td>
                      <td className="px-4 py-2 text-xs text-gray-300 font-mono">{row.confidence.toFixed(1)}%</td>
                      <td className="px-4 py-2">
                        {row.prediction === 'BENIGN'
                          ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]" style={{ background: 'rgba(0,255,65,0.08)', color: '#00ff41' }}><CheckCircle className="w-3 h-3" /> Safe</span>
                          : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]" style={{ background: 'rgba(255,0,64,0.08)', color: '#ff0040' }}><AlertTriangle className="w-3 h-3" /> Threat</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
