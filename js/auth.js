document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginStatusMessage = document.getElementById('loginStatusMessage');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const googleBtn = document.getElementById('googleLogin');
    const githubBtn = document.getElementById('githubLogin');
    const microsoftBtn = document.getElementById('microsoftLogin');

    const providerAvatars = {
        google: 'https://api.dicebear.com/9.x/identicon/svg?seed=google-user',
        microsoft: 'https://api.dicebear.com/9.x/identicon/svg?seed=microsoft-user',
        github: 'https://api.dicebear.com/9.x/identicon/svg?seed=github-user'
    };

    function setStatus(message, color = 'var(--accent-teal)') {
        if (!loginStatusMessage) return;
        loginStatusMessage.style.display = 'block';
        loginStatusMessage.style.color = color;
        loginStatusMessage.textContent = message;
    }

    function saveSession(user) {
        localStorage.setItem('cm_user', JSON.stringify(user));
        localStorage.setItem('cm_session', JSON.stringify({
            loggedIn: true,
            loginAt: new Date().toISOString()
        }));
    }

    function redirectToDashboard() {
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    }

    function parseOAuthCallback() {
        const params = new URLSearchParams(window.location.search);
        const provider = params.get('oauth_provider');
        const success = params.get('oauth_success') === '1';
        if (!provider || !success) return;

        const user = {
            name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
            email: `${provider}@codementor.ai`,
            provider: provider,
            avatar: providerAvatars[provider] || providerAvatars.github,
            joinedAt: new Date().toISOString()
        };
        saveSession(user);
        setStatus('Login Successful', 'var(--accent-teal)');
        window.history.replaceState({}, document.title, window.location.pathname);
        redirectToDashboard();
    }

    function startOAuth(provider, triggerEl) {
        const btn = triggerEl;
        if (btn) {
            btn.innerText = `Redirecting to ${provider} OAuth...`;
            btn.style.opacity = '0.75';
            btn.style.pointerEvents = 'none';
        }

        // OAuth redirect simulation for static deployment.
        const returnUrl = `${window.location.pathname}?oauth_provider=${provider}&oauth_success=1`;
        setTimeout(() => {
            window.location.href = returnUrl;
        }, 700);
    }

    function handleManualLogin(triggerEl, credentials) {
        const rawEmail = credentials.email;
        const userName = rawEmail.split('@')[0].replace(/[._-]/g, ' ');
        const normalizedName = userName.replace(/\b\w/g, (ch) => ch.toUpperCase());
        const avatar = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(normalizedName)}`;

        const user = {
            name: normalizedName || 'Demo User',
            email: rawEmail,
            provider: 'Email',
            avatar,
            joinedAt: new Date().toISOString()
        };
        saveSession(user);

        const btn = triggerEl;
        if (btn) {
            btn.innerText = 'Authenticating...';
            btn.style.opacity = '0.7';
            btn.disabled = true;
        }
        setStatus('Login Successful', 'var(--accent-teal)');
        redirectToDashboard();
    }

    parseOAuthCallback();

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = emailInput?.value.trim();
            const password = passwordInput?.value || '';

            if (!email || !password) {
                setStatus('Please enter both email and password.', '#ff9f9f');
                return;
            }
            if (!/\S+@\S+\.\S+/.test(email)) {
                setStatus('Please enter a valid email address.', '#ff9f9f');
                return;
            }
            if (password.length < 6) {
                setStatus('Password should be at least 6 characters.', '#ff9f9f');
                return;
            }

            const submitBtn = loginForm.querySelector('button[type="submit"]');
            handleManualLogin(submitBtn, { email, password });
        });
    }

    const providerMap = {
        googleLogin: 'google',
        microsoftLogin: 'microsoft',
        githubLogin: 'github'
    };

    [googleBtn, githubBtn, microsoftBtn].forEach((btn) => {
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                startOAuth(providerMap[btn.id], btn);
            });
        }
    });

    // Add some flair - follow mouse for subtle glow on auth card
    const card = document.querySelector('.auth-card');
    if (card) {
        document.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--x', `${x}px`);
            card.style.setProperty('--y', `${y}px`);
        });
    }
});
