// Frontend JavaScript for AI Planner App

let currentTask = null;
let currentSubtasks = [];
let currentSchedule = [];

// DOM Elements
const taskForm = document.getElementById('taskForm');
const taskTitle = document.getElementById('taskTitle');
const taskDescription = document.getElementById('taskDescription');
const imageUpload = document.getElementById('imageUpload');
const scanImageBtn = document.getElementById('scanImageBtn');
const ocrResult = document.getElementById('ocrResult');
const manualSubtasks = document.getElementById('manualSubtasks');
const subtasksList = document.getElementById('subtasksList');
const addSubtaskBtn = document.getElementById('addSubtaskBtn');
const resultsSection = document.getElementById('resultsSection');
const subtasksResult = document.getElementById('subtasksResult');
const schedulePreview = document.getElementById('schedulePreview');
const loadingSpinner = document.getElementById('loadingSpinner');
const successMessage = document.getElementById('successMessage');
const addToCalendarBtn = document.getElementById('addToCalendarBtn');
const resetBtn = document.getElementById('resetBtn');

// Radio buttons for subtask method
const subtaskMethodRadios = document.querySelectorAll('input[name="subtaskMethod"]');

// Toggle manual subtasks section
subtaskMethodRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'manual') {
            manualSubtasks.classList.remove('hidden');
            if (subtasksList.children.length === 0) {
                addManualSubtask();
            }
        } else {
            manualSubtasks.classList.add('hidden');
        }
    });
});

// Enable scan button when image is uploaded
imageUpload.addEventListener('change', (e) => {
    scanImageBtn.disabled = !e.target.files.length;
});

// Scan image for OCR
scanImageBtn.addEventListener('click', async () => {
    const file = imageUpload.files[0];
    if (!file) return;

    scanImageBtn.disabled = true;
    scanImageBtn.textContent = '🔄 Processing...';

    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch('/api/ocr', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        if (data.success) {
            ocrResult.innerHTML = `<strong>📝 Extracted Text:</strong><br>${data.text}`;
            ocrResult.classList.add('show');
            
            // Append to description
            if (taskDescription.value) {
                taskDescription.value += '\n\n' + data.text;
            } else {
                taskDescription.value = data.text;
            }
        } else {
            alert('Error processing image: ' + data.error);
        }
    } catch (error) {
        alert('Error scanning image: ' + error.message);
    } finally {
        scanImageBtn.disabled = false;
        scanImageBtn.textContent = '📷 Scan Image for Text';
    }
});

// Add manual subtask
addSubtaskBtn.addEventListener('click', addManualSubtask);

function addManualSubtask() {
    const subtaskItem = document.createElement('div');
    subtaskItem.className = 'subtask-item';
    subtaskItem.innerHTML = `
        <div class="subtask-header">
            <strong>Subtask ${subtasksList.children.length + 1}</strong>
            <button type="button" class="remove-subtask" onclick="this.parentElement.parentElement.remove()">Remove</button>
        </div>
        <label>Title:</label>
        <input type="text" class="subtask-title" placeholder="Subtask title" required>
        <label style="margin-top: 0.5rem;">Duration (minutes):</label>
        <select class="subtask-duration">
            <option value="25">25 minutes</option>
            <option value="30">30 minutes</option>
            <option value="40">40 minutes</option>
            <option value="45">45 minutes</option>
            <option value="50">50 minutes</option>
            <option value="60">60 minutes</option>
        </select>
    `;
    subtasksList.appendChild(subtaskItem);
}

// Form submission
taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const method = document.querySelector('input[name="subtaskMethod"]:checked').value;
    const title = taskTitle.value.trim();
    const description = taskDescription.value.trim();

    if (!title) {
        alert('Please enter a task title');
        return;
    }

    loadingSpinner.classList.remove('hidden');
    resultsSection.style.display = 'none';
    successMessage.classList.add('hidden');

    try {
        let subtasks = [];

        if (method === 'manual') {
            // Collect manual subtasks
            const subtaskItems = subtasksList.querySelectorAll('.subtask-item');
            if (subtaskItems.length === 0) {
                alert('Please add at least one subtask');
                loadingSpinner.classList.add('hidden');
                return;
            }

            subtaskItems.forEach((item, index) => {
                const title = item.querySelector('.subtask-title').value.trim();
                const duration = parseInt(item.querySelector('.subtask-duration').value);
                if (title) {
                    subtasks.push({
                        title,
                        duration,
                        order: index
                    });
                }
            });
        } else {
            // AI-generated breakdown
            const response = await fetch('/api/ai-breakdown', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, description })
            });

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to generate AI breakdown');
            }

            subtasks = data.subtasks;
        }

        currentSubtasks = subtasks;

        // Display subtasks
        displaySubtasks(subtasks);

        // Generate schedule
        const scheduleResponse = await fetch('/api/schedule', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title,
                description,
                subtasks,
                manual: method === 'manual'
            })
        });

        const scheduleData = await scheduleResponse.json();
        
        if (!scheduleData.success) {
            throw new Error(scheduleData.error || 'Failed to create schedule');
        }

        currentTask = scheduleData.task;
        currentSchedule = scheduleData.schedule;

        // Display schedule
        displaySchedule(scheduleData.schedule);

        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        alert('Error: ' + error.message);
    } finally {
        loadingSpinner.classList.add('hidden');
    }
});

// Display subtasks
function displaySubtasks(subtasks) {
    subtasksResult.innerHTML = subtasks.map((subtask, index) => `
        <div class="subtask-card">
            <h4>${index + 1}. ${subtask.title}</h4>
            ${subtask.description ? `<p>${subtask.description}</p>` : ''}
            <span class="duration-badge">⏱️ ${subtask.duration} minutes</span>
        </div>
    `).join('');
}

// Display schedule
function displaySchedule(schedule) {
    schedulePreview.innerHTML = schedule.map(event => {
        const start = new Date(event.startTime);
        const end = new Date(event.endTime);
        
        return `
            <div class="schedule-item">
                <div>
                    <div class="title">${event.title}</div>
                    <div class="buffer">Includes ${event.bufferMinutes} min buffer</div>
                </div>
                <div class="time">
                    ${formatTime(start)} - ${formatTime(end)}
                </div>
            </div>
        `;
    }).join('');
}

// Format time
function formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
}

// Add to Google Calendar
addToCalendarBtn.addEventListener('click', async () => {
    if (!currentTask || !currentSchedule.length) return;

    addToCalendarBtn.disabled = true;
    addToCalendarBtn.textContent = '⏳ Adding to Calendar...';

    try {
        const response = await fetch('/api/calendar/add-events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                taskId: currentTask.id,
                events: currentSchedule
            })
        });

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to add events to calendar');
        }

        successMessage.classList.remove('hidden');
        successMessage.scrollIntoView({ behavior: 'smooth' });

        setTimeout(() => {
            successMessage.classList.add('hidden');
        }, 5000);

    } catch (error) {
        alert('Error adding to calendar: ' + error.message);
    } finally {
        addToCalendarBtn.disabled = false;
        addToCalendarBtn.textContent = '📅 Add to Google Calendar';
    }
});

// Reset form
resetBtn.addEventListener('click', () => {
    taskForm.reset();
    resultsSection.style.display = 'none';
    manualSubtasks.classList.add('hidden');
    ocrResult.classList.remove('show');
    subtasksList.innerHTML = '';
    successMessage.classList.add('hidden');
    currentTask = null;
    currentSubtasks = [];
    currentSchedule = [];
    window.scrollTo({ top: 0, behavior: 'smooth' });
});
