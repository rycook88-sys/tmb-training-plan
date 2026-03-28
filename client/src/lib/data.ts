// ============================================================
// TMB Training Plan — All Data
// Design: Alpine Command Center / Topographic Brutalism
// ============================================================

export const ATHLETE = {
  name: "TMB Athlete",
  height: "6'2\"",
  startWeight: 232,
  currentWeight: 226,
  goalWeight: 205,
  tripDate: "2026-07-26",
  tripName: "Tour du Mont Blanc",
  tripDays: 10,
  tripStyle: "Hut-to-Hut",
  packWeight: "12–16 lbs",
};

export interface ItineraryDay {
  day: number;
  date: string;
  from: string;
  to: string;
  distance: string;
  distanceMi: number;
  duration: string;
  ascent: number;
  descent: number;
  difficulty: "easy" | "moderate" | "hard" | "brutal";
  note: string;
}

export const TMB_ITINERARY: ItineraryDay[] = [
  { day: 1, date: "Jul 26", from: "Les Houches", to: "Gîte Le Pontet", distance: "19.3 km", distanceMi: 12, duration: "10:00", ascent: 4659, descent: 4068, difficulty: "brutal", note: "Opening day — massive elevation. Set a conservative pace." },
  { day: 2, date: "Jul 27", from: "Les Contamines", to: "Les Chapieux", distance: "16.6 km", distanceMi: 10.3, duration: "08:45", ascent: 4232, descent: 2986, difficulty: "hard", note: "Col du Bonhomme. Big climb, moderate descent." },
  { day: 3, date: "Jul 28", from: "Bourg Saint Maurice", to: "Rifugio Elisabetta", distance: "14.3 km", distanceMi: 8.9, duration: "05:35", ascent: 3248, descent: 1214, difficulty: "moderate", note: "Shuttle start. Mostly climbing — good for your engine." },
  { day: 4, date: "Jul 29", from: "Rifugio Elisabetta", to: "Rifugio Maison Vieille", distance: "11 km", distanceMi: 6.8, duration: "04:30", ascent: 1476, descent: 2395, difficulty: "easy", note: "Short day. Recovery opportunity. Descent-heavy — practice mechanics." },
  { day: 5, date: "Jul 30", from: "Rifugio Maison Vieille", to: "Rifugio Chapy Mont Blanc", distance: "16.2 km", distanceMi: 10.1, duration: "07:10", ascent: 2920, descent: 4560, difficulty: "hard", note: "Welcome to Courmayeur. 4,560 ft descent — KNEE DAY #1." },
  { day: 6, date: "Jul 31", from: "Rifugio Chapy", to: "Gîte Alpage de La Peule", distance: "23.2 km", distanceMi: 14.4, duration: "10:15", ascent: 5249, descent: 3248, difficulty: "brutal", note: "Col Ferret — longest day. 5,249 ft climb. Manage energy." },
  { day: 7, date: "Aug 01", from: "Gîte Alpage de La Peule", to: "Relais D'Arpette", distance: "22.3 km", distanceMi: 13.9, duration: "07:50", ascent: 2231, descent: 3576, difficulty: "hard", note: "Long distance, net downhill. 3,576 ft descent." },
  { day: 8, date: "Aug 02", from: "Relais D'Arpette", to: "Trient", distance: "15.4 km", distanceMi: 9.6, duration: "07:15", ascent: 2395, descent: 3478, difficulty: "hard", note: "Another descent-heavy day. 3,478 ft down. Protect knees." },
  { day: 9, date: "Aug 03", from: "Trient", to: "Argentière", distance: "16.4 km", distanceMi: 10.2, duration: "08:15", ascent: 3248, descent: 3806, difficulty: "hard", note: "Biggest descent day: 3,806 ft. KNEE DAY #2." },
  { day: 10, date: "Aug 04", from: "Argentière", to: "Chamonix", distance: "17.1 km", distanceMi: 10.6, duration: "07:55", ascent: 4856, descent: 2133, difficulty: "hard", note: "Final push. Huge climb to finish. Leave it all out there." },
];

export interface Exercise {
  name: string;
  sets: string;
  reps: string;
  current: string;
  goal: string;
  notes: string;
}

export interface WorkoutDay {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  exercises: Exercise[];
}

