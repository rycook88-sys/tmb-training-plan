// Design: Alpine dark theme — Travel Toolkit section
// Currency converter (EUR/CHF→USD), phrasebook with TTS + big-text modal, cultural etiquette
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, DollarSign, Languages, Heart, Volume2, X,
  RefreshCw, Wifi, WifiOff, ArrowRightLeft,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════
   CURRENCY CONVERTER — daily-cached rates, offline-ready
   ═══════════════════════════════════════════════════════ */

const CACHE_KEY = "tmb_exchange_rates";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CachedRates {
  timestamp: number;
  eurToUsd: number;
  chfToUsd: number;
}

function loadCachedRates(): CachedRates | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedRates;
  } catch { return null; }
}

function saveCachedRates(rates: CachedRates) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(rates));
}

async function fetchRates(): Promise<CachedRates | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!res.ok) return null;
    const data = await res.json();
    const eurRate = data.rates?.EUR;
    const chfRate = data.rates?.CHF;
    if (!eurRate || !chfRate) return null;
    const rates: CachedRates = {
      timestamp: Date.now(),
      eurToUsd: 1 / eurRate,
      chfToUsd: 1 / chfRate,
    };
    saveCachedRates(rates);
    return rates;
  } catch { return null; }
}

function CurrencyConverter() {
  const [rates, setRates] = useState<CachedRates | null>(loadCachedRates());
  const [amount, setAmount] = useState("10");
  const [currency, setCurrency] = useState<"EUR" | "CHF">("EUR");
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  const refreshRates = useCallback(async () => {
    setLoading(true);
    const fresh = await fetchRates();
    if (fresh) setRates(fresh);
    setLoading(false);
  }, []);

  // Auto-fetch on mount if cache is stale or missing
  useEffect(() => {
    const cached = loadCachedRates();
    if (!cached || Date.now() - cached.timestamp > CACHE_DURATION) {
      refreshRates();
    }
  }, [refreshRates]);

  const rate = rates ? (currency === "EUR" ? rates.eurToUsd : rates.chfToUsd) : null;
  const numAmount = parseFloat(amount) || 0;
  const converted = rate ? (numAmount * rate).toFixed(2) : "—";
  const rateDisplay = rate ? rate.toFixed(4) : "—";
  const lastUpdated = rates ? new Date(rates.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Never";

  return (
    <div className="border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--primary)] font-semibold flex items-center gap-2">
          <DollarSign className="w-3.5 h-3.5" /> Currency Converter
        </h3>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="w-3 h-3 text-green-500" />
          ) : (
            <WifiOff className="w-3 h-3 text-yellow-500" />
          )}
          <span className="text-[9px] font-mono text-muted-foreground">
            {isOnline ? "Online" : "Offline (cached)"}
          </span>
        </div>
      </div>

      {/* Currency toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setCurrency("EUR")}
          className={`flex-1 py-2 text-xs font-mono font-semibold rounded transition-all ${
            currency === "EUR"
              ? "bg-blue-600 text-white"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          }`}
        >
          🇪🇺 EUR → USD
        </button>
        <button
          onClick={() => setCurrency("CHF")}
          className={`flex-1 py-2 text-xs font-mono font-semibold rounded transition-all ${
            currency === "CHF"
              ? "bg-red-600 text-white"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          }`}
        >
          🇨🇭 CHF → USD
        </button>
      </div>

      {/* Input + Output */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">{currency}</label>
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-foreground text-lg font-mono px-3 py-2 rounded focus:outline-none focus:border-[var(--primary)] transition-colors"
            placeholder="0.00"
          />
        </div>
        <ArrowRightLeft className="w-4 h-4 text-muted-foreground mt-4 shrink-0" />
        <div className="flex-1">
          <label className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">USD</label>
          <div className="w-full bg-slate-900 border border-slate-700 text-green-400 text-lg font-mono font-bold px-3 py-2 rounded">
            ${converted}
          </div>
        </div>
      </div>

      {/* Quick amounts */}
      <div className="flex gap-1.5 flex-wrap">
        {[5, 10, 20, 50, 100].map((v) => (
          <button
            key={v}
            onClick={() => setAmount(String(v))}
            className={`px-2.5 py-1 text-[10px] font-mono rounded transition-all ${
              amount === String(v)
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Rate info + refresh */}
      <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground">
        <span>1 {currency} = ${rateDisplay} USD</span>
        <div className="flex items-center gap-2">
          <span>Updated: {lastUpdated}</span>
          <button
            onClick={refreshRates}
            disabled={loading || !isOnline}
            className="text-[var(--primary)] hover:text-[var(--primary)]/80 disabled:opacity-30 transition-opacity"
            title="Refresh rates"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PHRASEBOOK — French & Italian with TTS + big-text modal
   ═══════════════════════════════════════════════════════ */

interface Phrase {
  english: string;
  translation: string;
  phonetic: string;
  category: string;
}

const FRENCH_PHRASES: Phrase[] = [
  // Greetings & Basics
  { english: "Hello / Good day", translation: "Bonjour", phonetic: "bohn-ZHOOR", category: "Greetings" },
  { english: "Good evening", translation: "Bonsoir", phonetic: "bohn-SWAHR", category: "Greetings" },
  { english: "Goodbye", translation: "Au revoir", phonetic: "oh ruh-VWAHR", category: "Greetings" },
  { english: "Please", translation: "S'il vous plaît", phonetic: "seel voo PLEH", category: "Greetings" },
  { english: "Thank you", translation: "Merci", phonetic: "mair-SEE", category: "Greetings" },
  { english: "Thank you very much", translation: "Merci beaucoup", phonetic: "mair-SEE boh-KOO", category: "Greetings" },
  { english: "You're welcome", translation: "De rien", phonetic: "duh ree-EN", category: "Greetings" },
  { english: "Excuse me", translation: "Excusez-moi", phonetic: "ex-koo-ZAY mwah", category: "Greetings" },
  { english: "I'm sorry", translation: "Je suis désolé", phonetic: "zhuh swee day-zo-LAY", category: "Greetings" },
  { english: "Yes / No", translation: "Oui / Non", phonetic: "wee / nohn", category: "Greetings" },
  { english: "Do you speak English?", translation: "Parlez-vous anglais ?", phonetic: "par-LAY voo ahn-GLEH", category: "Greetings" },
  { english: "I don't speak French", translation: "Je ne parle pas français", phonetic: "zhuh nuh PARL pah frahn-SEH", category: "Greetings" },
  { english: "My name is...", translation: "Je m'appelle...", phonetic: "zhuh mah-PEL...", category: "Greetings" },

  // Refuge / Accommodation
  { english: "I have a reservation", translation: "J'ai une réservation", phonetic: "zhay oon ray-zair-vah-SYOHN", category: "Refuge" },
  { english: "Do you have a room?", translation: "Avez-vous une chambre ?", phonetic: "ah-VAY voo oon SHAHM-bruh", category: "Refuge" },
  { english: "Where is the dormitory?", translation: "Où est le dortoir ?", phonetic: "oo eh luh dor-TWAHR", category: "Refuge" },
  { english: "Where are the showers?", translation: "Où sont les douches ?", phonetic: "oo sohn lay DOOSH", category: "Refuge" },
  { english: "Where are the toilets?", translation: "Où sont les toilettes ?", phonetic: "oo sohn lay twah-LET", category: "Refuge" },
  { english: "Can I charge my phone?", translation: "Puis-je recharger mon téléphone ?", phonetic: "pwee-zhuh ruh-shar-ZHAY mohn tay-lay-FOHN", category: "Refuge" },
  { english: "What time is dinner?", translation: "À quelle heure est le dîner ?", phonetic: "ah kel UHR eh luh dee-NAY", category: "Refuge" },
  { english: "I'd like a packed lunch", translation: "Je voudrais un pique-nique", phonetic: "zhuh voo-DREH uhn peek-NEEK", category: "Refuge" },
  { english: "The bill, please", translation: "L'addition, s'il vous plaît", phonetic: "lah-dee-SYOHN seel voo PLEH", category: "Refuge" },
  { english: "Can I pay in cash?", translation: "Puis-je payer en espèces ?", phonetic: "pwee-zhuh pay-YAY ahn es-PES", category: "Refuge" },
  { english: "Where can I leave my boots?", translation: "Où puis-je laisser mes chaussures ?", phonetic: "oo pwee-zhuh leh-SAY may show-SYUR", category: "Refuge" },

  // Trail / Hiking
  { english: "Which way to...?", translation: "Quelle direction pour... ?", phonetic: "kel dee-rek-SYOHN poor", category: "Trail" },
  { english: "How far is it?", translation: "C'est à quelle distance ?", phonetic: "seh tah kel dee-STAHNSS", category: "Trail" },
  { english: "Is the trail open?", translation: "Le sentier est ouvert ?", phonetic: "luh sahn-TYAY eh too-VAIR", category: "Trail" },
  { english: "Is there snow on the pass?", translation: "Y a-t-il de la neige au col ?", phonetic: "ee ah-TEEL duh lah NEZH oh KOL", category: "Trail" },
  { english: "I'm hiking the TMB", translation: "Je fais le Tour du Mont Blanc", phonetic: "zhuh feh luh TOOR doo mohn BLAHN", category: "Trail" },
  { english: "Where is the water source?", translation: "Où est la source d'eau ?", phonetic: "oo eh lah SOORSS doh", category: "Trail" },
  { english: "Be careful!", translation: "Faites attention !", phonetic: "fet ah-tahn-SYOHN", category: "Trail" },

  // Food & Drink
  { english: "A coffee, please", translation: "Un café, s'il vous plaît", phonetic: "uhn kah-FAY seel voo PLEH", category: "Food" },
  { english: "A beer, please", translation: "Une bière, s'il vous plaît", phonetic: "oon bee-AIR seel voo PLEH", category: "Food" },
  { english: "Water (still / sparkling)", translation: "De l'eau (plate / gazeuse)", phonetic: "duh LOH (plaht / gah-ZUHZ)", category: "Food" },
  { english: "The menu, please", translation: "La carte, s'il vous plaît", phonetic: "lah KART seel voo PLEH", category: "Food" },
  { english: "I'm vegetarian", translation: "Je suis végétarien", phonetic: "zhuh swee vay-zhay-tah-RYEHN", category: "Food" },
  { english: "It's delicious!", translation: "C'est délicieux !", phonetic: "seh day-lee-SYUH", category: "Food" },
  { english: "The check, please", translation: "L'addition, s'il vous plaît", phonetic: "lah-dee-SYOHN seel voo PLEH", category: "Food" },

  // Emergency
  { english: "Help!", translation: "Au secours !", phonetic: "oh suh-KOOR", category: "Emergency" },
  { english: "I need a doctor", translation: "J'ai besoin d'un médecin", phonetic: "zhay buh-ZWAHN duhn mayd-SAHN", category: "Emergency" },
  { english: "I'm injured", translation: "Je suis blessé", phonetic: "zhuh swee bleh-SAY", category: "Emergency" },
  { english: "Call mountain rescue", translation: "Appelez les secours en montagne", phonetic: "ah-PLAY lay suh-KOOR ahn mohn-TAHN-yuh", category: "Emergency" },
  { english: "Where is the pharmacy?", translation: "Où est la pharmacie ?", phonetic: "oo eh lah far-mah-SEE", category: "Emergency" },
  { english: "I'm allergic to...", translation: "Je suis allergique à...", phonetic: "zhuh swee ah-lair-ZHEEK ah", category: "Emergency" },

  // Numbers
  { english: "How much does it cost?", translation: "Combien ça coûte ?", phonetic: "kohm-BYEHN sah KOOT", category: "Shopping" },
  { english: "That's too expensive", translation: "C'est trop cher", phonetic: "seh troh SHAIR", category: "Shopping" },
  { english: "Do you accept cards?", translation: "Acceptez-vous les cartes ?", phonetic: "ak-sep-TAY voo lay KART", category: "Shopping" },
];

const ITALIAN_PHRASES: Phrase[] = [
  // Greetings & Basics
  { english: "Hello / Good day", translation: "Buongiorno", phonetic: "bwohn-JOHR-noh", category: "Greetings" },
  { english: "Good evening", translation: "Buonasera", phonetic: "bwoh-nah-SEH-rah", category: "Greetings" },
  { english: "Goodbye", translation: "Arrivederci", phonetic: "ah-ree-veh-DEHR-chee", category: "Greetings" },
  { english: "Please", translation: "Per favore", phonetic: "pair fah-VOH-reh", category: "Greetings" },
  { english: "Thank you", translation: "Grazie", phonetic: "GRAH-tsee-eh", category: "Greetings" },
  { english: "Thank you very much", translation: "Grazie mille", phonetic: "GRAH-tsee-eh MEE-leh", category: "Greetings" },
  { english: "You're welcome", translation: "Prego", phonetic: "PREH-goh", category: "Greetings" },
  { english: "Excuse me", translation: "Mi scusi", phonetic: "mee SKOO-zee", category: "Greetings" },
  { english: "I'm sorry", translation: "Mi dispiace", phonetic: "mee dee-SPYAH-cheh", category: "Greetings" },
  { english: "Yes / No", translation: "Sì / No", phonetic: "see / noh", category: "Greetings" },
  { english: "Do you speak English?", translation: "Parla inglese?", phonetic: "PAR-lah een-GLEH-zeh", category: "Greetings" },
  { english: "I don't speak Italian", translation: "Non parlo italiano", phonetic: "nohn PAR-loh ee-tah-LYAH-noh", category: "Greetings" },
  { english: "My name is...", translation: "Mi chiamo...", phonetic: "mee KYAH-moh...", category: "Greetings" },

  // Rifugio / Accommodation
  { english: "I have a reservation", translation: "Ho una prenotazione", phonetic: "oh OO-nah preh-noh-tah-TSYOH-neh", category: "Rifugio" },
  { english: "Do you have a room?", translation: "Avete una camera?", phonetic: "ah-VEH-teh OO-nah KAH-meh-rah", category: "Rifugio" },
  { english: "Where is the dormitory?", translation: "Dov'è il dormitorio?", phonetic: "doh-VEH eel dor-mee-TOH-ryoh", category: "Rifugio" },
  { english: "Where are the showers?", translation: "Dove sono le docce?", phonetic: "DOH-veh SOH-noh leh DOH-cheh", category: "Rifugio" },
  { english: "Where are the toilets?", translation: "Dove sono i bagni?", phonetic: "DOH-veh SOH-noh ee BAH-nyee", category: "Rifugio" },
  { english: "Can I charge my phone?", translation: "Posso caricare il telefono?", phonetic: "POHS-soh kah-ree-KAH-reh eel teh-LEH-foh-noh", category: "Rifugio" },
  { english: "What time is dinner?", translation: "A che ora è la cena?", phonetic: "ah keh OH-rah eh lah CHEH-nah", category: "Rifugio" },
  { english: "I'd like a packed lunch", translation: "Vorrei un pranzo al sacco", phonetic: "vohr-RAY oon PRAHN-tsoh ahl SAHK-koh", category: "Rifugio" },
  { english: "The bill, please", translation: "Il conto, per favore", phonetic: "eel KOHN-toh pair fah-VOH-reh", category: "Rifugio" },
  { english: "Can I pay in cash?", translation: "Posso pagare in contanti?", phonetic: "POHS-soh pah-GAH-reh een kohn-TAHN-tee", category: "Rifugio" },
  { english: "Where can I leave my boots?", translation: "Dove posso lasciare gli scarponi?", phonetic: "DOH-veh POHS-soh lah-SHAH-reh lyee skar-POH-nee", category: "Rifugio" },

  // Trail / Hiking
  { english: "Which way to...?", translation: "Quale direzione per...?", phonetic: "KWAH-leh dee-reh-TSYOH-neh pair", category: "Trail" },
  { english: "How far is it?", translation: "Quanto è lontano?", phonetic: "KWAHN-toh eh lohn-TAH-noh", category: "Trail" },
  { english: "Is the trail open?", translation: "Il sentiero è aperto?", phonetic: "eel sehn-TYEH-roh eh ah-PAIR-toh", category: "Trail" },
  { english: "Is there snow on the pass?", translation: "C'è neve sul passo?", phonetic: "cheh NEH-veh sool PAHS-soh", category: "Trail" },
  { english: "I'm hiking the TMB", translation: "Sto facendo il Tour du Mont Blanc", phonetic: "stoh fah-CHEHN-doh eel TOOR doo mohn BLAHN", category: "Trail" },
  { english: "Where is the water source?", translation: "Dov'è la fonte d'acqua?", phonetic: "doh-VEH lah FOHN-teh DAH-kwah", category: "Trail" },
  { english: "Be careful!", translation: "Attenzione!", phonetic: "aht-tehn-TSYOH-neh", category: "Trail" },

  // Food & Drink
  { english: "A coffee, please", translation: "Un caffè, per favore", phonetic: "oon kahf-FEH pair fah-VOH-reh", category: "Food" },
  { english: "A beer, please", translation: "Una birra, per favore", phonetic: "OO-nah BEER-rah pair fah-VOH-reh", category: "Food" },
  { english: "Water (still / sparkling)", translation: "Acqua (naturale / frizzante)", phonetic: "AH-kwah (nah-too-RAH-leh / freet-TSAHN-teh)", category: "Food" },
  { english: "The menu, please", translation: "Il menù, per favore", phonetic: "eel meh-NOO pair fah-VOH-reh", category: "Food" },
  { english: "I'm vegetarian", translation: "Sono vegetariano", phonetic: "SOH-noh veh-jeh-tah-RYAH-noh", category: "Food" },
  { english: "It's delicious!", translation: "È buonissimo!", phonetic: "eh bwoh-NEES-see-moh", category: "Food" },
  { english: "The check, please", translation: "Il conto, per favore", phonetic: "eel KOHN-toh pair fah-VOH-reh", category: "Food" },

  // Emergency
  { english: "Help!", translation: "Aiuto!", phonetic: "ah-YOO-toh", category: "Emergency" },
  { english: "I need a doctor", translation: "Ho bisogno di un medico", phonetic: "oh bee-ZOH-nyoh dee oon MEH-dee-koh", category: "Emergency" },
  { english: "I'm injured", translation: "Sono ferito", phonetic: "SOH-noh feh-REE-toh", category: "Emergency" },
  { english: "Call mountain rescue", translation: "Chiamate il soccorso alpino", phonetic: "kyah-MAH-teh eel sohk-KOHR-soh ahl-PEE-noh", category: "Emergency" },
  { english: "Where is the pharmacy?", translation: "Dov'è la farmacia?", phonetic: "doh-VEH lah far-mah-CHEE-ah", category: "Emergency" },
  { english: "I'm allergic to...", translation: "Sono allergico a...", phonetic: "SOH-noh ahl-LEHR-jee-koh ah", category: "Emergency" },

  // Shopping
  { english: "How much does it cost?", translation: "Quanto costa?", phonetic: "KWAHN-toh KOH-stah", category: "Shopping" },
  { english: "That's too expensive", translation: "È troppo caro", phonetic: "eh TROHP-poh KAH-roh", category: "Shopping" },
  { english: "Do you accept cards?", translation: "Accettate carte?", phonetic: "ah-cheht-TAH-teh KAR-teh", category: "Shopping" },
];

const PHRASE_CATEGORIES = ["Greetings", "Refuge", "Rifugio", "Trail", "Food", "Emergency", "Shopping"];

function speakPhrase(text: string, lang: "fr" | "it") {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === "fr" ? "fr-FR" : "it-IT";
  u.rate = 0.85;
  u.pitch = 0.9; // slightly lower for male-sounding voice
  // Try to find a male voice
  const voices = window.speechSynthesis.getVoices();
  const langCode = lang === "fr" ? "fr" : "it";
  const maleVoice = voices.find(
    (v) => v.lang.startsWith(langCode) && v.name.toLowerCase().includes("male")
  ) || voices.find(
    (v) => v.lang.startsWith(langCode) && !v.name.toLowerCase().includes("female")
  ) || voices.find(
    (v) => v.lang.startsWith(langCode)
  );
  if (maleVoice) u.voice = maleVoice;
  window.speechSynthesis.speak(u);
}

function PhraseCard({ phrase, lang, onShowBig }: { phrase: Phrase; lang: "fr" | "it"; onShowBig: (p: Phrase) => void }) {
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSpeaking(true);
    speakPhrase(phrase.translation, lang);
    setTimeout(() => setSpeaking(false), 2000);
  };

  return (
    <button
      onClick={() => onShowBig(phrase)}
      className="w-full text-left border border-slate-700/50 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600 p-3 rounded transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-mono text-muted-foreground">{phrase.english}</p>
          <p className="text-sm font-semibold text-foreground mt-0.5">{phrase.translation}</p>
          <p className="text-[10px] font-mono text-slate-500 italic mt-0.5">{phrase.phonetic}</p>
        </div>
        <button
          onClick={handleSpeak}
          className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            speaking
              ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
              : "bg-slate-700 text-slate-400 hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)]"
          }`}
          title="Hear pronunciation"
        >
          <Volume2 className={`w-3.5 h-3.5 ${speaking ? "animate-pulse" : ""}`} />
        </button>
      </div>
    </button>
  );
}

function BigTextModal({ phrase, lang, onClose }: { phrase: Phrase | null; lang: "fr" | "it"; onClose: () => void }) {
  if (!phrase) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-slate-900 border border-slate-700 rounded-xl p-8 max-w-lg w-full text-center space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-mono text-muted-foreground">{phrase.english}</p>
        <p className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">{phrase.translation}</p>
        <p className="text-lg font-mono text-[var(--primary)] italic">{phrase.phonetic}</p>
        <button
          onClick={() => speakPhrase(phrase.translation, lang)}
          className="mx-auto flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-mono text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Volume2 className="w-4 h-4" /> Speak
        </button>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </motion.div>
    </motion.div>
  );
}

function Phrasebook() {
  const [lang, setLang] = useState<"fr" | "it">("fr");
  const [activeCategory, setActiveCategory] = useState("Greetings");
  const [bigPhrase, setBigPhrase] = useState<Phrase | null>(null);

  // Load voices
  useEffect(() => {
    window.speechSynthesis?.getVoices();
    const handler = () => window.speechSynthesis?.getVoices();
    window.speechSynthesis?.addEventListener?.("voiceschanged", handler);
    return () => window.speechSynthesis?.removeEventListener?.("voiceschanged", handler);
  }, []);

  const phrases = lang === "fr" ? FRENCH_PHRASES : ITALIAN_PHRASES;
  // Map categories for the active language
  const categories = lang === "fr"
    ? ["Greetings", "Refuge", "Trail", "Food", "Emergency", "Shopping"]
    : ["Greetings", "Rifugio", "Trail", "Food", "Emergency", "Shopping"];

  // Reset category when switching language
  useEffect(() => {
    setActiveCategory("Greetings");
  }, [lang]);

  const filtered = phrases.filter((p) => p.category === activeCategory);

  return (
    <div className="border border-border bg-card p-4 space-y-4">
      <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--primary)] font-semibold flex items-center gap-2">
        <Languages className="w-3.5 h-3.5" /> Phrasebook
      </h3>
      <p className="text-[10px] font-mono text-muted-foreground">
        Tap any phrase to show it in large text. Use the speaker button for pronunciation.
      </p>

      {/* Language toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setLang("fr")}
          className={`flex-1 py-2.5 text-xs font-mono font-semibold rounded transition-all ${
            lang === "fr"
              ? "bg-blue-600 text-white"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          }`}
        >
          🇫🇷 French
        </button>
        <button
          onClick={() => setLang("it")}
          className={`flex-1 py-2.5 text-xs font-mono font-semibold rounded transition-all ${
            lang === "it"
              ? "bg-green-600 text-white"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          }`}
        >
          🇮🇹 Italian
        </button>
      </div>

      {/* Category pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-mono font-semibold transition-all ${
              activeCategory === cat
                ? "bg-violet-500 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Phrase list */}
      <div className="space-y-1.5">
        {filtered.map((p, i) => (
          <PhraseCard key={`${lang}-${i}`} phrase={p} lang={lang} onShowBig={setBigPhrase} />
        ))}
      </div>

      {/* Big text modal */}
      <AnimatePresence>
        {bigPhrase && (
          <BigTextModal phrase={bigPhrase} lang={lang} onClose={() => setBigPhrase(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CULTURAL ETIQUETTE GUIDE
   ═══════════════════════════════════════════════════════ */

interface EtiquetteTip {
  title: string;
  description: string;
  icon: string;
}

interface CountryGuide {
  country: string;
  flag: string;
  color: string;
  region: string;
  tips: EtiquetteTip[];
}

const CULTURAL_GUIDES: CountryGuide[] = [
  {
    country: "France",
    flag: "🇫🇷",
    color: "blue",
    region: "Chamonix Valley, Les Contamines, Beaufort",
    tips: [
      {
        title: "Always greet with \"Bonjour\"",
        description: "This is the single most important rule. Say \"Bonjour\" when entering any shop, refuge, restaurant, or even passing someone on a narrow trail. Not greeting is considered very rude. Say \"Au revoir\" when leaving.",
        icon: "👋",
      },
      {
        title: "Attempt French first",
        description: "Even a badly pronounced \"Bonjour, parlez-vous anglais?\" earns enormous goodwill. Never open with English. The effort matters more than perfection. They'll likely switch to English but will appreciate you tried.",
        icon: "🗣️",
      },
      {
        title: "Don't rush meals",
        description: "Dining in France is social, not transactional. Meals at refuges are communal and leisurely. Don't ask for the check immediately after eating. Enjoy the conversation and the wine. Lunch can last 1-2 hours.",
        icon: "🍷",
      },
      {
        title: "Bread etiquette",
        description: "Bread goes directly on the table next to your plate, not on the plate itself. It's used to push food onto your fork and to mop up sauces. Don't bite directly from a whole piece — tear off small pieces.",
        icon: "🥖",
      },
      {
        title: "Volume and personal space",
        description: "The French value discretion. Keep your voice down in restaurants, refuges, and public spaces. Loud conversations (especially in English) stand out and are considered impolite. This is especially true in shared dormitories.",
        icon: "🤫",
      },
      {
        title: "Tipping",
        description: "Service is included in the bill (\"service compris\"). Tipping is not required, but rounding up or leaving 1-2€ for good service at a refuge or restaurant is a kind gesture and appreciated.",
        icon: "💶",
      },
      {
        title: "\"Excusez-moi\" not \"Hey\"",
        description: "To get someone's attention, say \"Excusez-moi\" or \"Pardon\". Never snap fingers, whistle, or wave aggressively. In a refuge, wait to be acknowledged by the guardian before launching into questions.",
        icon: "🙋",
      },
      {
        title: "Greet fellow hikers on the trail",
        description: "A simple \"Bonjour\" to passing hikers is expected and part of mountain culture. It's also a safety practice — if something happens, people will remember seeing you. On narrow trails, the uphill hiker has right of way.",
        icon: "🥾",
      },
    ],
  },
  {
    country: "Italy",
    flag: "🇮🇹",
    color: "green",
    region: "Val Ferret, Courmayeur, Val d'Aosta",
    tips: [
      {
        title: "\"Buongiorno\" not \"Ciao\"",
        description: "Use \"Buongiorno\" (morning/afternoon) or \"Buonasera\" (after ~5pm) with strangers, shopkeepers, and rifugio staff. \"Ciao\" is only for friends and people you know well. Using it with strangers is considered too familiar and disrespectful.",
        icon: "👋",
      },
      {
        title: "Coffee rules",
        description: "Cappuccino is strictly a breakfast drink — ordering one after 11am marks you as a tourist. After meals, order an espresso (\"un caffè\"). At the bar, drinking standing up is cheaper than sitting at a table. This matters in Courmayeur cafés.",
        icon: "☕",
      },
      {
        title: "Coperto is not a scam",
        description: "The \"coperto\" (cover charge of 1-3€ per person) on your restaurant bill is completely normal and legal in Italy. It covers bread, table setting, and service. Don't complain about it — it's standard practice.",
        icon: "🧾",
      },
      {
        title: "Dress with care",
        description: "Even in mountain towns like Courmayeur, Italians dress well. For your rest day, wear your cleanest clothes. You don't need to be fancy, but avoid looking sloppy. Italians notice and appreciate when visitors make an effort.",
        icon: "👔",
      },
      {
        title: "Meal timing matters",
        description: "Lunch is 12:30-2:30pm, dinner is 7:30-9:30pm. Restaurants may not serve outside these hours. At rifugios, dinner is typically at a set time (usually 7pm) — be punctual. Arriving late disrupts the kitchen and other guests.",
        icon: "🕐",
      },
      {
        title: "Communal dining is social",
        description: "Rifugio meals are served family-style at shared tables. This is intentional — introduce yourself, ask where others are hiking from, share stories. Italians are warm and love conversation. Sitting silently on your phone is considered antisocial.",
        icon: "🤝",
      },
      {
        title: "Tipping",
        description: "Tipping is not expected in Italy but leaving 1-2€ or rounding up is a nice gesture, especially at rifugios where the staff work incredibly hard in remote conditions. Never tip by percentage like in the US.",
        icon: "💶",
      },
      {
        title: "Hand gestures",
        description: "Italians communicate expressively with hands. Don't be alarmed — it's normal. However, avoid making the \"OK\" sign (thumb and forefinger circle) as it can be considered offensive in some regions. A thumbs up is fine.",
        icon: "🤌",
      },
    ],
  },
  {
    country: "Switzerland",
    flag: "🇨🇭",
    color: "red",
    region: "Champex-Lac, La Fouly, Col de la Forclaz",
    tips: [
      {
        title: "Greet everyone on the trail",
        description: "In Switzerland, greeting every single person you pass on a hiking trail is not just polite — it's expected. A simple \"Bonjour\" (you're in the French-speaking part) or even a nod and smile is essential. Not greeting is considered genuinely rude.",
        icon: "👋",
      },
      {
        title: "Punctuality is sacred",
        description: "The Swiss are famously punctual. If dinner at the hut is at 7pm, be there at 6:55. If you booked a reservation, arrive on time. Buses and trains run to the second. Plan accordingly and don't make others wait.",
        icon: "⏰",
      },
      {
        title: "Quiet and order",
        description: "The Swiss highly value quiet, order, and cleanliness. Keep noise to a minimum in huts, on public transport, and in nature. Quiet hours (typically 10pm-6am) are strictly enforced. Don't play music on the trail.",
        icon: "🤫",
      },
      {
        title: "Never litter — ever",
        description: "Switzerland's pristine landscapes are maintained by a culture of zero tolerance for littering. Carry all trash out, including apple cores and banana peels (they take months to decompose at altitude). This is taken very seriously.",
        icon: "♻️",
      },
      {
        title: "Currency",
        description: "The Swiss franc (CHF) is the official currency, but euros are widely accepted along the TMB route. However, you'll often receive change in Swiss francs. ATMs in Champex-Lac and La Fouly may be limited — carry cash.",
        icon: "💰",
      },
      {
        title: "Three-kiss greeting",
        description: "Among friends, the Swiss-French do three cheek kisses (right, left, right), not two like in France. With strangers, a firm handshake is appropriate. Don't initiate kisses with people you've just met.",
        icon: "💋",
      },
      {
        title: "Respect rules and signs",
        description: "The Swiss follow rules carefully and expect visitors to do the same. Stay on marked trails, respect \"no camping\" signs, close gates behind you (livestock!), and follow any posted instructions at huts. Don't take shortcuts through meadows.",
        icon: "📋",
      },
      {
        title: "Tipping",
        description: "Service is included in Swiss prices (which are already high). Tipping is not expected but rounding up to the nearest franc is common and appreciated. Don't feel obligated to tip 15-20% like in the US.",
        icon: "💶",
      },
    ],
  },
];

/* ═══════════════════════════════════════════════════════
   REFUGE ETIQUETTE — Universal rules for all huts
   ═══════════════════════════════════════════════════════ */

const REFUGE_TIPS: EtiquetteTip[] = [
  {
    title: "No boots inside — ever",
    description: "Leave hiking boots in the boot room before entering. Every refuge provides crocs or slippers. Tie your boot laces to your partner's — many boots look identical and mix-ups are common and can ruin your trip.",
    icon: "🥾",
  },
  {
    title: "Bring a sleeping bag liner",
    description: "Required at every TMB refuge. Silk liners are best (100g vs 400g cotton). You can rent one for ~3€/night or buy one for ~10€, but bringing your own is more hygienic and lighter. Refuges provide blankets and pillows.",
    icon: "🛏️",
  },
  {
    title: "Order your packed lunch before dinner",
    description: "Refuges have a cutoff for ordering next day's \"pique-nique\" (packed lunch). Order before dinner to be safe. Don't expect the kitchen to prepare one in the morning if you forgot. The Bonatti refuge's lunch is especially excellent.",
    icon: "🥪",
  },
  {
    title: "Pay your bill before bed",
    description: "Settle your bill in the evening, not the morning. Most refuges are CASH ONLY — bring euros (accepted everywhere, even in Switzerland). Some may give change in Swiss francs. Cards are rarely accepted at high-altitude huts.",
    icon: "💳",
  },
  {
    title: "Quiet hours: 9-10pm to 6am",
    description: "Lights out is typically 9-10pm. Use a headlamp (red light mode) if you need to move around. Pack your bag the night before so you're not rustling plastic bags at 5am. Earplugs are essential — snoring is universal.",
    icon: "🌙",
  },
  {
    title: "Be tidy and share space",
    description: "Refuges are shared spaces. Don't spread belongings across the dormitory. Use hooks and baskets provided. Keep common areas clean. Seats at dinner are shared — you'll likely sit with strangers. This is part of the experience.",
    icon: "🧹",
  },
  {
    title: "Conserve water and resources",
    description: "Many refuges have limited water supply, especially at high altitude. Take short showers (if available — some charge 2-5€ for hot water). Don't waste food. Turn off lights when leaving rooms.",
    icon: "💧",
  },
  {
    title: "Greet the guardian on arrival",
    description: "The refuge guardian (gardien/guardiano) is your host. Check in with them first, confirm your reservation, and ask about dinner time. They're also your best source for trail conditions, weather, and local advice.",
    icon: "🏠",
  },
];

function CulturalGuide() {
  const [activeCountry, setActiveCountry] = useState(0);
  const [showRefugeRules, setShowRefugeRules] = useState(true);

  const guide = CULTURAL_GUIDES[activeCountry];
  const borderColor = guide.color === "blue" ? "border-blue-500/30" : guide.color === "green" ? "border-green-500/30" : "border-red-500/30";
  const bgColor = guide.color === "blue" ? "bg-blue-500/5" : guide.color === "green" ? "bg-green-500/5" : "bg-red-500/5";

  return (
    <div className="space-y-4">
      {/* Universal Refuge Rules */}
      <div className="border border-border bg-card p-4 space-y-3">
        <button
          onClick={() => setShowRefugeRules(!showRefugeRules)}
          className="w-full flex items-center justify-between group cursor-pointer"
        >
          <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--primary)] font-semibold flex items-center gap-2">
            <span>🏔️</span> Refuge Etiquette — All Countries
          </h3>
          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-300 ${showRefugeRules ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {showRefugeRules && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="space-y-2 pt-1">
                {REFUGE_TIPS.map((tip, i) => (
                  <div key={i} className="flex gap-3 p-3 bg-slate-800/50 rounded border border-slate-700/30">
                    <span className="text-lg shrink-0 mt-0.5">{tip.icon}</span>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{tip.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{tip.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Country-specific guides */}
      <div className="border border-border bg-card p-4 space-y-4">
        <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--primary)] font-semibold flex items-center gap-2">
          <Heart className="w-3.5 h-3.5" /> Cultural Etiquette by Country
        </h3>

        {/* Country tabs */}
        <div className="flex gap-2">
          {CULTURAL_GUIDES.map((g, i) => (
            <button
              key={g.country}
              onClick={() => setActiveCountry(i)}
              className={`flex-1 py-2.5 text-xs font-mono font-semibold rounded transition-all ${
                activeCountry === i
                  ? g.color === "blue" ? "bg-blue-600 text-white"
                    : g.color === "green" ? "bg-green-600 text-white"
                    : "bg-red-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {g.flag} {g.country}
            </button>
          ))}
        </div>

        {/* Region label */}
        <p className="text-[10px] font-mono text-muted-foreground">
          TMB Region: {guide.region}
        </p>

        {/* Tips */}
        <div className="space-y-2">
          {guide.tips.map((tip, i) => (
            <div key={i} className={`flex gap-3 p-3 rounded border ${borderColor} ${bgColor}`}>
              <span className="text-lg shrink-0 mt-0.5">{tip.icon}</span>
              <div>
                <p className="text-xs font-semibold text-foreground">{tip.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{tip.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN TRAVEL TOOLKIT COMPONENT
   ═══════════════════════════════════════════════════════ */

export default function TravelToolkit({ embedded = false }: { embedded?: boolean } = {}) {
  const [isOpen, setIsOpen] = useState(embedded);

  return (
    <section className="container py-6">
      {!embedded && (
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between group cursor-pointer"
      >
        <h2 className="text-sm uppercase tracking-[0.2em] text-foreground font-mono flex items-center gap-3 font-semibold">
          <span className="text-xl">🌍</span> Travel Toolkit
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[var(--muted-foreground)]">currency · phrases · etiquette</span>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors" />
          </motion.div>
        </div>
      </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-6">
              {/* Currency Converter */}
              <CurrencyConverter />

              {/* Phrasebook */}
              <Phrasebook />

              {/* Cultural Etiquette */}
              <CulturalGuide />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
