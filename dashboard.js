const express = require('express');
const db = require('../database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get dashboard stats
router.get('/', auth, (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date().toISOString();

    let projectIds;
    
    if (req.user.role === 'admin') {
      // Admin sees all projects
      projectIds = db.prepare('SELECT id FROM projects').all().map(p => p.id);
    } else {
      // Members see their projects
      projectIds = db.prepare('SELECT project_id FROM project_members WHERE user_id = ?').all(userId).map(p => p.project_id);
    }

    if (projectIds.length === 0) {
      return res.json({
        totalProjects: 0,
        totalTasks: 0,
        tasksByStatus: {
          todo: 0,
          in_progress: 0,
          review: 0,
          done: 0
        },
        tasksByPriority: {
          low: 0,
          medium: 0,
          high: 0
        },
        overdueTasks: [],
        myTasks: []
      });
    }

    const placeholders = projectIds.map(() => '?').join(',');

    // Task stats
    const tasksByStatus = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM tasks
      WHERE project_id IN (${placeholders})
      GROUP BY status
    `).all(...projectIds);

    const tasksByPriority = db.prepare(`
      SELECT priority, COUNT(*) as count
      FROM tasks
      WHERE project_id IN (${placeholders})
      GROUP BY priority
    `).all(...projectIds);

    // Overdue tasks
    const overdueTasks = db.prepare(`
      SELECT t.*, p.name as project_name,
        u.username as assigned_to_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.project_id IN (${placeholders})
        AND t.status != 'done'
        AND t.due_date < ?
      ORDER BY t.due_date ASC
      LIMIT 10
    `).all(...projectIds, now);

    // My assigned tasks
    const myTasks = db.prepare(`
      SELECT t.*, p.name as project_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.project_id IN (${placeholders})
        AND t.assigned_to = ?
        AND t.status != 'done'
      ORDER BY 
        CASE t.priority 
          WHEN 'high' THEN 1 
          WHEN 'medium' THEN 2 
          WHEN 'low' THEN 3 
        END,
        t.due_date ASC
    `).all(...projectIds, userId);

    // Project stats
    const projectCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM projects
      WHERE id IN (${placeholders})
    `).get(...projectIds);

    const taskCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM tasks
      WHERE project_id IN (${placeholders})
    `).get(...projectIds);

    // Format status counts
    const statusCountObj = { todo: 0, in_progress: 0, review: 0, done: 0 };
    tasksByStatus.forEach(s => {
      statusCountObj[s.status] = s.count;
    });

    // Format priority counts
    const priorityCountObj = { low: 0, medium: 0, high: 0 };
    tasksByPriority.forEach(p => {
      priorityCountObj[p.priority] = p.count;
    });

    res.json({
      totalProjects: projectCount.count,
      totalTasks: taskCount.count,
      tasksByStatus: statusCountObj,
      tasksByPriority: priorityCountObj,
      overdueTasks,
      myTasks
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
