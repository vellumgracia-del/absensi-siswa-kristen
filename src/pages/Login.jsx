import { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { BookOpen, Church, KeyRound, Loader2, ArrowLeft } from 'lucide-react';

const ADMIN_PASS = "admin123";

export default function Login({ onLoginStudent, onLoginAdmin }) {
  const [loginType, setLoginType] = useState('');
  const [nis, setNis] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (loginType === 'admin') {
        if (password === ADMIN_PASS) {
          onLoginAdmin();
        } else {
          setError("Password Admin Salah!");
        }
      } else {
        const q = query(collection(db, "smasa_students"), where("nis", "==", nis), where("pass", "==", password));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const d = snap.docs[0].data();
          onLoginStudent({ id: snap.docs[0].id, ...d });
        } else {
          setError("NIS/Password Salah!");
        }
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan. Cek koneksi Anda.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="h-full w-full flex items-center justify-center p-4 bg-[url('https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center overflow-y-auto">
      <div className="absolute inset-0 bg-blue-900/80 backdrop-blur-sm"></div>
      <div className="relative z-10 bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-fade-in min-h-[600px]">
        
        {/* Left Side Branding */}
        <div className="md:w-5/12 bg-gradient-to-br from-blue-800 to-indigo-900 p-10 flex flex-col justify-between text-white relative">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <BookOpen size={160} />
          </div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-lg">
              <BookOpen className="text-yellow-400" size={32} />
            </div>
            <p className="text-blue-200 font-serif italic mb-2 text-sm">"Takut akan Tuhan adalah permulaan pengetahuan"</p>
            <h1 className="text-2xl font-bold leading-tight mb-2">Siswa Kristen<br/>SMAN 1 Kandangan</h1>
          </div>
          <div className="relative z-10 text-[10px] text-blue-300 mt-8">&copy; 2026 Amaranggana.CO</div>
        </div>

        {/* Right Side Form / Options */}
        <div className="md:w-7/12 p-8 md:p-12 bg-white flex flex-col justify-center relative">
          
          {!loginType ? (
            <div className="w-full max-w-md mx-auto space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-1 font-serif">Shalom!</h2>
                <p className="text-sm text-slate-500">Sistem Absensi & Pembinaan Iman.</p>
              </div>
              <button onClick={() => setLoginType('student')} className="group w-full flex items-center p-4 border border-slate-200 rounded-2xl hover:border-blue-600 hover:bg-blue-50 transition-all text-left shadow-sm">
                <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center text-xl mr-4 group-hover:scale-110 transition-transform">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 group-hover:text-blue-700">Siswa</h3>
                  <p className="text-xs text-slate-500">Absensi & Renungan</p>
                </div>
              </button>
              <button onClick={() => setLoginType('admin')} className="group w-full flex items-center p-4 border border-slate-200 rounded-2xl hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left shadow-sm">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center text-xl mr-4 group-hover:scale-110 transition-transform">
                  <Church size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 group-hover:text-indigo-700">Guru Agama</h3>
                  <p className="text-xs text-slate-500">Admin Dashboard</p>
                </div>
              </button>
            </div>
          ) : (
            <div className="absolute inset-0 bg-white p-8 md:p-12 flex flex-col justify-center animate-fade-in z-20">
              <button onClick={() => {setLoginType(''); setError(''); setPassword(''); setNis('');}} className="absolute top-6 left-6 text-slate-400 hover:text-slate-700 flex items-center gap-2 text-sm font-medium">
                <ArrowLeft size={16} /> Kembali
              </button>
              <div className="w-full max-w-sm mx-auto">
                <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Login {loginType === 'student' ? 'Siswa' : 'Admin'}</h2>
                
                {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm text-center">{error}</div>}

                <form onSubmit={handleLogin} className="space-y-4">
                  {loginType === 'student' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">NIS Siswa</label>
                      <input type="text" required value={nis} onChange={e => setNis(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nomor Induk Siswa" />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                    <div className="relative">
                      <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none pr-10" placeholder="••••••••" />
                      <KeyRound className="absolute right-3 top-3.5 text-slate-400" size={18} />
                    </div>
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full bg-blue-800 hover:bg-blue-900 text-white font-bold py-3 rounded-xl shadow-lg transition-all mt-2 flex items-center justify-center">
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Masuk"}
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
