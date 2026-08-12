import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#030712]">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.02]"
          style={{ background: 'radial-gradient(circle, #00ff41 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.015]"
          style={{ background: 'radial-gradient(circle, #00aaff 0%, transparent 70%)' }} />
      </div>
      <Sidebar />
      <div className="ml-[260px] relative">
        <Header />
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
