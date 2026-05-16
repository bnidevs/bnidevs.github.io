// ── State ──────────────────────────────────────────────
const STORAGE_KEY = 'kanban_data';

const DEFAULT_COLUMNS = [
  { id: uid(), title: 'Backlog', tasks: [] },
  { id: uid(), title: 'To Do', tasks: [] },
  { id: uid(), title: 'In Progress', tasks: [] },
  { id: uid(), title: 'Review', tasks: [] },
  { id: uid(), title: 'Done', tasks: [] },
];

let state = load();

// ── Persistence ───────────────────────────────────────
function uid() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10);
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch { /* corrupt data, reset */ }
  return structuredClone(DEFAULT_COLUMNS);
}

// ── DOM refs ──────────────────────────────────────────
const board = document.getElementById('board');
const addColumnBtn = document.getElementById('addColumnBtn');
const modalOverlay = document.getElementById('taskModal');
const modalTitle = document.getElementById('modalTitle');
const modalClose = document.getElementById('modalClose');
const modalCancel = document.getElementById('modalCancel');
const modalSave = document.getElementById('modalSave');
const taskTitleInput = document.getElementById('taskTitleInput');
const taskDescInput = document.getElementById('taskDescInput');
const taskPointsInput = document.getElementById('taskPointsInput');


// ── Modal state ───────────────────────────────────────
let modalMode = 'create'; // 'create' | 'edit'
let modalColumnId = null;
let modalTaskId = null;

// ── Render ────────────────────────────────────────────
function render() {
  board.innerHTML = '';
  state.forEach(col => board.appendChild(createColumnEl(col)));
  save();
}

function createColumnEl(col) {
  const el = document.createElement('div');
  el.className = 'column';
  el.dataset.colId = col.id;

  const totalPts = col.tasks.reduce((s, t) => s + (t.points || 0), 0);

  el.innerHTML = `
    <div class="column-header">
      <input class="column-title" value="${escHtml(col.title)}" spellcheck="false" />
      <span class="column-stats">${col.tasks.length} · ${totalPts}pt</span>
      <div class="column-actions">
        <button class="col-action-btn delete" title="Delete column">✕</button>
      </div>
    </div>
    <div class="column-body" data-col-id="${col.id}"></div>
    <div style="padding: 0 12px 12px;">
      <button class="btn-add-task">+ Add task</button>
    </div>
  `;

  // Column title rename
  const titleInput = el.querySelector('.column-title');
  titleInput.addEventListener('blur', () => {
    const newTitle = titleInput.value.trim();
    if (newTitle && newTitle !== col.title) {
      col.title = newTitle;
      save();
      updateColumnStats(el, col);
    } else {
      titleInput.value = col.title;
    }
  });
  titleInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') titleInput.blur();
    if (e.key === 'Escape') { titleInput.value = col.title; titleInput.blur(); }
  });

  // Delete column
  el.querySelector('.col-action-btn.delete').addEventListener('click', () => {
    if (col.tasks.length > 0) {
      if (!confirm(`Delete "${col.title}" and its ${col.tasks.length} task(s)?`)) return;
    }
    state = state.filter(c => c.id !== col.id);
    render();
  });

  // Add task
  el.querySelector('.btn-add-task').addEventListener('click', () => {
    openModal('create', col.id);
  });

  // Render tasks
  const body = el.querySelector('.column-body');
  col.tasks.forEach(task => body.appendChild(createTaskEl(task, col.id)));

  // Drop zone events
  setupDropZone(body, col.id);

  return el;
}

function createTaskEl(task, colId) {
  const el = document.createElement('div');
  el.className = 'task-card';
  el.draggable = true;
  el.dataset.taskId = task.id;
  el.dataset.colId = colId;

  const pointsClass = task.points === 0 ? 'task-points zero' : 'task-points';
  const descHtml = task.desc ? `<div class="task-card-desc">${escHtml(task.desc)}</div>` : '';

  el.innerHTML = `
    <div class="task-card-title">${escHtml(task.title)}</div>
    ${descHtml}
    <div class="task-card-footer">
      <span class="${pointsClass}">${task.points}pt</span>
      <div class="task-card-actions">
        <button class="task-action-btn edit" title="Edit">✎</button>
        <button class="task-action-btn delete" title="Delete">✕</button>
      </div>
    </div>
  `;

  // Drag
  el.addEventListener('dragstart', e => {
    el.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ taskId: task.id, fromColId: colId }));
  });
  el.addEventListener('dragend', () => el.classList.remove('dragging'));

  // Edit
  el.querySelector('.task-action-btn.edit').addEventListener('click', e => {
    e.stopPropagation();
    openModal('edit', colId, task.id);
  });

  // Delete
  el.querySelector('.task-action-btn.delete').addEventListener('click', e => {
    e.stopPropagation();
    const col = state.find(c => c.id === colId);
    if (col) {
      col.tasks = col.tasks.filter(t => t.id !== task.id);
      render();
    }
  });

  return el;
}

