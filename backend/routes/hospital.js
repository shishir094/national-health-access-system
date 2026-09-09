import express from 'express';
import pool from '../config/db.js';
import verifyHospital from '../middleware/hospitalAuth.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const router = express.Router();

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000
};

const generate_hospital_token = (id) => {
    return jwt.sign({ id }, process.env.HOSPITAL_SECRET_KEY, { expiresIn: '30d' });
};

// ==========================================
// AUTHENTICATION & PROFILE
// ==========================================
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Please provide email and password" });

    try {
        const queryResult = await pool.query('SELECT * FROM hospital_db WHERE email = $1', [email]);
        if (queryResult.rows.length === 0) return res.status(400).json({ message: "Invalid credentials" });

        const hospital_data = queryResult.rows[0];
        const isMatch = await bcrypt.compare(password, hospital_data.password_hash);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const hospital_token = generate_hospital_token(hospital_data.hospital_id);
        res.cookie('hospital_token', hospital_token, cookieOptions);

        res.json({
            message: "Login successful",
            hospital_token,
            hospital_admin: { id: hospital_data.hospital_id, name: hospital_data.name, email: hospital_data.email }
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error during login" });
    }
});

router.get('/me', verifyHospital, async (req, res) => {
    try {
        const query = await pool.query(
            'SELECT hospital_id, name, license_number, email, hospital_type, hospital_bed_capacity, province, district, municipality, phone, emergency_contact FROM hospital_db WHERE hospital_id = $1',
            [req.hospital.id]
        );
        if (query.rows.length === 0) return res.status(404).json({ message: 'Hospital profile not found' });
        return res.json({ user: query.rows[0] });
    } catch (error) {
        return res.status(500).json({ message: 'Server error fetching user profile' });
    }
});

router.post('/logout', (req, res) => {
    res.cookie('hospital_token', '', { ...cookieOptions, maxAge: 1 });
    res.json({ message: 'logged out successfully' });
});

// ==========================================
// PUBLIC HOSPITAL & DEPARTMENT FETCHING
// ==========================================
router.get('/list', async (req, res) => {
    try {
        const query = await pool.query(`
            SELECT 
                h.hospital_id,
                h.name,
                h.email,
                h.phone,
                h.emergency_contact,
                h.province,
                h.district,
                h.municipality,
                h.hospital_type,
                h.hospital_bed_capacity,
                COALESCE(
                    json_agg(
                        json_build_object('department_id', d.department_id, 'name', d.name, 'description', d.description)
                    ) FILTER (WHERE d.department_id IS NOT NULL), 
                    '[]'
                ) AS departments
            FROM hospital_db h
            LEFT JOIN departments d ON h.hospital_id = d.hospital_id
            GROUP BY h.hospital_id
            ORDER BY h.hospital_id ASC;
        `);
        
        return res.json(query.rows);
    } catch (error) {
        console.error("Error fetching hospital list:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

router.get('/hospitals/:hospital_id/structure', async (req, res) => {
    const { hospital_id } = req.params;
    try {
        const query = `
            SELECT d.department_id, d.name AS department_name, d.description,
            COALESCE(json_agg(json_build_object('doctor_id', doc.doctor_id, 'name', doc.name, 'specialization', doc.specialization)) 
            FILTER (WHERE doc.doctor_id IS NOT NULL), '[]') AS doctors
            FROM departments d
            LEFT JOIN doctors doc ON d.department_id = doc.department_id
            WHERE d.hospital_id = $1
            GROUP BY d.department_id;
        `;
        const result = await pool.query(query, [hospital_id]);
        return res.json({ departments: result.rows });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch structure" });
    }
});

// ==========================================
// HOSPITAL DASHBOARD: MANAGE DEPARTMENTS & DOCTORS
// ==========================================
router.post('/departments', verifyHospital, async (req, res) => {
    const { name, description } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO departments (hospital_id, name, description) VALUES ($1, $2, $3) RETURNING *',
            [req.hospital.id, name, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: "Failed to create department" });
    }
});

router.post('/doctors', verifyHospital, async (req, res) => {
    const { department_id, name, specialization, phone, email } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO doctors (hospital_id, department_id, name, specialization, phone, email) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [req.hospital.id, department_id, name, specialization, phone, email]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: "Failed to add doctor" });
    }
});

