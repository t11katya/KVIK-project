let currentUser = null;
let teamMembers = [
    { email: "anna@example.com", name: "Анна", invitedBy: "demo@kvik.ru", status: "active" },
    { email: "ivan@example.com", name: "Иван", invitedBy: "demo@kvik.ru", status: "active" }
];

let projects = [
    {
        id: 1,
        name: "Веб-сайт КВИК",
        description: "Разработка основного сайта компании",
        bgColor: "#e0f2fe",
        members: [{email: "demo@kvik.ru", name: "Пользователь"}],
        tasks: [
            { id: 1, name: "Дизайн главной страницы", desc: "Создать современный макет", priority: "high", status: "todo", assignee: "Пользователь", deadline: "2025-01-20" },
            { id: 2, name: "Адаптивная вёрстка", desc: "Под мобильные устройства", priority: "medium", status: "progress", assignee: "Анна", deadline: "2025-01-25" },
            { id: 3, name: "Тестирование", desc: "Провести интеграционное тестирование", priority: "low", status: "done", assignee: "Иван", deadline: "2025-01-30" }
        ]
    },
    {
        id: 2,
        name: "Мобильное приложение",
        description: "демо версия",
        bgColor: "#dcfce7",
        members: [{email: "demo@kvik.ru", name: "Пользователь"}],
        tasks: [
            { id: 4, name: "Настройка навигации", desc: "Настроить роутинг и экраны", priority: "high", status: "todo", assignee: "Иван", deadline: "2025-02-01" },
            { id: 5, name: "Сборка приложения", desc: "Настроить сборку для iOS и Android", priority: "medium", status: "progress", assignee: "Анна", deadline: "2025-02-10" },
            { id: 6, name: "Публикация в сторах", desc: "Загрузить в App Store и Google Play", priority: "low", status: "todo", assignee: "Пользователь", deadline: "2025-02-20" }
        ]
    }
];

let currentProjectId = null;
let selectedBgColor = "#ffffff";
let selectedProjectMembers = [];
let openMenuId = null;
let pendingDeleteCallback = null;

// Фильтры и сортировка
let filters = { priority: null, status: null, assignee: null, project: null };
let sortBy = 'deadline';
let sortOrder = 'asc';