function updateColumnStats(colEl, col) {
  const totalPts = col.tasks.reduce((s, t) => s + (t.points || 0), 0);
  const stats = colEl.querySelector('.column-stats');
  if (stats) stats.textContent = `${col.tasks.length} · ${totalPts}pt`;
}

// ── Drag & Drop ───────────────────────────────────────
let placeholder = null;

function setupDropZone(body, colId) {
  body.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const column = body.closest('.column');
    column.classList.add('drag-over');

    const afterEl = getDragAfterElement(body, e.clientY);
    if (!placeholder) {
      placeholder = document.createElement('div');
      placeholder.className = 'drop-placeholder';
    }
    if (afterEl) {
      body.insertBefore(placeholder, afterEl);
    } else {
      body.appendChild(placeholder);
    }
  });

  body.addEventListener('dragleave', e => {
    // Only remove if actually leaving the body
    if (!body.contains(e.relatedTarget)) {
      body.closest('.column').classList.remove('drag-over');
      if (placeholder && placeholder.parentNode === body) {
        body.removeChild(placeholder);
      }
    }
  });

  body.addEventListener('drop', e => {
    e.preventDefault();
    body.closest('.column').classList.remove('drag-over');
    if (placeholder && placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
    placeholder = null;

    let data;
    try { data = JSON.parse(e.dataTransfer.getData('text/plain')); } catch { return; }

    const { taskId, fromColId } = data;
    const fromCol = state.find(c => c.id === fromColId);
    const toCol = state.find(c => c.id === colId);
    if (!fromCol || !toCol) return;

    const taskIdx = fromCol.tasks.findIndex(t => t.id === taskId);
    if (taskIdx === -1) return;

    const [task] = fromCol.tasks.splice(taskIdx, 1);

    // Figure out insert position
    const afterEl = getDragAfterElement(body, e.clientY);
    if (afterEl) {
      const afterTaskId = afterEl.dataset.taskId;
      const insertIdx = toCol.tasks.findIndex(t => t.id === afterTaskId);
      toCol.tasks.splice(insertIdx, 0, task);
    } else {
      toCol.tasks.push(task);
    }

    render();
  });
}

function getDragAfterElement(body, y) {
  const cards = [...body.querySelectorAll('.task-card:not(.dragging)')];
  let closest = null;
  let closestOffset = Number.NEGATIVE_INFINITY;

  cards.forEach(card => {
    const box = card.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closestOffset) {
      closestOffset = offset;
      closest = card;
    }
  });
  return closest;
}

// ── Modal ─────────────────────────────────────────────
function openModal(mode, colId, taskId = null) {
  modalMode = mode;
  modalColumnId = colId;
  modalTaskId = taskId;

  if (mode === 'edit') {
    const col = state.find(c => c.id === colId);
    const task = col?.tasks.find(t => t.id === taskId);
    if (!task) return;
    modalTitle.textContent = 'Edit Task';
    taskTitleInput.value = task.title;
    taskDescInput.value = task.desc || '';
    taskPointsInput.value = task.points;
  } else {
    modalTitle.textContent = 'New Task';
    taskTitleInput.value = '';
    taskDescInput.value = '';
    taskPointsInput.value = '0';
  }

  modalOverlay.classList.add('active');
  setTimeout(() => taskTitleInput.focus(), 50);
}

function closeModal() {
  modalOverlay.classList.remove('active');
}

modalClose.addEventListener('click', closeModal);
modalCancel.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) closeModal();
});

modalSave.addEventListener('click', () => {
  const title = taskTitleInput.value.trim();
  if (!title) {
    taskTitleInput.focus();
    return;
  }

  const col = state.find(c => c.id === modalColumnId);
  if (!col) return;

  if (modalMode === 'edit') {
    const task = col.tasks.find(t => t.id === modalTaskId);
    if (task) {
      task.title = title;
      task.desc = taskDescInput.value.trim();
      task.points = parseInt(taskPointsInput.value, 10) || 0;
    }
  } else {
    col.tasks.push({
      id: uid(),
      title,
      desc: taskDescInput.value.trim(),
      points: parseInt(taskPointsInput.value, 10) || 0,
    });
  }

  closeModal();
  render();
});

// Keyboard shortcut
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
    closeModal();
  }
});

// ── Add Column ────────────────────────────────────────
addColumnBtn.addEventListener('click', () => {
  state.push({ id: uid(), title: 'New Column', tasks: [] });
  render();
  // Focus the new column's title for immediate rename
  const cols = board.querySelectorAll('.column');
  const last = cols[cols.length - 1];
  if (last) {
    const input = last.querySelector('.column-title');
    input.select();
    input.focus();
    last.scrollIntoView({ behavior: 'smooth', inline: 'end' });
  }
});

// ── Helpers ───────────────────────────────────────────
function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ── Init ──────────────────────────────────────────────
render();