router.get('/hospital/appointments', verifyHospital, async (req, res) => {
    try {
        const deleteQuery = `
            DELETE FROM appointments 
            WHERE (appointment_date + appointment_time) < (NOW() - INTERVAL '1 hour');
        `;
        await pool.query(deleteQuery);

        const fetchQuery = `
            SELECT a.*, d.name AS department_name, doc.name AS doctor_name
            FROM appointments a
            JOIN departments d ON a.department_id = d.department_id
            LEFT JOIN doctors doc ON a.doctor_id = doc.doctor_id
            WHERE a.hospital_id = $1 
              AND LOWER(a.payment_status) = 'paid'
            ORDER BY a.appointment_date ASC, a.appointment_time ASC;
        `;
        const result = await pool.query(fetchQuery, [req.hospital.id]);
        res.json(result.rows);
    } catch (error) {
        console.error("Fetch Appointments Error:", error);
        res.status(500).json({ message: "Failed to fetch appointments" });
    }
});

// ==========================================
// APPOINTMENTS & ESEWA INTEGRATION
// ==========================================

// Helper API: Fetch Slot Counts for Real-Time Remaining Capacity
router.get('/appointments/slot-counts', async (req, res) => {
    const { hospital_id, department_id, date } = req.query;

    if (!hospital_id || !department_id || !date) {
        return res.status(400).json({ message: "hospital_id, department_id, and date are required." });
    }

    try {
        const query = `
            SELECT appointment_time, COUNT(*)::INT AS booked_count
            FROM appointments
            WHERE hospital_id = $1 
              AND department_id = $2 
              AND appointment_date = $3 
              AND status != 'CANCELLED'
            GROUP BY appointment_time;
        `;
        const result = await pool.query(query, [hospital_id, department_id, date]);

        const slotCounts = {};
        result.rows.forEach(row => {
            const timeKey = row.appointment_time.slice(0, 5);
            slotCounts[timeKey] = row.booked_count;
        });

        return res.json(slotCounts);
    } catch (error) {
        console.error("Error fetching slot counts:", error);
        return res.status(500).json({ message: "Failed to fetch slot counts" });
    }
});

const generateEsewaSignature = (secretKey, totalAmount, transactionUuid, productCode) => {
    const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
    return crypto.createHmac('sha256', secretKey).update(message).digest('base64');
};

router.post('/appointments', async (req, res) => {
    const { hospital_id, department_id, doctor_id, user_id, patient_name, patient_phone, appointment_date, appointment_time, notes } = req.body;

    if (!hospital_id || !department_id || !appointment_date || !appointment_time) {
        return res.status(400).json({ message: "Please fill all required fields." });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check 1: Prevent duplicate booking by the exact same user for the same slot
        if (user_id) {
            const userDuplicateCheck = await client.query(
                `SELECT appointment_id FROM appointments 
                 WHERE user_id = $1 AND hospital_id = $2 AND department_id = $3 
                 AND appointment_date = $4 AND appointment_time = $5 AND status != 'CANCELLED'`,
                [user_id, hospital_id, department_id, appointment_date, appointment_time]
            );

            if (userDuplicateCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: "You have already booked an appointment for this exact time slot." });
            }
        }

        // Check 2: Max 20 appointments limit per slot
        const capacityCheck = await client.query(
            `SELECT COUNT(*) FROM appointments 
             WHERE hospital_id = $1 AND department_id = $2 AND appointment_date = $3 AND appointment_time = $4 AND status != 'CANCELLED'`,
            [hospital_id, department_id, appointment_date, appointment_time]
        );

        if (parseInt(capacityCheck.rows[0].count) >= 20) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: "Maximum limit of 20 appointments reached for this time slot. Please select another slot." });
        }

        const transaction_uuid = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const amount = "500";

        const insertQuery = `
            INSERT INTO appointments (
                hospital_id, department_id, doctor_id, user_id, patient_name, patient_phone,
                appointment_date, appointment_time, notes, amount, payment_status, status, transaction_uuid
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING', 'PENDING', $11)
            RETURNING *;
        `;
        const newApp = await client.query(insertQuery, [
            hospital_id, department_id, doctor_id || null, user_id || null, patient_name, patient_phone,
            appointment_date, appointment_time, notes || null, amount, transaction_uuid
        ]);

        await client.query('COMMIT');

        const secretKey = "8gBm/:&EnhH.1/q";
        const productCode = "EPAYTEST";
        const signature = generateEsewaSignature(secretKey, amount, transaction_uuid, productCode);

        const esewaFormData = {
            amount: amount,
            tax_amount: "0",
            total_amount: amount,
            transaction_uuid: transaction_uuid,
            product_code: productCode,
            product_service_charge: "0",
            product_delivery_charge: "0",
            success_url: "http://localhost:5000/api/esewa/success",
            failure_url: "http://localhost:5000/api/esewa/failure",
            signed_field_names: "total_amount,transaction_uuid,product_code",
            signature: signature
        };

        return res.status(201).json({
            message: "Appointment created. Complete payment via eSewa.",
            appointment: newApp.rows[0],
            esewaFormData,
            esewaPaymentUrl: "https://rc-epay.esewa.com.np/api/epay/main/v2/form"
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Booking Error:", error);
        return res.status(500).json({ message: "Failed to schedule appointment." });
    } finally {
        client.release();
    }
});

