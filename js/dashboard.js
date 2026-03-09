document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('cm_user') || 'null');
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('userName').textContent = user.name;
    document.getElementById('welcomeName').textContent = user.name.split(' ')[0];
    const avatar = user.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.name || 'User')}`;
    document.getElementById('userAvatar').src = avatar;

    const analyses = JSON.parse(localStorage.getItem('cm_analyses') || '[]');
    const tasks = JSON.parse(localStorage.getItem('cm_tasks') || '[]');

    document.getElementById('analysisCount').textContent = analyses.length;
    loadRecentActivities();
    hydrateStreakStats(tasks);
    initCertificates();
});

function loadRecentActivities() {
    const plans = JSON.parse(localStorage.getItem('cm_saved_study_plans') || '[]')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
    const activityList = document.getElementById('activityList');
    if (!plans.length) {
        activityList.innerHTML = '<p style="color: var(--text-dim); text-align: center; padding: 2rem;">No recent study plans found.</p>';
        return;
    }

    activityList.innerHTML = plans.map((plan) => {
        const preview = (plan.topics || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 2)
            .join(', ');
        return `
            <button class="activity-item recent-plan-card" data-plan-id="${plan.id}" style="width:100%; background:transparent; border:0; color:inherit; cursor:pointer; text-align:left;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 40px; height: 40px; border-radius: 8px; background: rgba(123, 97, 255, 0.1); display: flex; align-items: center; justify-content: center; color: var(--accent-indigo);">
                        <i class="fas fa-book"></i>
                    </div>
                    <div>
                        <div style="font-weight: 700; font-size: 0.95rem;">${plan.language} Study Plan</div>
                        <div style="color: var(--text-dim); font-size: 0.8rem;">Topics: ${preview || 'General roadmap'}</div>
                        <div style="color: var(--text-muted); font-size: 0.75rem;">${plan.hours}h/day</div>
                    </div>
                </div>
                <div style="color: var(--text-dim); font-size: 0.8rem;">${formatDateTime(plan.createdAt)}</div>
            </button>
        `;
    }).join('');

    activityList.querySelectorAll('.recent-plan-card').forEach((card) => {
        card.addEventListener('click', () => openSavedPlan(card.dataset.planId));
    });
}

function openSavedPlan(planId) {
    localStorage.setItem('cm_open_study_plan_id', planId);
    window.location.href = `planner.html?planId=${encodeURIComponent(planId)}`;
}

function hydrateStreakStats(tasks) {
    const completedTasks = tasks.filter((task) => task.completed);
    const completedCount = completedTasks.length;
    const streak = calculateDayStreak(completedTasks);

    document.getElementById('streakCount').textContent = `${streak} day${streak === 1 ? '' : 's'}`;
    document.getElementById('taskSummary').textContent = `${completedCount} completed tasks`;
}

function calculateDayStreak(completedTasks) {
    const daySet = new Set(
        completedTasks
            .map((task) => task.completedAt)
            .filter(Boolean)
            .map((iso) => iso.slice(0, 10))
    );
    if (!daySet.size) return 0;

    let streak = 0;
    const now = new Date();
    for (let i = 0; i < 365; i += 1) {
        const day = new Date(now);
        day.setDate(now.getDate() - i);
        const key = day.toISOString().slice(0, 10);
        if (daySet.has(key)) {
            streak += 1;
        } else {
            break;
        }
    }
    return streak;
}

function initCertificates() {
    const form = document.getElementById('certificateForm');
    const list = document.getElementById('certificateList');
    const storageKey = 'cm_certificates';

    function render() {
        const certificates = JSON.parse(localStorage.getItem(storageKey) || '[]');
        if (!certificates.length) {
            list.innerHTML = '<p style="color: var(--text-dim);">No certificates added yet.</p>';
            return;
        }

        list.innerHTML = certificates.map((cert) => `
            <div class="certificate-item">
                <div>
                    <div style="font-weight:700;">${cert.title}</div>
                    <div style="color:var(--text-muted); font-size:0.85rem;">${cert.provider} • ${cert.date}</div>
                </div>
                <div style="display:flex; gap:0.5rem; align-items:center;">
                    ${cert.link ? `<a class="btn btn-secondary" href="${cert.link}" target="_blank" style="padding:0.45rem 0.7rem; font-size:0.8rem;">View</a>` : ''}
                    <button class="btn btn-secondary cert-delete" data-id="${cert.id}" style="padding:0.45rem 0.7rem; font-size:0.8rem; border-color:rgba(234,67,53,0.35); color:#ea4335;">Delete</button>
                </div>
            </div>
        `).join('');
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const certificates = JSON.parse(localStorage.getItem(storageKey) || '[]');
        certificates.unshift({
            id: `cert_${Date.now()}`,
            title: document.getElementById('certTitle').value.trim(),
            provider: document.getElementById('certProvider').value,
            date: document.getElementById('certDate').value,
            link: document.getElementById('certLink').value.trim()
        });
        localStorage.setItem(storageKey, JSON.stringify(certificates.slice(0, 20)));
        form.reset();
        render();
    });

    list.addEventListener('click', (e) => {
        if (!e.target.classList.contains('cert-delete')) return;
        const id = e.target.dataset.id;
        const certificates = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const filtered = certificates.filter((cert) => cert.id !== id);
        localStorage.setItem(storageKey, JSON.stringify(filtered));
        render();
    });

    render();
}

function formatDate(isoDate) {
    if (!isoDate) return '';
    return new Date(isoDate).toLocaleDateString();
}

function formatDateTime(isoDate) {
    if (!isoDate) return '';
    return new Date(isoDate).toLocaleString();
}

function logout() {
    localStorage.removeItem('cm_user');
    window.location.href = 'index.html';
}
