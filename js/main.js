//инициализация
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    updateAnalytics();
    updateSortIndicator();

    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.getElementById(`${tabName}Section`).classList.add('active');

            if (tabName === 'analytics') updateAnalytics();
            if (tabName === 'alltasks') applyFiltersAndSort();
            if (tabName === 'projects' && currentProjectId) showProjectBoard();
            if (tabName === 'settings') updateTeamListUI();
        });
    });
});

//аудентификация
function handleLogin() {
    currentUser = {
        name: document.getElementById('regName')?.value || 'Пользователь',
        email: document.getElementById('loginEmail').value
    };
    document.getElementById('userNameDisplay').innerText = currentUser.name;
    document.getElementById('profileName').innerText = currentUser.name;
    document.getElementById('profileEmail').innerText = currentUser.email;
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    updateTeamListUI();
    updateProjectsList();
    updateAllTasksList();
    updateAnalytics();
    updateSortIndicator();
}

function handleRegister() {
    handleLogin();
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
}

function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) location.reload();
}

function editProfile() {
    alert('Редактирование профиля (демо)');
}

function exportReport() {
    const formatSelect = document.getElementById('exportFormatSelect');
    const format = formatSelect.options[formatSelect.selectedIndex]?.text || 'формат';

    const periodSelect = document.getElementById('periodSelect');
    const period = periodSelect.options[periodSelect.selectedIndex]?.text || 'период';

    alert(`Экспорт отчёта в формате ${format} за ${period} (демо-режим)`);
}

//тема и настройки
function initTheme() {
    const themeBtns = document.querySelectorAll('.theme-btn');
    themeBtns.forEach(btn => {
        btn.onclick = () => {
            const theme = btn.dataset.theme;
            if (theme === 'dark') document.body.classList.add('dark');
            else if (theme === 'light') document.body.classList.remove('dark');
            themeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        };
    });

    const toggles = ['emailNotifications', 'deadlineReminders'];
    toggles.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', function() {
            this.classList.toggle('active');
        });
    });
}

//сортировка и фильтры
function updateSortIndicator() {
    const indicator = document.getElementById('sortIndicator');
    if (!indicator) return;
    const sortNames = {
        deadline: 'дедлайн',
        priority: 'приоритет',
        name: 'название',
        project: 'проект'
    };
    indicator.textContent = `(${sortNames[sortBy]} ${sortOrder === 'asc' ? '↑' : '↓'})`;
}

function applyFiltersAndSort() {
    renderActiveFilters();
    updateAllTasksList();
}

