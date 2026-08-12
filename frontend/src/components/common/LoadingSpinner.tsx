import { Shield } from 'lucide-react';

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="relative">
        <div className="w-16 h-16 border-2 border-white/[0.05] rounded-full" />
        <div className="absolute inset-0 w-16 h-16 border-2 border-transparent border-t-cyber-green rounded-full animate-spin" />
        <Shield className="absolute inset-0 m-auto w-6 h-6 text-cyber-green/40" />
      </div>
      <p className="text-xs text-gray-500 tracking-[0.3em] uppercase animate-pulse">Loading</p>
    </div>
  );
}
