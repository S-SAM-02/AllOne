(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const toast = (message) => {
    const el = $('#toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('show'), 3200);
  };
  const labels = {chat:'Chat',compare:'AI Compare',brain:'Ultimate Brain',projects:'Projects & Coding',research:'Research',browser:'Browser & Actions',files:'Files',history:'History',integrations:'Integrations',settings:'Settings & API Keys'};
  let apiReady = false;
  function showView(name) {
    if (!labels[name]) return;
    $$('.view').forEach(v => v.classList.toggle('active-view', v.id === 'view-' + name));
    $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === name));
    $('#pageCrumb').textContent = labels[name];
    $('#sidebar').classList.remove('open');
    window.scrollTo({top:0,behavior:'smooth'});
  }
  document.addEventListener('click', event => {
    const target = event.target.closest('[data-view]');
    if (target) showView(target.dataset.view);
  });
  $('#mobileMenu').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
  $('#newChat').addEventListener('click', () => {
    $('#promptInput').value = '';
    $('#conversation').innerHTML = '';
    showView('chat');
    $('#promptInput').focus();
  });
  $('#helpBtn').addEventListener('click', () => toast('ALL ONE local-first backend. Ollama runs on your computer; cloud fallbacks are optional and off by default.'));
  $('#attachBtn').addEventListener('click', () => $('#fileInput').click());
  $('#fileInput').addEventListener('change', e => { if (e.target.files.length) toast('File upload is not connected to the AI backend yet.'); });
  $$('.suggestion-card').forEach(card => card.addEventListener('click', () => {
    $('#promptInput').value = card.dataset.prompt;
    $('#promptInput').focus();
  }));
  function addMessage(label, text, className = '') {
    const item = document.createElement('article');
    item.className = 'message ' + className;
    const heading = document.createElement('div');
    heading.className = 'message-label';
    heading.textContent = label;
    const p = document.createElement('p');
    p.textContent = text;
    item.append(heading,p);
    $('#conversation').append(item);
    item.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  function addHistory(title, detail) {
    const row = document.createElement('div');
    row.className = 'agent-row';
    const icon = document.createElement('span');
    icon.className = 'agent-icon';
    icon.textContent = '◷';
    const info = document.createElement('div');
    const strong = document.createElement('strong');
    strong.textContent = title;
    const small = document.createElement('small');
    small.textContent = detail;
    info.append(strong,small);
    const state = document.createElement('span');
    state.className = 'agent-state';
    state.textContent = 'Local';
    row.append(icon,info,state);
    const history = $('#historyList');
    if (!history) return;
    const empty = $('.queue-empty',history);
    if (empty) empty.remove();
    history.prepend(row);
  }
  async function refreshStatus() {
    try {
      const response = await fetch('/api/status', {cache:'no-store'});
      if (!response.ok) throw new Error('Local backend unavailable');
      const status = await response.json();
      apiReady = true;
      const card = $('.status-card');
      if (card) {
        $('strong',card).textContent = 'Local backend ready';
        $('small',card).textContent = 'Ollama · ' + status.local.model + ' · cloud ' + (status.cloud.enabled ? 'opt-in' : 'off');
        $('.status-indicator',card).style.background = '#78d5b6';
      }
      const pill = $('.demo-pill');
      if (pill) pill.innerHTML = '<i></i> LOCAL-FIRST';
      const footer = $('.app-footer span:last-child');
      if (footer) footer.textContent = 'Build 0.2 · Local-first backend';
      const roster = $('#agentRoster');
      if (roster && status.agents) {
        roster.innerHTML = '';
        status.agents.forEach((agent, index) => {
          const row = document.createElement('div');
          row.className = 'agent-row';
          const icon = document.createElement('span');
          icon.className = 'agent-icon';
          icon.textContent = ['⌘','✧','◈','⌁','✦','盾','◎','✓'][index] || '✧';
          const info = document.createElement('div');
          const strong = document.createElement('strong');
          strong.textContent = agent.name;
          const small = document.createElement('small');
          small.textContent = 'Specialist role · shared model runtime';
          info.append(strong,small);
          const state = document.createElement('span');
          state.className = 'agent-state';
          state.textContent = 'Ready';
          row.append(icon,info,state);
          roster.append(row);
        });
      }
    } catch {
      apiReady = false;
      const card = $('.status-card');
      if (card) {
        $('strong',card).textContent = 'Backend not running';
        $('small',card).textContent = 'Start with npm start';
      }
      const pill = $('.demo-pill');
      if (pill) pill.innerHTML = '<i></i> SERVER OFFLINE';
    }
  }
  async function sendPrompt(prompt, mode) {
    if (!apiReady) await refreshStatus();
    if (!apiReady) {
      addMessage('ALL ONE · SETUP', 'The local backend is not running. Open the repository folder in PowerShell and run: npm start. Then refresh this page at http://127.0.0.1:8787.');
      return;
    }
    const pending = document.createElement('article');
    pending.className = 'message';
    pending.textContent = 'ALL ONE is coordinating the eight specialist roles…';
    $('#conversation').append(pending);
    $('#sendBtn').disabled = true;
    try {
      const response = await fetch('/api/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({prompt,mode: mode === 'compare3' || mode === 'compare4' ? 'compare' : 'auto',compareCount: mode === 'compare4' ? 4 : 3})
      });
      const data = await response.json();
      pending.remove();
      if (!response.ok) throw new Error(data.error || 'The model request failed.');
      addMessage('ALL ONE · ' + data.provider + ' · ' + data.model, data.answer);
      addHistory(prompt.slice(0,55), 'Chat · ' + data.provider + (data.reviewRun ? ' · reviewed' : ''));
      toast('Answer generated. ' + (data.reviewRun ? 'Local verification pass completed.' : ''));
    } catch (error) {
      pending.remove();
      addMessage('ALL ONE · ERROR', error.message + '\n\nCheck that Ollama is running and the model is installed. Cloud fallback is off unless you explicitly enable it in server/.env.');
      toast('Could not generate an answer.');
    } finally {
      $('#sendBtn').disabled = false;
    }
  }
  $('#sendBtn').addEventListener('click', async () => {
    const prompt = $('#promptInput').value.trim();
    if (!prompt) return toast('Write a question first.');
    const mode = $('#modeSelect').value;
    addMessage('YOU',prompt,'user-message');
    $('#promptInput').value = '';
    await sendPrompt(prompt,mode);
  });
  $('#promptInput').addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') $('#sendBtn').click();
  });
  $('#compareBtn').addEventListener('click', () => {
    const value = $('#comparePrompt').value.trim();
    if (!value) return toast('Enter a question to compare.');
    $('#promptInput').value = value;
    showView('chat');
    $('#modeSelect').value = 'compare3';
    $('#sendBtn').click();
  });
  $('#researchBtn').addEventListener('click', () => {
    const value = $('#researchPrompt').value.trim();
    if (!value) return toast('Enter a topic first.');
    $('#promptInput').value = 'Create a research plan for: ' + value + '. Identify claims that need verification and suggest reliable source types. Do not pretend to browse.';
    showView('chat');
    $('#sendBtn').click();
  });
  $('#planTaskBtn').addEventListener('click', () => {
    const task = $('#browserTask').value.trim();
    if (!task) return toast('Describe the browser task first.');
    $('#promptInput').value = 'Create a safe browser task plan for: ' + task + '. Do not execute anything. Identify actions that require explicit approval.';
    showView('chat');
    $('#modeSelect').value = 'plan';
    $('#sendBtn').click();
  });
  $('#filesUploadBtn').addEventListener('click', () => $('#filesInput').click());
  $('#filesInput').addEventListener('change', e => { if (e.target.files.length) toast('File upload and document processing are not connected yet.'); });
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault(); showView('chat'); $('#promptInput').focus();
    }
    if (e.key === 'Escape') $('#sidebar').classList.remove('open');
  });
  refreshStatus();
})();