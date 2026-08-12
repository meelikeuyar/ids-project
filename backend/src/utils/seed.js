/**
 * Database seed script — creates initial admin user
 * Usage: node src/utils/seed.js
 *
 * ⚠️  DEVELOPMENT ONLY — change passwords immediately in production!
 */
const crypto = require('crypto');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');

// Generate random password if env vars not provided
const generatePassword = () => {
  return crypto.randomBytes(12).toString('base64url') + 'A1!';
};

const seed = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ids_db';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const adminPass = process.env.SEED_ADMIN_PASS || generatePassword();
    const analystPass = process.env.SEED_ANALYST_PASS || generatePassword();

    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('Admin already exists, skipping seed.');
    } else {
      await User.create({
        name: 'Admin',
        email: process.env.SEED_ADMIN_EMAIL || 'admin@ids.local',
        password: adminPass,
        role: 'admin',
      });
      console.log('✅ Admin user created');
      console.log(`   Email: ${process.env.SEED_ADMIN_EMAIL || 'admin@ids.local'}`);
      console.log(`   Password: ${adminPass}`);
      console.log('   ⚠️  Change this password after first login!');
    }

    // Sample analyst
    const analystEmail = process.env.SEED_ANALYST_EMAIL || 'analyst@ids.local';
    const analystExists = await User.findOne({ email: analystEmail });
    if (!analystExists) {
      await User.create({
        name: 'Security Analyst',
        email: analystEmail,
        password: analystPass,
        role: 'analyst',
      });
      console.log('✅ Analyst user created');
      console.log(`   Email: ${analystEmail}`);
      console.log(`   Password: ${analystPass}`);
      console.log('   ⚠️  Change this password after first login!');
    }

    await mongoose.disconnect();
    console.log('\nSeed complete.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
};

seed();