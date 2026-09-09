import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import dotenv from 'dotenv'
dotenv.config()
const router = express.Router();
import {protect} from '../middleware/auth.js'
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30*24*60*60*1000 // 30 days
};

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

router.post('/register', async (req, res) => {
    try {
        const { name, province, district, email, password, citizenship } = req.body;
       
        if (!name || !province || !district || !email || !password || !citizenship) {
            return res.status(400).json({ message: 'please provide all fields' });
        }

        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'user already exists' });
        }

        const hashPassword = await bcrypt.hash(password, 10);

        const newUser = await pool.query(
            'INSERT INTO users (name, province, district, email, password, citizenship) VALUES($1, $2, $3, $4, $5, $6) RETURNING id, name, email',
            [name, province, district, email, hashPassword, citizenship]
        );

        const token = generateToken(newUser.rows[0].id);
        res.cookie('token', token, cookieOptions);

        return res.status(200).json({ user: newUser.rows[0] });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: 'Server error during registration', error: error.message });
    }
});

router.post('/register/hospital', async (req, res) => {
    try {
        const {
            name, license_number, hospital_type, hospital_bed_capacity,
            province, district, municipality, email, phone,
            emergency_contact, hospital_document, password
        } = req.body;

        // 1. Validate required fields
        if (
            !name || !license_number || !hospital_type || !hospital_bed_capacity || 
            !province || !district || !municipality || !email || !phone || 
            !emergency_contact || !hospital_document || !password
        ) {
            return res.status(400).json({ message: 'Please provide all required fields.' });
        }

        // 2. Check if account already exists in hospital_db (matching target table)
        const hospitalExists = await pool.query('SELECT * FROM hospital_db WHERE email = $1', [email]);
        if (hospitalExists.rows.length > 0) {
            return res.status(400).json({ message: 'An account with this email already exists.' });
        }

        // 3. Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // 4. Ensure numeric bed capacity is parsed to integer for SQL
        const bedCapacityInt = parseInt(hospital_bed_capacity, 10);

        // 5. Insert into hospital_db
        const newAccount = await pool.query(
            `INSERT INTO hospital_db (
                name, license_number, hospital_type, hospital_bed_capacity, 
                province, district, municipality, email, phone, 
                emergency_contact, hospital_document, password_hash
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
            RETURNING hospital_id, name, email`, 
            [
                name, license_number, hospital_type, bedCapacityInt, 
                province, district, municipality, email, phone, 
                emergency_contact, hospital_document, password_hash
            ]
        );

        const hospitalUser = newAccount.rows[0];

        // 6. FIX: Use hospital_id instead of id
        const hospital_token = generateToken(hospitalUser.hospital_id);

        // 7. Set cookie & return response
        res.cookie('token', hospital_token, cookieOptions);
        return res.status(201).json({ message: 'Registration successful!', user: hospitalUser });

    } catch (error) {
        console.error("Register Error:", error);
        return res.status(500).json({ 
            message: 'Server error during registration', 
            error: error.message 
        });
    }
});
    

//api for hospital dashboard login






router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'provide all require fields' });
    }
    
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
        return res.status(400).json({ message: 'invalid credentials' });
    }

    const userData = user.rows[0];
    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
        return res.status(400).json({
            message: 'invalid credentials'
        });
    }

    const token = generateToken(userData.id);

    res.cookie('token', token, cookieOptions);
    res.json({
        user: {
            id: userData.id,
            name: userData.name,
            email: userData.email
        }
    });
});

// Add 'protect' middleware to decode token and populate req.user
router.get('/me', protect, async (req, res) => {
  try {
    // Fetch full user details from DB using ID attached by protect middleware
    const userQuery = await pool.query(
      'SELECT id, name, email, province, district, citizenship, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return the user object under the 'user' key so response.data.user works
    return res.json({ user: userQuery.rows[0] });
  } catch (error) {
    console.error("Fetch Me Error:", error);
    return res.status(500).json({ message: 'Server error fetching user profile' });
  }
});




router.post('/logout', (req, res) => {
    res.cookie('token', '', { ...cookieOptions, maxAge: 1 });
    res.json({ message: 'logged out successfully' });
});

export default router;