export const WORKOUT_PLAN: WorkoutDay[] = [
  {
    id: "day-a",
    title: "DAY A",
    subtitle: "LOWER / DESCENT ARMOR",
    icon: "⬇",
    exercises: [
      { name: "Trap Bar Deadlift", sets: "2", reps: "8", current: "335 lb", goal: "335 lb (maintain)", notes: "Slow eccentric, stop ½\" from ground. No bouncing." },
      { name: "Lateral Step-Down", sets: "3", reps: "8/leg", current: "BW", goal: "BW+25 lb vest", notes: "THE money exercise. 3-sec lowering. Control the wobble." },
      { name: "Bulgarian Split Squat", sets: "3", reps: "10/leg", current: "50 lb DBs", goal: "60 lb DBs", notes: "Rear foot elevated. Drive through heel." },
      { name: "Single-Leg RDL", sets: "3", reps: "10/leg", current: "40 lb DB", goal: "55 lb DB", notes: "Hinge at hip. Feel the glute stretch." },
      { name: "Calf Raise (Eccentric)", sets: "3", reps: "15", current: "BW", goal: "BW+25 lb", notes: "2-sec up, 4-sec lowering. Full range." },
      { name: "Copenhagen Plank", sets: "3", reps: "20 sec/side", current: "20 sec", goal: "30 sec", notes: "Adductor strength for uneven terrain." },
    ],
  },
  {
    id: "day-b",
    title: "DAY B",
    subtitle: "UPPER / PACK ENDURANCE",
    icon: "🎒",
    exercises: [
      { name: "Assisted Pull-Up", sets: "3", reps: "8", current: "90 lb assist", goal: "50 lb assist", notes: "Full dead hang. Squeeze shoulder blades." },
      { name: "Farmer Carry", sets: "3", reps: "60 sec", current: "80 lb/hand", goal: "100 lb/hand", notes: "Shoulders packed. Core braced. Walk tall." },
      { name: "Face Pull", sets: "3", reps: "15", current: "30 lb", goal: "45 lb", notes: "External rotation at top. Posture correction." },
      { name: "Dumbbell Row", sets: "3", reps: "10/arm", current: "65 lb", goal: "80 lb", notes: "Elbow drives back. No torso rotation." },
      { name: "Overhead Press", sets: "3", reps: "8", current: "45 lb DBs", goal: "55 lb DBs", notes: "Strict. No leg drive." },
      { name: "Dead Hang", sets: "3", reps: "30 sec", current: "30 sec", goal: "60 sec", notes: "Grip endurance. Relax shoulders." },
    ],
  },
  {
    id: "day-c",
    title: "DAY C",
    subtitle: "CARDIO / MOUNTAIN ENGINE",
    icon: "🫀",
    exercises: [
      { name: "StairMill (Level 4)", sets: "1", reps: "60 min", current: "60 min @ HR<150", goal: "90 min @ HR<145", notes: "Zone 2. If HR drifts, drop to Level 3." },
      { name: "Loaded Pack Walk", sets: "1", reps: "30–45 min", current: "6–8 lb", goal: "15 lb pack", notes: "Add to stairmill or outdoor hike days." },
      { name: "Incline Treadmill Walk", sets: "1", reps: "20 min", current: "15% grade", goal: "15% @ 3.5 mph", notes: "Alternate with stairmill. Hip hinge practice." },
    ],
  },
  {
    id: "day-d",
    title: "DAY D",
    subtitle: "ACTIVE RECOVERY / MOBILITY",
    icon: "🦶",
    exercises: [
      { name: "Foot Open Book Drill", sets: "2", reps: "30 sec/gap", current: "Starting", goal: "All gaps mobile", notes: "Mobilize each metatarsal joint individually." },
      { name: "Foot Wringing", sets: "2", reps: "30 sec/foot", current: "Starting", goal: "Fluid motion", notes: "Wring like a towel. Break up lateral fascia." },
      { name: "Transverse Arch Ball Roll", sets: "2", reps: "60 sec/foot", current: "Starting", goal: "Even pressure", notes: "Lacrosse ball under ball of foot. Toes grip." },
      { name: "Skinny Foot Activation", sets: "3", reps: "10 reps/foot", current: "Starting", goal: "Visible arch lift", notes: "Pull big toe & pinky toe bases together. No toe curl." },
      { name: "Hip Flexor Stretch", sets: "2", reps: "60 sec/side", current: "Tight", goal: "Full ROM", notes: "Half-kneeling. Squeeze glute. Posterior tilt." },
      { name: "90/90 Hip Rotation", sets: "2", reps: "10/side", current: "Limited", goal: "Smooth transitions", notes: "Internal and external rotation. Slow and controlled." },
    ],
  },
];

export interface WeekBlock {
  label: string;
  pattern: string[];
  notes: string;
}

export const WEEKLY_BLOCKS: WeekBlock[] = [
  { label: "3-Day Off Block", pattern: ["A: Lower", "C: Cardio", "B: Upper"], notes: "Alternate lift/cardio. Always start with legs." },
  { label: "4-Day Off Block", pattern: ["A: Lower", "C: Cardio", "B: Upper", "C+D: Cardio + Mobility"], notes: "4th day is lighter. Stairmill + full foot routine." },
];

export const FOOT_VIDEOS = [
  {
    title: "How to Correct HIGH ARCHES: 6 Exercises for Pes Cavus",
    channel: "Team Youphoric Health & Performance",
    url: "https://www.youtube.com/watch?v=Z-lTGrspHMc",
    why: "Your one-stop video. Covers mobilization, strengthening, and stretching for pes cavus — all 6 exercises in one routine.",
  },
  {
    title: "Fix High Arches & Supinated Feet FAST (in 30 Days)",
    channel: "Zac Cupples (PT)",
    url: "https://www.youtube.com/watch?v=wHTHJ1iXhew",
    why: "Quick 3-exercise daily sequence from a respected PT. Teaches the foot to flatten under load — exactly what you need for descents.",
  },
];

// KEY_INSIGHTS removed per user request

export function getDaysUntilTrip(): number {
  const trip = new Date("2026-07-26T00:00:00");
  const now = new Date();
  const diff = trip.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getWeightProgress(current: number): number {
  const total = ATHLETE.startWeight - ATHLETE.goalWeight;
  const progress = ATHLETE.startWeight - current;
  return Math.min(100, Math.max(0, (progress / total) * 100));
}
