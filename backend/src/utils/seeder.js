require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const ActivitySession = require('../models/ActivitySession');
const AppUsageLog = require('../models/AppUsageLog');
const ProductivityScoreSnapshot = require('../models/ProductivityScoreSnapshot');
const AppCategory = require('../models/AppCategory');
const Alert = require('../models/Alert');
const Role = require('../models/Role');
const PERMISSIONS = require('../constants/permissions');
const scoringEngine = require('../services/scoringEngine');

const APPS = [
  { name: 'Visual Studio Code', cat: 'productive' },
  { name: 'Google Chrome', cat: 'neutral' },
  { name: 'Slack', cat: 'productive' },
  { name: 'Figma', cat: 'productive' },
  { name: 'YouTube', cat: 'distracting' },
  { name: 'Microsoft Teams', cat: 'productive' },
  { name: 'Postman', cat: 'productive' },
  { name: 'Facebook', cat: 'distracting' },
  { name: 'Notion', cat: 'productive' },
  { name: 'Excel', cat: 'productive' },
  { name: 'Terminal', cat: 'productive' },
  { name: 'Twitter', cat: 'distracting' },
];

function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function generateDaySessions(userId, dateStr) {
  const sessions = [];
  const appLogs = [];
  const base = new Date(dateStr + 'T09:00:00Z');
  let current = new Date(base);

  for (let i = 0; i < 20; i++) {
    const isIdle = Math.random() < 0.2;
    const dur = randomInt(isIdle ? 300 : 600, isIdle ? 1200 : 4200);
    const end = new Date(current.getTime() + dur * 1000);
    sessions.push({
      userId, type: isIdle ? 'idle' : 'active',
      startTime: new Date(current),
      endTime: end,
      durationSeconds: dur,
      date: dateStr,
    });
    if (!isIdle) {
      const app = pick(APPS);
      appLogs.push({
        userId, appName: app.name, category: app.cat,
        durationSeconds: dur,
        intervalStart: new Date(current),
        intervalEnd: end,
        date: dateStr,
      });
    }
    current = end;
    if (current.getUTCHours() >= 18) break;
  }
  return { sessions, appLogs };
}

