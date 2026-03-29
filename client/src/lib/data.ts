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
  { day: 1, date: "Jul 26", from: "Les Houches", to: "Gîte Le Pontet", distance: "20.6 km", distanceMi: 12.8, duration: "10:00", ascent: 4587, descent: 4031, difficulty: "brutal", note: "Opening day — massive elevation. Set a conservative pace." },
  { day: 2, date: "Jul 27", from: "Les Contamines", to: "Les Chapieux", distance: "16.4 km", distanceMi: 10.2, duration: "08:45", ascent: 4204, descent: 2855, difficulty: "hard", note: "Col du Bonhomme. Big climb, moderate descent." },
  { day: 3, date: "Jul 28", from: "Bourg Saint Maurice", to: "Rifugio Elisabetta", distance: "14.2 km", distanceMi: 8.8, duration: "05:35", ascent: 3140, descent: 1182, difficulty: "moderate", note: "Shuttle start. Mostly climbing — good for your engine." },
  { day: 4, date: "Jul 29", from: "Rifugio Elisabetta", to: "Rifugio Maison Vieille", distance: "10.1 km", distanceMi: 6.3, duration: "04:30", ascent: 1460, descent: 2050, difficulty: "easy", note: "Short day. Recovery opportunity. Descent-heavy — practice mechanics." },
  { day: 5, date: "Jul 30", from: "Rifugio Maison Vieille", to: "Rifugio Chapy Mont Blanc", distance: "15.9 km", distanceMi: 9.9, duration: "07:10", ascent: 2770, descent: 4471, difficulty: "hard", note: "Welcome to Courmayeur. 4,471 ft descent — KNEE DAY #1." },
  { day: 6, date: "Jul 31", from: "Rifugio Chapy", to: "Gîte Alpage de La Peule", distance: "23.0 km", distanceMi: 14.3, duration: "10:15", ascent: 5071, descent: 2910, difficulty: "brutal", note: "Col Ferret — longest day. 5,071 ft climb. Manage energy." },
  { day: 7, date: "Aug 01", from: "Gîte Alpage de La Peule", to: "Relais D'Arpette", distance: "22.2 km", distanceMi: 13.8, duration: "07:50", ascent: 2046, descent: 3426, difficulty: "hard", note: "Long distance, net downhill. 3,426 ft descent." },
  { day: 8, date: "Aug 02", from: "Relais D'Arpette", to: "Trient", distance: "15.3 km", distanceMi: 9.5, duration: "07:15", ascent: 2317, descent: 3345, difficulty: "hard", note: "Another descent-heavy day. 3,345 ft down. Protect knees." },
  { day: 9, date: "Aug 03", from: "Trient", to: "Argentière", distance: "19.8 km", distanceMi: 12.3, duration: "08:15", ascent: 3667, descent: 3999, difficulty: "hard", note: "Biggest descent day: 3,999 ft. KNEE DAY #2." },
  { day: 10, date: "Aug 04", from: "Argentière", to: "Chamonix", distance: "16.9 km", distanceMi: 10.5, duration: "07:55", ascent: 4724, descent: 1928, difficulty: "hard", note: "Final push. Huge climb to finish. Leave it all out there." },
];

