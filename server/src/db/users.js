const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const USERS_PATH = path.join(DATA_DIR, 'users.json');

function read() {
  if (!fs.existsSync(USERS_PATH)) return { users: [] };
  try { return JSON.parse(fs.readFileSync(USERS_PATH, 'utf8')); } catch { return { users: [] }; }
}

function write(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(USERS_PATH, JSON.stringify(data, null, 2));
}

function findByUsername(username) {
  return read().users.find((u) => u.username === username) || null;
}

function findById(id) {
  return read().users.find((u) => u.id === id) || null;
}

function create(user) {
  const db = read();
  db.users.push(user);
  write(db);
}

function updateAwsConfig(userId, awsConfig) {
  const db = read();
  const user = db.users.find((u) => u.id === userId);
  if (user) {
    user.awsConfig = awsConfig;
    write(db);
  }
}

module.exports = { findByUsername, findById, create, updateAwsConfig };
