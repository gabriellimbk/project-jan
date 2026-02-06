document.addEventListener('DOMContentLoaded', () => {
    const paramListContainer = document.getElementById('param-list');
    const targetField = document.getElementById('target-field');
    const targetBaseUrl = document.body.getAttribute('data-target-url') || 'http://localhost:3000';

    // Get search parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const paramsMap = {};

    // Convert to object for easier handling
    for (const [key, value] of urlParams.entries()) {
        paramsMap[key] = value;
    }

    const paramEntries = Object.entries(paramsMap);

    if (paramEntries.length > 0) {
        // Clear empty message
        paramListContainer.innerHTML = '';

        // Display all parameters
        paramEntries.forEach(([key, value], index) => {
            const badge = document.createElement('div');
            badge.className = 'param-badge';
            badge.style.animationDelay = `${index * 0.1}s`;
            badge.innerHTML = `
                <span class="param-key">${escapeHtml(key)}:</span>
                <span class="param-value">${escapeHtml(value)}</span>
            `;
            paramListContainer.appendChild(badge);
        });

        // Auto-fill logic
        // We look for common Canvas/LTI parameters
        const autoFillKeys = ['userId', 'user_id', 'id', 'uid', 'custom_user_id', 'lis_person_name_full'];

        let foundValue = null;
        for (const key of autoFillKeys) {
            if (paramsMap[key]) {
                foundValue = paramsMap[key];
                break;
            }
        }

        if (foundValue) {
            targetField.value = foundValue;
            targetField.classList.add('highlight');
            setTimeout(() => targetField.classList.remove('highlight'), 2000);

            const redirectUrl = new URL(targetBaseUrl);
            redirectUrl.searchParams.set('userId', foundValue);
            setTimeout(() => {
                window.location.href = redirectUrl.toString();
            }, 800);
        } else {
            targetField.placeholder = "Parameters found, but no target match.";
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