export interface Exercise {
  name: string;
  sets: string;
  reps: string;
  current: string;
  goal: string;
  goalValue?: number; // numeric goal for comparison (lbs or seconds)
  unit?: string; // "lb" | "sec" | "min" | "assist" — for logging
  notes: string;
  videoUrl?: string;
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
      { name: "Lateral Step-Down", sets: "2", reps: "8/leg", current: "20 lb DBs", goal: "35 lb DBs", goalValue: 35, unit: "lb", notes: "THE money exercise. Do it fresh. 3-sec lowering. Control the wobble. Hold DBs at sides." },
      { name: "Bulgarian Split Squat", sets: "2", reps: "10/leg", current: "50 lb DBs", goal: "60 lb DBs", goalValue: 60, unit: "lb", notes: "Rear foot elevated. Drive through heel." },
      { name: "Single-Leg RDL", sets: "2", reps: "10/leg", current: "40 lb DB", goal: "55 lb DB", goalValue: 55, unit: "lb", notes: "Hinge at hip. Feel the glute stretch.", videoUrl: "https://www.youtube.com/watch?v=Zfr6wizR8rs" },
      { name: "Trap Bar Deadlift", sets: "2", reps: "8", current: "335 lb", goal: "335 lb (maintain)", goalValue: 335, unit: "lb", notes: "Maintain lift. Slow eccentric, stop ½\" from ground. No bouncing." },
      { name: "Standing Calf Raise Machine", sets: "2", reps: "15", current: "330 lb", goal: "370 lb", goalValue: 370, unit: "lb", notes: "2-sec raise, 4-sec eccentric lowering. Full ROM — stretch at bottom, squeeze at top." },
      { name: "Hip Adduction Machine", sets: "2", reps: "8", current: "220 lb", goal: "265 lb", goalValue: 265, unit: "lb", notes: "Adductor strength for uneven terrain. Full ROM, controlled eccentric." },
    ],
  },
  {
    id: "day-b",
    title: "DAY B",
    subtitle: "UPPER / PACK ENDURANCE",
    icon: "🎒",
    exercises: [
      { name: "Farmer Carry", sets: "2", reps: "60 sec", current: "80 lb/hand", goal: "100 lb/hand", goalValue: 100, unit: "lb", notes: "Most TMB-specific upper move. Shoulders packed. Core braced. Walk tall." },
      { name: "Assisted Pull-Up", sets: "2", reps: "8", current: "90 lb assist", goal: "50 lb assist", goalValue: 50, unit: "assist", notes: "Full dead hang. Squeeze shoulder blades." },
      { name: "Dumbbell Row", sets: "2", reps: "10/arm", current: "65 lb", goal: "80 lb", goalValue: 80, unit: "lb", notes: "Elbow drives back. No torso rotation." },
      { name: "Overhead Press", sets: "2", reps: "8", current: "45 lb DBs", goal: "55 lb DBs", goalValue: 55, unit: "lb", notes: "Strict. No leg drive." },
      { name: "Face Pull", sets: "2", reps: "15", current: "30 lb", goal: "45 lb", goalValue: 45, unit: "lb", notes: "External rotation at top. Posture correction." },
      { name: "Dead Hang", sets: "2", reps: "30 sec", current: "30 sec", goal: "60 sec", goalValue: 60, unit: "sec", notes: "Grip endurance finisher. Relax shoulders.", videoUrl: "https://www.youtube.com/watch?v=2vspW4N4BMs" },
    ],
  },
  {
    id: "day-c",
    title: "DAY C",
    subtitle: "CARDIO / MOUNTAIN ENGINE",
    icon: "🫀",
    exercises: [
      { name: "StairMill (Level 4)", sets: "1", reps: "60 min", current: "60 min @ HR<150", goal: "90 min @ HR<145", goalValue: 90, unit: "min", notes: "Zone 2. If HR drifts, drop to Level 3." },
      { name: "Loaded Pack Walk", sets: "1", reps: "30–45 min", current: "6–8 lb", goal: "15 lb pack", goalValue: 15, unit: "lb", notes: "Add to stairmill or outdoor hike days." },
      { name: "Incline Treadmill Walk", sets: "1", reps: "20 min", current: "15% grade", goal: "15% @ 3.5 mph", goalValue: 3.5, unit: "mph", notes: "Alternate with stairmill. Hip hinge practice." },
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
      { name: "Skinny Foot Activation", sets: "2", reps: "10 reps/foot", current: "Starting", goal: "Visible arch lift", notes: "Pull big toe & pinky toe bases together. No toe curl." },
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
