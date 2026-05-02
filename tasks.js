const express = require('express');
const db = require('../database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all tasks for a project
router.get('/project/:projectId', auth, (req, res) => {
  try {
    const projectId = req.params.projectId;

    // Check membership
    const membership = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(projectId, req.user.id);
    
    if (!membership && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not a member of this project.' });
    }

    const tasks = db.prepare(`
      SELECT t.*, 
        u.username as assigned_to_name,
        creator.username as created_by_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users creator ON t.created_by = creator.id
      WHERE t.project_id = ?
      ORDER BY 
        CASE t.priority 
          WHEN 'high' THEN 1 
          WHEN 'medium' THEN 2 
          WHEN 'low' THEN 3 
        END,
        t.created_at DESC
    `).all(projectId);

    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Create task
router.post('/project/:projectId', auth, (req, res) => {
  try {
    const { title, description, priority = 'medium', due_date, assigned_to } = req.body;
    const projectId = req.params.projectId;

    if (!title) {
      return res.status(400).json({ error: 'Task title is required.' });
    }

    // Check membership
    const membership = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(projectId, req.user.id);
    
    if (!membership && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not a member of this project.' });
    }

    // Verify assigned_to is a member if provided
    if (assigned_to) {
      const assignee = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(projectId, assigned_to);
      if (!assignee && req.user.role !== 'admin') {
        return res.status(400).json({ error: 'Assigned user is not a member of this project.' });
      }
    }

    const result = db.prepare(`
      INSERT INTO tasks (title, description, priority, due_date, project_id, assigned_to, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(title, description || '', priority, due_date || null, projectId, assigned_to || null, req.user.id);

    const task = db.prepare(`
      SELECT t.*, 
        u.username as assigned_to_name,
        creator.username as created_by_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users creator ON t.created_by = creator.id
      WHERE t.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({ message: 'Task created successfully.', task });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get single task
router.get('/:id', auth, (req, res) => {
  try {
    const task = db.prepare(`
      SELECT t.*, 
        u.username as assigned_to_name,
        creator.username as created_by_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users creator ON t.created_by = creator.id
      WHERE t.id = ?
    `).get(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Check membership
    const membership = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(task.project_id, req.user.id);
    
    if (!membership && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not a member of this project.' });
    }

    res.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Update task
router.put('/:id', auth, (req, res) => {
  try {
    const { title, description, priority, due_date, assigned_to, status } = req.body;
    
    // Check if task exists
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Check membership
    const membership = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(task.project_id, req.user.id);
    
    if (!membership && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not a member of this project.' });
    }

    // Allow update if: is admin member, is assigned to task, or created the task
    const canUpdate = membership?.role === 'admin' || task.assigned_to === req.user.id || task.created_by === req.user.id || req.user.role === 'admin';
    
    if (!canUpdate) {
      return res.status(403).json({ error: 'You do not have permission to update this task.' });
    }

    // Verify assigned_to is a member if provided
    if (assigned_to && assigned_to !== task.assigned_to) {
      const assignee = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(task.project_id, assigned_to);
      if (!assignee && req.user.role !== 'admin') {
        return res.status(400).json({ error: 'Assigned user is not a member of this project.' });
      }
    }

    db.prepare(`
      UPDATE tasks 
      SET title = ?, description = ?, priority = ?, due_date = ?, assigned_to = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title || task.title,
      description !== undefined ? description : task.description,
      priority || task.priority,
      due_date !== undefined ? due_date : task.due_date,
      assigned_to !== undefined ? assigned_to : task.assigned_to,
      status || task.status,
      req.params.id
    );

    const updatedTask = db.prepare(`
      SELECT t.*, 
        u.username as assigned_to_name,
        creator.username as created_by_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users creator ON t.created_by = creator.id
      WHERE t.id = ?
    `).get(req.params.id);

    res.json({ message: 'Task updated successfully.', task: updatedTask });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Update task status only
router.put('/:id/status', auth, (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['todo', 'in_progress', 'review', 'done'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be one of: todo, in_progress, review, done' });
    }

    // Check if task exists
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Check membership
    const membership = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(task.project_id, req.user.id);
    
    if (!membership && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not a member of this project.' });
    }

    // Allow update if: is assigned to task or project admin or system admin
    const canUpdate = membership?.role === 'admin' || task.assigned_to === req.user.id || task.created_by === req.user.id || req.user.role === 'admin';
    
    if (!canUpdate) {
      return res.status(403).json({ error: 'You do not have permission to update this task.' });
    }

    db.prepare('UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);

    const updatedTask = db.prepare(`
      SELECT t.*, 
        u.username as assigned_to_name,
        creator.username as created_by_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users creator ON t.created_by = creator.id
      WHERE t.id = ?
    `).get(req.params.id);

    res.json({ message: 'Task status updated successfully.', task: updatedTask });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Delete task
router.delete('/:id', auth, (req, res) => {
  try {
    // Check if task exists
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Check membership
    const membership = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(task.project_id, req.user.id);
    
    if (!membership && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not a member of this project.' });
    }

    // Allow delete if: is project admin, created the task, or system admin
    const canDelete = membership?.role === 'admin' || task.created_by === req.user.id || req.user.role === 'admin';
    
    if (!canDelete) {
      return res.status(403).json({ error: 'You do not have permission to delete this task.' });
    }

    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);

    res.json({ message: 'Task deleted successfully.' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
