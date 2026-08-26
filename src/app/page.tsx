"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Dumbbell,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";
type View = "Dashboard" | "Member" | "Transaksi" | "Registrasi" | "Laporan" | "Personal Trainer" | "Pengaturan";
type Member = { id: string; name: string; email: string; phone?: string; paket: string; status: string; joined: string; expires: string; avatar: string; faceDescriptor?: number[]; jumlahKunjungan?: number; ptKuota?: number; ptTerpakai?: number; petugas?: string; komisi?: number };
type Transaction = { id: string; member: string; pt: string; date: string; paket: string; petugas?: string };
type Visit = { id: string; member: string; date: string; pt: string | null; petugas?: string };
type PersonalTrainer = { id: string; name: string; status: string; joined: string; expires: string; avatar: string };
type Package = { id: string; name: string; price: number; duration: string };
type Officer = { id: string; nama: string; username: string; password: string; status: string; superadmin: boolean };
type GymData = { members: Member[]; transactions: Transaction[]; visits: Visit[]; petugas: Officer[]; personalTrainers: PersonalTrainer[]; paket: Package[]; checkIns: number; revenue: { month: string; value: number }[] };
const emptyData: GymData = { members: [], transactions: [], visits: [], petugas: [], personalTrainers: [], paket: [], checkIns: 0, revenue: [] };

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

const parseIndonesianDate = (dateText: string) => {
  const monthMap: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, Mei: 4, Jun: 5, Jul: 6, Agu: 7, Sep: 8, Okt: 9, Nov: 10, Des: 11 };
  const [day, month, year] = dateText.split(" ");
  return new Date(Number(year), monthMap[month] ?? 0, Number(day));
};

