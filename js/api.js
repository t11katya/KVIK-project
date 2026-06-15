function getFilteredAndSortedTasks() {
    let allTasks = [];
    projects.forEach(p => {
        p.tasks.forEach(t => {
            allTasks.push({ ...t, projectName: p.name, projectId: p.id, projectBg: p.bgColor });
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

function saveProject() {
    const name = document.getElementById('projectName').value.trim();
    if(!name) return alert('Введите название проекта');

    const editingId = document.getElementById('editingProjectId').value;
    const allMembers = [{ email: currentUser.email, name: currentUser.name }];
    selectedProjectMembers.forEach(m => {
        if (!allMembers.some(ex => ex.email === m.email)) allMembers.push(m);
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
        if (task) Object.assign(task, taskData);
    } else {
        const newTask = { id: Date.now(), ...taskData };
        project.tasks.push(newTask);
    }

    closeModal('taskEditModal');
    if (currentProjectId === projectId) showProjectBoard();
    applyFiltersAndSort();
    updateAnalytics();
}

function changeTaskStatus(taskId, projectId, newStatus) {
    const project = projects.find(p => p.id === projectId);
    const task = project?.tasks.find(t => t.id === taskId);
    if(task) task.status = newStatus;
    closeModal('taskDetailModal');
    if(currentProjectId === projectId) showProjectBoard();
    applyFiltersAndSort();
    updateAnalytics();
}