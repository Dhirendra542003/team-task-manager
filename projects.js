const express = require('express');
const db = require('../database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all projects for current user
router.get('/', auth, (req, res) => {
  try {
    let projects;
    
    if (req.user.role === 'admin') {
      // Admin sees all projects
      projects = db.prepare(`
        SELECT p.*, u.username as owner_name,
          (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
          (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count
        FROM projects p
        JOIN users u ON p.owner_id = u.id
        ORDER BY p.created_at DESC
      `).all();
    } else {
      // Members see projects they belong to
      projects = db.prepare(`
        SELECT p.*, u.username as owner_name,
          (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
          (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count
        FROM projects p
        JOIN users u ON p.owner_id = u.id
        JOIN project_members pm ON p.id = pm.project_id
        WHERE pm.user_id = ?
        ORDER BY p.created_at DESC
      `).all(req.user.id);
    }

    res.json({ projects });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Create new project
router.post('/', auth, (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required.' });
    }

    // Insert project
    const result = db.prepare('INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)').run(name, description || '', req.user.id);

    // Add owner as admin member
    db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(result.lastInsertRowid, req.user.id, 'admin');

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ message: 'Project created successfully.', project });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get single project
router.get('/:id', auth, (req, res) => {
  try {
    const project = db.prepare(`
      SELECT p.*, u.username as owner_name
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      WHERE p.id = ?
    `).get(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Check membership
    const membership = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.id, req.user.id);
    
    if (!membership && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not a member of this project.' });
    }

    res.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Update project
router.put('/:id', auth, (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if project exists
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Check if user is admin of project or system admin
    const member = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.id, req.user.id);
    
    if ((!member || member.role !== 'admin') && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only project admins can update the project.' });
    }

    db.prepare('UPDATE projects SET name = ?, description = ? WHERE id = ?').run(name || project.name, description || project.description, req.params.id);

    const updatedProject = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);

    res.json({ message: 'Project updated successfully.', project: updatedProject });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Delete project
router.delete('/:id', auth, (req, res) => {
  try {
    // Check if project exists
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Check if user is owner or system admin
    if (project.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only project owner can delete the project.' });
    }

    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);

    res.json({ message: 'Project deleted successfully.' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get project members
router.get('/:id/members', auth, (req, res) => {
  try {
    // Check membership
    const membership = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.id, req.user.id);
    
    if (!membership && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not a member of this project.' });
    }

    const members = db.prepare(`
      SELECT u.id, u.username, u.email, pm.role, pm.joined_at
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
      ORDER BY pm.joined_at ASC
    `).all(req.params.id);

    res.json({ members });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Add member to project
router.post('/:id/members', auth, (req, res) => {
  try {
    const { userId, role = 'member' } = req.body;

    // Check if project exists
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Check if user is admin of project or system admin
    const member = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.id, req.user.id);
    
    if ((!member || member.role !== 'admin') && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only project admins can add members.' });
    }

    // Check if user exists
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Check if already a member
    const existingMember = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.id, userId);
    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member of this project.' });
    }

    db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(req.params.id, userId, role);

    res.status(201).json({ message: 'Member added successfully.' });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Remove member from project
router.delete('/:id/members/:userId', auth, (req, res) => {
  try {
    // Check if project exists
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Check if user is admin of project or system admin
    const member = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.id, req.user.id);
    
    if ((!member || member.role !== 'admin') && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only project admins can remove members.' });
    }

    // Check if member exists
    const projectMember = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.id, req.params.userId);
    if (!projectMember) {
      return res.status(404).json({ error: 'Member not found in this project.' });
    }

    // Can't remove owner
    if (project.owner_id === parseInt(req.params.userId)) {
      return res.status(400).json({ error: 'Cannot remove project owner.' });
    }

    db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?').run(req.params.id, req.params.userId);

    res.json({ message: 'Member removed successfully.' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
