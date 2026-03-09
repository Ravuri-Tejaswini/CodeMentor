document.addEventListener('DOMContentLoaded', () => {
    const plannerForm = document.getElementById('plannerForm');
    const hoursInput = document.getElementById('hours');
    const hoursVal = document.getElementById('hoursVal');
    const plannerOutput = document.getElementById('plannerOutput');
    const scheduleContainer = document.getElementById('scheduleContainer');
    const savePlanBtn = document.getElementById('savePlanBtn');
    const resourceChoices = document.querySelectorAll('.resource-choice');
    const languageInput = document.getElementById('language');
    const topicsInput = document.getElementById('topics');

    const SAVED_STUDY_PLANS_KEY = 'cm_saved_study_plans';
    let currentGeneratedPlan = null;

    const resourceMap = {
        gfg: 'https://www.geeksforgeeks.org/?s=',
        w3schools: 'https://www.w3schools.com/search/search.php?query=',
        mdn: 'https://developer.mozilla.org/en-US/search?q=',
        leetcode: 'https://leetcode.com/problemset/?search=',
        youtube: 'https://www.youtube.com/results?search_query='
    };

    if (hoursInput) {
        hoursInput.addEventListener('input', () => {
            hoursVal.textContent = hoursInput.value;
        });
    }

    if (plannerForm) {
        plannerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const language = languageInput.value;
            const hours = hoursInput.value;
            const topics = topicsInput.value;
            const selectedResources = Array.from(resourceChoices)
                .filter((choice) => choice.checked)
                .map((choice) => choice.value);

            if (!selectedResources.length) {
                alert('Select at least one resource source.');
                return;
            }

            generatePlan(language, hours, topics, selectedResources);
        });
    }

    if (savePlanBtn) {
        savePlanBtn.addEventListener('click', () => {
            if (!currentGeneratedPlan) {
                alert('Generate a study plan first, then save it.');
                return;
            }
            saveStudyPlan(currentGeneratedPlan);
            alert('Study plan saved successfully.');
        });
    }

    scheduleContainer.addEventListener('click', (e) => {
        const resourceBtn = e.target.closest('.resource-btn');
        if (!resourceBtn) return;

        const topic = resourceBtn.dataset.topic;
        const lang = resourceBtn.dataset.language;
        const selector = resourceBtn.closest('.resource-row').querySelector('.resource-select');
        const provider = selector.value;
        const baseUrl = resourceMap[provider] || resourceMap.gfg;
        const query = encodeURIComponent(`${topic} ${lang} tutorial`);
        window.open(`${baseUrl}${query}`, '_blank');
    });

    scheduleContainer.addEventListener('change', (e) => {
        if (!e.target.classList.contains('task-toggle')) return;
        const taskId = e.target.dataset.taskId;
        const tasks = JSON.parse(localStorage.getItem('cm_tasks') || '[]');
        const idx = tasks.findIndex((task) => task.id === taskId);
        if (idx === -1) return;

        tasks[idx].completed = e.target.checked;
        tasks[idx].completedAt = e.target.checked ? new Date().toISOString() : null;
        localStorage.setItem('cm_tasks', JSON.stringify(tasks));

        const statusEl = scheduleContainer.querySelector(`.completion-status[data-task-id="${taskId}"]`);
        if (statusEl) {
            statusEl.style.display = e.target.checked ? 'inline-flex' : 'none';
        }

        if (e.target.checked) {
            const logs = JSON.parse(localStorage.getItem('cm_completion_logs') || '[]');
            logs.unshift(new Date().toISOString().slice(0, 10));
            localStorage.setItem('cm_completion_logs', JSON.stringify(logs.slice(0, 100)));
        }
    });

    function generatePlan(lang, hrs, topics, selectedResources) {
        // Show loading state
        const submitBtn = plannerForm.querySelector('button');
        submitBtn.innerText = 'Analyzing with AI...';
        submitBtn.disabled = true;

        setTimeout(() => {
            const topicList = topics.split(',').map(t => t.trim()).filter(t => t.length > 0);
            const days = Math.max(topicList.length, 4);
            const planLines = [];
            for (let i = 1; i <= days; i++) {
                const topic = topicList[i - 1] || `Advanced ${lang} Practice`;
                planLines.push(`Day ${i}: ${topic}`);
            }

            currentGeneratedPlan = {
                id: `study_${Date.now()}`,
                language: lang,
                topics: topics,
                hours: Number(hrs),
                resources: selectedResources,
                plan: planLines,
                createdAt: new Date().toISOString()
            };

            renderStudyPlan(currentGeneratedPlan);
            submitBtn.innerText = 'Generate Custom Roadmap';
            submitBtn.disabled = false;

            plannerOutput.scrollIntoView({ behavior: 'smooth' });
        }, 1500);
    }

    function saveStudyPlan(studyPlan) {
        const plans = JSON.parse(localStorage.getItem(SAVED_STUDY_PLANS_KEY) || '[]');
        const withoutSame = plans.filter((plan) => plan.id !== studyPlan.id);
        withoutSame.unshift(studyPlan);
        localStorage.setItem(SAVED_STUDY_PLANS_KEY, JSON.stringify(withoutSame));
    }

    function renderStudyPlan(studyPlan) {
        const dayItems = studyPlan.plan.map((line, idx) => {
            const topic = line.replace(/^Day\s+\d+:\s*/i, '').trim();
            const day = idx + 1;
            const taskId = `${studyPlan.id}_day_${day}`;
            const optionsHtml = (studyPlan.resources || ['gfg'])
                .map((resource) => `<option value="${resource}">${labelForResource(resource)}</option>`)
                .join('');
            return { topic, day, taskId, optionsHtml };
        });

        ensureTasksForPlan(studyPlan, dayItems);
        const tasks = JSON.parse(localStorage.getItem('cm_tasks') || '[]');

        const html = dayItems.map((item) => {
            const task = tasks.find((t) => t.id === item.taskId);
            const completed = Boolean(task?.completed);
            return `
                <div class="card study-card fade-in" style="animation-delay: ${item.day * 0.1}s; align-items: flex-start; text-align: left; padding: 2rem;">
                    <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 1rem;">
                        <span style="color: var(--accent-teal); font-weight: 700; font-family: var(--font-mono);">DAY ${item.day}</span>
                        <div style="display: flex; gap: 0.5rem;">
                            <i class="fas fa-clock" style="font-size: 0.8rem; color: var(--text-dim);"></i>
                            <span style="font-size: 0.8rem; color: var(--text-dim);">${studyPlan.hours}h</span>
                        </div>
                    </div>
                    <span class="completion-status" data-task-id="${item.taskId}" style="display:${completed ? 'inline-flex' : 'none'}; margin-bottom:0.7rem; font-size:0.78rem; font-weight:700; color:#00f5d4; background:rgba(0,245,212,0.12); border:1px solid rgba(0,245,212,0.35); padding:0.25rem 0.55rem; border-radius:999px;">
                        <i class="fas fa-check-circle" style="margin-right:0.35rem;"></i> Marked as completed
                    </span>
                    <h4 style="font-size: 1.2rem; margin-bottom: 1rem; color: var(--text-bright);">${item.topic}</h4>
                    <ul style="padding-left: 1.2rem; color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">
                        <li>Core concepts and syntax for ${item.topic}</li>
                        <li>Hands-on coding challenges</li>
                        <li>Logic implementation in ${studyPlan.language}</li>
                    </ul>
                    <label class="task-check">
                        <input type="checkbox" class="task-toggle" data-task-id="${item.taskId}" ${completed ? 'checked' : ''}>
                        Mark Day ${item.day} as complete
                    </label>
                    <div class="resource-row">
                        <select class="resource-select">${item.optionsHtml}</select>
                        <button class="btn btn-secondary resource-btn" data-topic="${item.topic}" data-language="${studyPlan.language}" style="padding: 0.6rem; font-size: 0.8rem;">
                            View Resources <i class="fas fa-external-link-alt" style="margin-left: 0.5rem; font-size: 0.7rem;"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        scheduleContainer.innerHTML = html;
        plannerOutput.style.display = 'block';
    }

    function ensureTasksForPlan(studyPlan, dayItems) {
        const tasks = JSON.parse(localStorage.getItem('cm_tasks') || '[]');
        const existingIds = new Set(tasks.map((task) => task.id));
        const newTasks = dayItems
            .filter((item) => !existingIds.has(item.taskId))
            .map((item) => ({
                id: item.taskId,
                planId: studyPlan.id,
                day: item.day,
                topic: item.topic,
                language: studyPlan.language,
                completed: false,
                completedAt: null,
                createdAt: studyPlan.createdAt
            }));
        if (newTasks.length) {
            localStorage.setItem('cm_tasks', JSON.stringify([...newTasks, ...tasks].slice(0, 120)));
        }
    }

    function loadSavedPlanOnOpen() {
        const params = new URLSearchParams(window.location.search);
        const urlId = params.get('planId');
        const fallbackId = localStorage.getItem('cm_open_study_plan_id');
        const selectedId = urlId || fallbackId;
        if (!selectedId) return;

        const plans = JSON.parse(localStorage.getItem(SAVED_STUDY_PLANS_KEY) || '[]');
        const selectedPlan = plans.find((plan) => plan.id === selectedId);
        if (!selectedPlan) return;

        currentGeneratedPlan = selectedPlan;
        languageInput.value = selectedPlan.language;
        hoursInput.value = String(selectedPlan.hours);
        hoursVal.textContent = String(selectedPlan.hours);
        topicsInput.value = selectedPlan.topics;
        renderStudyPlan(selectedPlan);
        localStorage.removeItem('cm_open_study_plan_id');
    }

    function labelForResource(resourceKey) {
        const labels = {
            gfg: 'GeeksforGeeks',
            w3schools: 'W3Schools',
            mdn: 'MDN',
            leetcode: 'LeetCode',
            youtube: 'YouTube'
        };
        return labels[resourceKey] || resourceKey;
    }

    loadSavedPlanOnOpen();
});
