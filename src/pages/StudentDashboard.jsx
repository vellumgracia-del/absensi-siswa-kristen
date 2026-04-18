import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, onSnapshot, orderBy, addDoc } from 'firebase/firestore';
import { User, LogOut, BookOpen, ClipboardCheck, Pen } from 'lucide-react';
import { format, getDaysInMonth, startOfMonth } from 'date-fns';

export default function StudentDashboard({ user, onLogout }) {
  const [devotional, setDevotional] = useState({ date: '...', verse: 'Memuat...', content: 'Sedang mengambil data...' });
  const [agendas, setAgendas] = useState([]);
  const [attendances, setAttendances] = useState([]);
  
  const [attStatus, setAttStatus] = useState('Hadir');
  const [prayer, setPrayer] = useState('');
  const [dailyLog, setDailyLog] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Devotional listener
    const unsubDev = onSnapshot(query(collection(db, "smasa_devotional")), (snap) => {
      snap.forEach(doc => {
        if(doc.id === 'daily') setDevotional(doc.data());
      });
    });

    // Agenda listener
    const qAgenda = query(collection(db, "smasa_agenda"), where("isFinished", "!=", true), orderBy("timestamp", "desc"));
    const unsubAgenda = onSnapshot(qAgenda, (snap) => {
      const data = [];
      snap.forEach(doc => data.push({id: doc.id, ...doc.data()}));
      setAgendas(data);
    });

    // Attendance listener
    const qAtt = query(collection(db, "smasa_attendance"), where("nis", "==", user.nis));
    const unsubAtt = onSnapshot(qAtt, (snap) => {
      const data = [];
      snap.forEach(doc => data.push(doc.data()));
      setAttendances(data);
    });

    return () => { unsubDev(); unsubAgenda(); unsubAtt(); };
  }, [user.nis]);

  const submitAttendance = async (e) => {
    e.preventDefault();
    
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`; 
    
    // Check if already attended
    const alreadyAttended = attendances.some(a => a.date === todayStr);
    if (alreadyAttended) {
      return alert("Anda sudah absen hari ini!");
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "smasa_attendance"), {
        nis: user.nis,
        name: user.name,
        status: attStatus,
        prayer: prayer,
        dailyLog: dailyLog,
        timestamp: today.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}),
        date: todayStr,
        createdAt: new Date()
      });
      alert("Absen & Jurnal Terkirim!");
      setPrayer('');
      setDailyLog('');
    } catch (err) {
      console.error(err);
      alert("Gagal kirim.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCalendar = () => {
    const today = new Date();
    const daysInMonth = getDaysInMonth(today);
    const currentMonth = today.getMonth() + 1;
    const year = today.getFullYear();
    
    const elements = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const isPresent = attendances.some(l => {
        if(!l.date) return false;
        
        // Match string formats easily from original script
        if (l.date.startsWith(`${i}/`) || l.date.includes(`/${i}/${year}`)) return true;
        
        // Strict parsing
        try {
          const dParts = l.date.includes('/') ? l.date.split('/').reverse() : l.date.split('-');
          const d = new Date(dParts.join('-'));
          if(!isNaN(d.getTime())) {
            return d.getDate() === i && (d.getMonth() + 1) === currentMonth;
          }
        } catch(e){}
        return false;
      });

      elements.push(
        <div key={i} className={`cal-bubble ${isPresent ? 'bg-green-500 text-white shadow-md transform scale-110' : 'bg-slate-100 text-slate-400'}`}>
          {isPresent ? '✓' : i}
        </div>
      );
    }
    return elements;
  };

  return (
    <section className="h-full overflow-y-auto bg-slate-50 flex flex-col items-center p-4 md:p-6 animate-fade-in">
      <div className="w-full max-w-2xl space-y-6 pb-20">
        
        {/* Header */}
        <nav className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
              <User size={20} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Siswa / <span>{user.kelas || "Kelas -"}</span></p>
              <h2 className="text-sm font-bold text-slate-800">{user.name}</h2>
            </div>
          </div>
          <button onClick={onLogout} className="text-red-500 hover:bg-red-50 p-2 rounded-lg text-xs font-semibold flex items-center gap-1">
            <LogOut size={14} /> Logout
          </button>
        </nav>

        {/* Renungan Card */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-2 -mr-2 opacity-10">
            <BookOpen size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3 opacity-90">
              <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider">Renungan</span>
              <span className="text-[10px]">{devotional.date}</span>
            </div>
            <h3 className="text-lg font-serif font-bold leading-relaxed mb-2">"{devotional.verse}"</h3>
            <p className="text-blue-100 text-xs leading-relaxed">{devotional.content}</p>
          </div>
        </div>

        {/* Form Absensi & Jurnal */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4 text-sm flex items-center gap-2">
            <ClipboardCheck className="text-blue-600" size={18} /> Form Ibadah Harian
          </h3>
          
          <form onSubmit={submitAttendance} className="space-y-6">
            {/* 1. Status */}
            <div className="grid grid-cols-3 gap-2">
              {['Hadir', 'Sakit', 'Izin'].map(status => (
                <label key={status} className="cursor-pointer relative">
                  <input type="radio" name="attStatus" value={status} checked={attStatus === status} onChange={(e)=>setAttStatus(e.target.value)} className="peer sr-only" />
                  <div className={`py-2 px-2 rounded-lg border text-center transition-all ${attStatus === status ? 
                    (status === 'Hadir' ? 'bg-green-50 border-green-500 text-green-700' : 
                     status === 'Sakit' ? 'bg-red-50 border-red-500 text-red-700' : 
                     'bg-yellow-50 border-yellow-500 text-yellow-700') 
                    : 'border-slate-200 hover:bg-slate-50'}`}>
                    <span className="text-xs font-bold">{status}</span>
                  </div>
                </label>
              ))}
            </div>

            {/* 2. Kalender Checklist */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center mb-2 border-b border-slate-200 pb-2">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase">Jejak Kehadiran (Bulan Ini)</h3>
                <div className="text-[9px] text-slate-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span> Hadir
                </div>
              </div>
              <div className="calendar-grid">
                {renderCalendar()}
              </div>
            </div>
            
            {/* 3. Agenda Harian Siswa */}
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <label className="block text-xs font-bold text-blue-600 uppercase mb-2 flex items-center gap-2">
                <Pen size={14} /> Agenda / Kegiatan Harianmu
              </label>
              <textarea value={dailyLog} onChange={e=>setDailyLog(e.target.value)} rows="2" placeholder="Ceritakan kegiatan positifmu hari ini..." className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs resize-none"></textarea>
            </div>

            {/* 4. Renungan & Doa */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Isi Renungan & Pokok Doa</label>
              <textarea value={prayer} onChange={e=>setPrayer(e.target.value)} rows="2" placeholder="Tuliskan renungan atau doamu..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs resize-none"></textarea>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-xl shadow-lg transition-all text-sm disabled:opacity-75">
              {isSubmitting ? 'Mengirim...' : 'Kirim Absen'}
            </button>
          </form>
        </div>
        
        {/* Jadwal Agenda Sekolah */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 px-2">Jadwal Agenda Sekolah</h3>
          <ul className="space-y-2">
            {agendas.length > 0 ? agendas.map(a => (
              <li key={a.id} className="flex gap-3 p-2 bg-slate-50 rounded">
                <span className="font-bold text-blue-600 text-xs whitespace-nowrap">{a.time}</span>
                <span className="text-slate-700 text-xs">{a.title}</span>
              </li>
            )) : <li className="text-center text-slate-400 text-xs italic">Tidak ada agenda aktif.</li>}
          </ul>
        </div>

      </div>
    </section>
  );
}
