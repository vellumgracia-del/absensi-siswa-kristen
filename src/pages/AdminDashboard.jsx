import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, onSnapshot, orderBy, doc, deleteDoc, updateDoc, setDoc, addDoc } from 'firebase/firestore';
import { LayoutDashboard, BookOpen, ClipboardList, Users, CalendarDays, LogOut, Menu, X, FileSpreadsheet, Edit, Trash, CheckCircle2, Cross } from 'lucide-react';

export default function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // States
  const [attendances, setAttendances] = useState([]);
  const [students, setStudents] = useState([]);
  const [agendas, setAgendas] = useState([]);

  // Dashboard Stats
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalPresent, setTotalPresent] = useState(0);
  const [prayers, setPrayers] = useState([]);

  // Forms
  const [devVerse, setDevVerse] = useState('');
  const [devContent, setDevContent] = useState('');
  
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [newNis, setNewNis] = useState('');
  const [newName, setNewName] = useState('');
  const [newClass, setNewClass] = useState('');
  const [newPass, setNewPass] = useState('');

  const [agendaTime, setAgendaTime] = useState('');
  const [agendaTitle, setAgendaTitle] = useState('');

  useEffect(() => {
    // Attendees listener
    const qAtt = query(collection(db, "smasa_attendance"), orderBy("createdAt", "desc"));
    const unsubAtt = onSnapshot(qAtt, (snap) => {
      const atts = [];
      let present = 0;
      const prayList = [];
      snap.forEach(doc => {
        const d = doc.data();
        atts.push(d);
        if(d.status === 'Hadir') present++;
        if(d.prayer && d.prayer.length > 2) prayList.push({name: d.name, text: d.prayer});
      });
      setAttendances(atts);
      setTotalPresent(present);
      setPrayers(prayList);
    });

    // Students Listener
    const qStu = query(collection(db, "smasa_students"), orderBy("name"));
    const unsubStu = onSnapshot(qStu, (snap) => {
      setTotalStudents(snap.size);
      const stus = [];
      snap.forEach(doc => stus.push({id: doc.id, ...doc.data()}));
      setStudents(stus);
    });

    // Agenda Listener
    const qAgenda = query(collection(db, "smasa_agenda"), orderBy("timestamp", "desc"));
    const unsubAgenda = onSnapshot(qAgenda, (snap) => {
      const ags = [];
      snap.forEach(doc => ags.push({id: doc.id, ...doc.data()}));
      setAgendas(ags);
    });

    return () => { unsubAtt(); unsubStu(); unsubAgenda(); };
  }, []);

  // --- ACTIONS ---
  
  const saveDevotional = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "smasa_devotional", "daily"), {
        date: new Date().toLocaleDateString('id-ID'),
        verse: devVerse,
        content: devContent
      });
      alert("Renungan Terbit!");
    } catch(err) { console.error(err); alert("Gagal"); }
  };

  const exportCSV = () => {
    let csv = "Tanggal,Waktu,NIS,Nama,Status,Renungan_Doa,Agenda_Siswa\n";
    attendances.forEach(l => { 
      const safePrayer = (l.prayer || '').replace(/"/g, '""');
      const safeLog = (l.dailyLog || '').replace(/"/g, '""');
      csv += `"${l.date}","${l.timestamp}","${l.nis}","${l.name}","${l.status}","${safePrayer}","${safeLog}"\n`; 
    });
    const link = document.createElement("a"); 
    link.href = "data:text/csv;charset=utf-8," + encodeURI(csv); 
    link.download = "Absensi_SARKRIS_Full.csv"; 
    link.click();
  };

  const saveStudent = async () => {
    if(!newNis || !newName || !newPass) return alert("Lengkapi data!");
    const data = { nis: newNis, name: newName, kelas: newClass, pass: newPass };
    try {
      if(editingStudentId) { 
        await updateDoc(doc(db, "smasa_students", editingStudentId), data); 
        alert("Diperbarui!"); 
      } else { 
        await addDoc(collection(db, "smasa_students"), data); 
        alert("Ditambahkan"); 
      }
      cancelEditStudent();
    } catch(e) { console.error(e); alert("Gagal"); }
  };

  const editStudent = (s) => {
    setEditingStudentId(s.id);
    setNewNis(s.nis); setNewName(s.name); setNewClass(s.kelas || ""); setNewPass(s.pass);
  };

  const cancelEditStudent = () => {
    setEditingStudentId(null);
    setNewNis(''); setNewName(''); setNewClass(''); setNewPass('');
  };

  const deleteDocFirebase = async (col, id) => {
    if(confirm("Hapus data ini permanen?")) {
      try { await deleteDoc(doc(db, col, id)); } catch(e) { console.error(e); }
    }
  };

  const addAgenda = async () => {
    if(!agendaTime || !agendaTitle) return;
    try {
      await addDoc(collection(db, "smasa_agenda"), { time: agendaTime, title: agendaTitle, timestamp: new Date(), isFinished: false });
      setAgendaTime(''); setAgendaTitle('');
    } catch(e) { console.error(e); }
  };

  const finishAgenda = async (id) => {
    if(confirm("Tandai agenda sebagai selesai?")) {
      await updateDoc(doc(db, "smasa_agenda", id), { isFinished: true });
    }
  };

  // Nav helper
  const tabs = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'devotional', icon: BookOpen, label: 'Renungan' },
    { id: 'attendance', icon: ClipboardList, label: 'Absensi' },
    { id: 'students', icon: Users, label: 'Data Siswa' },
    { id: 'agenda', icon: CalendarDays, label: 'Agenda' },
  ];

  return (
    <section className="h-screen flex bg-slate-50 overflow-hidden animate-fade-in">
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 bg-white border-r border-slate-200 z-30 flex flex-col w-64 shadow-sm transform transition-transform md:translate-x-0 md:static md:flex ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-20 flex items-center gap-3 px-6 border-b border-slate-100 bg-blue-900 text-white">
          <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
            <span className="font-bold">+</span>
          </div>
          <div><span className="font-bold text-sm block">Guru Agama</span><span className="text-[10px] text-blue-200">Admin Mode</span></div>
          {isMobileMenuOpen && (
            <button className="md:hidden ml-auto text-white/70 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
              <X size={20} />
            </button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scroll">
          {tabs.map(tab => (
             <button key={tab.id} onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === tab.id ? 'bg-blue-50 text-blue-800 font-semibold border-r-4 border-blue-800' : 'text-slate-600 hover:bg-slate-50'}`}>
               <tab.icon size={18} className={activeTab === tab.id ? 'text-blue-800' : 'text-slate-400'} />
               <span className="text-sm">{tab.label}</span>
             </button>
          ))}
        </div>
        <div className="p-4 border-t border-slate-100">
          <button onClick={onLogout} className="w-full text-red-600 text-xs font-bold hover:bg-red-50 p-2 rounded flex items-center justify-center gap-2">
            <LogOut size={14} /> Keluar
          </button>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
        <div className="md:hidden bg-white p-4 flex justify-between items-center shadow-sm z-20">
          <button onClick={()=>setIsMobileMenuOpen(true)}>
            <Menu className="text-slate-600" size={24} />
          </button>
          <span className="font-bold text-blue-900">Admin Panel</span>
          <button onClick={onLogout} className="text-red-500 text-xs font-bold">Keluar</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scroll relative">
          
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Siswa</p>
                  <h3 className="text-2xl font-bold text-slate-800">{totalStudents}</h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Hadir</p>
                  <h3 className="text-2xl font-bold text-green-600">{totalPresent}</h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Doa</p>
                  <h3 className="text-2xl font-bold text-purple-600">{prayers.length}</h3>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <h3 className="font-bold text-purple-800 mb-3 text-sm flex items-center gap-2">Pokok Doa (Realtime)</h3>
                <ul className="divide-y text-sm">
                  {prayers.length > 0 ? prayers.map((p, i) => (
                    <li key={i} className="py-3"><b className="text-slate-800">{p.name}:</b> <span className="text-slate-600 italic">"{p.text}"</span></li>
                  )) : <li className="py-3 text-center text-slate-400">Nihil</li>}
                </ul>
              </div>
            </div>
          )}

          {/* Devotional Tab */}
          {activeTab === 'devotional' && (
            <div className="space-y-4 max-w-2xl animate-fade-in">
              <h2 className="font-bold text-lg text-slate-800">Kelola Renungan</h2>
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <form onSubmit={saveDevotional} className="space-y-4">
                  <input type="text" value={devVerse} onChange={e=>setDevVerse(e.target.value)} className="w-full border p-3 rounded-lg text-sm focus:ring-2 ring-blue-500 outline-none" placeholder="Ayat Emas (e.g. Mazmur 23:1)" required />
                  <textarea rows="4" value={devContent} onChange={e=>setDevContent(e.target.value)} className="w-full border p-3 rounded-lg text-sm focus:ring-2 ring-blue-500 outline-none" placeholder="Isi renungan..." required></textarea>
                  <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-700">Terbitkan</button>
                </form>
              </div>
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-lg text-slate-800">Data Absensi & Jurnal</h2>
                <button onClick={exportCSV} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-green-700 flex items-center gap-2">
                  <FileSpreadsheet size={16} /> Export CSV
                </button>
              </div>
              <div className="bg-white rounded-xl border overflow-x-auto shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 font-bold text-xs uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-3">Waktu</th>
                      <th className="p-3">Nama</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Renungan & Doa</th>
                      <th className="p-3">Agenda Siswa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendances.map((d, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-3 text-slate-500 text-xs whitespace-nowrap">{d.date}<br/>{d.timestamp}</td>
                        <td className="p-3 font-bold text-slate-800">{d.name}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${d.status==='Hadir'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="p-3 text-xs italic text-slate-600 max-w-[200px] truncate">{d.prayer||'-'}</td>
                        <td className="p-3 text-xs text-blue-600 max-w-[200px] truncate">{d.dailyLog||'-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="font-bold text-lg text-slate-800">Data Siswa</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border space-y-3 h-fit shadow-sm relative sticky top-0">
                  <h3 className="text-xs font-bold text-slate-400 uppercase">{editingStudentId ? 'Edit Data Siswa' : 'Tambah Siswa'}</h3>
                  <input value={newNis} onChange={e=>setNewNis(e.target.value)} placeholder="NIS" className="border p-2 rounded text-sm w-full outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Nama Lengkap" className="border p-2 rounded text-sm w-full outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  <input value={newClass} onChange={e=>setNewClass(e.target.value)} placeholder="Kelas (e.g. XI IPA 1)" className="border p-2 rounded text-sm w-full outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  <input value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="Password" type="password" className="border p-2 rounded text-sm w-full outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  
                  <div className="flex gap-2 pt-2">
                    {editingStudentId && <button onClick={cancelEditStudent} className="flex-1 bg-gray-200 text-gray-700 p-2 rounded text-sm font-bold hover:bg-gray-300">Batal</button>}
                    <button onClick={saveStudent} className="flex-1 bg-blue-600 text-white p-2 rounded text-sm font-bold hover:bg-blue-700">{editingStudentId ? 'Update' : 'Simpan'}</button>
                  </div>
                </div>
                <div className="md:col-span-2 bg-white rounded-xl border overflow-x-auto shadow-sm">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 font-bold text-xs uppercase text-slate-500 border-b">
                      <tr>
                        <th className="p-3">NIS</th>
                        <th className="p-3">Nama</th>
                        <th className="p-3">Kelas</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono text-blue-600">{s.nis}</td>
                          <td className="p-3 font-medium text-slate-800">{s.name}</td>
                          <td className="p-3 text-slate-500">{s.kelas || '-'}</td>
                          <td className="p-3 text-right flex justify-end gap-2">
                            <button onClick={()=>editStudent(s)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded"><Edit size={16}/></button>
                            <button onClick={()=>deleteDocFirebase('smasa_students', s.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash size={16}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Agenda Tab */}
          {activeTab === 'agenda' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="font-bold text-lg mb-4 text-slate-800">Agenda Aktif</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl border space-y-3 h-fit shadow-sm sticky top-0">
                    <h3 className="text-xs font-bold text-slate-400 uppercase">Tambah Agenda Baru</h3>
                    <input value={agendaTime} onChange={e=>setAgendaTime(e.target.value)} placeholder="Waktu (e.g. Jumat 12:00)" className="border p-2 rounded text-sm w-full outline-none focus:ring-1 focus:ring-blue-500" />
                    <input value={agendaTitle} onChange={e=>setAgendaTitle(e.target.value)} placeholder="Kegiatan" className="border p-2 rounded text-sm w-full outline-none focus:ring-1 focus:ring-blue-500" />
                    <button onClick={addAgenda} className="bg-blue-600 text-white p-2 rounded w-full text-sm font-bold hover:bg-blue-700">Tambah</button>
                  </div>
                  <div className="md:col-span-2 bg-white rounded-xl border p-4 shadow-sm">
                    <ul className="space-y-2 text-sm">
                      {agendas.filter(a => !a.isFinished).map(a => (
                        <li key={a.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <div>
                            <b className="text-blue-600 block text-xs mb-1">{a.time}</b>
                            <span className="text-slate-700 font-medium">{a.title}</span>
                          </div>
                          <button onClick={()=>finishAgenda(a.id)} className="bg-green-100 text-green-700 px-3 py-1.5 rounded pointer hover:bg-green-200 flex items-center gap-1 text-xs font-bold transition-colors">
                            <CheckCircle2 size={14} /> Selesai
                          </button>
                        </li>
                      ))}
                      {agendas.filter(a => !a.isFinished).length === 0 && <li className="text-center text-slate-400 italic text-sm">Tidak ada agenda aktif</li>}
                    </ul>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="font-bold text-lg mb-4 text-gray-500">Riwayat Selesai</h2>
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 shadow-sm">
                  <ul className="space-y-2 text-sm">
                    {agendas.filter(a => a.isFinished).map(a => (
                      <li key={a.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 opacity-75">
                        <div>
                          <b className="text-gray-500 block text-xs mb-1">{a.time}</b>
                          <span className="text-gray-600 font-medium line-through">{a.title}</span>
                        </div>
                        <button onClick={()=>deleteDocFirebase('smasa_agenda', a.id)} className="text-red-400 hover:text-red-600 text-xs font-bold bg-red-50 p-2 rounded">
                          <Trash size={16} />
                        </button>
                      </li>
                    ))}
                    {agendas.filter(a => a.isFinished).length === 0 && <li className="text-center text-slate-400 italic text-sm">Belum ada riwayat</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </section>
  );
}
