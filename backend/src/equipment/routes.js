import express from 'express';
import { pool } from '../db/connection.js';
import { authenticateToken } from '../auth/middleware.js';

const router = express.Router();

// All equipment routes require authentication
router.use(authenticateToken);

// Get all equipment
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, t.name as team_name
      FROM equipment e
      LEFT JOIN teams t ON e.maintenance_team_id = t.id
      ORDER BY e.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get equipment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single equipment
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, t.name as team_name
      FROM equipment e
      LEFT JOIN teams t ON e.maintenance_team_id = t.id
      WHERE e.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    // Ensure is_usable is included (defaults to true if column doesn't exist yet)
    const equipment = result.rows[0];
    if (equipment.is_usable === undefined || equipment.is_usable === null) {
      equipment.is_usable = true;
    }

    res.json(equipment);
  } catch (error) {
    console.error('❌ Get equipment error:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      equipmentId: req.params.id
    });
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create equipment
router.post('/', async (req, res) => {
  try {
    const { name, category, location, maintenance_team_id } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await pool.query(
      `INSERT INTO equipment (name, category, location, maintenance_team_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, category || null, location || null, maintenance_team_id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create equipment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update equipment
router.patch('/:id', async (req, res) => {
  try {
    const { name, category, location, maintenance_team_id } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      values.push(category);
    }
    if (location !== undefined) {
      updates.push(`location = $${paramCount++}`);
      values.push(location);
    }
    if (maintenance_team_id !== undefined) {
      updates.push(`maintenance_team_id = $${paramCount++}`);
      values.push(maintenance_team_id);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);
    const result = await pool.query(
      `UPDATE equipment SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update equipment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete equipment
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM equipment WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    res.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    console.error('Delete equipment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Auto-Fill Logic: Get default team and category for equipment
router.get('/:id/autofill', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        e.maintenance_team_id as team_id,
        e.category,
        t.name as team_name
      FROM equipment e
      LEFT JOIN teams t ON e.maintenance_team_id = t.id
      WHERE e.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    const equipment = result.rows[0];
    res.json({
      team_id: equipment.team_id,
      category: equipment.category,
      team_name: equipment.team_name
    });
  } catch (error) {
    console.error('Get autofill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get open requests count for equipment (for Smart Button)
router.get('/:id/requests/count', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as open_count
      FROM requests
      WHERE equipment_id = $1 
        AND status IN ('new', 'in_progress')
    `, [req.params.id]);

    res.json({ 
      equipment_id: parseInt(req.params.id),
      open_count: parseInt(result.rows[0].open_count)
    });
  } catch (error) {
    console.error('Get requests count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

