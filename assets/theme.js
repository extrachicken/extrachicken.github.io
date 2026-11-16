try { document.documentElement.dataset.theme = localStorage.getItem('resume-theme') || 'dark'; } catch { document.documentElement.dataset.theme = 'dark'; }
