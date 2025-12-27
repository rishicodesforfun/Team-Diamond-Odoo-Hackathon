import express from 'express';
import { pool } from '../db/connection.js';
import { authenticateToken, requireRole } from '../auth/middleware.js';

const router = express.Router();

// All user management routes require authentication
router.use(authenticateToken);

// Get all users (managers only)
router.get('/', requireRole('manager'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.email, u.name, u.role, u.team_id, u.created_at,
             t.name as team_name
      FROM users u
      LEFT JOIN teams t ON u.team_id = t.id
      ORDER BY u.role, u.name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get technicians only (managers only)
router.get('/technicians', requireRole('manager'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.email, u.name, u.role, u.team_id, u.created_at,
             t.name as team_name
      FROM users u
      LEFT JOIN teams t ON u.team_id = t.id
      WHERE u.role = 'technician'
      ORDER BY u.name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get technicians error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assign user to team (managers only)
router.patch('/:id/team', requireRole('manager'), async (req, res) => {
  try {
    const { team_id } = req.body;
    
    const result = await pool.query(
      `UPDATE users 
       SET team_id = $1 
       WHERE id = $2 
       RETURNING id, email, name, role, team_id`,
      [team_id || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Assign team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user role (managers only)
router.patch('/:id/role', requireRole('manager'), async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['employee', 'technician', 'manager'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const result = await pool.query(
      `UPDATE users 
       SET role = $1 
       WHERE id = $2 
       RETURNING id, email, name, role, team_id`,
      [role, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
