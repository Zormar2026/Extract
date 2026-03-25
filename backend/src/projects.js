const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const PROJECTS_PATH = path.join(__dirname, '..', 'data', 'projects.json');

function ensureDataDir() {
  const dir = path.dirname(PROJECTS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(PROJECTS_PATH)) fs.writeFileSync(PROJECTS_PATH, '[]', 'utf8');
}

function readProjects() {
  ensureDataDir();
  try { return JSON.parse(fs.readFileSync(PROJECTS_PATH, 'utf8')); } catch (e) { return []; }
}

function writeProjects(items) {
  ensureDataDir();
  fs.writeFileSync(PROJECTS_PATH, JSON.stringify(items, null, 2), 'utf8');
}

function getAll() {
  return readProjects().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getById(id) {
  return readProjects().find(p => p.id === id) || null;
}

function create(extraction) {
  const items = readProjects();
  const intel = extraction.intelligence || {};
  const ts = intel.typeSpecific || {};
  const contentType = intel.contentType || '';

  // Extract tasks based on content type
  let rawTasks = [];

  if (contentType === 'tutorial/how-to' && ts.steps?.length) {
    rawTasks = ts.steps.map(s => ({
      number: s.number, instruction: s.instruction,
      timestamp: s.timestamp || '', command: s.command || null, tip: s.tip || null
    }));
  } else if (contentType === 'business/entrepreneurship' && ts.implementationPlan?.length) {
    rawTasks = ts.implementationPlan.map(s => ({
      number: s.step, instruction: s.action,
      timestamp: s.timeline || '', command: null, tip: null
    }));
  } else if (contentType === 'recipe/cooking' && ts.method?.length) {
    rawTasks = ts.method.map(s => ({
      number: s.step, instruction: s.instruction,
      timestamp: s.time || '', command: null, tip: s.temperature || null
    }));
  } else if (contentType === 'workout/fitness' && ts.exercises?.length) {
    rawTasks = ts.exercises.map((ex, i) => ({
      number: ex.order || i + 1,
      instruction: `${ex.name}: ${ex.sets} sets x ${ex.reps} reps`,
      timestamp: ex.restTime ? `Rest: ${ex.restTime}` : '',
      command: null,
      tip: ex.formCues ? ex.formCues.join(', ') : null
    }));
  } else if (intel.actionItems?.length) {
    rawTasks = intel.actionItems.map((a, i) => ({
      number: i + 1,
      instruction: typeof a === 'string' ? a : a.action || JSON.stringify(a),
      timestamp: '', command: null, tip: null
    }));
  }

  const tasks = rawTasks.map((t, i) => ({
    id: uuidv4(),
    stepNumber: t.number || i + 1,
    instruction: t.instruction || '',
    timestamp: t.timestamp || '',
    command: t.command || null,
    tip: t.tip || null,
    completed: false,
    createdAt: new Date().toISOString()
  }));

  const project = {
    id: uuidv4(),
    url: extraction.source?.url || extraction.url || '',
    title: extraction.source?.title || intel.summary?.slice(0, 80) || 'Untitled Project',
    contentType: intel.contentType || 'unknown',
    status: 'not_started',
    progress: 0,
    estimatedTime: ts.estimatedTime || ts.totalTime || ts.totalDuration || '',
    estimatedCost: ts.estimatedCost || ts.startupCosts || '',
    difficultyLevel: ts.difficultyLevel || ts.difficulty || '',
    tasks,
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  items.push(project);
  writeProjects(items);
  return project;
}

function update(id, updates) {
  const items = readProjects();
  const idx = items.findIndex(p => p.id === id);
  if (idx === -1) return null;

  if (updates.status) items[idx].status = updates.status;
  if (updates.notes !== undefined) items[idx].notes = updates.notes;
  items[idx].updatedAt = new Date().toISOString();

  // Recalculate progress
  const tasks = items[idx].tasks || [];
  items[idx].progress = tasks.length ? Math.round(tasks.filter(t => t.completed).length / tasks.length * 100) : 0;

  writeProjects(items);
  return items[idx];
}

function remove(id) {
  const items = readProjects();
  const idx = items.findIndex(p => p.id === id);
  if (idx === -1) return false;
  items.splice(idx, 1);
  writeProjects(items);
  return true;
}

function toggleTask(projectId, taskId) {
  const items = readProjects();
  const pIdx = items.findIndex(p => p.id === projectId);
  if (pIdx === -1) return null;

  const task = items[pIdx].tasks.find(t => t.id === taskId);
  if (!task) return null;

  task.completed = !task.completed;

  // Recalculate progress
  const tasks = items[pIdx].tasks;
  items[pIdx].progress = tasks.length ? Math.round(tasks.filter(t => t.completed).length / tasks.length * 100) : 0;

  // Auto-update status
  if (items[pIdx].progress === 100) items[pIdx].status = 'done';
  else if (items[pIdx].progress > 0) items[pIdx].status = 'in_progress';
  else items[pIdx].status = 'not_started';

  items[pIdx].updatedAt = new Date().toISOString();
  writeProjects(items);
  return items[pIdx];
}

module.exports = { getAll, getById, create, update, remove, toggleTask };
