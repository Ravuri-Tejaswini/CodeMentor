document.addEventListener('DOMContentLoaded', () => {
    // Initialize CodeMirror
    const codeArea = document.getElementById('codeInput');
    const editor = CodeMirror.fromTextArea(codeArea, {
        mode: 'javascript',
        theme: 'material-palenight',
        lineNumbers: true,
        indentUnit: 4,
        matchBrackets: true,
        autoCloseBrackets: true
    });

    const langSelect = document.getElementById('analyzerLanguage');
    langSelect.addEventListener('change', () => {
        editor.setOption('mode', langSelect.value);
    });

    const analyzeBtn = document.getElementById('analyzeBtn');
    const analyzerOutput = document.getElementById('analyzerOutput');
    const beginnerCheck = document.getElementById('beginnerMode');
    const errorBox = ensureErrorBox();

    analyzeBtn.addEventListener('click', () => {
        const code = editor.getValue();
        if (!code.trim()) return alert('Please enter some code to analyze.');

        analyzeCode(code);
    });

    beginnerCheck.addEventListener('change', () => {
        if (analyzerOutput.style.display !== 'none') {
            const code = editor.getValue();
            analyzeCode(code, true); // Re-analyze or just update text
        }
    });

    function analyzeCode(code, skipScroll = false) {
        const isBeginner = beginnerCheck.checked;
        analyzeBtn.innerText = 'Consulting AI Neural Engine...';
        analyzeBtn.disabled = true;

        setTimeout(() => {
            const validation = validateCode(langSelect.value, code);
            if (!validation.valid) {
                errorBox.style.display = 'block';
                errorBox.innerHTML = `<strong>Code issue found:</strong> ${validation.message}`;

                const syntaxAssist = buildSyntaxAssist(langSelect.value, code, validation);
                updateSection('explanationSection', syntaxAssist.explanation);
                updateSection('timeComplexity', 'Not available until syntax is valid');
                updateSection('spaceComplexity', 'Not available until syntax is valid');
                updateSection('optimizationSection', syntaxAssist.howToFix);
                updateSection('practiceSection', syntaxAssist.fixedCodeHtml);
                analyzerOutput.style.display = 'block';
                analyzeBtn.innerText = 'Analyze System Logic';
                analyzeBtn.disabled = false;
                if (!skipScroll) {
                    analyzerOutput.scrollIntoView({ behavior: 'smooth' });
                }
                return;
            }

            errorBox.style.display = 'none';
            const report = heuristicAnalysis(code, isBeginner);

            updateSection('explanationSection', report.explanation);
            updateSection('timeComplexity', report.time);
            updateSection('spaceComplexity', report.space);
            updateSection('optimizationSection', report.optimization);
            updateSection('practiceSection', report.practice);

            analyzerOutput.style.display = 'block';
            analyzeBtn.innerText = 'Analyze System Logic';
            analyzeBtn.disabled = false;

            if (!skipScroll) {
                analyzerOutput.scrollIntoView({ behavior: 'smooth' });
            }

            // Save to local storage for dashboard
            saveAnalysisToLocal(code.substring(0, 50) + '...', report.time);
        }, 1500);
    }

    function ensureErrorBox() {
        let box = document.getElementById('analysisErrorBox');
        if (!box) {
            box = document.createElement('div');
            box.id = 'analysisErrorBox';
            box.className = 'alert-box';
            box.style.display = 'none';
            box.style.marginBottom = '1rem';
            analyzerOutput.prepend(box);
        }
        return box;
    }

    function validateCode(lang, code) {
        const stack = [];
        const openers = ['(', '{', '['];
        const closers = { ')': '(', '}': '{', ']': '[' };

        for (let i = 0; i < code.length; i += 1) {
            const ch = code[i];
            if (openers.includes(ch)) stack.push(ch);
            if (closers[ch]) {
                const top = stack.pop();
                if (top !== closers[ch]) {
                    return { valid: false, message: `Mismatched bracket near character ${i + 1}.` };
                }
            }
        }
        if (stack.length) {
            return { valid: false, message: 'Unclosed bracket detected. Check (), {} or [].' };
        }

        if (lang === 'javascript') {
            try {
                // Parse only, do not execute.
                // eslint-disable-next-line no-new-func
                new Function(code);
            } catch (err) {
                return { valid: false, message: `${err.message}` };
            }
        }

        if (lang === 'python') {
            const lines = code.split('\n');
            for (let i = 0; i < lines.length; i += 1) {
                const line = lines[i].trim();
                const needsColon = /^(if|for|while|def|class|elif|else)\b/.test(line);
                if (needsColon && !line.endsWith(':')) {
                    return { valid: false, message: `Python syntax may be wrong at line ${i + 1}: expected ":" at the end.` };
                }
            }
        }

        return { valid: true, message: '' };
    }

    function buildSyntaxAssist(lang, code, validation) {
        const fixedCode = autoFixSyntax(lang, code);
        const escaped = escapeHtml(fixedCode);

        return {
            explanation: `Your ${lang} code contains a syntax issue. Error detail: ${validation.message}`,
            howToFix: 'Fix the line indicated in the error message, ensure brackets are balanced, and complete language-specific syntax (like ":" in Python blocks).',
            fixedCodeHtml: `
                <p style="margin-bottom:0.6rem;">Suggested syntax-fixed version:</p>
                <pre style="white-space:pre-wrap; background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: 10px; padding: 0.9rem; overflow:auto;">${escaped}</pre>
            `
        };
    }

    function autoFixSyntax(lang, code) {
        let fixed = code;

        if (lang === 'python') {
            const lines = fixed.split('\n').map((line) => {
                const trimmed = line.trim();
                const needsColon = /^(if|for|while|def|class|elif|else)\b/.test(trimmed);
                if (needsColon && !trimmed.endsWith(':')) {
                    return `${line}:`;
                }
                return line;
            });
            fixed = lines.join('\n');
        }

        // Generic bracket balancing fallback.
        const openCount = { '(': 0, '{': 0, '[': 0 };
        const pairs = { '(': ')', '{': '}', '[': ']' };
        for (let i = 0; i < fixed.length; i += 1) {
            const ch = fixed[i];
            if (openCount[ch] !== undefined) openCount[ch] += 1;
            if (ch === ')' && openCount['('] > 0) openCount['('] -= 1;
            if (ch === '}' && openCount['{'] > 0) openCount['{'] -= 1;
            if (ch === ']' && openCount['['] > 0) openCount['['] -= 1;
        }

        const appenders = [];
        Object.keys(openCount).forEach((opener) => {
            const count = openCount[opener];
            for (let i = 0; i < count; i += 1) appenders.push(pairs[opener]);
        });
        if (appenders.length) {
            fixed += `\n${appenders.join('')}`;
        }

        return fixed;
    }

    function escapeHtml(text) {
        return text
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function updateSection(id, content) {
        const section = document.getElementById(id);
        const container = section.querySelector('.content');
        container.innerHTML = content;
        section.classList.add('fade-in');
    }

    function heuristicAnalysis(code, isBeginner) {
        const lang = langSelect.value;
        const lowercaseCode = code.toLowerCase();

        // Basic complexity heuristics
        let time = 'O(1)';
        let space = 'O(1)';

        if (lowercaseCode.includes('for') || lowercaseCode.includes('while')) {
            time = 'O(n)';
            if (lowercaseCode.indexOf('for', lowercaseCode.indexOf('for') + 1) !== -1) {
                time = 'O(n²)';
            }
        }

        if (lowercaseCode.includes('list') || lowercaseCode.includes('array') || lowercaseCode.includes('map') || lowercaseCode.includes('set')) {
            space = 'O(n)';
        }

        const reports = {
            explanation: isBeginner
                ? `Imagine this code is a set of simple instructions for a robot. It starts by taking some data, then it ${lowercaseCode.includes('if') ? 'makes a decision based on a condition' : 'performs a task'}. ${time.includes('n') ? 'It repeats this multiple times to process every item.' : 'It finishes the job in one go.'}`
                : `This ${lang} implementation initializes a processing sequence where the engine ${lowercaseCode.includes('if') ? 'evaluates logical branches' : 'executes linear operations'}. The control flow suggests ${time} performance due to ${time.includes('n') ? 'iterative processing' : 'constant-time access'}.`,
            time: time,
            space: space,
            optimization: `Consider using more memory-efficient ${lang === 'javascript' ? 'ES6 features' : 'library functions'}. Ensure proper error handling to prevent runtime exceptions in deep logic stacks.`,
            practice: `Try implementing the same logic using a ${time.includes('n') ? 'recursive' : 'loop-based'} approach to see how it affects the memory stack.`
        };

        return reports;
    }

    function saveAnalysisToLocal(snippet, complexity) {
        const analyses = JSON.parse(localStorage.getItem('cm_analyses') || '[]');
        analyses.unshift({
            id: Date.now(),
            snippet: snippet,
            complexity: complexity,
            date: new Date().toLocaleDateString()
        });
        localStorage.setItem('cm_analyses', JSON.stringify(analyses.slice(0, 5)));
    }
});
