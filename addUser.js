const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://127.0.0.1:27017/finwise');

const User = mongoose.model('User', new mongoose.Schema({
    fullName: String, email: { type: String, unique: true }, password: String,
    balance: Number, transactions: Array, budgets: Object, goals: Array, creditCards: Array
}));

async function add() {
    const users = [
        { name: 'Rahul Kumar', email: 'rahul@gmail.com', pass: 'rahul123' },
        { name: 'Priya Sharma', email: 'priya@gmail.com', pass: 'priya123' },
        { name: 'Amit Singh', email: 'amit@gmail.com', pass: 'amit123' }
    ];

    for (let u of users) {
        await User.deleteOne({ email: u.email });
        const hashed = await bcrypt.hash(u.pass, 10);
        await User.create({
            fullName: u.name, email: u.email, password: hashed, balance: 50000,
            budgets: { Food: 800, Housing: 3500 },
            goals: [{ name: 'Emergency Fund', target: 50000, current: 0 }],
            transactions: [], creditCards: []
        });
    }
    console.log('✅ 3 Users Created!');
    console.log('📧 rahul@gmail.com / rahul123');
    console.log('📧 priya@gmail.com / priya123');
    console.log('📧 amit@gmail.com / amit123');
    process.exit(0);
}
add();
