import { useState, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./components/ui/dialog";
import {
  Home,
  Calendar as CalIcon,
  Heart,
  User,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Trophy,
  Check,
  LogOut,
  Lock,
  Mail,
  Pencil,
  Trash2,
  Star,
  Camera,
  ImagePlus,
  Bluetooth,
  BluetoothConnected,
  BluetoothOff,
  Send,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type Screen = "auth" | "onboarding" | "main";
type MainTab = "home" | "calendar" | "health" | "profile";
type PetType =
  | "gato" | "perro" | "conejo" | "panda" | "zorro"
  | "oso" | "leon" | "tigre" | "koala" | "hamster";
type Mood = "feliz" | "tranquilo" | "triste" | "cansado" | "estresado" | "motivado" | "otra";
type Priority = "baja" | "media" | "alta";

interface Task {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  priority: Priority;
  completed: boolean;
  emoji: string;
}

interface CheckinRecord {
  date: string;
  mood: Mood;
  customMood?: string;
  sleep: number;
  energy: number;
  influences: string[];
  note: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PET_EMOJIS: Record<PetType, string> = {
  gato: "🐱", perro: "🐶", conejo: "🐰", panda: "🐼", zorro: "🦊",
  oso: "🐻", leon: "🦁", tigre: "🐯", koala: "🐨", hamster: "🐹",
};

const MOOD_DATA: Record<Mood, { emoji: string; label: string; color: string; bg: string }> = {
  feliz:     { emoji: "😊", label: "Feliz",     color: "#F59E0B", bg: "#FEF3C7" },
  tranquilo: { emoji: "😌", label: "Tranquilo", color: "#3BBFB4", bg: "#CCFBF1" },
  triste:    { emoji: "😢", label: "Triste",    color: "#6B7A99", bg: "#E2E8F0" },
  cansado:   { emoji: "😴", label: "Cansado",   color: "#9B7ADB", bg: "#EDE9FE" },
  estresado: { emoji: "😰", label: "Estresado", color: "#EF4444", bg: "#FEE2E2" },
  motivado:  { emoji: "🚀", label: "Motivado",  color: "#22C55E", bg: "#DCFCE7" },
  otra:      { emoji: "💭", label: "Otra",      color: "#152540", bg: "#E8F4F8" },
};

const TASK_EMOJIS = [
  "📚","📝","💪","🏃","🎯","🔬","🎵","🍎","💡","⚽",
  "🎨","🧘","📖","💻","🎓","🏊","📊","✏️","🔧","🏋️",
  "🧪","🎤","🏆","🌱","🎭","🧠","📐","🔭","🎸","🏅",
];

const SPORTS = [
  "Fútbol", "Baloncesto", "Voleibol", "Natación", "Atletismo",
  "Tenis", "Ciclismo", "Gimnasia", "Artes Marciales", "Crossfit", "Yoga", "Otro",
];

const INFLUENCES = ["Estudios", "Sueño", "Familia", "Amigos", "Actividad física", "Redes sociales", "Otro"];

const QUOTES = [
  "El descanso no es inactividad — es parte del rendimiento.",
  "Cada pequeño paso cuenta. Estás haciendo un gran trabajo.",
  "Cuídate a ti mismo para poder dar lo mejor de ti.",
  "Los errores son parte del aprendizaje, no del fracaso.",
  "Hoy es un buen día para ser amable contigo mismo.",
  "Tu bienestar importa tanto como tus calificaciones.",
  "El equilibrio es la clave del éxito sostenible.",
];

// ─── BLE Constants ───────────────────────────────────────────────────────────
// Nordic UART Service — adjust to match your ESP32 firmware if different
const BLE_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const BLE_CHAR_RX_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";

const MONTH_NAMES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
const DAY_NAMES_SHORT = ["D","L","M","M","J","V","S"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayStr() { return new Date().toISOString().split("T")[0]; }
function daysAgo(n: number) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}
function dateToStr(d: Date) { return d.toISOString().split("T")[0]; }
function dailyQuote() { return QUOTES[new Date().getDate() % QUOTES.length]; }

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  const checks = [pw.length >= 8, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)];
  const count = checks.filter(Boolean).length;
  if (count <= 1) return { score: 1, label: "Débil",      color: "#EF4444" };
  if (count === 2) return { score: 2, label: "Regular",   color: "#F59E0B" };
  if (count === 3) return { score: 3, label: "Fuerte",    color: "#22C55E" };
  return            { score: 4, label: "Muy fuerte", color: "#10B981" };
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const days: { date: Date; inMonth: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--)
    days.push({ date: new Date(year, month - 1, daysInPrev - i), inMonth: false });
  for (let d = 1; d <= daysInMonth; d++)
    days.push({ date: new Date(year, month, d), inMonth: true });
  while (days.length < 42) {
    const extra = days.length - firstDay - daysInMonth + 1;
    days.push({ date: new Date(year, month + 1, extra), inMonth: false });
  }
  return days;
}

function priorityColor(p: Priority) { return { alta: "#EF4444", media: "#F59E0B", baja: "#22C55E" }[p]; }
function priorityBg(p: Priority)    { return { alta: "#FEE2E2", media: "#FEF3C7", baja: "#DCFCE7" }[p]; }
function priorityLabel(p: Priority) { return { alta: "Alta",    media: "Media",    baja: "Baja"    }[p]; }

function getMoodDisplay(rec: CheckinRecord) {
  if (rec.mood === "otra") return { emoji: "💭", label: rec.customMood || "Otra", color: "#152540", bg: "#E8F4F8" };
  return MOOD_DATA[rec.mood as Mood] ?? MOOD_DATA.feliz;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function App() {
  // ── Routing ───────────────────────────────────────────────────────────────
  const [screen, setScreen]             = useState<Screen>("auth");
  const [mainTab, setMainTab]           = useState<MainTab>("home");
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [authTab, setAuthTab]           = useState<"login" | "signup">("login");

  // ── Login ─────────────────────────────────────────────────────────────────
  const [loginEmail, setLoginEmail]     = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPw, setShowLoginPw]   = useState(false);
  const [loginError, setLoginError]     = useState("");

  // ── Signup ────────────────────────────────────────────────────────────────
  const [signupName, setSignupName]     = useState("");
  const [signupEmail, setSignupEmail]   = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm]   = useState("");
  const [showSignupPw, setShowSignupPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [habeasData, setHabeasData]     = useState(false);
  const [signupError, setSignupError]   = useState("");

  // ── User ──────────────────────────────────────────────────────────────────
  const [userName, setUserName]   = useState("Ana García");
  const [userEmail, setUserEmail] = useState("ana@universidad.edu");
  const [userAge, setUserAge]     = useState("");
  const [userSport, setUserSport] = useState("");

  // ── BLE ───────────────────────────────────────────────────────────────────
  type BleStatus = "idle" | "connecting" | "connected" | "error";
  const [bleStatus, setBleStatus]   = useState<BleStatus>("idle");
  const [bleMessage, setBleMessage] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bleCharRef  = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bleDeviceRef = useRef<any>(null);

  // ── Profile photo ─────────────────────────────────────────────────────────
  const [profilePhoto, setProfilePhoto]       = useState<string | null>(null);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const photoInputRef   = useRef<HTMLInputElement>(null);
  const cameraInputRef  = useRef<HTMLInputElement>(null);

  // ── Pet ───────────────────────────────────────────────────────────────────
  const [petType, setPetType]         = useState<PetType>("gato");
  const [petName, setPetName]         = useState("Luna");
  const [petLevel, setPetLevel]       = useState(3);
  const [petExp, setPetExp]           = useState(65);
  const [petHappiness, setPetHappiness] = useState(80);

  // ── Tasks ─────────────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState<Task[]>([
    { id:1, title:"Estudiar parcial de Cálculo",    description:"Capítulos 5 y 6",       date:todayStr(),  time:"14:00", priority:"alta",   completed:false, emoji:"📚" },
    { id:2, title:"Entregar informe de laboratorio",description:"",                        date:todayStr(),  time:"23:59", priority:"alta",   completed:false, emoji:"🔬" },
    { id:3, title:"Leer artículo de metodología",   description:"Para clase del lunes",   date:todayStr(),  time:"20:00", priority:"media",  completed:false, emoji:"📝" },
    { id:4, title:"Meditación de 10 minutos",       description:"",                        date:todayStr(),  time:"08:00", priority:"baja",   completed:true,  emoji:"🧘" },
    { id:5, title:"Práctica de fútbol",             description:"Cancha universitaria",    date:daysAgo(-1), time:"16:00", priority:"media",  completed:false, emoji:"⚽" },
    { id:6, title:"Revisar notas de estadística",   description:"",                        date:daysAgo(2),  time:"",      priority:"media",  completed:false, emoji:"📊" },
  ]);
  const [nextId, setNextId] = useState(7);

  // Task form state (shared by add + edit)
  const [showAddTask, setShowAddTask]   = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [editingTask, setEditingTask]   = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc]   = useState("");
  const [newTaskDate, setNewTaskDate]   = useState(todayStr());
  const [newTaskTime, setNewTaskTime]   = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>("media");
  const [newTaskEmoji, setNewTaskEmoji] = useState("📝");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Task status accordion
  const [statusOpen, setStatusOpen] = useState({ pendientes: true, vencidas: false, completadas: false });

  // ── Health check-in ───────────────────────────────────────────────────────
  const [checkinHistory, setCheckinHistory] = useState<CheckinRecord[]>([
    { date:daysAgo(1), mood:"motivado",  sleep:7, energy:4, influences:["Estudios","Amigos"],           note:"" },
    { date:daysAgo(2), mood:"cansado",   sleep:5, energy:2, influences:["Estudios","Sueño"],             note:"" },
    { date:daysAgo(3), mood:"feliz",     sleep:8, energy:5, influences:["Amigos","Actividad física"],   note:"" },
    { date:daysAgo(4), mood:"tranquilo", sleep:7, energy:3, influences:["Familia"],                       note:"" },
    { date:daysAgo(5), mood:"estresado", sleep:4, energy:2, influences:["Estudios","Redes sociales"],   note:"" },
    { date:daysAgo(6), mood:"motivado",  sleep:8, energy:4, influences:["Actividad física"],             note:"" },
  ]);
  const [checkinSleep, setCheckinSleep]           = useState(7);
  const [checkinMood, setCheckinMood]             = useState<Mood | null>(null);
  const [checkinCustomMood, setCheckinCustomMood] = useState("");
  const [checkinEnergy, setCheckinEnergy]         = useState(3);
  const [checkinInfluences, setCheckinInfluences] = useState<string[]>([]);
  const [checkinNote, setCheckinNote]             = useState("");

  // ── Calendar ──────────────────────────────────────────────────────────────
  const [calMonth, setCalMonth]       = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr());

  // ── Notifications ─────────────────────────────────────────────────────────
  const [notifReminders, setNotifReminders] = useState(true);
  const [notifCheckin, setNotifCheckin]     = useState(true);
  const [notifPet, setNotifPet]             = useState(false);

  // ── Feedback ──────────────────────────────────────────────────────────────
  const [showFeedback, setShowFeedback]           = useState(false);
  const [feedbackRating, setFeedbackRating]       = useState(0);
  const [feedbackDays, setFeedbackDays]           = useState("");
  const [feedbackExperience, setFeedbackExperience] = useState("");
  const [feedbackRecs, setFeedbackRecs]           = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackError, setFeedbackError]         = useState("");

  // ─── Derived ─────────────────────────────────────────────────────────────
  const pwStrength        = useMemo(() => passwordStrength(signupPassword), [signupPassword]);
  const todayCheckin      = checkinHistory.find(c => c.date === todayStr());
  const streak            = checkinHistory.length;
  const calDays           = useMemo(() => getMonthDays(calMonth.getFullYear(), calMonth.getMonth()), [calMonth]);
  const todayTasks        = tasks.filter(t => t.date === todayStr());
  const todayPending      = todayTasks.filter(t => !t.completed);
  const pendingFuture     = tasks.filter(t => !t.completed && t.date >= todayStr()).sort((a,b)=>a.date.localeCompare(b.date));
  const overdueTasks      = tasks.filter(t => !t.completed && t.date < todayStr()).sort((a,b)=>b.date.localeCompare(a.date));
  const completedTasks    = tasks.filter(t => t.completed).sort((a,b)=>b.date.localeCompare(a.date));
  const nextTask          = todayPending.filter(t=>t.time).sort((a,b)=>a.time.localeCompare(b.time))[0];
  const selectedDateTasks = tasks.filter(t => t.date === selectedDate);
  const firstName         = userName.split(" ")[0];

  // ─── Auth handlers ────────────────────────────────────────────────────────
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) { setLoginError("Completa todos los campos."); return; }
    setUserName(loginEmail.split("@")[0]); setUserEmail(loginEmail);
    setScreen("main");
  };
  const handleGoogleAuth = (isSignup: boolean) => {
    setUserName("Ana García"); setUserEmail("ana.garcia@gmail.com");
    if (isSignup) { setScreen("onboarding"); setOnboardingStep(1); } else setScreen("main");
  };
  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName||!signupEmail||!signupPassword||!signupConfirm) { setSignupError("Completa todos los campos."); return; }
    if (signupPassword !== signupConfirm) { setSignupError("Las contraseñas no coinciden."); return; }
    if (pwStrength.score < 3) { setSignupError("La contraseña debe ser más segura."); return; }
    if (!habeasData) { setSignupError("Debes aceptar el tratamiento de datos."); return; }
    setUserName(signupName); setUserEmail(signupEmail);
    setScreen("onboarding"); setOnboardingStep(1);
  };
  const handleLogout = () => { setScreen("auth"); setAuthTab("login"); setLoginEmail(""); setLoginPassword(""); };

  // ─── Onboarding ───────────────────────────────────────────────────────────
  const nextOnboarding = () => {
    if (onboardingStep < 4) setOnboardingStep(s=>s+1);
    else { setScreen("main"); setMainTab("home"); }
  };
  const prevOnboarding = () => { if (onboardingStep>1) setOnboardingStep(s=>s-1); };

  // ─── Task actions ─────────────────────────────────────────────────────────
  const resetTaskForm = () => {
    setNewTaskTitle(""); setNewTaskDesc(""); setNewTaskDate(todayStr());
    setNewTaskTime(""); setNewTaskPriority("media"); setNewTaskEmoji("📝");
    setShowEmojiPicker(false);
  };

  const openAddTask = (date = todayStr()) => {
    resetTaskForm(); setNewTaskDate(date); setShowAddTask(true);
  };

  const addTask = () => {
    if (!newTaskTitle.trim() || !newTaskDate) return;
    setTasks(prev => [...prev, { id:nextId, title:newTaskTitle, description:newTaskDesc, date:newTaskDate, time:newTaskTime, priority:newTaskPriority, completed:false, emoji:newTaskEmoji }]);
    setNextId(n=>n+1); resetTaskForm(); setShowAddTask(false); gainExp(5);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTaskTitle(task.title); setNewTaskDesc(task.description);
    setNewTaskDate(task.date); setNewTaskTime(task.time);
    setNewTaskPriority(task.priority); setNewTaskEmoji(task.emoji);
    setShowEmojiPicker(false); setShowEditTask(true);
  };

  const saveEditTask = () => {
    if (!editingTask || !newTaskTitle.trim()) return;
    setTasks(prev => prev.map(t =>
      t.id === editingTask.id
        ? { ...t, title:newTaskTitle, description:newTaskDesc, date:newTaskDate, time:newTaskTime, priority:newTaskPriority, emoji:newTaskEmoji }
        : t
    ));
    setShowEditTask(false); setEditingTask(null); resetTaskForm();
  };

  const deleteTask = (id: number) => setTasks(prev => prev.filter(t=>t.id!==id));

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => {
      if (t.id!==id) return t;
      if (!t.completed) { gainExp(15); setPetHappiness(h=>Math.min(100,h+3)); }
      return { ...t, completed:!t.completed };
    }));
  };

  // ─── Pet ──────────────────────────────────────────────────────────────────
  const gainExp = (amount: number) => {
    setPetExp(exp => {
      const needed = petLevel*100, next = exp+amount;
      if (next>=needed) { setPetLevel(l=>l+1); return next-needed; }
      return next;
    });
  };
  const petMessage = () => {
    if (petHappiness>80) return `¡Hola ${firstName}! Estoy muy feliz de verte 🌟`;
    if (petHappiness>60) return `¿Cómo estuvo tu día? ¡Aquí estoy contigo! 💙`;
    if (petHappiness>40) return `Te extrañé... ¿hacemos el check-in juntos? 🥺`;
    return `Por favor cuídate un poco más. ¡Te quiero! 🫂`;
  };

  // ─── Check-in ─────────────────────────────────────────────────────────────
  const saveCheckin = () => {
    if (!checkinMood) return;
    if (checkinMood==="otra" && !checkinCustomMood.trim()) return;
    const record: CheckinRecord = {
      date:todayStr(), mood:checkinMood,
      customMood: checkinMood==="otra" ? checkinCustomMood.trim() : undefined,
      sleep:checkinSleep, energy:checkinEnergy,
      influences:checkinInfluences, note:checkinNote,
    };
    setCheckinHistory(prev=>[record,...prev.filter(c=>c.date!==todayStr())]);
    if (checkinMood==="feliz"||checkinMood==="motivado") { setPetHappiness(h=>Math.min(100,h+8)); gainExp(20); }
    else if (checkinMood==="estresado"||checkinMood==="triste") { setPetHappiness(h=>Math.max(10,h-5)); }
    setCheckinMood(null); setCheckinCustomMood(""); setCheckinInfluences([]); setCheckinNote(""); setCheckinSleep(7); setCheckinEnergy(3);
  };
  const toggleInfluence = (inf: string) => {
    setCheckinInfluences(prev=>prev.includes(inf)?prev.filter(i=>i!==inf):[...prev,inf]);
  };

  // ─── BLE handlers ────────────────────────────────────────────────────────
  const connectBLE = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav = navigator as any;
    if (!nav.bluetooth) {
      setBleStatus("error");
      setBleMessage("Bluetooth no compatible. Usa Chrome en Android o desktop.");
      return;
    }
    try {
      setBleStatus("connecting"); setBleMessage("");
      const device = await nav.bluetooth.requestDevice({
        filters: [{ name: "ESP32" }],
        optionalServices: [BLE_SERVICE_UUID],
      });
      bleDeviceRef.current = device;
      device.addEventListener("gattserverdisconnected", () => {
        setBleStatus("idle"); setBleMessage("Desconectado del ESP32.");
        bleCharRef.current = null;
      });
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(BLE_SERVICE_UUID);
      const char    = await service.getCharacteristic(BLE_CHAR_RX_UUID);
      bleCharRef.current = char;
      setBleStatus("connected"); setBleMessage(`Conectado a: ${device.name}`);
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string };
      setBleStatus("error");
      setBleMessage(
        e.name === "NotFoundError"
          ? "No se encontró ningún ESP32 cercano."
          : e.name === "SecurityError"
          ? "Permiso denegado por el navegador."
          : (e.message || "Error desconocido al conectar.")
      );
    }
  };

  const disconnectBLE = () => {
    if (bleDeviceRef.current?.gatt?.connected) bleDeviceRef.current.gatt.disconnect();
    bleCharRef.current = null;
    bleDeviceRef.current = null;
    setBleStatus("idle"); setBleMessage("");
  };

  const sendTaskBLE = async (title: string, date: string, time: string) => {
    if (!bleCharRef.current) {
      setBleMessage("⚠️ Conecta el ESP32 primero.");
      return false;
    }
    const payload = `${title}|${date}|${time}`;
    const bytes   = new TextEncoder().encode(payload);
    try {
      const CHUNK = 512;
      for (let i = 0; i < bytes.length; i += CHUNK) {
        await bleCharRef.current.writeValue(bytes.slice(i, i + CHUNK));
      }
      setBleMessage(`✅ Enviado: "${title}"`);
      return true;
    } catch (err: unknown) {
      const e = err as { message?: string };
      setBleMessage("❌ Error al enviar: " + (e.message || ""));
      return false;
    }
  };

  const addAndSendTask = async () => {
    if (!newTaskTitle.trim() || !newTaskDate) return;
    await sendTaskBLE(newTaskTitle, newTaskDate, newTaskTime);
    addTask();
  };

  // ─── Profile photo ────────────────────────────────────────────────────────
  const handlePhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setProfilePhoto(ev.target?.result as string); setShowPhotoOptions(false); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ─── Feedback ────────────────────────────────────────────────────────────
  const submitFeedback = () => {
    if (!feedbackRating) { setFeedbackError("Selecciona una calificación."); return; }
    if (!feedbackDays)   { setFeedbackError("Indica cuántos días usaste el prototipo."); return; }
    if (!feedbackExperience.trim()) { setFeedbackError("Describe tu experiencia."); return; }
    setFeedbackError("");
    const data = {
      usuario: userName, calificacion: feedbackRating,
      diasDeUso: parseInt(feedbackDays),
      experiencia: feedbackExperience,
      recomendaciones: feedbackRecs || "Sin recomendaciones",
      fecha: new Date().toLocaleString("es-ES"),
      timestamp: new Date().toISOString(),
    };
    const existing = JSON.parse(localStorage.getItem("restifound_feedback") || "[]");
    existing.push(data);
    localStorage.setItem("restifound_feedback", JSON.stringify(existing));
    setFeedbackSubmitted(true);
    setTimeout(() => {
      setShowFeedback(false); setFeedbackSubmitted(false);
      setFeedbackRating(0); setFeedbackDays(""); setFeedbackExperience(""); setFeedbackRecs("");
    }, 2800);
  };

  // ─── Reusable task form fields (shared between Add & Edit dialogs) ─────────
  const TaskFormFields = () => (
    <div className="px-5 py-4 space-y-4">
      {/* Emoji + Title */}
      <div>
        <label className="text-[#6B7A99] text-xs font-bold block mb-1.5" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Emoji y título *</label>
        <div className="flex gap-2">
          <button type="button" onClick={()=>setShowEmojiPicker(v=>!v)}
            className="w-12 h-[42px] bg-[#F5F8FA] rounded-xl text-xl flex items-center justify-center flex-shrink-0 hover:bg-[#E8F4F8] transition-colors border-2 border-transparent"
            style={{border:`2px solid ${showEmojiPicker?"#152540":"transparent"}`}}>
            {newTaskEmoji}
          </button>
          <input value={newTaskTitle} onChange={e=>setNewTaskTitle(e.target.value)}
            placeholder="¿Qué tienes que hacer?"
            className="flex-1 bg-[#F5F8FA] rounded-xl py-2.5 px-3.5 text-sm text-[#152540] placeholder-[#A8B5C8] outline-none focus:ring-2 focus:ring-[#152540]/15 transition-all"
            style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}} />
        </div>
        {showEmojiPicker && (
          <div className="mt-2 bg-[#F5F8FA] rounded-xl p-2.5 grid grid-cols-10 gap-1.5">
            {TASK_EMOJIS.map(em=>(
              <button key={em} type="button" onClick={()=>{setNewTaskEmoji(em);setShowEmojiPicker(false);}}
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-base transition-all hover:bg-white ${newTaskEmoji===em?"bg-white shadow-sm":""}`}>
                {em}
              </button>
            ))}
          </div>
        )}
      </div>
      <div>
        <label className="text-[#6B7A99] text-xs font-bold block mb-1.5" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Descripción</label>
        <input value={newTaskDesc} onChange={e=>setNewTaskDesc(e.target.value)} placeholder="Detalles opcionales..."
          className="w-full bg-[#F5F8FA] rounded-xl py-2.5 px-3.5 text-sm text-[#152540] placeholder-[#A8B5C8] outline-none focus:ring-2 focus:ring-[#152540]/15"
          style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[#6B7A99] text-xs font-bold block mb-1.5" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Fecha *</label>
          <input type="date" value={newTaskDate} onChange={e=>setNewTaskDate(e.target.value)}
            className="w-full bg-[#F5F8FA] rounded-xl py-2.5 px-3 text-sm text-[#152540] outline-none focus:ring-2 focus:ring-[#152540]/15" />
        </div>
        <div>
          <label className="text-[#6B7A99] text-xs font-bold block mb-1.5" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Hora</label>
          <input type="time" value={newTaskTime} onChange={e=>setNewTaskTime(e.target.value)}
            className="w-full bg-[#F5F8FA] rounded-xl py-2.5 px-3 text-sm text-[#152540] outline-none focus:ring-2 focus:ring-[#152540]/15" />
        </div>
      </div>
      <div>
        <label className="text-[#6B7A99] text-xs font-bold block mb-1.5" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Prioridad</label>
        <div className="flex gap-2">
          {(["baja","media","alta"] as Priority[]).map(p=>(
            <button key={p} type="button" onClick={()=>setNewTaskPriority(p)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
              style={{background:newTaskPriority===p?priorityBg(p):"#F5F8FA", color:newTaskPriority===p?priorityColor(p):"#A8B5C8", border:`2px solid ${newTaskPriority===p?priorityColor(p):"transparent"}`}}>
              {priorityLabel(p)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── Reusable task row (used in calendar accordion) ───────────────────────
  const TaskRow = ({ task, showStatus = false }: { task: Task; showStatus?: boolean }) => (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${task.completed?"bg-[#F9FBFC] border-[#F0F4F8]":"bg-white border-[#E2EAF0]"}`}>
      <span className="text-xl flex-shrink-0">{task.emoji}</span>
      <button type="button" onClick={()=>toggleTask(task.id)}
        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${task.completed?"bg-[#22C55E] border-[#22C55E]":"border-[#D1DBE8] hover:border-[#152540]"}`}>
        {task.completed && <Check className="w-3.5 h-3.5 text-white" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${task.completed?"text-[#A8B5C8] line-through":"text-[#152540]"}`}>{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {task.time && <span className="text-[#A8B5C8] text-[10px]" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>🕐 {task.time}</span>}
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{background:priorityBg(task.priority), color:priorityColor(task.priority)}}>
            {priorityLabel(task.priority)}
          </span>
          {showStatus && task.date < todayStr() && !task.completed && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#FEE2E2] text-[#EF4444]">
              {new Date(task.date+"T12:00:00").toLocaleDateString("es-ES",{day:"numeric",month:"short"})}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button type="button" onClick={()=>openEditTask(task)}
          className="w-7 h-7 rounded-lg bg-[#F5F8FA] flex items-center justify-center hover:bg-[#E8F4F8] transition-colors">
          <Pencil className="w-3.5 h-3.5 text-[#6B7A99]" />
        </button>
        <button type="button" onClick={()=>deleteTask(task.id)}
          className="w-7 h-7 rounded-lg bg-[#FEF2F2] flex items-center justify-center hover:bg-[#FEE2E2] transition-colors">
          <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" />
        </button>
      </div>
      <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{background:priorityColor(task.priority)}} />
    </div>
  );

  // ─── Accordion section helper ─────────────────────────────────────────────
  const AccordionSection = ({
    id, label, count, color, bg, open, onToggle, children
  }: {
    id: keyof typeof statusOpen; label: string; count: number; color: string; bg: string;
    open: boolean; onToggle: () => void; children: React.ReactNode;
  }) => (
    <div className="bg-white rounded-2xl border border-[#E2EAF0] overflow-hidden">
      <button type="button" onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#F9FBFC] transition-colors">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-black px-2 py-1 rounded-lg" style={{background:bg, color}}>{count}</span>
          <span className="text-[#152540] font-black text-sm">{label}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-[#A8B5C8] transition-transform duration-200 ${open?"rotate-180":""}`} />
      </button>
      {open && (
        <div className="border-t border-[#F5F8FA] p-3 space-y-2">
          {children}
        </div>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // AUTH SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  if (screen === "auth") {
    const GoogleSVG = () => (
      <svg className="w-4 h-4" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0d1c33] via-[#152540] to-[#1a3358] flex items-center justify-center p-5 relative overflow-hidden">
        <div className="absolute top-[-80px] right-[-60px] w-64 h-64 bg-[#3BBFB4]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-60px] left-[-40px] w-48 h-48 bg-[#BCD7E3]/10 rounded-full blur-3xl" />

        <div className="w-full max-w-sm relative z-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/15">
              <span className="text-4xl">🌿</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Restifound</h1>
            <p className="text-white/50 text-sm mt-1 font-medium" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              Tu compañero de bienestar estudiantil
            </p>
          </div>

          <div className="bg-white/8 backdrop-blur-sm rounded-2xl p-1 flex mb-5 border border-white/10">
            {(["login","signup"] as const).map(t=>(
              <button key={t} type="button"
                onClick={()=>{setAuthTab(t);setLoginError("");setSignupError("");}}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${authTab===t?"bg-white text-[#152540] shadow-sm":"text-white/60 hover:text-white/80"}`}>
                {t==="login"?"Iniciar sesión":"Crear cuenta"}
              </button>
            ))}
          </div>

          {authTab==="login" && (
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35 pointer-events-none" />
                <input type="email" placeholder="Correo electrónico" value={loginEmail}
                  onChange={e=>{setLoginEmail(e.target.value);setLoginError("");}}
                  className="w-full bg-white/8 border border-white/15 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-white/35 focus:outline-none focus:border-white/40 text-sm transition-colors"
                  style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}} />
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35 pointer-events-none" />
                <input type={showLoginPw?"text":"password"} placeholder="Contraseña" value={loginPassword}
                  onChange={e=>{setLoginPassword(e.target.value);setLoginError("");}}
                  className="w-full bg-white/8 border border-white/15 rounded-xl py-3.5 pl-11 pr-12 text-white placeholder-white/35 focus:outline-none focus:border-white/40 text-sm transition-colors"
                  style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}} />
                <button type="button" onClick={()=>setShowLoginPw(v=>!v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/65 transition-colors">
                  {showLoginPw?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                </button>
              </div>
              {loginError && <p className="text-red-300 text-xs font-medium">{loginError}</p>}
              <button type="submit" className="w-full bg-white text-[#152540] font-black py-3.5 rounded-xl hover:bg-white/90 transition-all text-sm mt-1 shadow-lg shadow-black/20">
                Entrar
              </button>
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-white/15"/><span className="text-white/35 text-xs">o</span><div className="flex-1 h-px bg-white/15"/>
              </div>
              <button type="button" onClick={()=>handleGoogleAuth(false)}
                className="w-full bg-white/8 border border-white/15 text-white font-semibold py-3 rounded-xl hover:bg-white/15 transition-all text-sm flex items-center justify-center gap-2.5">
                <GoogleSVG />Continuar con Google
              </button>
            </form>
          )}

          {authTab==="signup" && (
            <form onSubmit={handleSignup} className="space-y-3">
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35 pointer-events-none" />
                <input type="text" placeholder="Nombre completo" value={signupName}
                  onChange={e=>{setSignupName(e.target.value);setSignupError("");}}
                  className="w-full bg-white/8 border border-white/15 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-white/35 focus:outline-none focus:border-white/40 text-sm"
                  style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}} />
              </div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35 pointer-events-none" />
                <input type="email" placeholder="Correo electrónico" value={signupEmail}
                  onChange={e=>{setSignupEmail(e.target.value);setSignupError("");}}
                  className="w-full bg-white/8 border border-white/15 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-white/35 focus:outline-none focus:border-white/40 text-sm"
                  style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}} />
              </div>
              <div className="space-y-1.5">
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35 pointer-events-none" />
                  <input type={showSignupPw?"text":"password"} placeholder="Contraseña" value={signupPassword}
                    onChange={e=>{setSignupPassword(e.target.value);setSignupError("");}}
                    className="w-full bg-white/8 border border-white/15 rounded-xl py-3.5 pl-11 pr-12 text-white placeholder-white/35 focus:outline-none focus:border-white/40 text-sm"
                    style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}} />
                  <button type="button" onClick={()=>setShowSignupPw(v=>!v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/65">
                    {showSignupPw?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                  </button>
                </div>
                {signupPassword && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1">
                      {[1,2,3,4].map(i=>(
                        <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                          style={{background:i<=pwStrength.score?pwStrength.color:"rgba(255,255,255,0.12)"}}/>
                      ))}
                    </div>
                    <p className="text-xs font-bold" style={{color:pwStrength.color}}>{pwStrength.label}</p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                      {[
                        [signupPassword.length>=8,"Mín. 8 caracteres"],
                        [/[A-Z]/.test(signupPassword),"Letra mayúscula"],
                        [/[0-9]/.test(signupPassword),"Un número"],
                        [/[^A-Za-z0-9]/.test(signupPassword),"Carácter especial"],
                      ].map(([ok,label],i)=>(
                        <div key={i} className="flex items-center gap-1">
                          <span className="text-[10px]" style={{color:ok?"#22C55E":"rgba(255,255,255,0.25)"}}>{ok?"✓":"○"}</span>
                          <span className="text-[10px]" style={{color:ok?"rgba(255,255,255,0.65)":"rgba(255,255,255,0.3)",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{label as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35 pointer-events-none" />
                <input type={showConfirmPw?"text":"password"} placeholder="Confirmar contraseña" value={signupConfirm}
                  onChange={e=>{setSignupConfirm(e.target.value);setSignupError("");}}
                  className="w-full bg-white/8 border border-white/15 rounded-xl py-3.5 pl-11 pr-12 text-white placeholder-white/35 focus:outline-none focus:border-white/40 text-sm"
                  style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}} />
                <button type="button" onClick={()=>setShowConfirmPw(v=>!v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/65">
                  {showConfirmPw?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                </button>
              </div>
              {signupConfirm && signupPassword!==signupConfirm && (
                <p className="text-red-300 text-[11px] font-medium">Las contraseñas no coinciden</p>
              )}
              <label className="flex items-start gap-2.5 cursor-pointer bg-white/5 rounded-xl p-3 border border-white/10">
                <input type="checkbox" checked={habeasData} onChange={e=>setHabeasData(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded flex-shrink-0 accent-[#3BBFB4]" />
                <span className="text-white/55 text-[11px] leading-relaxed" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  Autorizo el tratamiento de mis datos personales para la prestación del servicio de bienestar estudiantil. Puedo revocar esta autorización en cualquier momento.{" "}
                  <a href="https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981" target="_blank" rel="noopener noreferrer"
                    onClick={e=>e.stopPropagation()} className="text-[#3BBFB4] underline font-bold hover:text-[#3BBFB4]/75 transition-colors">
                    Ley 1581 de 2012 — Habeas Data
                  </a>
                </span>
              </label>
              {signupError && <p className="text-red-300 text-xs font-medium">{signupError}</p>}
              <button type="submit" disabled={!habeasData}
                className="w-full bg-white text-[#152540] font-black py-3.5 rounded-xl hover:bg-white/90 transition-all text-sm shadow-lg shadow-black/20 disabled:opacity-35 disabled:cursor-not-allowed">
                Crear cuenta
              </button>
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-white/15"/><span className="text-white/35 text-xs">o</span><div className="flex-1 h-px bg-white/15"/>
              </div>
              <button type="button" onClick={()=>handleGoogleAuth(true)}
                className="w-full bg-white/8 border border-white/15 text-white font-semibold py-3 rounded-xl hover:bg-white/15 transition-all text-sm flex items-center justify-center gap-2.5">
                <GoogleSVG />Registrarse con Google
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ONBOARDING
  // ─────────────────────────────────────────────────────────────────────────
  if (screen === "onboarding") {
    const titles = ["","Elige tu mascota 🐾",`Ponle nombre a tu ${PET_EMOJIS[petType]}`,"¿Cuántos años tienes?","¿Qué deporte practicas?"];
    const descs  = ["","Tu compañero te acompañará en tu camino hacia el bienestar.","Dale un nombre único a tu nuevo amigo.","Esto nos ayuda a personalizar tu experiencia.","Personalizamos tu perfil deportivo."];
    const nextDisabled = (onboardingStep===2&&!petName.trim())||(onboardingStep===3&&!userAge)||(onboardingStep===4&&!userSport);
    return (
      <div className="min-h-screen bg-[#F5F8FA] flex items-center justify-center p-5">
        <div className="w-full max-w-md">
          <div className="flex gap-2 mb-8">
            {[1,2,3,4].map(i=>(
              <div key={i} className="flex-1 h-1.5 rounded-full transition-all duration-300"
                style={{background:i<=onboardingStep?"#152540":"#D1DBE8"}}/>
            ))}
          </div>
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-[#E2EAF0]">
            <h2 className="text-2xl font-black text-[#152540] mb-1">{titles[onboardingStep]}</h2>
            <p className="text-[#6B7A99] text-sm mb-6" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{descs[onboardingStep]}</p>
            {onboardingStep===1 && (
              <div className="grid grid-cols-5 gap-3">
                {(Object.keys(PET_EMOJIS) as PetType[]).map(p=>(
                  <button key={p} type="button" onClick={()=>setPetType(p)}
                    className={`aspect-square rounded-2xl text-3xl flex items-center justify-center transition-all duration-200 ${petType===p?"bg-[#152540] scale-110 shadow-lg":"bg-[#F5F8FA] hover:bg-[#E8F4F8]"}`}>
                    {PET_EMOJIS[p]}
                  </button>
                ))}
              </div>
            )}
            {onboardingStep===2 && (
              <div className="space-y-5">
                <div className="text-center text-8xl py-4">{PET_EMOJIS[petType]}</div>
                <input type="text" placeholder="ej: Luna, Max, Mochi..." value={petName} onChange={e=>setPetName(e.target.value)}
                  className="w-full border-2 border-[#E2EAF0] focus:border-[#152540] rounded-xl py-3.5 px-4 text-center text-lg font-bold text-[#152540] outline-none transition-colors"/>
              </div>
            )}
            {onboardingStep===3 && (
              <div className="space-y-4">
                <div className="bg-[#F5F8FA] rounded-2xl p-4 text-center text-[#6B7A99] text-sm" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  Te ayuda a obtener recursos de bienestar adecuados para ti.
                </div>
                <input type="number" placeholder="Tu edad" value={userAge} min="10" max="35" onChange={e=>setUserAge(e.target.value)}
                  className="w-full border-2 border-[#E2EAF0] focus:border-[#152540] rounded-xl py-3.5 px-4 text-center text-2xl font-black text-[#152540] outline-none transition-colors"/>
              </div>
            )}
            {onboardingStep===4 && (
              <div className="grid grid-cols-3 gap-2">
                {SPORTS.map(s=>(
                  <button key={s} type="button" onClick={()=>setUserSport(s)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 ${userSport===s?"bg-[#152540] text-white shadow-md":"bg-[#F5F8FA] text-[#6B7A99] hover:bg-[#E8F4F8]"}`}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-3 mt-8">
              {onboardingStep>1 && (
                <button type="button" onClick={prevOnboarding}
                  className="flex-1 py-3.5 rounded-xl border-2 border-[#E2EAF0] text-[#6B7A99] font-bold text-sm hover:border-[#152540] transition-colors">
                  Anterior
                </button>
              )}
              <button type="button" onClick={nextOnboarding} disabled={nextDisabled}
                className="flex-1 py-3.5 rounded-xl bg-[#152540] text-white font-black text-sm disabled:opacity-40 hover:bg-[#152540]/90 transition-all active:scale-[0.98]">
                {onboardingStep===4?"¡Empezar! 🚀":"Siguiente"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN APP
  // ─────────────────────────────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting = hour<12?"Buenos días":hour<18?"Buenas tardes":"Buenas noches";

  return (
    <div className="min-h-screen bg-[#F5F8FA] flex flex-col max-w-lg mx-auto relative">

      {/* ══ HOME ══════════════════════════════════════════════════════════ */}
      {mainTab==="home" && (
        <div className="flex-1 overflow-y-auto pb-24">
          {/* Navy hero */}
          <div className="bg-[#152540] pt-14 pb-8 px-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/4 rounded-full -translate-y-16 translate-x-16"/>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#3BBFB4]/10 rounded-full translate-y-12 -translate-x-12"/>
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-white/55 text-sm font-semibold" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{greeting},</p>
                <h1 className="text-white text-2xl font-black leading-tight">{firstName} 👋</h1>
                <p className="text-white/40 text-xs mt-1" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  {new Date().toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"})}
                </p>
              </div>
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="relative">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/15 text-4xl">
                    {PET_EMOJIS[petType]}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-[#F59E0B] text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-lg">{petLevel}</div>
                </div>
                <p className="text-white/40 text-[10px] mt-1.5 font-medium">{petName||"Mascota"}</p>
              </div>
            </div>
            <div className="relative mt-4 space-y-1.5">
              {[{label:"Felicidad",value:petHappiness,color:"#F59E0B"},{label:"Experiencia",value:Math.round((petExp/(petLevel*100))*100),color:"#3BBFB4"}].map(bar=>(
                <div key={bar.label} className="flex items-center gap-2">
                  <span className="text-white/45 text-[10px] font-semibold w-20" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{bar.label}</span>
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{width:`${bar.value}%`,background:bar.color}}/>
                  </div>
                  <span className="text-white/35 text-[10px] w-7 text-right">{bar.value}%</span>
                </div>
              ))}
            </div>
            <div className="relative mt-4 bg-white/8 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
              <span className="text-xl flex-shrink-0">{PET_EMOJIS[petType]}</span>
              <p className="text-white/75 text-xs leading-relaxed" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{petMessage()}</p>
            </div>
          </div>

          <div className="px-4 space-y-5 mt-5">

            {/* ── BLE Connect card ── */}
            <div className={`rounded-2xl border p-4 flex items-center gap-3 transition-all ${
              bleStatus==="connected" ? "bg-[#DCFCE7] border-[#22C55E]/30"
              : bleStatus==="error"   ? "bg-[#FEE2E2] border-[#EF4444]/30"
              : bleStatus==="connecting" ? "bg-[#FEF3C7] border-[#F59E0B]/30"
              : "bg-white border-[#E2EAF0]"
            }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                bleStatus==="connected" ? "bg-[#22C55E]"
                : bleStatus==="error"   ? "bg-[#EF4444]"
                : bleStatus==="connecting" ? "bg-[#F59E0B]"
                : "bg-[#152540]"
              }`}>
                {bleStatus==="connected"
                  ? <BluetoothConnected className="w-5 h-5 text-white"/>
                  : bleStatus==="error"
                  ? <BluetoothOff className="w-5 h-5 text-white"/>
                  : <Bluetooth className={`w-5 h-5 text-white ${bleStatus==="connecting"?"animate-pulse":""}`}/>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#152540] font-black text-sm">
                  {bleStatus==="connected" ? "ESP32 conectado"
                  : bleStatus==="connecting" ? "Buscando ESP32..."
                  : bleStatus==="error" ? "Error de conexión"
                  : "Dispositivo ESP32"}
                </p>
                <p className="text-[10px] truncate mt-0.5" style={{
                  color: bleStatus==="connected"?"#22C55E":bleStatus==="error"?"#EF4444":bleStatus==="connecting"?"#F59E0B":"#6B7A99",
                  fontFamily:"'Plus Jakarta Sans',sans-serif"
                }}>
                  {bleMessage || "Sin conexión Bluetooth"}
                </p>
              </div>
              {bleStatus==="connected" ? (
                <button type="button" onClick={disconnectBLE}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#22C55E]/30 text-[#22C55E] text-xs font-bold hover:bg-[#F0FDF4] transition-colors flex-shrink-0">
                  Desconectar
                </button>
              ) : (
                <button type="button" onClick={connectBLE} disabled={bleStatus==="connecting"}
                  className="px-3 py-1.5 rounded-xl bg-[#152540] text-white text-xs font-bold disabled:opacity-50 hover:bg-[#152540]/90 transition-colors flex-shrink-0 active:scale-95">
                  {bleStatus==="connecting" ? "Conectando..." : "Conectar"}
                </button>
              )}
            </div>

            {/* Resumen */}
            <section>
              <h2 className="text-[#152540] font-black text-base mb-3">Resumen de hoy</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {emoji:todayCheckin?getMoodDisplay(todayCheckin).emoji:"—",label:"Estado de ánimo",value:todayCheckin?getMoodDisplay(todayCheckin).label:"Sin registrar",bg:todayCheckin?getMoodDisplay(todayCheckin).bg:"#EEF2F7"},
                  {emoji:"🌙",label:"Horas de sueño",value:todayCheckin?`${todayCheckin.sleep} horas`:"Sin registrar",bg:"#EDE9FE"},
                  {emoji:"✅",label:"Tareas pendientes",value:`${todayPending.length} de ${todayTasks.length}`,bg:"#FEE2E2"},
                  {emoji:"⏰",label:"Próximo recordatorio",value:nextTask?`${nextTask.time} — ${nextTask.title.slice(0,14)}…`:"Sin tareas hoy",bg:"#FEF3C7"},
                ].map((card,i)=>(
                  <div key={i} className="bg-white rounded-2xl p-4 border border-[#E2EAF0]">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3" style={{background:card.bg}}>{card.emoji}</div>
                    <p className="text-[#6B7A99] text-[10px] font-semibold mb-0.5" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{card.label}</p>
                    <p className="text-[#152540] font-bold text-xs">{card.value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Check-in CTA */}
            {!todayCheckin && (
              <button type="button" onClick={()=>setMainTab("health")}
                className="w-full bg-gradient-to-r from-[#3BBFB4] to-[#2AADA2] rounded-2xl p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform shadow-md shadow-[#3BBFB4]/25">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">✨</div>
                <div className="flex-1">
                  <p className="text-white font-black text-sm">Haz tu check-in diario</p>
                  <p className="text-white/70 text-xs mt-0.5" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Solo toma un minuto. ¡Tu bienestar importa!</p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/60 flex-shrink-0"/>
              </button>
            )}

            {/* Tareas de hoy */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[#152540] font-black text-base">Tareas de hoy</h2>
                <button type="button" onClick={()=>setMainTab("calendar")} className="text-[#3BBFB4] text-xs font-bold">Ver todo</button>
              </div>
              <div className="space-y-2">
                {todayPending.length===0 ? (
                  <div className="bg-white rounded-2xl p-6 border border-[#E2EAF0] text-center">
                    <p className="text-3xl mb-2">🎉</p>
                    <p className="text-[#152540] font-bold text-sm">¡Sin tareas pendientes hoy!</p>
                    <p className="text-[#6B7A99] text-xs mt-1" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Aprovecha para descansar.</p>
                  </div>
                ) : todayPending.slice(0,4).map(task=>(
                  <div key={task.id} className="bg-white rounded-2xl p-3.5 border border-[#E2EAF0] flex items-center gap-3">
                    <span className="text-xl flex-shrink-0">{task.emoji}</span>
                    <button type="button" onClick={()=>toggleTask(task.id)}
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${task.completed?"bg-[#22C55E] border-[#22C55E]":"border-[#D1DBE8] hover:border-[#152540]"}`}>
                      {task.completed&&<Check className="w-3.5 h-3.5 text-white"/>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate text-[#152540]">{task.title}</p>
                      {task.time&&<p className="text-[#A8B5C8] text-[10px] mt-0.5" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>🕐 {task.time}</p>}
                    </div>
                    <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{background:priorityColor(task.priority)}}/>
                  </div>
                ))}
              </div>
            </section>

            {/* Recordatorios */}
            <section>
              <h2 className="text-[#152540] font-black text-base mb-3">Recordatorios próximos</h2>
              <div className="space-y-2">
                {pendingFuture.slice(0,3).map(task=>(
                  <div key={task.id} className="bg-white rounded-2xl px-4 py-3 border border-[#E2EAF0] flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg" style={{background:priorityBg(task.priority)}}>{task.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#152540] font-semibold text-sm truncate">{task.title}</p>
                      <p className="text-[#A8B5C8] text-[10px]" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                        {task.date===todayStr()?"Hoy":new Date(task.date+"T12:00:00").toLocaleDateString("es-ES",{day:"numeric",month:"short"})}
                        {task.time?` · ${task.time}`:""}
                      </p>
                    </div>
                  </div>
                ))}
                {pendingFuture.length===0&&<div className="bg-white rounded-2xl p-4 border border-[#E2EAF0] text-center"><p className="text-[#6B7A99] text-sm" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Sin recordatorios pendientes</p></div>}
              </div>
            </section>

            {/* Racha */}
            <div className="bg-white rounded-2xl p-4 border border-[#E2EAF0] flex items-center gap-4">
              <div className="w-12 h-12 bg-[#FEF3C7] rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">🔥</div>
              <div><p className="text-[#152540] font-black text-xl">{streak} días</p><p className="text-[#6B7A99] text-xs" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Racha de bienestar activa</p></div>
              <Trophy className="w-5 h-5 text-[#F59E0B] ml-auto"/>
            </div>

            {/* Quote */}
            <div className="bg-[#152540] rounded-2xl p-5">
              <p className="text-[#3BBFB4] text-[10px] font-black uppercase tracking-widest mb-2">💡 Frase del día</p>
              <p className="text-white font-semibold text-sm leading-relaxed" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>"{dailyQuote()}"</p>
            </div>
          </div>
        </div>
      )}

      {/* ══ CALENDAR ══════════════════════════════════════════════════════ */}
      {mainTab==="calendar" && (
        <div className="flex-1 overflow-y-auto pb-24">
          <div className="bg-[#152540] pt-14 pb-6 px-5">
            <h1 className="text-white text-2xl font-black">Calendario</h1>
            <p className="text-white/50 text-xs mt-1" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Organiza tu vida académica y personal</p>
          </div>

          <div className="px-4 mt-4 space-y-4">
            {/* Calendar grid */}
            <div className="bg-white rounded-3xl p-4 border border-[#E2EAF0] shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <button type="button" onClick={()=>setCalMonth(m=>new Date(m.getFullYear(),m.getMonth()-1,1))}
                  className="w-9 h-9 rounded-xl bg-[#F5F8FA] flex items-center justify-center hover:bg-[#E8F4F8] transition-colors">
                  <ChevronLeft className="w-4 h-4 text-[#152540]"/>
                </button>
                <span className="font-black text-[#152540] text-base">{MONTH_NAMES[calMonth.getMonth()]} {calMonth.getFullYear()}</span>
                <button type="button" onClick={()=>setCalMonth(m=>new Date(m.getFullYear(),m.getMonth()+1,1))}
                  className="w-9 h-9 rounded-xl bg-[#F5F8FA] flex items-center justify-center hover:bg-[#E8F4F8] transition-colors">
                  <ChevronRight className="w-4 h-4 text-[#152540]"/>
                </button>
              </div>
              <div className="grid grid-cols-7 mb-1">
                {DAY_NAMES_SHORT.map((d,i)=><div key={i} className="text-center text-[11px] font-black text-[#A8B5C8] py-1">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-y-0.5">
                {calDays.map(({date,inMonth},i)=>{
                  const ds=dateToStr(date), isToday=ds===todayStr(), isSel=ds===selectedDate;
                  const taskCount=tasks.filter(t=>t.date===ds).length;
                  const hasHigh=tasks.some(t=>t.date===ds&&t.priority==="alta"&&!t.completed);
                  return (
                    <button key={i} type="button" onClick={()=>setSelectedDate(ds)}
                      className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-150 ${isSel?"bg-[#152540] text-white":isToday?"bg-[#E8F4F8] text-[#152540]":inMonth?"text-[#152540] hover:bg-[#F5F8FA]":"text-[#D1DBE8]"}`}>
                      <span className={`text-xs ${isSel||isToday?"font-black":"font-semibold"}`}>{date.getDate()}</span>
                      {taskCount>0&&<div className={`absolute bottom-1 w-1 h-1 rounded-full ${isSel?"bg-white":hasHigh?"bg-[#EF4444]":"bg-[#3BBFB4]"}`}/>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected date tasks */}
            <div>
              <h3 className="text-[#152540] font-black text-sm mb-3">
                {selectedDate===todayStr()?"Hoy":new Date(selectedDate+"T12:00:00").toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"})}
              </h3>
              <div className="space-y-2">
                {selectedDateTasks.length===0?(
                  <div className="bg-white rounded-2xl p-6 border border-[#E2EAF0] text-center">
                    <p className="text-3xl mb-2">📅</p>
                    <p className="text-[#6B7A99] text-sm font-semibold">Sin actividades para este día</p>
                    <p className="text-[#A8B5C8] text-xs mt-1" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Toca + para agregar una</p>
                  </div>
                ):selectedDateTasks.map(task=><TaskRow key={task.id} task={task} showStatus/>)}
              </div>
            </div>

            {/* Estado de tareas accordion */}
            <div>
              <h2 className="text-[#152540] font-black text-base mb-3">Estado de tareas</h2>
              <div className="space-y-2">
                <AccordionSection id="pendientes" label="Pendientes" count={pendingFuture.length}
                  color="#F59E0B" bg="#FEF3C7" open={statusOpen.pendientes}
                  onToggle={()=>setStatusOpen(s=>({...s,pendientes:!s.pendientes}))}>
                  {pendingFuture.length===0
                    ?<p className="text-[#A8B5C8] text-xs text-center py-2" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>¡Sin tareas pendientes! 🎉</p>
                    :pendingFuture.map(task=><TaskRow key={task.id} task={task}/>)}
                </AccordionSection>

                <AccordionSection id="vencidas" label="Vencidas / Perdidas" count={overdueTasks.length}
                  color="#EF4444" bg="#FEE2E2" open={statusOpen.vencidas}
                  onToggle={()=>setStatusOpen(s=>({...s,vencidas:!s.vencidas}))}>
                  {overdueTasks.length===0
                    ?<p className="text-[#A8B5C8] text-xs text-center py-2" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Sin tareas vencidas ✓</p>
                    :overdueTasks.map(task=><TaskRow key={task.id} task={task} showStatus/>)}
                </AccordionSection>

                <AccordionSection id="completadas" label="Completadas" count={completedTasks.length}
                  color="#22C55E" bg="#DCFCE7" open={statusOpen.completadas}
                  onToggle={()=>setStatusOpen(s=>({...s,completadas:!s.completadas}))}>
                  {completedTasks.length===0
                    ?<p className="text-[#A8B5C8] text-xs text-center py-2" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Aún no has completado tareas</p>
                    :completedTasks.map(task=><TaskRow key={task.id} task={task}/>)}
                </AccordionSection>
              </div>
            </div>
          </div>

          {/* FAB */}
          <button type="button" onClick={()=>openAddTask(selectedDate)}
            className="fixed bottom-24 right-5 w-14 h-14 bg-[#152540] rounded-2xl flex items-center justify-center shadow-xl shadow-[#152540]/35 hover:bg-[#152540]/90 active:scale-95 transition-all z-40">
            <Plus className="w-7 h-7 text-white"/>
          </button>
        </div>
      )}

      {/* ══ HEALTH ════════════════════════════════════════════════════════ */}
      {mainTab==="health" && (
        <div className="flex-1 overflow-y-auto pb-24">
          <div className="bg-[#152540] pt-14 pb-6 px-5">
            <h1 className="text-white text-2xl font-black">Check-in diario ✨</h1>
            <p className="text-white/50 text-xs mt-1" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Registra cómo te sientes en menos de un minuto.</p>
          </div>

          <div className="px-4 mt-4 space-y-4">
            {/* Streak */}
            <div className="bg-white rounded-2xl p-4 border border-[#E2EAF0] flex items-center gap-3">
              <span className="text-2xl">🔥</span>
              <div>
                <p className="text-[#152540] font-black">{streak} días de racha</p>
                <p className="text-[#6B7A99] text-xs" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>¡Sigue así! El bienestar es un hábito.</p>
              </div>
            </div>

            {todayCheckin ? (
              <div className="space-y-4">
                <div className="bg-white rounded-3xl p-6 border border-[#E2EAF0] text-center space-y-3">
                  <div className="w-16 h-16 bg-[#DCFCE7] rounded-2xl flex items-center justify-center mx-auto text-3xl">✅</div>
                  <h3 className="text-[#152540] font-black text-lg">¡Check-in completado!</h3>
                  <p className="text-[#6B7A99] text-sm" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Ya registraste cómo te sientes hoy. ¡Buen trabajo!</p>
                  <div className="grid grid-cols-2 gap-3 text-left">
                    {[
                      {label:"Estado de ánimo",value:`${getMoodDisplay(todayCheckin).emoji} ${getMoodDisplay(todayCheckin).label}`},
                      {label:"Horas de sueño",value:`🌙 ${todayCheckin.sleep}h`},
                      {label:"Nivel de energía",value:"⚡".repeat(todayCheckin.energy)+"·".repeat(5-todayCheckin.energy)},
                      {label:"Influido por",value:todayCheckin.influences.slice(0,2).join(", ")||"—"},
                    ].map((item,i)=>(
                      <div key={i} className="bg-[#F5F8FA] rounded-xl p-3">
                        <p className="text-[#6B7A99] text-[10px] font-semibold" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{item.label}</p>
                        <p className="text-[#152540] font-bold text-sm mt-1">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 1. Sleep */}
                <div className="bg-white rounded-2xl p-4 border border-[#E2EAF0]">
                  <div className="flex items-center gap-2 mb-4"><span className="text-xl">🌙</span><h3 className="text-[#152540] font-black text-sm">¿Cuántas horas dormiste anoche?</h3></div>
                  <div className="flex items-center gap-4">
                    <button type="button" onClick={()=>setCheckinSleep(s=>Math.max(0,+(s-0.5).toFixed(1)))}
                      className="w-10 h-10 rounded-xl bg-[#F5F8FA] font-black text-[#152540] hover:bg-[#E8F4F8] transition-colors text-xl flex items-center justify-center">−</button>
                    <div className="flex-1 text-center"><span className="text-4xl font-black text-[#152540]">{checkinSleep}</span><span className="text-[#6B7A99] text-sm ml-1">h</span></div>
                    <button type="button" onClick={()=>setCheckinSleep(s=>Math.min(14,+(s+0.5).toFixed(1)))}
                      className="w-10 h-10 rounded-xl bg-[#F5F8FA] font-black text-[#152540] hover:bg-[#E8F4F8] transition-colors text-xl flex items-center justify-center">+</button>
                  </div>
                  <div className="mt-3 flex gap-1.5">
                    {[["< 5h","#EF4444",0,5],["5–7h","#F59E0B",5,7],["7–9h","#22C55E",7,9],["9h+","#3BBFB4",9,14]].map(([label,color,min,max])=>{
                      const active=checkinSleep>=(min as number)&&checkinSleep<(max as number);
                      return (<div key={label as string} className="flex-1 space-y-1"><div className="h-1.5 rounded-full transition-all" style={{background:active?color as string:"#EEF2F7"}}/><p className="text-[9px] text-center font-bold" style={{color:active?color as string:"#D1DBE8",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{label as string}</p></div>);
                    })}
                  </div>
                </div>

                {/* 2. Mood (including "Otra") */}
                <div className="bg-white rounded-2xl p-4 border border-[#E2EAF0]">
                  <div className="flex items-center gap-2 mb-4"><span className="text-xl">💭</span><h3 className="text-[#152540] font-black text-sm">¿Cómo te sientes hoy?</h3></div>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(MOOD_DATA) as Mood[]).map(mood=>(
                      <button key={mood} type="button" onClick={()=>setCheckinMood(mood)}
                        className="p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all duration-200 active:scale-[0.97]"
                        style={{background:checkinMood===mood?MOOD_DATA[mood].bg:"#F5F8FA", border:`2px solid ${checkinMood===mood?MOOD_DATA[mood].color:"transparent"}`, transform:checkinMood===mood?"scale(1.04)":"scale(1)"}}>
                        <span className="text-2xl">{MOOD_DATA[mood].emoji}</span>
                        <span className="text-[10px] font-bold" style={{color:checkinMood===mood?MOOD_DATA[mood].color:"#6B7A99",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{MOOD_DATA[mood].label}</span>
                      </button>
                    ))}
                  </div>
                  {/* Custom mood input */}
                  {checkinMood==="otra" && (
                    <div className="mt-3">
                      <input value={checkinCustomMood} onChange={e=>setCheckinCustomMood(e.target.value)}
                        placeholder="¿Qué emoción estás sintiendo? ej: ansioso, orgulloso..."
                        className="w-full bg-[#F5F8FA] rounded-xl py-3 px-3.5 text-sm text-[#152540] placeholder-[#A8B5C8] outline-none focus:ring-2 focus:ring-[#152540]/15 transition-all"
                        style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}} autoFocus/>
                    </div>
                  )}
                </div>

                {/* 3. Energy */}
                <div className="bg-white rounded-2xl p-4 border border-[#E2EAF0]">
                  <div className="flex items-center gap-2 mb-4"><span className="text-xl">⚡</span><h3 className="text-[#152540] font-black text-sm">¿Qué nivel de energía tienes?</h3></div>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(n=>(
                      <button key={n} type="button" onClick={()=>setCheckinEnergy(n)}
                        className="flex-1 aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200"
                        style={{background:n<=checkinEnergy?"#152540":"#F5F8FA"}}>
                        <span className="text-base">{n<=2?"🪫":n<=3?"⚡":"🔋"}</span>
                        <span className="text-[10px] font-black" style={{color:n<=checkinEnergy?"#fff":"#D1DBE8"}}>{n}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Influences */}
                <div className="bg-white rounded-2xl p-4 border border-[#E2EAF0]">
                  <div className="flex items-center gap-2 mb-4"><span className="text-xl">🔍</span><h3 className="text-[#152540] font-black text-sm">¿Qué influyó en cómo te sientes?</h3></div>
                  <div className="flex flex-wrap gap-2">
                    {INFLUENCES.map(inf=>(
                      <button key={inf} type="button" onClick={()=>toggleInfluence(inf)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${checkinInfluences.includes(inf)?"bg-[#152540] text-white":"bg-[#F5F8FA] text-[#6B7A99] hover:bg-[#E8F4F8]"}`}>
                        {inf}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Note */}
                <div className="bg-white rounded-2xl p-4 border border-[#E2EAF0]">
                  <div className="flex items-center gap-2 mb-3"><span className="text-xl">📝</span><h3 className="text-[#152540] font-black text-sm">Nota opcional</h3></div>
                  <textarea value={checkinNote} onChange={e=>setCheckinNote(e.target.value)}
                    placeholder="Escribe cómo estuvo tu día, qué te preocupó o qué te hizo sentir bien."
                    className="w-full bg-[#F5F8FA] rounded-xl p-3.5 text-xs text-[#152540] placeholder-[#A8B5C8] outline-none resize-none min-h-[90px] leading-relaxed focus:ring-2 focus:ring-[#152540]/10 transition-all"
                    style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}/>
                </div>

                <button type="button" onClick={saveCheckin}
                  disabled={!checkinMood||(checkinMood==="otra"&&!checkinCustomMood.trim())}
                  className="w-full bg-[#152540] text-white font-black py-4 rounded-2xl text-sm disabled:opacity-40 hover:bg-[#152540]/90 transition-all active:scale-[0.98] shadow-lg shadow-[#152540]/20">
                  Guardar check-in ✨
                </button>
              </div>
            )}

            {/* Weekly history */}
            <div className="bg-white rounded-2xl p-4 border border-[#E2EAF0]">
              <h3 className="text-[#152540] font-black text-sm mb-4">Historial semanal</h3>
              <div className="flex gap-1.5">
                {Array.from({length:7},(_,i)=>{
                  const d=daysAgo(6-i), rec=checkinHistory.find(c=>c.date===d), isToday=d===todayStr();
                  const display = rec ? getMoodDisplay(rec) : null;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <p className="text-[10px] font-bold text-[#A8B5C8]">{DAY_NAMES_SHORT[new Date(d+"T12:00:00").getDay()]}</p>
                      <div className={`w-full aspect-square rounded-xl flex items-center justify-center text-base transition-all ${isToday?"ring-2 ring-[#152540] ring-offset-1":""}`}
                        style={{background:display?display.bg:"#F5F8FA"}}>
                        {display?display.emoji:<span className="text-[#D1DBE8] text-sm">·</span>}
                      </div>
                      <p className="text-[8px] text-[#A8B5C8] text-center leading-tight" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                        {display?display.label.slice(0,6):"—"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ PROFILE ═══════════════════════════════════════════════════════ */}
      {mainTab==="profile" && (
        <div className="flex-1 overflow-y-auto pb-24">
          <div className="bg-[#152540] pt-14 pb-16 px-5">
            <h1 className="text-white text-2xl font-black">Mi perfil</h1>
          </div>

          <div className="px-4 -mt-10 space-y-4">
            {/* Profile card */}
            <div className="bg-white rounded-3xl p-5 border border-[#E2EAF0] shadow-sm">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#152540] flex items-center justify-center shadow-md">
                    {profilePhoto
                      ? <img src={profilePhoto} alt="Foto de perfil" className="w-full h-full object-cover"/>
                      : <span className="text-white text-2xl font-black">{userName.charAt(0).toUpperCase()}</span>}
                  </div>
                  <button type="button" onClick={()=>setShowPhotoOptions(v=>!v)}
                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#3BBFB4] rounded-lg flex items-center justify-center shadow-md hover:bg-[#2AADA2] transition-colors">
                    <Camera className="w-3.5 h-3.5 text-white"/>
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#152540] font-black text-base truncate">{userName}</p>
                  <p className="text-[#6B7A99] text-xs truncate" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{userEmail}</p>
                  {userSport&&<span className="inline-block mt-1.5 bg-[#E8F4F8] text-[#152540] text-[10px] font-bold px-2.5 py-0.5 rounded-full">{userSport}</span>}
                </div>
              </div>

              {/* Photo options */}
              {showPhotoOptions && (
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={()=>photoInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#F5F8FA] rounded-xl py-2.5 text-xs font-bold text-[#152540] hover:bg-[#E8F4F8] transition-colors">
                    <ImagePlus className="w-4 h-4"/><span>Galería</span>
                  </button>
                  <button type="button" onClick={()=>cameraInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#F5F8FA] rounded-xl py-2.5 text-xs font-bold text-[#152540] hover:bg-[#E8F4F8] transition-colors">
                    <Camera className="w-4 h-4"/><span>Cámara</span>
                  </button>
                  <button type="button" onClick={()=>setShowPhotoOptions(false)}
                    className="w-10 flex items-center justify-center bg-[#FEF2F2] rounded-xl text-[#EF4444] hover:bg-[#FEE2E2] transition-colors text-xs font-bold">✕</button>
                </div>
              )}
              {/* Hidden file inputs */}
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoFile}/>
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoFile}/>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-[#F5F8FA]">
                {[
                  {value:streak,label:"Días de racha",icon:"🔥"},
                  {value:tasks.filter(t=>t.completed).length,label:"Tareas hechas",icon:"✅"},
                  {value:checkinHistory.length,label:"Check-ins",icon:"💙"},
                ].map((stat,i)=>(
                  <div key={i} className="text-center">
                    <p className="text-xl mb-1">{stat.icon}</p>
                    <p className="text-[#152540] font-black text-xl">{stat.value}</p>
                    <p className="text-[#A8B5C8] text-[10px]" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pet info */}
            <div className="bg-white rounded-2xl p-4 border border-[#E2EAF0] flex items-center gap-4">
              <div className="text-4xl">{PET_EMOJIS[petType]}</div>
              <div className="flex-1">
                <p className="text-[#152540] font-black text-sm">{petName||"Mi mascota"}</p>
                <p className="text-[#6B7A99] text-xs" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Nivel {petLevel} · {petHappiness}% felicidad</p>
                <div className="mt-2 h-1.5 bg-[#FEF3C7] rounded-full overflow-hidden">
                  <div className="h-full bg-[#F59E0B] rounded-full transition-all" style={{width:`${petHappiness}%`}}/>
                </div>
              </div>
            </div>

            {/* ⭐ Evaluate Restifound */}
            <button type="button" onClick={()=>setShowFeedback(true)}
              className="w-full bg-gradient-to-r from-[#F59E0B] to-[#F97316] rounded-2xl p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform shadow-md shadow-[#F59E0B]/30">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">⭐</div>
              <div className="flex-1">
                <p className="text-white font-black text-sm">Evaluar Restifound</p>
                <p className="text-white/75 text-xs mt-0.5" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Comparte tu experiencia con el prototipo</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/60 flex-shrink-0"/>
            </button>

            {/* Notifications */}
            <div className="bg-white rounded-2xl border border-[#E2EAF0] overflow-hidden">
              <div className="px-4 py-3 bg-[#F5F8FA] border-b border-[#E2EAF0]">
                <p className="text-[#6B7A99] text-[10px] font-black uppercase tracking-widest" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Notificaciones</p>
              </div>
              {[
                {label:"Recordatorios de tareas",emoji:"🔔",value:notifReminders,setter:setNotifReminders},
                {label:"Check-in diario",emoji:"✨",value:notifCheckin,setter:setNotifCheckin},
                {label:"Mensajes de mascota",emoji:PET_EMOJIS[petType],value:notifPet,setter:setNotifPet},
              ].map((item,i,arr)=>(
                <div key={i} className={`flex items-center justify-between px-4 py-3.5 ${i<arr.length-1?"border-b border-[#F5F8FA]":""}`}>
                  <div className="flex items-center gap-3"><span className="text-lg w-6 text-center">{item.emoji}</span><span className="text-[#152540] text-sm font-semibold">{item.label}</span></div>
                  <button type="button" onClick={()=>item.setter(v=>!v)}
                    className="relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0"
                    style={{background:item.value?"#152540":"#D1DBE8"}}>
                    <div className="absolute top-[2px] w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300" style={{left:item.value?"22px":"2px"}}/>
                  </button>
                </div>
              ))}
            </div>

            {/* Account */}
            <div className="bg-white rounded-2xl border border-[#E2EAF0] overflow-hidden">
              <div className="px-4 py-3 bg-[#F5F8FA] border-b border-[#E2EAF0]">
                <p className="text-[#6B7A99] text-[10px] font-black uppercase tracking-widest" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Cuenta</p>
              </div>
              {[
                {icon:"🛡️",label:"Privacidad y Habeas Data",href:"https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981"},
                {icon:"ℹ️",label:"Acerca de Restifound",href:undefined},
              ].map((item,i,arr)=>(
                <a key={i} href={item.href} target={item.href?"_blank":undefined} rel="noopener noreferrer"
                  className={`flex items-center gap-3 px-4 py-4 hover:bg-[#F5F8FA] transition-colors cursor-pointer ${i<arr.length-1?"border-b border-[#F5F8FA]":""}`}>
                  <span className="text-lg w-6 text-center">{item.icon}</span>
                  <span className="text-[#152540] text-sm font-semibold flex-1">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-[#D1DBE8]"/>
                </a>
              ))}
            </div>

            <button type="button" onClick={handleLogout}
              className="w-full bg-white rounded-2xl border border-[#FEE2E2] p-4 flex items-center justify-center gap-2 text-[#EF4444] font-bold text-sm hover:bg-[#FEF2F2] transition-colors">
              <LogOut className="w-4 h-4"/>Cerrar sesión
            </button>
            <p className="text-center text-[#D1DBE8] text-[10px] pb-2" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Restifound v1.0 · Bienestar estudiantil</p>
          </div>
        </div>
      )}

      {/* ══ BOTTOM NAV ════════════════════════════════════════════════════ */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t border-[#E8EFF5] z-50 shadow-sm">
        <div className="flex items-center justify-around px-2 pt-2 pb-3">
          {[
            {tab:"home" as MainTab,Icon:Home,label:"Inicio"},
            {tab:"calendar" as MainTab,Icon:CalIcon,label:"Calendario"},
            {tab:"health" as MainTab,Icon:Heart,label:"Salud"},
            {tab:"profile" as MainTab,Icon:User,label:"Perfil"},
          ].map(({tab,Icon,label})=>{
            const active=mainTab===tab;
            return (
              <button key={tab} type="button" onClick={()=>setMainTab(tab)}
                className={`flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all duration-200 ${active?"text-[#152540]":"text-[#A8B5C8] hover:text-[#6B7A99]"}`}>
                <div className={`w-7 h-7 flex items-center justify-center rounded-xl transition-all ${active?"bg-[#E8F4F8]":""}`}>
                  <Icon className="w-5 h-5" strokeWidth={active?2.5:1.8}/>
                </div>
                <span className={`text-[10px] ${active?"font-black text-[#152540]":"font-semibold"}`} style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ══ DIALOG: ADD TASK ══════════════════════════════════════════════ */}
      <Dialog open={showAddTask} onOpenChange={v=>{setShowAddTask(v);if(!v){resetTaskForm();}}}>
        <DialogContent className="!rounded-3xl !p-0 !max-w-sm overflow-hidden border-[#E2EAF0]" aria-describedby={undefined}>
          <DialogHeader className="px-5 pt-6 pb-0">
            <DialogTitle className="text-[#152540] font-black text-lg">Nueva actividad</DialogTitle>
          </DialogHeader>
          <TaskFormFields/>
          <DialogFooter className="px-5 pb-6 space-y-2">
            <div className="flex gap-2">
              <button type="button" onClick={()=>{setShowAddTask(false);resetTaskForm();}}
                className="flex-1 py-3 rounded-xl border-2 border-[#E2EAF0] text-[#6B7A99] font-bold text-sm hover:border-[#152540]/30 transition-colors">Cancelar</button>
              <button type="button" onClick={addTask} disabled={!newTaskTitle.trim()||!newTaskDate}
                className="flex-1 py-3 rounded-xl bg-[#152540] text-white font-black text-sm disabled:opacity-40 hover:bg-[#152540]/90 transition-all">Guardar</button>
            </div>
            <button type="button" onClick={addAndSendTask}
              disabled={!newTaskTitle.trim()||!newTaskDate||bleStatus!=="connected"}
              className="w-full py-3 rounded-xl text-white font-black text-sm disabled:opacity-40 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{background:bleStatus==="connected"?"linear-gradient(135deg,#152540,#1e3a5f)":"#A8B5C8"}}>
              <Send className="w-4 h-4"/>
              {bleStatus==="connected" ? "Guardar y enviar al ESP32" : "Conecta ESP32 para enviar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ DIALOG: EDIT TASK ═════════════════════════════════════════════ */}
      <Dialog open={showEditTask} onOpenChange={v=>{setShowEditTask(v);if(!v){setEditingTask(null);resetTaskForm();}}}>
        <DialogContent className="!rounded-3xl !p-0 !max-w-sm overflow-hidden border-[#E2EAF0]" aria-describedby={undefined}>
          <DialogHeader className="px-5 pt-6 pb-0">
            <DialogTitle className="text-[#152540] font-black text-lg">Editar actividad</DialogTitle>
          </DialogHeader>
          <TaskFormFields/>
          <DialogFooter className="px-5 pb-6 flex gap-2">
            <button type="button" onClick={()=>{setShowEditTask(false);setEditingTask(null);resetTaskForm();}}
              className="flex-1 py-3 rounded-xl border-2 border-[#E2EAF0] text-[#6B7A99] font-bold text-sm hover:border-[#152540]/30 transition-colors">Cancelar</button>
            <button type="button" onClick={saveEditTask} disabled={!newTaskTitle.trim()||!newTaskDate}
              className="flex-1 py-3 rounded-xl bg-[#152540] text-white font-black text-sm disabled:opacity-40 hover:bg-[#152540]/90 transition-all">Guardar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ DIALOG: FEEDBACK ══════════════════════════════════════════════ */}
      <Dialog open={showFeedback} onOpenChange={v=>{if(!feedbackSubmitted) setShowFeedback(v);}}>
        <DialogContent className="!rounded-3xl !p-0 !max-w-sm overflow-hidden border-[#E2EAF0] max-h-[90vh]" aria-describedby={undefined}>
          <DialogHeader className="px-5 pt-6 pb-0">
            <DialogTitle className="text-[#152540] font-black text-lg flex items-center gap-2">
              <span>⭐</span> Evaluar Restifound
            </DialogTitle>
          </DialogHeader>

          {feedbackSubmitted ? (
            <div className="px-5 py-10 text-center space-y-3">
              <div className="w-20 h-20 bg-[#DCFCE7] rounded-3xl flex items-center justify-center mx-auto text-4xl">✅</div>
              <h3 className="text-[#152540] font-black text-xl">¡Gracias!</h3>
              <p className="text-[#6B7A99] text-sm" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Tu evaluación nos ayuda a mejorar Restifound para ti y para otros estudiantes.</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[70vh]">
              <div className="px-5 py-4 space-y-5">
                {/* Star rating */}
                <div>
                  <p className="text-[#152540] font-black text-sm mb-1">Calificación general *</p>
                  <p className="text-[#6B7A99] text-xs mb-3" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>¿Cómo calificarías tu experiencia con Restifound?</p>
                  <div className="flex gap-2 justify-center">
                    {[1,2,3,4,5].map(n=>(
                      <button key={n} type="button" onClick={()=>setFeedbackRating(n)}
                        className="transition-transform hover:scale-110 active:scale-95">
                        <Star className={`w-9 h-9 transition-all ${n<=feedbackRating?"fill-[#F59E0B] text-[#F59E0B]":"text-[#D1DBE8]"}`}/>
                      </button>
                    ))}
                  </div>
                  {feedbackRating>0 && (
                    <p className="text-center text-xs font-bold mt-2" style={{color:"#F59E0B"}}>
                      {["","Muy insatisfecho","Insatisfecho","Neutral","Satisfecho","Muy satisfecho"][feedbackRating]}
                    </p>
                  )}
                </div>

                {/* Days used */}
                <div>
                  <label className="text-[#152540] font-black text-sm block mb-1">Días de uso *</label>
                  <p className="text-[#6B7A99] text-xs mb-2" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>¿Cuántos días utilizaste el prototipo Restifound?</p>
                  <input type="number" value={feedbackDays} onChange={e=>setFeedbackDays(e.target.value)} min="1"
                    placeholder="ej: 7"
                    className="w-full bg-[#F5F8FA] rounded-xl py-3 px-3.5 text-sm text-[#152540] placeholder-[#A8B5C8] outline-none focus:ring-2 focus:ring-[#152540]/15"
                    style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}/>
                </div>

                {/* Experience */}
                <div>
                  <label className="text-[#152540] font-black text-sm block mb-1">Tu experiencia *</label>
                  <p className="text-[#6B7A99] text-xs mb-2" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Cuéntanos sobre tu experiencia usando el aparato Restifound y la aplicación.</p>
                  <textarea value={feedbackExperience} onChange={e=>{if(e.target.value.length<=1000)setFeedbackExperience(e.target.value);}}
                    placeholder="¿Cómo fue tu experiencia? ¿Fue fácil de usar? ¿Qué te pareció el prototipo?..."
                    className="w-full bg-[#F5F8FA] rounded-xl p-3.5 text-xs text-[#152540] placeholder-[#A8B5C8] outline-none resize-none min-h-[100px] leading-relaxed focus:ring-2 focus:ring-[#152540]/10 transition-all"
                    style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}/>
                  <p className="text-right text-[10px] mt-1" style={{color:feedbackExperience.length>900?"#EF4444":"#A8B5C8",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                    {feedbackExperience.length}/1000
                  </p>
                </div>

                {/* Recommendations */}
                <div>
                  <label className="text-[#152540] font-black text-sm block mb-1">Recomendaciones <span className="text-[#A8B5C8] font-normal">(opcional)</span></label>
                  <textarea value={feedbackRecs} onChange={e=>{if(e.target.value.length<=1000)setFeedbackRecs(e.target.value);}}
                    placeholder="¿Qué mejorarías? ¿Qué funcionalidades te gustaría agregar?"
                    className="w-full bg-[#F5F8FA] rounded-xl p-3.5 text-xs text-[#152540] placeholder-[#A8B5C8] outline-none resize-none min-h-[80px] leading-relaxed focus:ring-2 focus:ring-[#152540]/10 transition-all"
                    style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}/>
                  <p className="text-right text-[10px] mt-1" style={{color:feedbackRecs.length>900?"#EF4444":"#A8B5C8",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                    {feedbackRecs.length}/1000
                  </p>
                </div>

                <div className="bg-[#F5F8FA] rounded-xl p-3 text-[10px] text-[#6B7A99]" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  * Campos obligatorios. Tu evaluación se guarda de forma segura y nos ayuda a mejorar.
                </div>

                {feedbackError && <p className="text-[#EF4444] text-xs font-semibold">{feedbackError}</p>}
              </div>
            </div>
          )}

          {!feedbackSubmitted && (
            <DialogFooter className="px-5 pb-6 pt-3 border-t border-[#F5F8FA] flex gap-2">
              <button type="button" onClick={()=>{setShowFeedback(false);setFeedbackError("");}}
                className="flex-1 py-3 rounded-xl border-2 border-[#E2EAF0] text-[#6B7A99] font-bold text-sm hover:border-[#152540]/30 transition-colors">Cancelar</button>
              <button type="button" onClick={submitFeedback}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-white font-black text-sm hover:opacity-90 transition-all shadow-md">
                Enviar ⭐
              </button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
