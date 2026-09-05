import pool from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getSchedules() {
  const query = `
    SELECT 
      ws.id,
      ws.name,
      ws.weekly_hours,
      ws.created_at,
      ws.updated_at,
      COUNT(DISTINCT e.id) as assigned_employees_count,
      COUNT(DISTINCT sl.id) as lines_count
    FROM working_schedules ws
    LEFT JOIN employees e ON e.schedule_id = ws.id
    LEFT JOIN schedule_lines sl ON sl.schedule_id = ws.id
    GROUP BY ws.id, ws.name, ws.weekly_hours, ws.created_at, ws.updated_at
    ORDER BY ws.created_at ASC
  `;

  const res = await pool.query(query);
  return res.rows;
}

export async function getScheduleById(id) {
  const schedRes = await pool.query('SELECT * FROM working_schedules WHERE id = $1', [id]);
  if (schedRes.rows.length === 0) {
    throw new AppError('Working schedule not found', 404, 'SCHEDULE_NOT_FOUND');
  }

  const linesRes = await pool.query(`
    SELECT * FROM schedule_lines 
    WHERE schedule_id = $1 
    ORDER BY day_of_week ASC
  `, [id]);

  const schedule = schedRes.rows[0];
  schedule.lines = linesRes.rows;
  return schedule;
}

export async function createSchedule({ name, weekly_hours = 40.00, lines = [] }) {
  if (!name || !name.trim()) {
    throw new AppError('Schedule name is required.', 400, 'VALIDATION_ERROR');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const insertSchedQuery = `
      INSERT INTO working_schedules (name, weekly_hours)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const schedRes = await client.query(insertSchedQuery, [name.trim(), parseFloat(weekly_hours)]);
    const scheduleId = schedRes.rows[0].id;

    if (lines && lines.length > 0) {
      for (const line of lines) {
        if (line.day_of_week && line.start_time && line.end_time) {
          await client.query(`
            INSERT INTO schedule_lines (schedule_id, day_of_week, start_time, end_time, break_hours)
            VALUES ($1, $2, $3, $4, $5)
          `, [
            scheduleId, 
            parseInt(line.day_of_week, 10), 
            line.start_time, 
            line.end_time, 
            parseFloat(line.break_hours || 1.00)
          ]);
        }
      }
    }

    await client.query('COMMIT');
    return getScheduleById(scheduleId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateSchedule(id, { name, weekly_hours, lines }) {
  await getScheduleById(id);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (name || weekly_hours !== undefined) {
      await client.query(`
        UPDATE working_schedules
        SET 
          name = COALESCE($1, name),
          weekly_hours = COALESCE($2, weekly_hours),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [name ? name.trim() : null, weekly_hours !== undefined ? parseFloat(weekly_hours) : null, id]);
    }

    if (lines && Array.isArray(lines)) {
      await client.query('DELETE FROM schedule_lines WHERE schedule_id = $1', [id]);
      for (const line of lines) {
        if (line.day_of_week && line.start_time && line.end_time) {
          await client.query(`
            INSERT INTO schedule_lines (schedule_id, day_of_week, start_time, end_time, break_hours)
            VALUES ($1, $2, $3, $4, $5)
          `, [
            id, 
            parseInt(line.day_of_week, 10), 
            line.start_time, 
            line.end_time, 
            parseFloat(line.break_hours || 1.00)
          ]);
        }
      }
    }

    await client.query('COMMIT');
    return getScheduleById(id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteSchedule(id) {
  const empCheck = await pool.query('SELECT COUNT(*) FROM employees WHERE schedule_id = $1', [id]);
  if (parseInt(empCheck.rows[0].count, 10) > 0) {
    throw new AppError('Cannot delete schedule because active employees are assigned to it.', 400, 'SCHEDULE_IN_USE');
  }

  await pool.query('DELETE FROM working_schedules WHERE id = $1', [id]);
  return { id, action: 'deleted' };
}
