import express from 'express';
import { pool } from '../db/connection.js';
import { authenticateToken } from '../auth/middleware.js';

const router = express.Router();

// All request routes require authentication
router.use(authenticateToken);

// Get all requests (with filters)
router.get('/', async (req, res) => {
  try {
    const { status, equipment_id, type } = req.query;
    let query = `
      SELECT r.*, 
             e.name as equipment_name, 
             e.category as equipment_category,
             t.name as team_name,
             u.name as user_name
      FROM requests r
      LEFT JOIN equipment e ON r.equipment_id = e.id
      LEFT JOIN teams t ON r.team_id = t.id
      LEFT JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND r.status = $${paramCount++}`;
      params.push(status);
    }
    if (equipment_id) {
      query += ` AND r.equipment_id = $${paramCount++}`;
      params.push(equipment_id);
    }
    if (type) {
      query += ` AND r.type = $${paramCount++}`;
      params.push(type);
    }

    query += ' ORDER BY r.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get calendar events
router.get('/calendar', async (req, res) => {
  try {
    const { start, end } = req.query;

    let query = `
      SELECT r.id,
             r.title,
             r.scheduled_date as date,
             r.start_time as "startTime",
             r.duration_hours as "durationHours",
             r.status,
             r.type,
             e.name as equipment_name
      FROM requests r
      LEFT JOIN equipment e ON r.equipment_id = e.id
      WHERE r.scheduled_date IS NOT NULL
    `;
    const params = [];
    let paramCount = 1;

    if (start) {
      query += ` AND r.scheduled_date >= $${paramCount++}`;
      params.push(start);
    }
    if (end) {
      query += ` AND r.scheduled_date <= $${paramCount++}`;
      params.push(end);
    }

    query += ' ORDER BY r.scheduled_date, r.start_time';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get calendar error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single request
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, 
             e.name as equipment_name, 
             e.category as equipment_category,
             t.name as team_name,
             u.name as user_name
      FROM requests r
      LEFT JOIN equipment e ON r.equipment_id = e.id
      LEFT JOIN teams t ON r.team_id = t.id
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create request
router.post('/', async (req, res) => {
  try {
    const {
      equipment_id,
      team_id,
      type,
      title,
      description,
      scheduled_date,
      start_time,
      duration_hours
    } = req.body;

    if (!equipment_id || !type || !title) {
      return res.status(400).json({ error: 'Equipment ID, type, and title are required' });
    }

    if (!['corrective', 'preventive'].includes(type)) {
      return res.status(400).json({ error: 'Type must be "corrective" or "preventive"' });
    }

    const result = await pool.query(
      `INSERT INTO requests (
        equipment_id, team_id, user_id, type, title, description,
        scheduled_date, start_time, duration_hours, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        equipment_id,
        team_id || null,
        req.userId,
        type,
        title,
        description || null,
        scheduled_date || null,
        start_time || null,
        duration_hours || 1.0,
        'new'
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update request status (for Kanban drag)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['new', 'in_progress', 'repaired', 'scrap'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required' });
    }

    const result = await pool.query(
      `UPDATE requests 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update request status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update request
router.patch('/:id', async (req, res) => {
  try {
    const {
      equipment_id,
      team_id,
      type,
      title,
      description,
      scheduled_date,
      start_time,
      duration_hours,
      status
    } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (equipment_id !== undefined) {
      updates.push(`equipment_id = $${paramCount++}`);
      values.push(equipment_id);
    }
    if (team_id !== undefined) {
      updates.push(`team_id = $${paramCount++}`);
      values.push(team_id);
    }
    if (type !== undefined) {
      updates.push(`type = $${paramCount++}`);
      values.push(type);
    }
    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (scheduled_date !== undefined) {
      updates.push(`scheduled_date = $${paramCount++}`);
      values.push(scheduled_date);
    }
    if (start_time !== undefined) {
      updates.push(`start_time = $${paramCount++}`);
      values.push(start_time);
    }
    if (duration_hours !== undefined) {
      updates.push(`duration_hours = $${paramCount++}`);
      values.push(duration_hours);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.params.id);

    const result = await pool.query(
      `UPDATE requests SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get dashboard stats
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'new') as new_count,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
        COUNT(*) FILTER (WHERE status = 'repaired') as repaired_count,
        COUNT(*) FILTER (WHERE status = 'scrap') as scrap_count,
        COUNT(*) FILTER (WHERE type = 'corrective') as corrective_count,
        COUNT(*) FILTER (WHERE type = 'preventive') as preventive_count,
        COUNT(*) as total_count
      FROM requests
    `);

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

