// AI Planner - Frontend JavaScript (UI/UX v2)

// ===== STATE MANAGEMENT =====
let currentTask = null;
let currentSubtasks = [];
let currentSchedule = [];
let scheduledEvents = [];
let unscheduledTasks = [];

// ===== DOM ELEMENTS =====
const taskForm = document.getElementById("taskForm");
const taskTitle = document.getElementById("taskTitle");
const taskDescription = document.getElementById("taskDescription");
const imageUpload = document.getElementById("imageUpload");
const ocrResult = document.getElementById("ocrResult");
const taskPool = document.getElementById("taskPool");
const timelineGrid = document.getElementById("timelineGrid");
const loadingSpinner = document.getElementById("loadingSpinner");
const successMessage = document.getElementById("successMessage");
const voiceToggle = document.getElementById("voiceToggle");
const voiceIndicator = document.getElementById("voiceIndicator");
const addToCalendarBtn = document.getElementById("addToCalendarBtn");

// ===== INITIALIZE APP =====
document.addEventListener("DOMContentLoaded", () => {
    initializeTimeline();
    attachEventListeners();
});

// ===== TIMELINE GENERATION =====
function initializeTimeline() {
    const startHour = 8; // 8 AM
    const endHour = 20; // 8 PM

    for (let hour = startHour; hour < endHour; hour++) {
        const timeLabel = document.createElement("div");
        timeLabel.className = "time-label";
        timeLabel.textContent = formatHour(hour);

        const timeSlot = document.createElement("div");
        timeSlot.className = "time-slot";
        timeSlot.dataset.hour = hour;
        timeSlot.dataset.time = `${hour}:00`;

        // Make time slots droppable
        timeSlot.addEventListener("dragover", handleDragOver);
        timeSlot.addEventListener("drop", handleDrop);
        timeSlot.addEventListener("dragleave", handleDragLeave);

        timelineGrid.appendChild(timeLabel);
        timelineGrid.appendChild(timeSlot);
    }
}

function formatHour(hour) {
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
}

// ===== EVENT LISTENERS =====
function attachEventListeners() {
    // Task form submission
    taskForm.addEventListener("submit", handleTaskSubmit);

    // Image upload for OCR
    imageUpload.addEventListener("change", handleImageUpload);

    // Voice toggle (stub)
    voiceToggle.addEventListener("click", handleVoiceToggle);

    // Calendar sync button
    addToCalendarBtn.addEventListener("click", syncToCalendar);
}

// ===== TASK SUBMISSION =====
async function handleTaskSubmit(e) {
    e.preventDefault();

    const title = taskTitle.value.trim();
    const description = taskDescription.value.trim();
    const method = document.querySelector(
        'input[name="subtaskMethod"]:checked',
    ).value;

    if (!title) return;

    showLoading();

    try {
        if (method === "ai") {
            // AI-generated breakdown
            const response = await fetch("/ingest/text", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, description }),
            });

            const data = await response.json();

            if (data.success) {
                currentTask = { title, description };
                currentSubtasks = data.subtasks || [];
                currentSchedule = data.schedule || [];

                renderUnscheduledTasks();
                addToCalendarBtn.disabled = false;
            } else {
                alert("Error: " + (data.error || "Failed to generate plan"));
            }
        } else {
            // Manual entry (simplified for now)
            currentTask = { title, description };
            currentSubtasks = [
                {
                    title: title,
                    duration: 30,
                    description: description,
                },
            ];
            currentSchedule = [];

            renderUnscheduledTasks();
            addToCalendarBtn.disabled = false;
        }
    } catch (error) {
        console.error("Task submission error:", error);
        alert("Failed to process task. Please try again.");
    } finally {
        hideLoading();
    }
}

// ===== IMAGE UPLOAD & OCR =====
async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    showLoading();

    try {
        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch("/ingest/image", {
            method: "POST",
            body: formData,
        });

        const data = await response.json();

        if (data.success && data.text) {
            ocrResult.textContent = `📄 Extracted text: ${data.text}`;
            ocrResult.classList.remove("hidden");
            taskDescription.value = data.text;
        } else {
            alert("Failed to extract text from image");
        }
    } catch (error) {
        console.error("OCR error:", error);
        alert("Failed to process image");
    } finally {
        hideLoading();
    }
}

