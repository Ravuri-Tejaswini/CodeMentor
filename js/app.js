// Core App Logic - CodeMentor
document.addEventListener('DOMContentLoaded', () => {
    initTypewriter();
    initNavbarScroll();
    initFadeInObserver();
    hydrateUserNav();
    initChatbot();
    initMotivationAndReminder();
});

function initTypewriter() {
    const typewriter = document.getElementById('typewriter');
    if (!typewriter) return;

    const phrases = [
        'Generate Study Plans Instantly',
        'Analyze Code with AI Precision',
        'Master Programming Logic',
        'Optimize Your Snippets'
    ];
    let phraseIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let typeSpeed = 100;

    function type() {
        const currentPhrase = phrases[phraseIdx];
        if (isDeleting) {
            typewriter.textContent = currentPhrase.substring(0, charIdx - 1);
            charIdx -= 1;
            typeSpeed = 50;
        } else {
            typewriter.textContent = currentPhrase.substring(0, charIdx + 1);
            charIdx += 1;
            typeSpeed = 100;
        }

        if (!isDeleting && charIdx === currentPhrase.length) {
            isDeleting = true;
            typeSpeed = 2000;
        } else if (isDeleting && charIdx === 0) {
            isDeleting = false;
            phraseIdx = (phraseIdx + 1) % phrases.length;
            typeSpeed = 500;
        }
        setTimeout(type, typeSpeed);
    }
    type();
}

function initNavbarScroll() {
    const nav = document.getElementById('navbar');
    if (!nav) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });
}