async function seed(skipDbConnect = false) {
  if (!skipDbConnect) {
    await connectDB();
  }
  console.log('🌱 Seeding WorkPulse demo data...');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    ActivitySession.deleteMany({}),
    AppUsageLog.deleteMany({}),
    ProductivityScoreSnapshot.deleteMany({}),
    AppCategory.deleteMany({}),
    Alert.deleteMany({}),
    Role.deleteMany({}),
  ]);

  // Seed default categories
  const defaultCats = [
    { type: 'app', pattern: 'Visual Studio Code', category: 'productive', label: 'Code Editor', isDefault: true },
    { type: 'app', pattern: 'Figma', category: 'productive', label: 'Design Tool', isDefault: true },
    { type: 'app', pattern: 'Slack', category: 'productive', label: 'Communication', isDefault: true },
    { type: 'app', pattern: 'YouTube', category: 'distracting', label: 'Video Streaming', isDefault: true },
    { type: 'app', pattern: 'Facebook', category: 'distracting', label: 'Social Media', isDefault: true },
    { type: 'domain', pattern: 'github.com', category: 'productive', label: 'Code Repository', isDefault: true },
    { type: 'domain', pattern: 'stackoverflow.com', category: 'productive', label: 'Dev Q&A', isDefault: true },
    { type: 'domain', pattern: 'twitter.com', category: 'distracting', label: 'Social Media', isDefault: true },
    { type: 'domain', pattern: 'reddit.com', category: 'distracting', label: 'Social Media', isDefault: true },
  ];
  await AppCategory.insertMany(defaultCats.map(c => ({ ...c, orgId: 'default_org' })));

  // Create roles
  const adminRole = await Role.create({
    name: 'Admin',
    level: 0,
    permissions: Object.values(PERMISSIONS),
    isSystem: true,
    color: '#8B5CF6'
  });

  const managerRole = await Role.create({
    name: 'Manager',
    parentRoleId: adminRole._id,
    level: 1,
    permissions: [
      PERMISSIONS.VIEW_OWN_DATA,
      PERMISSIONS.VIEW_TEAM_DATA,
      PERMISSIONS.ASSIGN_TASKS,
      PERMISSIONS.CREATE_TASKS,
      PERMISSIONS.EDIT_TASKS,
      PERMISSIONS.APPROVE_TASKS,
      PERMISSIONS.VIEW_TEAM_ANALYTICS,
      PERMISSIONS.VIEW_ALERTS,
      PERMISSIONS.APPROVE_LEAVES
    ],
    isSystem: true,
    color: '#3B82F6'
  });

  const employeeRole = await Role.create({
    name: 'Employee',
    parentRoleId: managerRole._id,
    level: 2,
    permissions: [
      PERMISSIONS.VIEW_OWN_DATA,
      PERMISSIONS.REQUEST_LEAVES
    ],
    isSystem: true,
    color: '#10B981'
  });

  // Create users
  const admin = await User.create({ name: 'Alex Admin', email: 'admin@workpulse.dev', password: 'password123', role: 'admin', roleId: adminRole._id, department: 'Management', userId: 'alexadmin', mobileNumber: '1111111111' });
  const manager = await User.create({ name: 'Morgan Manager', email: 'manager@workpulse.dev', password: 'password123', role: 'manager', roleId: managerRole._id, department: 'Engineering', userId: 'morganmgr', mobileNumber: '2222222222' });
  const emp1 = await User.create({ name: 'Jordan Dev', email: 'jordan@workpulse.dev', password: 'password123', role: 'employee', roleId: employeeRole._id, department: 'Engineering', managerId: manager._id, userId: 'jordandev', mobileNumber: '3333333333' });
  const emp2 = await User.create({ name: 'Casey Designer', email: 'casey@workpulse.dev', password: 'password123', role: 'employee', roleId: employeeRole._id, department: 'Design', managerId: manager._id, userId: 'caseydes', mobileNumber: '4444444444' });
  const emp3 = await User.create({ name: 'Riley Analyst', email: 'riley@workpulse.dev', password: 'password123', role: 'employee', roleId: employeeRole._id, department: 'Data', managerId: manager._id, userId: 'rileyana', mobileNumber: '5555555555' });

  // Set manager's managerId to admin
  await User.findByIdAndUpdate(manager._id, { managerId: admin._id });

  const employees = [emp1, emp2, emp3];

  // Seed 7 days of data for each employee
  for (const emp of employees) {
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const { sessions, appLogs } = generateDaySessions(emp._id, dateStr);
      await ActivitySession.insertMany(sessions);
      await AppUsageLog.insertMany(appLogs);
      await scoringEngine.computeAndSave(emp._id, dateStr);
    }
  }

  // Seed alerts
  await Alert.insertMany([
    { managerId: manager._id, employeeId: emp1._id, type: 'low_score', title: 'Low Productivity Score', message: 'Jordan Dev scored below 40 yesterday. Consider checking in.' },
    { managerId: manager._id, employeeId: emp2._id, type: 'excessive_idle', title: 'Excessive Idle Time', message: 'Casey Designer had over 2 hours of unannotated idle time today.' },
    { managerId: manager._id, employeeId: emp3._id, type: 'system', title: 'Agent Offline', message: 'Riley Analyst\'s desktop agent hasn\'t synced in 48 hours.' },
  ]);

  console.log('✅ Seeded successfully!');
  console.log('');
  console.log('Demo Login Credentials:');
  console.log('  Admin:    admin@workpulse.dev    / password123');
  console.log('  Manager:  manager@workpulse.dev  / password123');
  console.log('  Employee: jordan@workpulse.dev   / password123');
  console.log('  Employee: casey@workpulse.dev    / password123');
  console.log('  Employee: riley@workpulse.dev    / password123');
  console.log('');
  // process.exit(0);
}

// If run directly from command line, execute seed
if (require.main === module) {
  seed().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
} else {
  module.exports = { seed };
}
