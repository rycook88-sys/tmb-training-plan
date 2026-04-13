import mysql from 'mysql2/promise';
import fs from 'fs';

// Read DATABASE_URL from .env
const envFile = fs.readFileSync('/home/ubuntu/tmb-training-plan/.env', 'utf8');
const lines = envFile.split('\n');
let dbUrl = '';
for (const line of lines) {
  if (line.startsWith('DATABASE_URL=')) {
    dbUrl = line.substring('DATABASE_URL='.length).replace(/^"|"$/g, '');
    break;
  }
}

if (!dbUrl) { console.log("No DATABASE_URL found"); process.exit(1); }

const conn = await mysql.createConnection({ uri: dbUrl, ssl: { rejectUnauthorized: false } });

// List all data types
const [rows] = await conn.execute("SELECT dataType, LENGTH(jsonData) as size, updatedAt FROM nutritionBackups ORDER BY updatedAt DESC");
console.log("=== All backup data types ===");
for (const r of rows) {
  console.log(`  ${r.dataType}: ${r.size} bytes, updated ${r.updatedAt}`);
}

// Fetch body fat entries
const [bfRows] = await conn.execute("SELECT jsonData FROM nutritionBackups WHERE dataType = 'bodyfatEntries' LIMIT 1");
if (bfRows.length > 0) {
  fs.writeFileSync('/tmp/bf-entries.json', bfRows[0].jsonData);
  console.log("\n=== Body Fat Entries saved to /tmp/bf-entries.json ===");
  console.log(bfRows[0].jsonData.substring(0, 2000));
} else {
  console.log("\n[!] No bodyfatEntries found in database");
}

// Fetch weight log
const [wtRows] = await conn.execute("SELECT jsonData FROM nutritionBackups WHERE dataType = 'weightLog' LIMIT 1");
if (wtRows.length > 0) {
  fs.writeFileSync('/tmp/weight-log.json', wtRows[0].jsonData);
  console.log("\n=== Weight Log saved to /tmp/weight-log.json ===");
  console.log(wtRows[0].jsonData.substring(0, 2000));
} else {
  console.log("\n[!] No weightLog found in database");
}

// Fetch workout sessions
const [wsRows] = await conn.execute("SELECT jsonData FROM nutritionBackups WHERE dataType = 'workoutSessions' LIMIT 1");
if (wsRows.length > 0) {
  fs.writeFileSync('/tmp/workout-sessions.json', wsRows[0].jsonData);
  console.log("\n=== Workout Sessions saved to /tmp/workout-sessions.json ===");
  const data = JSON.parse(wsRows[0].jsonData);
  console.log(`  ${data.length} sessions found`);
} else {
  console.log("\n[!] No workoutSessions found in database");
}

await conn.end();