function initFadeInObserver() {
    const cards = document.querySelectorAll('.card');
    if (!cards.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    cards.forEach((card) => observer.observe(card));
}

function hydrateUserNav() {
    const user = JSON.parse(localStorage.getItem('cm_user') || 'null');
    const loginLink = document.querySelector('a[href="login.html"]');

    if (user && loginLink) {
        const avatar = user.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.name || 'User')}`;
        loginLink.innerHTML = `<img src="${avatar}" alt="Profile" style="width:24px;height:24px;border-radius:50%;margin-right:0.45rem;vertical-align:middle;"> ${user.name?.split(' ')[0] || 'Profile'}`;
        loginLink.href = 'dashboard.html';
        loginLink.classList.remove('btn-secondary');
        loginLink.classList.add('btn-primary');
        loginLink.style.display = 'inline-flex';
        loginLink.style.alignItems = 'center';
    }
}

function initChatbot() {
    const host = document.body;
    if (!host) return;

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'cm-chat-toggle';
    toggleBtn.innerHTML = '<i class="fas fa-comment-dots"></i>';
    toggleBtn.setAttribute('aria-label', 'Open chatbot');

    const panel = document.createElement('div');
    panel.className = 'cm-chat-panel';
    panel.innerHTML = `
        <div class="cm-chat-header">CodeMentor Support Bot</div>
        <div class="cm-chat-messages" id="cmChatMessages">
            <div class="cm-msg cm-msg-bot">Hi! Ask me about study plans, analyzer usage, login issues, reminders, or resources.</div>
        </div>
        <div class="cm-chat-input-row">
            <input id="cmChatInput" type="text" placeholder="Type your question..." />
            <button id="cmChatSend" class="btn btn-primary" style="padding:0.6rem 0.9rem;">Send</button>
        </div>
    `;

    host.appendChild(toggleBtn);
    host.appendChild(panel);

    const messages = panel.querySelector('#cmChatMessages');
    const input = panel.querySelector('#cmChatInput');
    const sendBtn = panel.querySelector('#cmChatSend');

    toggleBtn.addEventListener('click', () => {
        const isOpen = panel.style.display === 'flex';
        panel.style.display = isOpen ? 'none' : 'flex';
    });

    function pushMessage(text, fromUser) {
        const msg = document.createElement('div');
        msg.className = `cm-msg ${fromUser ? 'cm-msg-user' : 'cm-msg-bot'}`;
        msg.textContent = text;
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
    }

    function botReply(query) {
        const q = query.toLowerCase();
        const tasks = JSON.parse(localStorage.getItem('cm_tasks') || '[]');
        const pending = tasks.filter((t) => !t.completed).length;

        if (q.includes('study') || q.includes('plan')) {
            return 'Use Study Planner: enter topics separated by commas, select resources, then mark each day complete to keep your streak.';
        }
        if (q.includes('analyzer') || q.includes('error') || q.includes('wrong code')) {
            return 'In Code Analyzer, invalid syntax now shows a specific error hint. Fix the highlighted issue, then run analysis again.';
        }
        if (q.includes('resource') || q.includes('gfg') || q.includes('w3')) {
            return 'You can choose resource providers like GFG, W3Schools, MDN, or LeetCode in Study Planner before opening resource links.';
        }
        if (q.includes('streak') || q.includes('complete')) {
            return `Current pending tasks: ${pending}. Complete daily tasks from your plan to maintain streaks in dashboard stats.`;
        }
        if (q.includes('login') || q.includes('password')) {
            return 'Login supports direct email/password and social sign-ins. If blocked, verify email format and password length (>=6).';
        }
        if (q.includes('website') || q.includes('bug') || q.includes('issue')) {
            return 'For website issues: refresh once, check internet status, and re-open the page. If it persists, mention the exact page and action.';
        }
        return 'I can help with study plans, code analyzer errors, resources, reminders, streaks, and website issues. Ask me anything specific.';
    }

    function sendQuery() {
        const text = input.value.trim();
        if (!text) return;
        pushMessage(text, true);
        input.value = '';
        setTimeout(() => pushMessage(botReply(text), false), 250);
    }

    sendBtn.addEventListener('click', sendQuery);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendQuery();
    });
}

function initMotivationAndReminder() {
    const quotes = [
        'Small daily progress creates life-changing results.',
        'Consistency beats intensity in coding journeys.',
        'Debugging is where real developers are built.',
        'You are one focused session away from a breakthrough.'
    ];
    let idleTimer;
    let quoteTimer;

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'cm-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4200);
    }

    function showQuote(reason) {
        const modal = document.createElement('div');
        modal.className = 'cm-quote-modal';
        const quote = quotes[Math.floor(Math.random() * quotes.length)];
        modal.innerHTML = `
            <div class="cm-quote-card">
                <h4 style="margin-bottom:0.6rem;">Stay motivated</h4>
                <p style="color:var(--text-muted); margin-bottom:0.8rem;">${reason}</p>
                <p style="font-size:1.05rem;">"${quote}"</p>
                <button class="btn btn-primary" style="margin-top:1rem;">Continue</button>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        modal.querySelector('button').addEventListener('click', () => modal.remove());
    }

    function resetIdleTimer() {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            showQuote('Looks like you have been inactive for a while. Here is a boost.');
        }, 120000);
    }

    ['mousemove', 'keydown', 'scroll', 'click'].forEach((eventName) => {
        document.addEventListener(eventName, resetIdleTimer);
    });
    resetIdleTimer();

    window.addEventListener('offline', () => {
        showQuote('Network issue detected. Do not lose momentum.');
    });
    window.addEventListener('online', () => {
        showToast('Network restored. You are back on track.');
    });

    function remindIncompleteWork() {
        const now = new Date();
        if (now.getHours() < 20) return;
        const todayKey = now.toISOString().slice(0, 10);
        const lastReminder = localStorage.getItem('cm_last_reminder_date');
        if (lastReminder === todayKey) return;

        const tasks = JSON.parse(localStorage.getItem('cm_tasks') || '[]');
        const pending = tasks.filter((task) => !task.completed).length;
        if (!pending) return;

        localStorage.setItem('cm_last_reminder_date', todayKey);
        showToast(`Reminder: You still have ${pending} pending study tasks today.`);

        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification('CodeMentor Reminder', { body: `You still have ${pending} pending tasks.` });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
        }
    }

    clearInterval(quoteTimer);
    quoteTimer = setInterval(remindIncompleteWork, 45000);
    remindIncompleteWork();
}