const formatInputDate = (dateText?: string) => {
  if (!dateText) return "";
  const date = parseIndonesianDate(dateText);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const formatMemberDate = (dateText: string) => {
  const [year, month, day] = dateText.split("-").map(Number);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${String(day).padStart(2, "0")} ${monthNames[month - 1]} ${year}`;
};

const navItems: { label: View; icon: typeof LayoutDashboard }[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Member", icon: Users },
  { label: "Transaksi", icon: CircleDollarSign },
  { label: "Registrasi", icon: CalendarDays },
  { label: "Laporan", icon: BarChart3 },
  { label: "Personal Trainer", icon: Dumbbell },
];

const faceModelUrl = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";
let faceModelsPromise: Promise<void> | null = null;
let faceApiPromise: Promise<typeof import("@vladmandic/face-api")> | null = null;
const getFaceApi = () => {
  faceApiPromise ??= import("@vladmandic/face-api");
  return faceApiPromise;
};
const loadFaceModels = async () => {
  const faceapi = await getFaceApi();
  faceModelsPromise ??= Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(faceModelUrl),
    faceapi.nets.faceLandmark68Net.loadFromUri(faceModelUrl),
    faceapi.nets.faceRecognitionNet.loadFromUri(faceModelUrl),
  ]).then(() => undefined).catch((error) => { faceModelsPromise = null; throw error; });
  return faceModelsPromise;
};

export default function Home() {
  const [gymData, setGymData] = useState<GymData>(emptyData);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<View>("Dashboard");
  const [mobileNav, setMobileNav] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentOfficer, setCurrentOfficer] = useState<Officer | null>(null);
  const [query, setQuery] = useState("");

  const filteredMembers = members.filter((member) => member.name.toLowerCase().includes(query.toLowerCase()) || member.id.toLowerCase().includes(query.toLowerCase()));
  const handleNav = (view: View) => { setActiveView(view); setMobileNav(false); };
  const handleSaveMember = async (member: Member) => { const response = await fetch(`/api/members${editingMember ? `?id=${encodeURIComponent(member.id)}` : ""}`, { method: editingMember ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(member) }); if (!response.ok) { window.alert("Member gagal disimpan ke database."); return; } setMembers((currentMembers) => editingMember ? currentMembers.map((item) => item.id === member.id ? member : item) : [member, ...currentMembers]); setShowRegister(false); setEditingMember(null); setActiveView("Member"); };
  useEffect(() => { fetch("/api/gym-data").then((response) => { if (!response.ok) throw new Error("Gagal mengambil data gym"); return response.json() as Promise<GymData>; }).then((fetchedData) => { setGymData(fetchedData); setMembers(fetchedData.members); setTransactions(fetchedData.transactions); }).catch(() => setGymData(emptyData)).finally(() => setIsLoading(false)); }, []);

  if (isLoading) return <main className="loading-screen"><span className="brand-mark"><Dumbbell size={20} /></span><strong>Memuat data Fitness...</strong></main>;

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand"><span className="brand-mark"><Dumbbell size={20} /></span><span>Fitness</span></div>
        <nav className="nav-list" aria-label="Navigasi utama">
          <p className="nav-caption">Overview</p>
          {navItems.map(({ label, icon: Icon }) => <button key={label} onClick={() => handleNav(label)} className={`nav-item ${activeView === label ? "active" : ""}`}><Icon size={18} /><span>{label}</span>{label === "Transaksi" && <span className="nav-count">12</span>}</button>)}
          <p className="nav-caption nav-caption-spaced">System</p>
          <button onClick={() => handleNav("Pengaturan")} className={`nav-item ${activeView === "Pengaturan" ? "active" : ""}`}><Settings size={18} /><span>Pengaturan</span></button>
        </nav>
        <div className="sidebar-bottom"><div className="upgrade-box"><span className="upgrade-icon">✦</span><strong>Memberikan yang terbaik</strong><p>Kelola operasional lebih mudah bersama Fitness.</p></div><div className="profile-mini"><span className="avatar avatar-dark">AS</span><div><strong>Administrator</strong><small>admin@drmairunzi.id</small></div><ChevronDown size={15} /></div></div>
      </aside>
      {mobileNav && <button aria-label="Tutup navigasi" className="scrim" onClick={() => setMobileNav(false)} />}
      <section className="main-content">
        <header className="topbar"><button className="mobile-menu" aria-label="Buka navigasi" onClick={() => setMobileNav(true)}><Menu size={21} /></button><div className="breadcrumb"><span>Workspace</span><span>/</span><strong>{activeView}</strong></div><div className="top-actions"><button className="icon-button notification" aria-label="Notifikasi"><Bell size={19} /><i /></button><span className="top-divider" /><button className="user-menu" onClick={() => setIsLoggedIn(!isLoggedIn)}><span className="avatar avatar-green">AS</span><span className="user-copy"><strong>{currentOfficer?.nama ?? "Administrator"}</strong><small>{isLoggedIn ? "Online" : "Offline"}</small></span><ChevronDown size={15} /></button></div></header>
        <div className="content-wrap">
          {activeView === "Dashboard" && <Dashboard data={gymData} members={members} transactions={transactions} onRegister={() => setShowRegister(true)} onMembers={() => handleNav("Member")} />}
          {activeView === "Member" && <MemberView members={filteredMembers} query={query} setQuery={setQuery} onRegister={() => { setEditingMember(null); setShowRegister(true); }} onEdit={(member) => { setEditingMember(member); setShowRegister(true); }} />}
          {activeView === "Transaksi" && <TransactionView members={members} personalTrainers={gymData.personalTrainers} packages={gymData.paket} officer={currentOfficer} transactions={transactions} setTransactions={setTransactions} />}
          {activeView === "Registrasi" && <RegistrationView officer={currentOfficer} onSave={handleSaveMember} />}
          {activeView === "Laporan" && <><ReportView transactions={transactions} /><OfficerReport transactions={transactions} officers={gymData.petugas} members={members} /></>}
          {activeView === "Personal Trainer" && <TrainerMasterView trainers={gymData.personalTrainers} />}
          {activeView === "Pengaturan" && <SettingsView />}
        </div>
      </section>
      {(showLogin || !isLoggedIn) && <LoginModal officers={gymData.petugas} onLogin={(officer) => { setCurrentOfficer(officer); setShowLogin(false); setIsLoggedIn(true); }} />}
      {showRegister && <RegisterModal member={editingMember} officer={currentOfficer} onClose={() => { setShowRegister(false); setEditingMember(null); }} onSave={handleSaveMember} />}
      <button className="logout-fab" onClick={() => { setIsLoggedIn(false); setShowLogin(true); }}><LogOut size={16} /> Keluar</button>
    </main>
  );
}

function Dashboard({ data, members, transactions, onRegister, onMembers }: { data: GymData; members: Member[]; transactions: Transaction[]; onRegister: () => void; onMembers: () => void }) {
  const todayLabel = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(new Date());
  const todayShort = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date());
  const activeMembers = members.filter((member) => member.status === "Aktif");
  const monthlyRevenue = data.revenue.length ? data.revenue[data.revenue.length - 1].value * 1000000 : 0;
  const expiringMembers = members.filter((member) => member.status === "Akan berakhir").length;
  const planCounts = data.paket.slice(0, 3).map((paket) => ({ plan: paket.name, count: activeMembers.filter((member) => member.paket === paket.id).length }));
  const maxPlanCount = Math.max(...planCounts.map((item) => item.count), 1);
  return <>
    <div className="page-heading"><div><p className="eyebrow">{todayLabel}</p><h1>Selamat datang, Admin <span>✦</span></h1><p className="subheading">Berikut ringkasan performa Fitness hari ini.</p></div><button className="primary-button" onClick={onRegister}><Plus size={17} /> Registrasi member</button></div>
    <div className="metric-grid"><Metric icon={<Users />} label="Total member" value={members.length.toLocaleString("id-ID")} change={`${activeMembers.length} aktif`} detail="dari master member" tone="mint" /><Metric icon={<CircleDollarSign />} label="Pendapatan bulan ini" value={formatCurrency(monthlyRevenue)} change={`${transactions.length} transaksi`} detail="dari data transaksi" tone="yellow" /><Metric icon={<Dumbbell />} label="Check-in hari ini" value={data.visits.filter((visit) => visit.date === todayShort).length.toLocaleString("id-ID")} change="Data operasional" detail="kunjungan hari ini" tone="blue" /><Metric icon={<CalendarDays />} label="Membership berakhir" value={expiringMembers.toString()} change={expiringMembers ? "Perlu perhatian" : "Aman"} detail="status member" tone="coral" negative={expiringMembers > 0} /></div>
    <div className="dashboard-grid"><section className="panel revenue-panel"><div className="panel-header"><div><h2>Pendapatan</h2><p>Performa pendapatan 6 bulan terakhir</p></div><span className="data-badge">Dalam juta rupiah</span></div><div className="chart"><div className="chart-axis"><span>100 jt</span><span>75 jt</span><span>50 jt</span><span>25 jt</span><span>0</span></div><div className="chart-body"><div className="grid-lines"><i /><i /><i /><i /><i /></div><div className="bars">{data.revenue.map((item) => <div className="bar-column" key={item.month}><div className="bar-value">{item.value} jt</div><div className="bar" style={{ height: `${item.value}%` }} /><span>{item.month}</span></div>)}</div></div></div></section><section className="panel plan-panel"><div className="panel-header"><div><h2>Komposisi member</h2><p>{activeMembers.length} member aktif berdasarkan paket</p></div><button className="more-button">•••</button></div><div className="donut-wrap"><div className="donut"><strong>{activeMembers.length.toLocaleString("id-ID")}</strong><span>Member aktif</span></div><div className="legend">{planCounts.map((item, index) => <Legend key={item.plan} color={["green", "yellow", "blue"][index]} label={item.plan} value={`${Math.round((item.count / maxPlanCount) * 100)}%`} />)}</div></div><div className="plan-summary"><span>Paket paling diminati</span><strong>{planCounts.sort((a, b) => b.count - a.count)[0].plan} <ArrowUpRight size={15} /></strong></div></section></div>
    <section className="panel table-panel"><div className="panel-header"><div><h2>Member terbaru</h2><p>Member yang baru bergabung dengan Fitness</p></div><button className="text-button" onClick={onMembers}>Lihat semua <ArrowUpRight size={16} /></button></div><MemberTable members={members.slice(0, 4)} /></section><DailyReport visits={data.visits} members={members} transactions={transactions} today={todayShort} /><SessionNotifications members={members} /><TrainerReport visits={data.visits} trainers={data.personalTrainers} />
  </>;
}

function DailyReport({ visits, members, transactions, today }: { visits: Visit[]; members: Member[]; transactions: Transaction[]; today: string }) {
  const newMembers = members.filter((member) => member.joined === today).length;
  const todayTransactions = transactions.filter((transaction) => transaction.date === today).length;
  return <section className="panel daily-report"><div><p className="eyebrow">Laporan harian</p><h2>Aktivitas {today}</h2></div><div className="daily-stats"><div><strong>{visits.filter((visit) => visit.date === today).length}</strong><span>Jumlah hadir</span></div><div><strong>{newMembers}</strong><span>Pendaftar baru</span></div><div><strong>{todayTransactions}</strong><span>Transaksi</span></div></div></section>;
}

function SessionNotifications({ members }: { members: Member[] }) { const lowSessionMembers = members.filter((member) => { const remaining = (member.ptKuota ?? 0) - (member.ptTerpakai ?? 0); return remaining >= 0 && remaining <= 3; }); return <section className="panel notification-panel"><div className="panel-header"><div><h2>Notifikasi sisa sesi PT</h2><p>Member dengan sisa 2-3 sesi untuk ditawarkan perpanjangan.</p></div><Bell size={18} /></div><div className="notification-list">{lowSessionMembers.length ? lowSessionMembers.map((member) => <div className="notification-row" key={member.id}><span className="avatar avatar-pink">{member.avatar}</span><div><strong>{member.name}</strong><small>{Math.max((member.ptKuota ?? 0) - (member.ptTerpakai ?? 0), 0)} sesi tersisa</small></div><button className="secondary-button">Hubungi</button></div>) : <p className="empty-state">Tidak ada member dengan sesi PT yang hampir habis.</p>}</div></section>; }
function TrainerReport({ visits, trainers }: { visits: Visit[]; trainers: PersonalTrainer[] }) { return <section className="panel table-panel trainer-report"><div className="panel-header"><div><h2>Laporan sesi Personal Trainer</h2><p>Sesi dicatat oleh PT dan dibagi 60% trainer : 40% manajemen.</p></div><span className="data-badge">Fee per sesi</span></div><div className="table-scroll"><table><thead><tr><th>Personal trainer</th><th>Sesi tercatat</th><th>Porsi trainer</th><th>Porsi manajemen</th></tr></thead><tbody>{trainers.map((trainer) => { const sessions = visits.filter((visit) => visit.pt === trainer.id).length; return <tr key={trainer.id}><td><strong>{trainer.name}</strong><small className="table-subtext">{trainer.id}</small></td><td>{sessions} sesi</td><td>60%</td><td>40%</td></tr>; })}</tbody></table></div></section>; }
function TrainerMasterView({ trainers }: { trainers: PersonalTrainer[] }) { return <><div className="page-heading compact"><div><p className="eyebrow">Master data</p><h1>Personal Trainer</h1><p className="subheading">Kelola data trainer lepas dan masa berlaku kontraknya.</p></div><button className="primary-button"><Plus size={17} /> Tambah trainer</button></div><section className="panel table-panel"><div className="table-toolbar"><div className="search-box"><Search size={17} /><input placeholder="Cari personal trainer..." /></div><span className="data-badge">Fee 60% per sesi</span></div><div className="table-scroll"><table><thead><tr><th>Personal trainer</th><th>Status</th><th>Bergabung</th><th>Masa berlaku</th><th>Skema</th><th /></tr></thead><tbody>{trainers.map((trainer) => <tr key={trainer.id}><td><div className="member-cell"><span className="avatar avatar-green">{trainer.avatar}</span><div><strong>{trainer.name}</strong><small>{trainer.id}</small></div></div></td><td><span className={`status ${trainer.status === "Aktif" ? "status-active" : trainer.status === "Nonaktif" ? "status-off" : "status-warning"}`}><i />{trainer.status}</span></td><td>{trainer.joined}</td><td>{trainer.expires}</td><td><span className="plan-pill">60% : 40%</span></td><td><button className="kebab">•••</button></td></tr>)}</tbody></table></div></section></>; }

function Metric({ icon, label, value, change, detail, tone, negative = false }: { icon: React.ReactNode; label: string; value: string; change: string; detail: string; tone: string; negative?: boolean }) { return <div className="metric"><span className={`metric-icon ${tone}`}>{icon}</span><p>{label}</p><strong>{value}</strong><small className={negative ? "negative" : "positive"}>{negative ? "!" : "↗"} {change} <em>{detail}</em></small></div>; }
function Legend({ color, label, value }: { color: string; label: string; value: string }) { return <div className="legend-row"><i className={`dot ${color}`} /><span>{label}</span><strong>{value}</strong></div>; }

function MemberView({ members, query, setQuery, onRegister, onEdit }: { members: Member[]; query: string; setQuery: (v: string) => void; onRegister: () => void; onEdit: (member: Member) => void }) { return <><div className="page-heading compact"><div><p className="eyebrow">Database Fitness</p><h1>Master data member</h1><p className="subheading">Pantau profil, paket, dan masa aktif member.</p></div><button className="primary-button" onClick={onRegister}><Plus size={17} /> Tambah member</button></div><section className="panel table-panel"><div className="table-toolbar"><div className="search-box"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama atau ID member..." /></div><button className="select-button">Semua status <ChevronDown size={15} /></button></div><MemberTable members={members} onEdit={onEdit} /></section></>; }
function MemberTable({ members, onEdit }: { members: Member[]; onEdit?: (member: Member) => void }) { return <div className="table-scroll"><table><thead><tr><th>Member</th><th>Paket</th><th>Status</th><th>Kunjungan</th><th>Masa berlaku</th><th>Sisa PT</th><th /></tr></thead><tbody>{members.map((member) => { const ptRemaining = Math.max((member.ptKuota ?? 0) - (member.ptTerpakai ?? 0), 0); return <tr key={member.id}><td><div className="member-cell"><span className="avatar avatar-pink">{member.avatar}</span><div><strong>{member.name}</strong><small>{member.id}</small></div></div></td><td><span className="plan-pill">{member.paket}</span></td><td><span className={`status ${member.status === "Aktif" ? "status-active" : member.status === "Nonaktif" ? "status-off" : "status-warning"}`}><i />{member.status}</span></td><td>{member.jumlahKunjungan ?? 0} kali</td><td>{member.joined} - {member.expires}</td><td><span className={ptRemaining <= 3 ? "status status-warning" : "status status-active"}><i />{ptRemaining} sesi</span></td><td><button className="kebab" aria-label={`Edit ${member.name}`} onClick={() => onEdit?.(member)}><Settings size={15} /></button></td></tr>; })}</tbody></table></div>; }

function TransactionView({ members, personalTrainers, packages, officer, transactions, setTransactions }: { members: Member[]; personalTrainers: PersonalTrainer[]; packages: Package[]; officer: Officer | null; transactions: Transaction[]; setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>> }) {
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [faceVerified, setFaceVerified] = useState(false);
  const selectedTransactionMember = members.find((member) => member.id === selectedMemberId || member.name === selectedMemberId);
  const remainingPtSessions = selectedTransactionMember ? Math.max((selectedTransactionMember.ptKuota ?? 0) - (selectedTransactionMember.ptTerpakai ?? 0), 0) : 0;
  const todayLabel = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date());
  const filteredTransactions = transactions.filter((transaction) => `${transaction.id} ${transaction.member} ${transaction.pt} ${transaction.paket}`.toLowerCase().includes(query.toLowerCase()));
  useEffect(() => {
        const handleMemberChange = (event: Event) => {
      const input = event.target as HTMLInputElement;
      if (input.name !== "member") return;
      const member = members.find((item) => item.id === input.value || item.name === input.value);
      if (!member) return;
      setSelectedMemberId(member.id);
      setFaceVerified(false);
      const ptSelect = input.form?.elements.namedItem("pt") as HTMLSelectElement | null;
      const remainingSessions = Math.max((member.ptKuota ?? 0) - (member.ptTerpakai ?? 0), 0);
      if (ptSelect) { ptSelect.required = false; ptSelect.disabled = remainingSessions === 0; ptSelect.value = ""; }
      const expired = parseIndonesianDate(member.expires) < new Date();
      window.alert(`Informasi member\n\nID: ${member.id}\nNama: ${member.name}\nMasa berlaku: ${member.expires}${expired ? "\n\nMasa berlaku habis." : ""}`);
    };
    document.querySelectorAll<HTMLSelectElement>('select[name="pt"]').forEach((select) => { select.required = false; });
    document.addEventListener("change", handleMemberChange);
    return () => document.removeEventListener("change", handleMemberChange);
  }, [members]);
  const saveTransaction = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const member = String(formData.get("member") || "");
    const pt = String(formData.get("pt") || "");
    const paket = String(formData.get("paket") || "");
    if (!member || !paket) return;
    const selectedMember = members.find((item) => item.id === member || item.name === member);
    if (!selectedMember) {
      window.alert("Member tidak ditemukan. Silakan pilih member dari daftar master.");
      return;
    }
    if (!faceVerified) {
      window.alert("Wajah belum diverifikasi. Silakan lakukan face recognize terlebih dahulu.");
      return;
    }
    if (parseIndonesianDate(selectedMember.expires) < new Date()) {
      window.alert(`Masa berlaku member sudah habis.\n\nID: ${selectedMember.id}\nNama: ${selectedMember.name}\nBerakhir: ${selectedMember.expires}\n\nTransaksi tidak dapat dilakukan.`);
      return;
    }
    if (pt && remainingPtSessions === 0) {
      window.alert("Kuota sesi Personal Trainer member sudah habis. Pilih kunjungan mandiri tanpa PT.");
      return;
    }
    const currentDate = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date());
    const highestTransactionId = transactions.reduce((highest, item) => Math.max(highest, Number(item.id.match(/\d+$/)?.[0] ?? 0)), 8821);
    const transaction = { id: `TRX-${highestTransactionId + 1}`, member: selectedMember.id, pt, date: currentDate, paket, petugas: officer?.id };
    const response = await fetch("/api/transactions/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(transaction) });
    if (!response.ok) { const error = await response.json().catch(() => null) as { error?: string } | null; window.alert(error?.error ?? "Transaksi gagal disimpan ke database."); return; }
    setTransactions((currentTransactions) => [transaction, ...currentTransactions]);
    event.currentTarget.reset();
    setShowForm(false);
  };
  return <><div className="page-heading compact"><div><p className="eyebrow">Keuangan</p><h1>Transaksi hari ini</h1><p className="subheading">Aktivitas pembayaran Fitness pada {todayLabel}.</p></div><button className="primary-button" onClick={() => { setShowForm((isVisible) => !isVisible); setFaceVerified(false); }}><Plus size={17} /> {showForm ? "Tutup form" : "Buat transaksi"}</button></div>{showForm && <section className="panel form-panel transaction-form"><form className="register-form" onSubmit={saveTransaction}><div className="form-grid"><label>Member<input required name="member" list="member-options" placeholder="Ketik nama atau ID member..." autoComplete="off" /><datalist id="member-options">{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</datalist></label><label>Personal trainer<select required name="pt" defaultValue=""><option value="" disabled>Pilih personal trainer</option>{personalTrainers.map((trainer) => <option key={trainer.id} value={trainer.id}>{trainer.name} ({trainer.id})</option>)}</select></label><label>Paket membership<select required name="paket" defaultValue=""><option value="" disabled>Pilih paket</option>{packages.map((paket) => <option key={paket.id} value={paket.id}>{paket.name}</option>)}</select></label></div><FaceCapture expectedDescriptor={selectedTransactionMember?.faceDescriptor} verificationOnly onVerified={setFaceVerified} /><div className="form-actions"><button className="secondary-button" type="button" onClick={() => setShowForm(false)}>Batal</button><button className="primary-button" type="submit"><Check size={17} /> Simpan transaksi</button></div></form></section>}<section className="panel table-panel"><div className="table-toolbar"><div><h2>Transaksi hari ini</h2><p>{filteredTransactions.length} transaksi tercatat</p></div><div className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari transaksi..." /></div></div><div className="table-scroll"><table><thead><tr><th>ID transaksi</th><th>Member</th><th>Personal trainer</th><th>Tanggal</th><th>Paket</th></tr></thead><tbody>{filteredTransactions.map((trx) => <tr key={trx.id}><td><strong>{trx.id}</strong></td><td>{members.find((member) => member.id === trx.member)?.name ?? trx.member}</td><td>{personalTrainers.find((trainer) => trainer.id === trx.pt)?.name ?? trx.pt}</td><td>{trx.date}</td><td><span className="plan-pill">{packages.find((paket) => paket.id === trx.paket)?.name ?? trx.paket}</span></td></tr>)}</tbody></table></div></section></>;
}
function RegistrationView({ officer, onSave }: { officer: Officer | null; onSave: (member: Member) => void }) { return <><div className="page-heading compact"><div><p className="eyebrow">Member baru</p><h1>Registrasi member</h1><p className="subheading">Tambahkan member baru ke dalam database gym.</p></div></div><section className="form-panel"><RegisterForm officer={officer} onSave={onSave} /></section></>; }
function ReportView({ transactions }: { transactions: Transaction[] }) {
  const todayLabel = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric" }).format(new Date());
  return <><div className="page-heading compact"><div><p className="eyebrow">Insight bisnis</p><h1>Laporan transaksi</h1><p className="subheading">Data aktual transaksi Fitness per {todayLabel}.</p></div><button className="secondary-button"><ArrowUpRight size={16} /> Export laporan</button></div><div className="report-cards"><Metric icon={<CircleDollarSign />} label="Total transaksi" value={transactions.length.toLocaleString("id-ID")} change="Data real" detail="dari gym-data.json" tone="yellow" /><Metric icon={<Check />} label="Transaksi hari ini" value={transactions.filter((transaction) => transaction.date === todayLabel).length.toLocaleString("id-ID")} change="Tanggal aktif" detail="sesuai data transaksi" tone="mint" /><Metric icon={<Users />} label="Personal trainer" value={new Set(transactions.map((transaction) => transaction.pt)).size.toLocaleString("id-ID")} change="PT digunakan" detail="dalam transaksi" tone="blue" /></div><section className="panel table-panel"><div className="panel-header"><div><h2>Detail transaksi</h2><p>Daftar transaksi aktual dari data lokal.</p></div><strong className="report-total">{transactions.length} transaksi</strong></div><div className="table-scroll"><table><thead><tr><th>ID transaksi</th><th>Member</th><th>Personal trainer</th><th>Tanggal</th><th>Paket</th></tr></thead><tbody>{transactions.map((transaction) => <tr key={transaction.id}><td><strong>{transaction.id}</strong></td><td>{transaction.member}</td><td>{transaction.pt}</td><td>{transaction.date}</td><td><span className="plan-pill">{transaction.paket}</span></td></tr>)}</tbody></table></div></section></>;
}
function OfficerReport({ transactions, officers, members }: { transactions: Transaction[]; officers: Officer[]; members: Member[] }) {
  const rows = officers.map((officer) => {
    const officerTransactions = transactions.filter((transaction) => transaction.petugas === officer.id);
    const registeredMembers = members.filter((member) => member.petugas === officer.id).length;
    return { officer, transactionCount: officerTransactions.length, registeredMembers, commission: registeredMembers * 10 };
  }).filter((row) => row.transactionCount || row.registeredMembers);
  return <section className="panel table-panel officer-report"><div className="panel-header"><div><h2>Laporan berdasarkan petugas</h2><p>Aktivitas transaksi dan bonus registrasi per petugas.</p></div><span className="data-badge">Bonus 10% / member baru</span></div><div className="table-scroll"><table><thead><tr><th>Petugas</th><th>Role</th><th>Transaksi</th><th>Member baru</th><th>Bonus</th></tr></thead><tbody>{rows.map((row) => <tr key={row.officer.id}><td><strong>{row.officer.nama}</strong><small className="table-subtext">{row.officer.username}</small></td><td><span className="plan-pill">{row.officer.superadmin ? "Superadmin" : "Petugas"}</span></td><td>{row.transactionCount}</td><td>{row.registeredMembers}</td><td><strong>{row.commission}%</strong></td></tr>)}</tbody></table></div></section>;
}
function SettingsView() {
  const [saved, setSaved] = useState(false);
  return <><div className="page-heading compact"><div><p className="eyebrow">Konfigurasi aplikasi</p><h1>Pengaturan</h1><p className="subheading">Atur informasi gym dan preferensi operasional.</p></div></div><section className="form-panel settings-panel"><div className="settings-section"><h2>Profil gym</h2><p>Informasi yang tampil pada dashboard Fitness.</p><div className="form-grid"><label>Nama gym<input defaultValue="Fitness" /></label><label>Email admin<input type="email" defaultValue="admin@drmairunzi.id" /></label><label>Nomor telepon<input defaultValue="021-xxx-xxxx" /></label><label>Alamat gym<input defaultValue="Kota Bogor" /></label></div></div><div className="settings-section"><h2>Preferensi notifikasi</h2><p>Kelola pengingat penting untuk tim Anda.</p><label className="setting-toggle"><input type="checkbox" defaultChecked /><span><strong>Notifikasi transaksi</strong><small>Terima pemberitahuan saat transaksi baru dibuat.</small></span></label><label className="setting-toggle"><input type="checkbox" defaultChecked /><span><strong>Pengingat membership</strong><small>Ingatkan admin saat masa aktif member akan berakhir.</small></span></label></div><div className="form-actions"><span className="save-message">{saved ? "Pengaturan berhasil disimpan." : ""}</span><button className="primary-button" onClick={() => setSaved(true)}><Check size={17} /> Simpan pengaturan</button></div></section></>;
}

function LoginModal({ officers, onLogin }: { officers: Officer[]; onLogin: (officer: Officer) => void }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState("");
  const submitLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const officer = officers.find((item) => item.username === username && item.password === password && item.status === "Aktif");
    if (officer) { onLogin(officer); return; }
    setError("Username atau password salah.");
  };
  return <div className="modal-backdrop"><form className="modal login-modal" onSubmit={submitLogin}><span className="brand-mark large"><Dumbbell size={22} /></span><h2>Masuk ke Fitness</h2><p>Kelola studio gym Anda dengan lebih ringan.</p><label>Username<input required value={username} onChange={(event) => setUsername(event.target.value)} /></label><label>Password<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <small className="negative">{error}</small>}<button className="primary-button full" type="submit"><LogIn size={17} /> Masuk ke dashboard</button></form></div>;
}
function RegisterForm({ member, officer, onSave }: { member?: Member | null; officer: Officer | null; onSave: (member: Member) => void }) {
  const [form, setForm] = useState({ name: member?.name ?? "", email: member?.email ?? "", phone: member?.phone ?? "", paket: member?.paket ?? "PK-001", joined: formatInputDate(member?.joined), expires: formatInputDate(member?.expires) });
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | undefined>(member?.faceDescriptor);
  const updateForm = (field: keyof typeof form, value: string) => setForm((currentForm) => ({ ...currentForm, [field]: value }));
  const submitForm = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name || !form.email.trim() || !form.phone.trim() || !form.joined || !form.expires) return;
    if (form.expires < form.joined) { window.alert("Masa berlaku berakhir tidak boleh sebelum tanggal mulai."); return; }
    const avatar = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
    if (!faceDescriptor) { window.alert("Biometrik wajah wajib direkam sebelum member disimpan."); return; }
    onSave({ id: member?.id ?? `GM-${Math.floor(2400 + Math.random() * 90)}`, name, email: form.email.trim(), phone: form.phone.trim(), paket: form.paket, status: member?.status ?? "Aktif", joined: formatMemberDate(form.joined), expires: formatMemberDate(form.expires), avatar, faceDescriptor, jumlahKunjungan: member?.jumlahKunjungan, ptKuota: member?.ptKuota, ptTerpakai: member?.ptTerpakai, petugas: member?.petugas ?? officer?.id, komisi: member?.komisi ?? 10 });
  };
  return <form className="register-form" onSubmit={submitForm}><div className="form-grid"><label>Nama lengkap<input required value={form.name} onChange={(event) => updateForm("name", event.target.value)} placeholder="Contoh: Rani Kusuma" /></label><label>Email<input required type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} placeholder="nama@email.com" /></label><label>Nomor telepon<input required value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} placeholder="08xx-xxxx-xxxx" /></label><label>Paket membership<select value={form.paket} onChange={(event) => updateForm("paket", event.target.value)}><option>PK-001</option><option>PK-002</option><option>PK-003</option><option>PK-004</option><option>PK-005</option></select></label><label>Tanggal mulai<input required type="date" value={form.joined} onChange={(event) => updateForm("joined", event.target.value)} /></label><label>Tanggal berakhir<input required type="date" value={form.expires} onChange={(event) => updateForm("expires", event.target.value)} /></label></div><FaceCapture initialDescriptor={faceDescriptor} onCapture={setFaceDescriptor} /><div className="form-actions"><button className="primary-button" type="submit"><Check size={17} /> Simpan member</button></div></form>;
}
function RegisterModal({ member, officer, onClose, onSave }: { member: Member | null; officer: Officer | null; onClose: () => void; onSave: (member: Member) => void }) { return <div className="modal-backdrop"><div className="modal register-modal"><div className="modal-title"><div><p className="eyebrow">{member ? "Perbarui data" : "Member baru"}</p><h2>{member ? "Edit member" : "Tambah member"}</h2></div><button className="close-button" onClick={onClose}><X size={18} /></button></div><RegisterForm member={member} officer={officer} onSave={onSave} /></div></div>; }

function FaceCapture({ initialDescriptor, expectedDescriptor, onCapture, onVerified, verificationOnly = false }: { initialDescriptor?: number[]; expectedDescriptor?: number[]; onCapture?: (descriptor: number[]) => void; onVerified?: (verified: boolean) => void; verificationOnly?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState(initialDescriptor ? "Biometrik wajah sudah tersimpan." : "Kamera siap digunakan.");
  const [cameraOn, setCameraOn] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!cameraOn || !video || !stream) return;
    video.srcObject = stream;
    void video.play().catch(() => setStatus("Video kamera tidak dapat diputar. Periksa izin browser."));
  }, [cameraOn]);
  useEffect(() => () => { streamRef.current?.getTracks().forEach((track) => track.stop()); }, []);
  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Kamera tidak didukung browser");
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      setCameraOn(true);
      setStatus("Kamera aktif. Memuat model wajah...");
      void loadFaceModels().then(() => setStatus("Posisikan wajah di kamera, lalu tekan Face recognize.")).catch(() => setStatus("Kamera aktif, tetapi model wajah gagal dimuat. Periksa koneksi internet."));
    } catch { setStatus("Akses kamera gagal. Pastikan izin kamera sudah diberikan dan gunakan HTTPS atau localhost."); }
  };
  const captureFace = async () => {
    const video = videoRef.current;
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth) { setStatus("Video kamera belum siap. Tunggu sebentar lalu coba lagi."); return; }
    setBusy(true);
    try {
      const faceapi = await getFaceApi();
      await Promise.race([loadFaceModels(), new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error("Model timeout")), 10000))]);
      const result = await Promise.race([faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })).withFaceLandmarks().withFaceDescriptor(), new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error("Detection timeout")), 5000))]);
      if (!result) { setStatus("Wajah tidak terdeteksi. Atur pencahayaan dan posisi wajah."); onVerified?.(false); return; }
      const descriptor = Array.from(result.descriptor);
      if (descriptor.length !== 128 || descriptor.some((value) => !Number.isFinite(value))) throw new Error("Descriptor wajah tidak valid");
      if (verificationOnly) { const verified = expectedDescriptor ? faceapi.euclideanDistance(expectedDescriptor, descriptor) < 0.52 : false; onVerified?.(verified); setStatus(verified ? "Wajah dikenali dan sesuai master member." : "Wajah tidak dikenali. Tidak sesuai master member."); if (!verified) window.alert("Wajah tidak dikenali. Wajah tidak sesuai dengan master member."); }
      else if (onCapture) { onCapture(descriptor); setStatus("Wajah tersimpan di form. Klik Simpan member untuk menyimpan ke master."); }
    } catch (error) { const detail = error instanceof Error ? error.message : "Kesalahan tidak diketahui"; setStatus(`Pengenalan wajah gagal: ${detail}. Coba ulangi.`); onVerified?.(false); }
    finally { setBusy(false); }
  };
  return <div className="face-capture"><div className="face-capture-header"><div><strong>Biometrik wajah</strong><small>{status}</small></div>{!cameraOn && <button className="secondary-button" type="button" onClick={startCamera}>Buka kamera</button>}</div>{cameraOn && <><video ref={videoRef} className="face-video" muted playsInline /><button className="primary-button" type="button" onClick={captureFace} disabled={busy}>{busy ? "Memeriksa..." : verificationOnly ? "Face recognize" : "Ambil wajah"}</button></>}</div>;
}