function renderActiveFilters() {
    const container = document.getElementById('activeFilters');
    if (!container) return;

    const activeFiltersList = [];

    if (filters.priority) {
        const priorityNames = { high: 'Высокий', medium: 'Средний', low: 'Низкий' };
        activeFiltersList.push({ label: `Приоритет: ${priorityNames[filters.priority]}`, clear: () => { filters.priority = null; applyFiltersAndSort(); } });
    }
    if (filters.status) {
        const statusNames = { todo: 'Нужно сделать', progress: 'В процессе', done: 'Готово' };
        activeFiltersList.push({ label: `Статус: ${statusNames[filters.status]}`, clear: () => { filters.status = null; applyFiltersAndSort(); } });
    }
    if (filters.assignee) {
        activeFiltersList.push({ label: `Исполнитель: ${filters.assignee}`, clear: () => { filters.assignee = null; applyFiltersAndSort(); } });
    }
    if (filters.project) {
        const project = projects.find(p => p.id === filters.project);
        if (project) {
            activeFiltersList.push({ label: `Проект: ${project.name}`, clear: () => { filters.project = null; applyFiltersAndSort(); } });
        }
    }

    if (activeFiltersList.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = activeFiltersList.map(f => `
        <span class="filter-badge">
            ${f.label}
            <span class="filter-badge-remove" onclick="(function(){ ${f.clear.toString()} })()">✕</span>
        </span>
    `).join('');
}

function clearAllFilters() {
    filters = { priority: null, status: null, assignee: null, project: null };
    sortBy = 'deadline';
    sortOrder = 'asc';
    document.getElementById('searchTasksInput').value = '';
    updateSortIndicator();
    applyFiltersAndSort();
}

//меню
document.addEventListener('click', function(e) {
    if (!e.target.closest('.menu-container')) {
        if (openMenuId) {
            const menu = document.getElementById(openMenuId);
            if (menu) menu.remove();
            openMenuId = null;
        }
    }
});

function showMenu(menuId, event, items) {
    event.stopPropagation();

    if (openMenuId) {
        const oldMenu = document.getElementById(openMenuId);
        if (oldMenu) oldMenu.remove();
        if (openMenuId === menuId) {
            openMenuId = null;
            return;
        }
    }

    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();

    const existingMenu = document.getElementById(menuId);
    if (existingMenu) existingMenu.remove();

    const menu = document.createElement('div');
    menu.id = menuId;
    menu.className = 'dropdown-menu';
    menu.style.position = 'fixed';
    menu.style.top = (rect.bottom + window.scrollY) + 'px';
    menu.style.right = (window.innerWidth - rect.right) + 'px';

    items.forEach(item => {
        const btn = document.createElement('button');
        btn.textContent = item.label;
        btn.onclick = (e) => {
            e.stopPropagation();
            item.action();
            menu.remove();
            openMenuId = null;
        };
        menu.appendChild(btn);
    });

    document.body.appendChild(menu);
    openMenuId = menuId;
}

function showFilterMenu(event) {
    const items = [
        { label: 'Все приоритеты', action: () => { filters.priority = null; applyFiltersAndSort(); } },
        { label: 'Высокий приоритет', action: () => { filters.priority = 'high'; applyFiltersAndSort(); } },
        { label: 'Средний приоритет', action: () => { filters.priority = 'medium'; applyFiltersAndSort(); } },
        { label: 'Низкий приоритет', action: () => { filters.priority = 'low'; applyFiltersAndSort(); } },
        { label: '—', action: () => {} },
        { label: 'Все статусы', action: () => { filters.status = null; applyFiltersAndSort(); } },
        { label: 'Нужно сделать', action: () => { filters.status = 'todo'; applyFiltersAndSort(); } },
        { label: 'В процессе', action: () => { filters.status = 'progress'; applyFiltersAndSort(); } },
        { label: 'Готово', action: () => { filters.status = 'done'; applyFiltersAndSort(); } },
        { label: '—', action: () => {} },
        { label: 'Все проекты', action: () => { filters.project = null; applyFiltersAndSort(); } },
        { label: 'Веб-сайт КВИК', action: () => { filters.project = 1; applyFiltersAndSort(); } },
        { label: 'Мобильное приложение', action: () => { filters.project = 2; applyFiltersAndSort(); } }
    ];
    showMenu('filter-menu-' + Date.now(), event, items);
}

function showSortMenu(event) {
    const items = [
        { label: 'По дедлайну (раньше → позже)', action: () => { sortBy = 'deadline'; sortOrder = 'asc'; applyFiltersAndSort(); } },
        { label: 'По дедлайну (позже → раньше)', action: () => { sortBy = 'deadline'; sortOrder = 'desc'; applyFiltersAndSort(); } },
        { label: 'По приоритету (высокий → низкий)', action: () => { sortBy = 'priority'; sortOrder = 'desc'; applyFiltersAndSort(); } },
        { label: 'По приоритету (низкий → высокий)', action: () => { sortBy = 'priority'; sortOrder = 'asc'; applyFiltersAndSort(); } },
        { label: 'По названию (А → Я)', action: () => { sortBy = 'name'; sortOrder = 'asc'; applyFiltersAndSort(); } },
        { label: 'По названию (Я → А)', action: () => { sortBy = 'name'; sortOrder = 'desc'; applyFiltersAndSort(); } }
    ];
    showMenu('sort-menu-' + Date.now(), event, items);
}

function showProjectMenu(event, projectId) {
    event.stopPropagation();
    showMenu('project-menu-' + Date.now(), event, [
        { label: 'Редактировать', action: () => editProject(projectId) },
        { label: 'Удалить', action: () => deleteProject(projectId) }
    ]);
}

function showTaskMenu(event, taskId, projectId) {
    event.stopPropagation();
    showMenu('task-menu-' + Date.now(), event, [
        { label: 'Редактировать', action: () => editTask(taskId, projectId) },
        { label: 'Удалить', action: () => deleteTask(taskId, projectId) }
    ]);
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

//проекты
function openProject(projectId) {
    currentProjectId = projectId;
    document.getElementById('backToProjectsBtn').style.display = 'block';
    const projectsHeader = document.getElementById('projectsHeader');
    if (projectsHeader) projectsHeader.classList.add('hidden');
    updateTaskAssigneeSelect();
    showProjectBoard();
}

function goToProjects() {
    currentProjectId = null;
    document.getElementById('backToProjectsBtn').style.display = 'none';
    const projectsHeader = document.getElementById('projectsHeader');
    if (projectsHeader) projectsHeader.classList.remove('hidden');
    updateProjectsList();
}

function showProjectBoard() {
    const project = projects.find(p => p.id === currentProjectId);
    if (!project) return;

    const columns = { todo: [], progress: [], done: [] };
    project.tasks.forEach(t => columns[t.status].push(t));

    const boardHtml = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
            <div>
                <h2 style="font-size: 28px; margin: 0;">${escapeHtml(project.name)}</h2>
                <p style="margin-top: 8px; color: #64748b;">${escapeHtml(project.description || 'Нет описания')}</p>
            </div>
            <button class="btn" onclick="openCreateTaskModal()" style="white-space: nowrap;">+ Новая задача</button>
        </div>
        <div class="board">
            ${renderColumn('Нужно сделать', columns.todo, project.id)}
            ${renderColumn('В процессе', columns.progress, project.id)}
            ${renderColumn('Готово', columns.done, project.id)}
        </div>
    `;
document.getElementById('projectsList').style.setProperty('--project-bg', project.bgColor || '#ffffff');
    document.getElementById('projectsList').innerHTML = boardHtml;
}

function renderColumn(title, tasks, projectId) {
    function formatDateForColumn(dateStr) {
        if (!dateStr) return '—';
        if (dateStr.includes('.')) return dateStr;
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return parts[2] + '-' + parts[1] + '-' + parts[0];
        }
        return dateStr;
    }

    return `
        <div class="column">
            <div class="column-header"><span>${title}</span><span>${tasks.length}</span></div>
            ${tasks.map(t => {
                return `
                    <div class="task-card" onclick="showTaskDetail(${t.id}, ${projectId})">
                        <div style="position: absolute; top: 12px; right: 12px;">
                            <button class="card-menu-btn" style="font-size: 16px;" onclick="event.stopPropagation(); showTaskMenu(event, ${t.id}, ${projectId})">⋮</button>
                        </div>
                        <div class="flex-between"><strong>${escapeHtml(t.name)}</strong><span class="priority-badge priority-${t.priority}">${t.priority === 'high' ? 'Высокий' : t.priority === 'medium' ? 'Средний' : 'Низкий'}</span></div>
                        <div style="font-size:13px; margin:8px 0">${escapeHtml(t.desc.substring(0,45))}${t.desc.length > 45 ? '...' : ''}</div>
                        <div style="display:flex; justify-content:space-between; font-size:12px;"><span>👤 ${escapeHtml(t.assignee)}</span><span>${formatDateForColumn(t.deadline)}</span></div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function editProject(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (project) {
        openProjectModal(project);
    }
}

function deleteProject(projectId) {
    showConfirmDialog('Удаление проекта', 'Вы уверены, что хотите удалить этот проект?', () => {
        projects = projects.filter(p => p.id !== projectId);
        if (currentProjectId === projectId) {
            goToProjects();
        }
        updateProjectsList();
        applyFiltersAndSort();
        updateAnalytics();
    });
}

function openCreateTaskModal() {
    if (!currentProjectId) return;
    const project = projects.find(p => p.id === currentProjectId);

    const assigneeSelect = document.getElementById('taskEditAssignee');
    assigneeSelect.innerHTML = '';
    if (project.members) {
        project.members.forEach(m => {
            const option = document.createElement('option');
            option.value = m.name;
            option.textContent = m.name;
            assigneeSelect.appendChild(option);
        });
    }

    document.getElementById('editingTaskId').value = '';
    document.getElementById('editingTaskProjectId').value = currentProjectId;
    document.getElementById('taskEditName').value = '';
    document.getElementById('taskEditDesc').value = '';
    document.getElementById('taskEditPriority').value = 'medium';
    document.getElementById('taskEditDeadline').value = '';
    document.getElementById('taskEditStatus').value = 'todo';
    document.getElementById('taskModalTitle').innerText = 'Новая задача';
    document.getElementById('taskEditModal').style.display = 'flex';
}

function editTask(taskId, projectId) {
    const project = projects.find(p => p.id === projectId);
    const task = project?.tasks.find(t => t.id === taskId);
    if (!task) return;

    document.getElementById('editingTaskId').value = taskId;
    document.getElementById('editingTaskProjectId').value = projectId;
    document.getElementById('taskEditName').value = task.name;
    document.getElementById('taskEditDesc').value = task.desc || '';
    document.getElementById('taskEditPriority').value = task.priority;
    document.getElementById('taskEditDeadline').value = task.deadline || '';
    document.getElementById('taskEditStatus').value = task.status;

    const assigneeSelect = document.getElementById('taskEditAssignee');
    assigneeSelect.innerHTML = '';
    if (project.members) {
        project.members.forEach(m => {
            const option = document.createElement('option');
            option.value = m.name;
            option.textContent = m.name;
            if (task.assignee === m.name) option.selected = true;
            assigneeSelect.appendChild(option);
        });
    }

    document.getElementById('taskModalTitle').innerText = 'Редактирование задачи';
    document.getElementById('taskEditModal').style.display = 'flex';
}

function deleteTask(taskId, projectId) {
    showConfirmDialog('Удаление задачи', 'Вы уверены, что хотите удалить эту задачу?', () => {
        const project = projects.find(p => p.id === projectId);
        if (project) {
            project.tasks = project.tasks.filter(t => t.id !== taskId);
        }
        if (currentProjectId === projectId) {
            showProjectBoard();
        }
        applyFiltersAndSort();
        updateAnalytics();
    });
}

function saveTask() {
    const taskId = document.getElementById('editingTaskId').value;
    const projectId = parseInt(document.getElementById('editingTaskProjectId').value);
    const project = projects.find(p => p.id === projectId);

    const taskData = {
        name: document.getElementById('taskEditName').value,
        desc: document.getElementById('taskEditDesc').value,
        priority: document.getElementById('taskEditPriority').value,
        assignee: document.getElementById('taskEditAssignee').value,
        deadline: document.getElementById('taskEditDeadline').value,
        status: document.getElementById('taskEditStatus').value
    };

    if (!taskData.name) return alert('Укажите название задачи');

    if (taskId) {
        const task = project.tasks.find(t => t.id == taskId);
        if (task) {
            Object.assign(task, taskData);
        }
    } else {
        const newTask = {
            id: Date.now(),
            ...taskData
        };
        project.tasks.push(newTask);
    }

    closeModal('taskEditModal');
    if (currentProjectId === projectId) {
        showProjectBoard();
    }
    applyFiltersAndSort();
    updateAnalytics();
}

function changeTaskStatus(taskId, projectId, newStatus) {
    const project = projects.find(p => p.id === projectId);
    const task = project?.tasks.find(t => t.id === taskId);
    if (task) {
        task.status = newStatus;
    }
    closeModal('taskDetailModal');
    if (currentProjectId === projectId) showProjectBoard();
    applyFiltersAndSort();
    updateAnalytics();
}

function showTaskDetail(taskId, projectId) {
    const project = projects.find(p => p.id === projectId);
    const task = project?.tasks.find(t => t.id === taskId);
    if (!task) return;

    const projectBgColor = project.bgColor || '#ffffff';

    let statusText = { todo: 'Нужно сделать', progress: 'В процессе', done: 'Готово' }[task.status];
    let actionButton = '';
    if (task.status === 'todo') actionButton = `<button class="btn" onclick="changeTaskStatus(${task.id}, ${projectId}, 'progress')">Взять в работу</button>`;
    else if (task.status === 'progress') actionButton = `<button class="btn" onclick="changeTaskStatus(${task.id}, ${projectId}, 'done')">Завершить</button>`;
    else actionButton = `<button class="btn" onclick="changeTaskStatus(${task.id}, ${projectId}, 'todo')">Вернуть в работу</button>`;

    document.getElementById('taskDetailContent').innerHTML = `
        <div style="background: ${projectBgColor}; border-radius: 32px; padding: 32px;">
            <h2>${escapeHtml(task.name)}</h2>
            <div style="margin:12px 0"><span class="priority-badge priority-${task.priority}">${getPriorityText(task.priority)}</span></div>
            <p><strong>Описание:</strong> ${escapeHtml(task.desc || 'Нет')}</p>
            <p><strong>Исполнитель:</strong> ${escapeHtml(task.assignee)}</p>
            <p><strong>Статус:</strong> ${statusText}</p>
            <p><strong>Дедлайн:</strong> ${formatDateForModal(task.deadline)}</p>
            <div style="margin-top:24px; display:flex; gap:12px; flex-wrap:wrap;">
                ${actionButton}
                <button class="btn btn-outline" onclick="editTask(${task.id}, ${projectId}); closeModal('taskDetailModal');">Редактировать</button>
                <button class="btn btn-outline btn-danger" onclick="deleteTask(${task.id}, ${projectId}); closeModal('taskDetailModal');">Удалить</button>
            </div>
            <button class="btn link-btn" style="margin-top:16px" onclick="closeModal('taskDetailModal')">Закрыть</button>
        </div>
    `;
    document.getElementById('taskDetailModal').style.display = 'flex';
}

function updateTaskAssigneeSelect() {
    const select = document.getElementById('taskEditAssignee');
    if (!select) return;

    let allAssignees = [{ email: currentUser?.email, name: currentUser?.name || 'Пользователь' }];

    if (currentProjectId) {
        const project = projects.find(p => p.id === currentProjectId);
        if (project && project.members) {
            project.members.forEach(m => {
                if (m.email !== currentUser?.email) {
                    allAssignees.push(m);
                }
            });
        }
    }

    select.innerHTML = allAssignees.map(a => `<option value="${a.name || a.email}">${escapeHtml(a.name || a.email)}</option>`).join('');
}

function openProjectModal(projectToEdit = null) {
    selectedProjectMembers = [];

    if (projectToEdit) {
        document.getElementById('projectModalTitle').innerText = 'Редактирование проекта';
        document.getElementById('editingProjectId').value = projectToEdit.id;
        document.getElementById('projectName').value = projectToEdit.name;
        document.getElementById('projectDesc').value = projectToEdit.description || '';

        const bgOptions = document.querySelectorAll('.bg-option');
        bgOptions.forEach(opt => {
            if (opt.getAttribute('data-bg') === projectToEdit.bgColor) {
                opt.classList.add('selected');
                selectedBgColor = projectToEdit.bgColor;
            } else {
                opt.classList.remove('selected');
            }
        });

        if (projectToEdit.members) {
            projectToEdit.members.forEach(m => {
                if (m.email !== currentUser?.email) {
                    selectedProjectMembers.push(m);
                }
            });
        }
    } else {
        document.getElementById('projectModalTitle').innerText = 'Создание проекта';
        document.getElementById('editingProjectId').value = '';
        document.getElementById('projectName').value = '';
        document.getElementById('projectDesc').value = '';
        initBgPicker();
    }

    updateTeamMembersForProject();
    document.getElementById('projectModal').style.display = 'flex';
}

function saveProject() {
    const name = document.getElementById('projectName').value.trim();
    if (!name) return alert('Введите название проекта');

    const editingId = document.getElementById('editingProjectId').value;
    const allMembers = [{ email: currentUser.email, name: currentUser.name }];
    selectedProjectMembers.forEach(m => {
        if (!allMembers.some(ex => ex.email === m.email)) {
            allMembers.push(m);
        }
    });

    if (editingId) {
        const index = projects.findIndex(p => p.id == editingId);
        if (index !== -1) {
            projects[index] = {
                ...projects[index],
                name: name,
                description: document.getElementById('projectDesc').value,
                bgColor: selectedBgColor,
                members: allMembers
            };
        }
    } else {
        const newProject = {
            id: Date.now(),
            name: name,
            description: document.getElementById('projectDesc').value,
            bgColor: selectedBgColor,
            members: allMembers,
            tasks: []
        };
        projects.push(newProject);
    }

    closeModal('projectModal');
    updateProjectsList();
    updateAnalytics();
    updateTaskAssigneeSelect();
    applyFiltersAndSort();
}

function initBgPicker() {
    document.querySelectorAll('.bg-option').forEach(opt => {
        opt.removeEventListener('click', bgPickerClick);
        opt.addEventListener('click', bgPickerClick);
    });
    const first = document.querySelector('.bg-option');
    if (first && !document.querySelector('.bg-option.selected')) {
        first.classList.add('selected');
        selectedBgColor = first.getAttribute('data-bg');
    }
}

function bgPickerClick(e) {
    document.querySelectorAll('.bg-option').forEach(o => o.classList.remove('selected'));
    this.classList.add('selected');
    selectedBgColor = this.getAttribute('data-bg');
}

function updateTeamMembersForProject() {
    const container = document.getElementById('teamMembersForProject');
    if (!container) return;

    const availableMembers = teamMembers.filter(m => m.email !== currentUser?.email);

    if (availableMembers.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px;">Нет доступных участников</div>';
        return;
    }

    container.innerHTML = availableMembers.map(m => `
        <div class="team-member-item">
            <input type="checkbox" class="member-checkbox" value="${m.email}"
                ${selectedProjectMembers.some(sm => sm.email === m.email) ? 'checked' : ''}
                onchange="toggleProjectMember('${m.email}', this.checked)">
            <span class="member-email"><strong>${escapeHtml(m.name || m.email)}</strong><br><span style="font-size:12px;">${escapeHtml(m.email)}</span></span>
        </div>
    `).join('');
}

function toggleProjectMember(email, isChecked) {
    if (isChecked) {
        if (!selectedProjectMembers.some(m => m.email === email)) {
            const member = teamMembers.find(m => m.email === email);
            selectedProjectMembers.push({ email: email, name: member?.name || email.split('@')[0] });
        }
    } else {
        selectedProjectMembers = selectedProjectMembers.filter(m => m.email !== email);
    }
}

function inviteToTeam() {
    const email = document.getElementById('inviteEmail').value.trim();
    if (!email) {
        alert('Введите email для приглашения');
        return;
    }
    if (!email.includes('@')) {
        alert('Введите корректный email');
        return;
    }
    if (teamMembers.some(m => m.email === email)) {
        alert('Этот пользователь уже в команде');
        return;
    }
    if (email === currentUser?.email) {
        alert('Нельзя пригласить самого себя');
        return;
    }

    teamMembers.push({
        email: email,
        name: email.split('@')[0],
        invitedBy: currentUser.email,
        status: 'active'
    });

    document.getElementById('inviteEmail').value = '';
    updateTeamListUI();
    alert(`Приглашение отправлено на ${email}`);
}

function removeFromTeam(email) {
    showConfirmDialog('Удаление участника', `Удалить ${email} из команды?`, () => {
        teamMembers = teamMembers.filter(m => m.email !== email);
        updateTeamListUI();
        updateTeamMembersForProject();
        applyFiltersAndSort();
    });
}

function showConfirmDialog(title, message, callback) {
    document.getElementById('confirmTitle').innerText = title;
    document.getElementById('confirmMessage').innerHTML = message;
    pendingDeleteCallback = callback;
    document.getElementById('confirmModal').style.display = 'flex';
}

function confirmAction(confirmed) {
    closeModal('confirmModal');
    if (confirmed && pendingDeleteCallback) {
        pendingDeleteCallback();
        pendingDeleteCallback = null;
    }
}

document.getElementById('exportFormatSelect')?.addEventListener('change', function() {
    const period = document.getElementById('periodSelect').value;
    if (period && period !== 'Период' && this.value !== 'Экспорт отчёта') {
        exportReport();
    }
});