// eSewa Payment Callback - Success
router.get('/esewa/success', async (req, res) => {
    const { data } = req.query;
    if (!data) return res.redirect('http://localhost:5173/dashboard?payment=failed');

    try {
        const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
        
        const transaction_uuid = decodedData.transaction_uuid;
        const refId = decodedData.transaction_code || decodedData.reference_id || 'N/A';
        const status = decodedData.status;

        if (status === 'COMPLETE') {
            await pool.query(
                `UPDATE appointments SET payment_status = 'PAID', status = 'CONFIRMED', esewa_ref_id = $1 WHERE transaction_uuid = $2`,
                [refId, transaction_uuid]
            );
            return res.redirect('http://localhost:5173/dashboard?payment=success');
        }
        
        return res.redirect('http://localhost:5173/dashboard?payment=failed');
    } catch (err) {
        console.error("eSewa Callback Verification Error:", err);
        return res.redirect('http://localhost:5173/dashboard?payment=failed');
    }
});

// eSewa Payment Callback - Failure
router.get('/esewa/failure', (req, res) => {
    res.redirect('http://localhost:5173/dashboard?payment=cancelled');
});

// ==========================================
// USER DASHBOARD: FETCH & CLEANUP APPOINTMENTS WITH AM/PM
// ==========================================
router.get('/appointments/user/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const deleteQuery = `
            DELETE FROM appointments 
            WHERE (appointment_date + appointment_time) < (NOW() - INTERVAL '1 hour');
        `;
        await pool.query(deleteQuery);

        const fetchQuery = `
            SELECT 
                a.appointment_id,
                a.hospital_id,
                a.department_id,
                a.doctor_id,
                a.user_id,
                a.patient_name,
                a.patient_phone,
                a.appointment_date,
                TO_CHAR(a.appointment_time, 'HH12:MI AM') AS appointment_time_formatted,
                a.appointment_time,
                a.notes,
                a.amount,
                a.payment_status,
                a.status,
                h.name AS hospital_name, 
                d.name AS department_name, 
                doc.name AS doctor_name
            FROM appointments a
            JOIN hospital_db h ON a.hospital_id = h.hospital_id
            JOIN departments d ON a.department_id = d.department_id
            LEFT JOIN doctors doc ON a.doctor_id = doc.doctor_id
            WHERE a.user_id = $1 
              AND LOWER(a.payment_status) = 'paid'
            ORDER BY a.appointment_date ASC, a.appointment_time ASC;
        `;
        const result = await pool.query(fetchQuery, [userId]);
        
        return res.json(result.rows);
    } catch (error) {
        console.error("User Appointments Fetch Error:", error);
        return res.status(500).json({ message: "Failed to fetch user appointments" });
    }
});

export default router;