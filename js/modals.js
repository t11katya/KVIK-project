function closeModal(id) {
    document.getElementById(id).style.display = 'none';
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

function openProjectModal(projectToEdit = null) {
    selectedProjectMembers = [];
    if (projectToEdit) {
        document.getElementById('projectModalTitle').innerText = 'Редактирование проекта';
        document.getElementById('editingProjectId').value = projectToEdit.id;
        document.getElementById('projectName').value = projectToEdit.name;
        document.getElementById('projectDesc').value = projectToEdit.description || '';
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