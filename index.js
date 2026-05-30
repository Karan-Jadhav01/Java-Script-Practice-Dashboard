const STORAGE_KEY = "jsPracticeRecords";
const practiceForm = document.getElementById("practiceForm");
const practiceDate = document.getElementById("practiceDate");
const practiceTopic = document.getElementById("practiceTopic");
const practiceMinutes = document.getElementById("practiceMinutes");
const recordsBody = document.getElementById("recordsBody");
const clearRecords = document.getElementById("clearRecords");
const todaySessions = document.getElementById("todaySessions");
const todayTime = document.getElementById("todayTime");
const totalSessions = document.getElementById("totalSessions");
const totalTime = document.getElementById("totalTime");
const currentStreak = document.getElementById("currentStreak");
const bestStreak = document.getElementById("bestStreak");
const codeEditor = document.getElementById("codeEditor");
const runCodeButton = document.getElementById("runCode");
const codeOutput = document.getElementById("codeOutput");
const clearOutputButton = document.getElementById("clearOutput");

let records = [];

function getSavedRecords() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
}

function saveRecords() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function getTodayKey() {
    return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
    const date = new Date(value + "T00:00:00");
    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function getUniqueSortedDays() {
    const uniqueDays = [...new Set(records.map(record => record.date))];
    return uniqueDays.sort((a, b) => (a < b ? 1 : -1));
}

function computeStreaks() {
    const days = getUniqueSortedDays();
    if (!days.length) {
        return { current: 0, best: 0 };
    }

    const daySet = new Set(days);
    let current = 0;
    const today = new Date(getTodayKey());
    let pointer = new Date(today);
    while (daySet.has(pointer.toISOString().slice(0, 10))) {
        current += 1;
        pointer.setDate(pointer.getDate() - 1);
    }

    let best = 0;
    let streak = 0;
    let previous = null;
    const sortedDays = [...days].sort();

    for (const dateString of sortedDays) {
        const date = new Date(dateString + "T00:00:00");
        if (!previous) {
            streak = 1;
        } else {
            const diff = (date - previous) / (1000 * 60 * 60 * 24);
            streak = diff === 1 ? streak + 1 : 1;
        }
        best = Math.max(best, streak);
        previous = date;
    }

    return { current, best };
}

function renderStats() {
    const todayKey = getTodayKey();
    const todayRecords = records.filter(record => record.date === todayKey);
    const totalMinutes = records.reduce((sum, item) => sum + item.minutes, 0);
    const streaks = computeStreaks();

    todaySessions.textContent = `${todayRecords.length} session${todayRecords.length === 1 ? "" : "s"}`;
    todayTime.textContent = `${todayRecords.reduce((sum, item) => sum + item.minutes, 0)} min`;
    totalSessions.textContent = `${records.length} session${records.length === 1 ? "" : "s"}`;
    totalTime.textContent = `${totalMinutes} min`;
    currentStreak.textContent = `${streaks.current} day${streaks.current === 1 ? "" : "s"}`;
    bestStreak.textContent = `best ${streaks.best}`;
}

function renderRecords() {
    recordsBody.innerHTML = "";
    if (!records.length) {
        const row = document.createElement("tr");
        row.innerHTML = `<td colspan="4" class="empty">No practice records yet. Add a session to start.</td>`;
        recordsBody.appendChild(row);
        return;
    }

    records.forEach(record => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${formatDate(record.date)}</td>
            <td>${record.topic}</td>
            <td>${record.minutes}</td>
            <td><button class="delete-btn" type="button" data-id="${record.id}">Delete</button></td>
        `;
        recordsBody.appendChild(tr);
    });
}

function addRecord(event) {
    event.preventDefault();
    const date = practiceDate.value;
    const topic = practiceTopic.value.trim();
    const minutes = Number(practiceMinutes.value);

    if (!date || !topic || minutes <= 0) {
        return;
    }

    const newRecord = {
        id: Date.now().toString(),
        date,
        topic,
        minutes,
    };

    records.unshift(newRecord);
    saveRecords();
    renderRecords();
    renderStats();

    practiceTopic.value = "";
    practiceMinutes.value = "30";
}

function deleteRecord(event) {
    const button = event.target.closest("button[data-id]");
    if (!button) return;
    const id = button.dataset.id;
    records = records.filter(record => record.id !== id);
    saveRecords();
    renderRecords();
    renderStats();
}

function clearAllRecords() {
    if (!records.length) return;
    if (!confirm("Clear all practice records? This cannot be undone.")) {
        return;
    }
    records = [];
    saveRecords();
    renderRecords();
    renderStats();
}

function appendOutput(message, type = "log") {
    const prefix = type === "error" ? "Error: " : type === "warn" ? "Warning: " : "";
    codeOutput.textContent += `${prefix}${message}\n`;
}

function clearOutput() {
    codeOutput.textContent = "";
}

function runCode() {
    clearOutput();
    const code = codeEditor.value.trim();
    if (!code) {
        codeOutput.textContent = "Enter JavaScript code and press Run.";
        return;
    }

    const outputs = [];
    const consoleProxy = {
        log(...args) {
            outputs.push(args.map(item => String(item)).join(" "));
        },
        warn(...args) {
            outputs.push("Warning: " + args.map(item => String(item)).join(" "));
        },
        error(...args) {
            outputs.push("Error: " + args.map(item => String(item)).join(" "));
        }
    };

    try {
        const runner = new Function("console", code);
        const result = runner(consoleProxy);
        if (result !== undefined) {
            outputs.push("Result: " + String(result));
        }
    } catch (error) {
        outputs.push("Error: " + error.message);
    }

    codeOutput.textContent = outputs.length ? outputs.join("\n") : "(No output)";
}

function setDefaultDate() {
    practiceDate.value = getTodayKey();
}

function initialize() {
    records = getSavedRecords();
    setDefaultDate();
    renderRecords();
    renderStats();
    practiceForm.addEventListener("submit", addRecord);
    recordsBody.addEventListener("click", deleteRecord);
    clearRecords.addEventListener("click", clearAllRecords);
    runCodeButton.addEventListener("click", runCode);
    clearOutputButton.addEventListener("click", clearOutput);
}

document.addEventListener("DOMContentLoaded", initialize);
