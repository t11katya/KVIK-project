function updateProjectsList() {
    const container = document.getElementById('projectsList');
    if (projects.length === 0) {
        container.innerHTML = '<div class="empty-state">Нет проектов<br>Создайте первый проект с помощью кнопки выше</div>';
        return;
    }

    container.innerHTML = projects.map(p => {
        const total = p.tasks.length;
        const done = p.tasks.filter(t => t.status === 'done').length;
        const percent = total ? (done/total)*100 : 0;
        const membersCount = p.members ? p.members.length : 1;

        return `
            <div class="project-card" style="background: ${p.bgColor || '#ffffff'};">
                <div style="position: absolute; top: 20px; right: 20px;">
                    <button class="card-menu-btn" onclick="showProjectMenu(event, ${p.id})">⋮</button>
                </div>
                <h3>${escapeHtml(p.name)}</h3>
                <p style="margin-top: 8px;">${escapeHtml(p.description || 'Нет описания')}</p>
                <div>Задачи: ${done} / ${total}</div>
                <div class="progress-bar"><div class="progress-fill" style="width:${percent}%"></div></div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
                    <span style="font-size: 13px; color: #64748b;">👥${membersCount} Участников</span>
                    <button class="btn btn-sm" style="width: auto; margin-top: 0;" onclick="event.stopPropagation(); openProject(${p.id})">Открыть проект</button>
                </div>
            </div>
        `;
    }).join('');
}

function updateAllTasksList() {
    const filteredTasks = getFilteredAndSortedTasks();
    const active = filteredTasks.filter(t => t.status !== 'done');
    const done = filteredTasks.filter(t => t.status === 'done');

    const container = document.getElementById('allTasksContainer');
    if (!container) return;

    function formatDateRu(dateStr) {
        if (!dateStr) return '—';
        if (dateStr.includes('.')) return dateStr;
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return parts[2] + '-' + parts[1] + '-' + parts[0];
        }
        return dateStr;
    }

    function priorityToRussian(priority) {
        const p = String(priority).toLowerCase();
        if (p === 'high') return 'ВЫСОКИЙ';
        if (p === 'medium') return 'СРЕДНИЙ';
        if (p === 'low') return 'НИЗКИЙ';
        return priority;
    }

    container.innerHTML = `
        <h3 style="margin: 20px 0 12px">Активные (${active.length})</h3>
        ${active.map(t => `
            <div class="task-card" style="display:flex; align-items:center; gap:16px; flex-wrap:wrap; justify-content:space-between">
                <input type="checkbox" onchange="changeTaskStatus(${t.id}, ${t.projectId}, 'done')">
                <div style="flex:1"><strong>${escapeHtml(t.name)}</strong> <span class="priority-badge priority-${t.priority}">${priorityToRussian(t.priority)}</span></div>
                <div>${escapeHtml(t.projectName)}</div>
                <div>${escapeHtml(t.assignee)}</div>
                <div>${formatDateRu(t.deadline)}</div>
            </div>
        `).join('') || '<div class="empty-state">Нет активных задач</div>'}
        <h3 style="margin: 30px 0 12px">Выполненные (${done.length})</h3>
        ${done.map(t => `
            <div class="task-card" style="display:flex; align-items:center; gap:16px; opacity:0.7">
                <span>✓</span>
                <div><strong>${escapeHtml(t.name)}</strong> <span class="priority-badge priority-${t.priority}">${priorityToRussian(t.priority)}</span></div>
                <div>${escapeHtml(t.projectName)}</div>
                <div>${escapeHtml(t.assignee)}</div>
            </div>
        `).join('') || '<div class="empty-state">Нет выполненных задач</div>'}
    `;
}

function updateTeamListUI() {
    const container = document.getElementById('teamListContainer');
    if (!container) return;

    if (teamMembers.length === 0) {
        container.innerHTML = '<div class="empty-state">Нет участников команды</div>';
        return;
    }

    container.innerHTML = teamMembers.map(m => `
        <div class="team-member-item">
            <span><strong>${escapeHtml(m.name)}</strong><br>${escapeHtml(m.email)}</span>
            <button class="btn btn-outline btn-sm" onclick="removeFromTeam('${m.email}')">Удалить</button>
        </div>
    `).join('');
}

function updateAnalytics() {
    let todo = 0, progress = 0, done = 0;
    projects.forEach(p => {
        p.tasks.forEach(t => {
            if (t.status === 'todo') todo++;
            else if (t.status === 'progress') progress++;
            else done++;
        });
    });

    if (window.statusChart && typeof window.statusChart.destroy === 'function') {
        window.statusChart.destroy();
    }

    const ctx = document.getElementById('statusChart');
    if (ctx) {
        window.statusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Нужно сделать', 'В процессе', 'Готово'],
                datasets: [{ data: [todo, progress, done], backgroundColor: ['#ef4444', '#f59e0b', '#10b981'] }]
            }
        });
    }

    const progressContainer = document.getElementById('projectsProgress');
    if (progressContainer) {
        progressContainer.innerHTML = projects.map(p => {
            const total = p.tasks.length;
            const comp = p.tasks.filter(t => t.status === 'done').length;
            const perc = total ? (comp / total) * 100 : 0;
            return `<div><strong>${escapeHtml(p.name)}</strong> (${comp}/${total})<div class="progress-bar"><div class="progress-fill" style="width:${perc}%"></div></div></div>`;
        }).join('');
    }

    const rating = {};
    projects.forEach(p => p.tasks.forEach(t => {
        if (t.status === 'done') rating[t.assignee] = (rating[t.assignee] || 0) + 1;
    }));
    const sorted = Object.entries(rating).sort((a, b) => b[1] - a[1]);
    const ratingContainer = document.getElementById('ratingList');
    if (ratingContainer) {
        ratingContainer.innerHTML = sorted.map(([name, count], i) => `<li>${i + 1}. ${name} — ${count} задач</li>`).join('') || '<li>Нет завершённых задач</li>';
    }
}

function getFilteredAndSortedTasks() {
    let allTasks = [];
    projects.forEach(p => {
        p.tasks.forEach(t => {
            allTasks.push({ ...t, projectName: p.name, projectId: p.id });
        });
    });

    const searchTerm = document.getElementById('searchTasksInput')?.value.toLowerCase() || '';
    if (searchTerm) {
        allTasks = allTasks.filter(t =>
            t.name.toLowerCase().includes(searchTerm) ||
            (t.desc && t.desc.toLowerCase().includes(searchTerm))
        );
    }

    if (filters.priority) allTasks = allTasks.filter(t => t.priority === filters.priority);
    if (filters.status) allTasks = allTasks.filter(t => t.status === filters.status);
    if (filters.assignee) allTasks = allTasks.filter(t => t.assignee === filters.assignee);
    if (filters.project) allTasks = allTasks.filter(t => t.projectId === filters.project);

    const priorityWeight = { high: 3, medium: 2, low: 1 };
    allTasks.sort((a, b) => {
        let valA, valB;
        switch(sortBy) {
            case 'deadline':
                valA = a.deadline || '9999-12-31';
                valB = b.deadline || '9999-12-31';
                break;
            case 'priority':
                valA = priorityWeight[a.priority];
                valB = priorityWeight[b.priority];
                break;
            case 'name':
                valA = a.name.toLowerCase();
                valB = b.name.toLowerCase();
                break;
            case 'project':
                valA = a.projectName.toLowerCase();
                valB = b.projectName.toLowerCase();
                break;
            default:
                valA = a.deadline || '9999-12-31';
                valB = b.deadline || '9999-12-31';
        }
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    return allTasks;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}