require('dotenv/config');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Simple user schema for testing
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  firstName: String,
  lastName: String,
  role: String
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

async function testAuth() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    const passwordMap = {
      'admin@riskwise.com': 'RiskWise2024!',
      'risk.manager@riskwise.com': 'RiskManager2024!',
      'analyst@riskwise.com': 'Analyst2024!',
      'compliance@riskwise.com': 'Compliance2024!'
    };

    for (const user of users) {
      console.log(`\nProcessing user: ${user.email}`);
      
      const correctPassword = passwordMap[user.email];
      if (!correctPassword) {
        console.log('⚠️ No password mapping found for this user');
        continue;
      }

      // If password is not hashed (doesn't start with $2), hash it
      if (!user.password.startsWith('$2')) {
        console.log('Password is not hashed, hashing now...');
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(correctPassword, salt);
        
        // Update user with hashed password
        await User.findByIdAndUpdate(user._id, { password: hashedPassword });
        console.log('✅ Password updated and hashed');
      } else {
        console.log('✅ Password already hashed');
      }

      // Test comparison
      const updatedUser = await User.findById(user._id);
      const isValid = await updatedUser.comparePassword(correctPassword);
      console.log(`Password test result for ${user.email}:`, isValid);
    }

    console.log('\n🎉 All users processed!');
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testAuth();