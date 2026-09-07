// seed/seed.js — idempotent demo data + default admin
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const db = require('../src/db/database');
const { run: migrate } = require('../src/db/migrate');

const adminModel = require('../src/models/admin.model');
const userModel = require('../src/models/user.model');
const photoModel = require('../src/models/photo.model');
const interestModel = require('../src/models/interest.model');

const GENDERS = ['Female', 'Male', 'Other'];
const LOCATIONS = ['Lahore', 'Karachi', 'Islamabad', 'Multan', 'Rawalpindi', 'Faisalabad', 'Peshawar', 'Quetta'];
const NAMES = [
  ['Ayesha', 'Female'], ['Bilal', 'Male'], ['Fariha', 'Female'], ['Hamza', 'Male'], ['Zara', 'Female'],
  ['Ali', 'Male'], ['Mehwish', 'Female'], ['Usman', 'Male'], ['Sana', 'Female'], ['Zain', 'Male'],
  ['Mariam', 'Female'], ['Omar', 'Male'], ['Hira', 'Female'], ['Danish', 'Male'], ['Noor', 'Female'],
  ['Salman', 'Male'], ['Areeba', 'Female'], ['Imran', 'Male'], ['Kiran', 'Female'], ['Adeel', 'Male']
];

function randOf(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function dobForAge(age) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - age);
  return d.toISOString().slice(0, 10);
}

async function seed() {
  migrate();
  interestModel.ensureDefaults();

  // --- Default admin (only if no admin exists) ---
  const existingAdmin = adminModel.isAdminUser(-1) || db.prepare('SELECT COUNT(*) AS n FROM admin_users').get().n;
  if (!existingAdmin) {
    const username = process.env.ADMIN_EMAIL || 'admin@humsafar.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const adminUser = userModel.findByEmail(username);
    let u;
    if (adminUser) {
      u = adminUser;
    } else {
      const passwordHash = await bcrypt.hash(password, 10);
      u = userModel.create({ name: 'Site Admin', email: username, passwordHash, dob: dobForAge(30), gender: 'Other', location: 'Islamabad' });
    }
    adminModel.addAdmin(u.id, null);
    userModel.setEmailVerified(u.id, 1);
    console.log('Default admin ready:', username, '->', password);
  }

  // --- Demo users (only if empty) ---
  const userCount = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  const needsDemo = userCount <= 1; // just admin
  if (needsDemo) {
    const BUCKETS = {
      profiles: ['bio', 'relationship_pref', 'looking_gender', 'distance_pref', 'age_min', 'age_max', 'height', 'occupation', 'education'],
    };
    const REL = ['Friendship', 'Serious Relationship', 'Something Casual'];
    const OCC = ['Software Engineer', 'Doctor', 'Teacher', 'Designer', 'Student', 'Entrepreneur', 'Marketing', 'Architect'];
    const EDU = ['Bachelor\'s', 'Master\'s', 'PhD', 'High School'];

    const passwordHash = await bcrypt.hash('password123', 10);
    const userIds = [];

    for (let i = 0; i < NAMES.length; i++) {
      const [name, gender] = NAMES[i];
      const email = `${name.toLowerCase()}.${i}@humsafar.test`;
      if (userModel.findByEmail(email)) continue;
      const age = 20 + Math.floor(Math.random() * 22); // 20-41
      const dob = dobForAge(age);
      const location = randOf(LOCATIONS);
      const u = userModel.create({ name, email, passwordHash, dob, gender, location });
      userModel.setEmailVerified(u.id, 1);
      userIds.push(u.id);

      // profile fields
      const interestList = interestModel.listAll();
      const chosen = [...interestList].sort(() => 0.5 - Math.random()).slice(0, 3 + Math.floor(Math.random() * 3));
      interestModel.setForUser(u.id, chosen.map((c) => c.name));

      const altGender = randOf(GENDERS.filter((g) => g !== gender));
      db.prepare(`UPDATE profiles SET
        bio = ?, relationship_pref = ?, looking_gender = ?,
        distance_pref = ?, age_min = ?, age_max = ?, height = ?,
        occupation = ?, education = ?, online = ?
        WHERE user_id = ?`)
        .run(
          `Hi! I'm ${name}. ${randOf(['Love exploring new cafes.', 'Big fan of hiking and sunsets.', 'Looking for a genuine connection.', 'Coffee enthusiast and a good listener.', 'Let’s make memories together.'])}`,
          randOf(REL), altGender,
          10 + Math.floor(Math.random() * 190), 20 + Math.floor(Math.random() * 3), 28 + Math.floor(Math.random() * 12),
          152 + Math.floor(Math.random() * 30),
          randOf(OCC), randOf(EDU),
          Math.random() > 0.5 ? 1 : 0,
          u.id
        );

      // a couple of generated avatar photos (SVG data URIs are deterministic)
      for (let p = 0; p < 2; p++) {
        const color = ['#e91e63', '#9c27b0', '#3f51b5', '#00bcd4', '#4caf50', '#ff9800'][i % 6];
        const letter = name[0];
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='400' height='400' fill='${color}'/><circle cx='200' cy='160' r='80' fill='rgba(255,255,255,0.25)'/><text x='200' y='200' font-size='110' text-anchor='middle' fill='#fff' font-family='Arial'>${letter}</text><text x='200' y='330' font-size='48' text-anchor='middle' fill='#fff' font-family='Arial'>${name.split(' ')[0]}</text></svg>`;
        const url = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
        photoModel.add(u.id, url, p === 0);
      }
    }

    // Create a few likes + one confirmed match for lively demo data
    if (userIds.length >= 2) {
      const a = userIds[0];
      const b = userIds[1];
      // a likes b -> no match yet (both only get notifs)
      db.prepare('INSERT OR IGNORE INTO likes (from_user, to_user) VALUES (?,?)').run(a, b);
      // reciprocal -> match between c and d
      const c = userIds[2];
      const d = userIds[3];
      db.prepare('INSERT OR IGNORE INTO likes (from_user, to_user) VALUES (?,?)').run(c, d);
      db.prepare('INSERT OR IGNORE INTO likes (from_user, to_user) VALUES (?,?)').run(d, c);
      const matchModel = require('../src/models/match.model');
      const { createMatch } = require('../src/services/matchmaking.service');
      createMatch(c, d);
      // a couple more likes to fill "who liked me"
      db.prepare('INSERT OR IGNORE INTO likes (from_user, to_user) VALUES (?,?)').run(userIds[4], userIds[5]);
    }

    console.log(`Seeded ${userIds.length} demo users.`);
  } else {
    console.log('Demo users already present, skipping.');
  }

  // Backfill: ensure every demo user (.test domain) has interests assigned
  const orphans = db.prepare(`
    SELECT u.id FROM users u LEFT JOIN (SELECT DISTINCT user_id FROM user_interests) ui ON ui.user_id = u.id
    WHERE ui.user_id IS NULL AND u.email LIKE '%.test'
  `).all();
  const all = interestModel.listAll();
  for (const o of orphans) {
    const chosen = [...all].sort(() => 0.5 - Math.random()).slice(0, 4);
    interestModel.setForUser(o.id, chosen.map((c) => c.name));
  }
  if (orphans.length) console.log(`Backfilled interests for ${orphans.length} demo users.`);

  console.log('Seeding complete.');
}

if (require.main === module) seed().catch((e) => { console.error(e); process.exit(1); });
module.exports = { seed };