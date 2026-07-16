const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// CORS with proper configuration
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== MONGODB CONNECTION =====
mongoose.connect('mongodb://localhost:27017/finwise', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
})
.then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log('📌 Database: finwise');
})
.catch(err => {
    console.log('❌ MongoDB connection error:', err.message);
    console.log('💡 Make sure MongoDB is running!');
});

// ===== USER SCHEMA =====
const UserSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        trim: true
    },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        trim: true
    },
    password: { 
        type: String, 
        required: true 
    },
    avatar: {
        type: String,
        default: ''
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

const User = mongoose.model('User', UserSchema);

// ===== MIDDLEWARE: Verify Token =====
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            success: false,
            message: 'Unauthorized: No token provided' 
        });
    }

    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, 'finwise_secret_key_2026');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ 
            success: false,
            message: 'Unauthorized: Invalid token' 
        });
    }
};

// ===== TEST ROUTE =====
app.get('/api/test', (req, res) => {
    res.json({ 
        success: true,
        message: '🚀 FinWise Backend is running!',
        database: mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Disconnected ❌',
        timestamp: new Date()
    });
});

// ===== SIGNUP ROUTE =====
app.post('/api/auth/signup', async (req, res) => {
    try {
        console.log('📝 Signup attempt:', req.body.email);
        const { name, email, password } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'All fields are required' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                success: false,
                message: 'Password must be at least 6 characters' 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            console.log('⚠️ User already exists:', email);
            return res.status(400).json({ 
                success: false,
                message: 'User already exists with this email' 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563eb&color=fff&size=100`
        });

        await user.save();
        console.log('✅ New user created:', email);

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user._id, 
                email: user.email,
                name: user.name
            },
            'finwise_secret_key_2026',
            { expiresIn: '7d' }
        );

        // Return success response with token
        res.status(201).json({
            success: true,
            message: 'Account created successfully!',
            token: token,
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email,
                avatar: user.avatar,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('❌ Signup error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error. Please try again.' 
        });
    }
});

// ===== SIGNIN ROUTE =====
app.post('/api/auth/signin', async (req, res) => {
    try {
        console.log('🔑 Signin attempt:', req.body.email);
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Email and password are required' 
            });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            console.log('❌ User not found:', email);
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password' 
            });
        }

        // Check password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            console.log('❌ Invalid password for:', email);
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password' 
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user._id, 
                email: user.email,
                name: user.name
            },
            'finwise_secret_key_2026',
            { expiresIn: '7d' }
        );

        console.log('✅ User logged in:', email);

        res.json({
            success: true,
            message: 'Login successful!',
            token: token,
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email,
                avatar: user.avatar,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('❌ Signin error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error. Please try again.' 
        });
    }
});

// ===== GET PROFILE (Protected) =====
app.get('/api/auth/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }
        res.json({
            success: true,
            user: user
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
});

// ===== GET ALL USERS (Debug) =====
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json({
            success: true,
            count: users.length,
            users: users
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📌 Test API: http://localhost:${PORT}/api/test`);
    console.log(`📌 Signup: http://localhost:${PORT}/api/auth/signup`);
    console.log(`📌 Signin: http://localhost:${PORT}/api/auth/signin`);
    console.log(`📌 Profile: http://localhost:${PORT}/api/auth/profile`);
    console.log(`📌 Users: http://localhost:${PORT}/api/users`);
    console.log(`\n💡 Make sure MongoDB is running!\n`);
});