// ===== RENDER UNSCHEDULED TASKS =====
function renderUnscheduledTasks() {
    taskPool.innerHTML = "";
    unscheduledTasks = currentSubtasks.filter(
        (task) => !scheduledEvents.find((e) => e.subtaskId === task.id),
    );

    unscheduledTasks.forEach((task, index) => {
        const taskCard = document.createElement("div");
        taskCard.className = "task-card";
        taskCard.draggable = true;
        taskCard.dataset.taskId = index;
        taskCard.dataset.duration = task.duration || 30;

        taskCard.innerHTML = `
      <div class="task-card-title">${task.title || task.description}</div>
      <div class="task-card-duration">${task.duration || 30} min</div>
    `;

        // Drag events
        taskCard.addEventListener("dragstart", handleDragStart);
        taskCard.addEventListener("dragend", handleDragEnd);

        taskPool.appendChild(taskCard);
    });
}

// ===== DRAG AND DROP =====
let draggedTask = null;

function handleDragStart(e) {
    draggedTask = e.target;
    e.target.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target.innerHTML);
}

function handleDragEnd(e) {
    e.target.classList.remove("dragging");
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = "move";

    const timeSlot = e.currentTarget;
    if (!timeSlot.classList.contains("drop-zone")) {
        timeSlot.classList.add("drop-zone");
    }

    return false;
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove("drop-zone");
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    e.preventDefault();

    const timeSlot = e.currentTarget;
    timeSlot.classList.remove("drop-zone");

    if (!draggedTask) return false;

    const taskId = parseInt(draggedTask.dataset.taskId);
    const task = unscheduledTasks[taskId];
    const hour = parseInt(timeSlot.dataset.hour);

    // Create scheduled event
    const scheduledEvent = document.createElement("div");
    scheduledEvent.className = "scheduled-event";
    scheduledEvent.innerHTML = `
    <div class="scheduled-event-title">${task.title || task.description}</div>
    <div class="scheduled-event-time">${task.duration || 30} min</div>
  `;

    // Clear existing content and add event
    timeSlot.innerHTML = "";
    timeSlot.appendChild(scheduledEvent);

    // Update schedule
    scheduledEvents.push({
        subtaskId: taskId,
        task: task,
        startTime: `${hour}:00`,
        hour: hour,
    });

    // Remove from unscheduled
    draggedTask.remove();
    draggedTask = null;

    return false;
}

// ===== VOICE MODE (STUB) =====
function handleVoiceToggle() {
    // Show voice indicator
    voiceIndicator.classList.remove("hidden");

    // Hide after 2 seconds (stub behavior)
    setTimeout(() => {
        voiceIndicator.classList.add("hidden");
        alert(
            "Voice mode coming soon! 🎤\nThis feature will allow you to speak your tasks and schedule them using AI.",
        );
    }, 2000);
}

// ===== CALENDAR SYNC =====
async function syncToCalendar() {
    if (scheduledEvents.length === 0) {
        alert("Please schedule at least one task on the timeline first.");
        return;
    }

    showLoading();

    try {
        // Build events array
        const events = scheduledEvents.map((se) => {
            const startHour = se.hour;
            const duration = se.task.duration || 30;

            return {
                title: se.task.title || se.task.description,
                description: se.task.description || "",
                startTime: `${startHour}:00`,
                duration: duration,
                bufferMinutes: 10,
            };
        });

        const response = await fetch("/agenda", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                taskTitle: currentTask.title,
                events: events,
            }),
        });

        const data = await response.json();

        if (data.success) {
            showSuccess();
            setTimeout(() => hideSuccess(), 3000);
        } else {
            alert(
                "Failed to sync to calendar: " +
                    (data.error || "Unknown error"),
            );
        }
    } catch (error) {
        console.error("Calendar sync error:", error);
        alert("Failed to sync with Google Calendar");
    } finally {
        hideLoading();
    }
}

// ===== UI HELPERS =====
function showLoading() {
    loadingSpinner.classList.remove("hidden");
}

function hideLoading() {
    loadingSpinner.classList.add("hidden");
}

function showSuccess() {
    successMessage.classList.remove("hidden");
}

function hideSuccess() {
    successMessage.classList.add("hidden");
}

// ===== UTILITY FUNCTIONS =====
function formatTime(hour, minute = 0) {
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
}
