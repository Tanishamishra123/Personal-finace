const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/finwise';

// Models
const userSchema = new mongoose.Schema({
    fullName: String, email: { type: String, unique: true }, password: String,
    phone: String, country: String, membership: String
}, { timestamps: true });

const transactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    category: String, amount: Number, type: String, icon: String, date: Date
}, { timestamps: true });

const accountSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String, type: String, balance: Number, number: String
}, { timestamps: true });


const User = mongoose.model('User', userSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const Account = mongoose.model('Account', accountSchema);

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB Connected');

        await User.deleteMany({});
        await Transaction.deleteMany({});
        await Account.deleteMany({});
        console.log('🗑️  Old data cleared');

        const hashedPassword = await bcrypt.hash('demo123', 10);
        const user = await User.create({
            fullName: 'John Doe',
            email: 'demo@finwise.io',
            password: hashedPassword,
            phone: '+1 (555) 123-4567',
            country: 'United States',
            membership: 'premium'
        });
        console.log('👤 Demo user created');

        await Account.insertMany([
            { user: user._id, name: 'Checking Account', type: 'checking', balance: 45680.50, number: '**** 4832' },
            { user: user._id, name: 'Savings Account', type: 'savings', balance: 89340.50, number: '**** 7891' },
            { user: user._id, name: 'Platinum Card', type: 'credit', balance: -2340.00, number: '**** 1234' },
            { user: user._id, name: 'Bitcoin Wallet', type: 'crypto', balance: 15750.00, number: 'BTC' }
        ]);
        console.log('💳 Accounts created');

        await Transaction.insertMany([
            { user: user._id, category: 'Salary Deposit', amount: 16250, type: 'income', icon: 'briefcase', date: new Date() },
            { user: user._id, category: 'Rent Payment', amount: -3450, type: 'expense', icon: 'home', date: new Date('2024-01-01') },
            { user: user._id, category: 'Freelance Work', amount: 2000, type: 'income', icon: 'laptop', date: new Date('2024-01-08') },
            { user: user._id, category: 'Netflix', amount: -15.99, type: 'expense', icon: 'tv', date: new Date('2024-01-10') }
        ]);
        console.log('💰 Transactions created');

        console.log('\n✅ SEED COMPLETE!');
        console.log('📧 Email: demo@finwise.io');
        console.log('🔑 Password: demo123\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

seed();