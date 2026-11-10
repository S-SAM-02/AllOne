(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const toast = (message) => {
    const el = $("#toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove("show"), 2800);
  };
  const labels = {
    chat:"Chat",compare:"AI Compare",brain:"Ultimate Brain",projects:"Projects & Coding",
    research:"Research",browser:"Browser & Actions",files:"Files",history:"History",
    integrations:"Integrations",settings:"Settings & API Keys"
  };
  function showView(name) {
    if (!labels[name]) return;
    $$(".view").forEach(v => v.classList.toggle("active-view", v.id === `view-${name}`));
    $$(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.view === name));
    $("#pageCrumb").textContent = labels[name];
    $("#sidebar").classList.remove("open");
    window.scrollTo({top:0,behavior:"smooth"});
  }
  document.addEventListener("click", event => {
    const target = event.target.closest("[data-view]");
    if (target) showView(target.dataset.view);
  });
  $("#mobileMenu").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
  $("#newChat").addEventListener("click", () => {
    $("#promptInput").value = "";
    $("#conversation").innerHTML = "";
    showView("chat");
    $("#promptInput").focus();
  });
  $("#helpBtn").addEventListener("click", () => toast("This is the ALL ONE interactive prototype. Live integrations need backend setup."));
  $("#attachBtn").addEventListener("click", () => $("#fileInput").click());
  $("#fileInput").addEventListener("change", e => {
    if (e.target.files.length) toast(`${e.target.files.length} file(s) selected. Upload processing is not connected yet.`);
  });
  $$(".suggestion-card").forEach(card => card.addEventListener("click", () => {
    $("#promptInput").value = card.dataset.prompt;
    $("#promptInput").focus();
  }));
  function addMessage(label, text, className = "") {
    const item = document.createElement("article");
    item.className = `message ${className}`;
    const heading = document.createElement("div");
    heading.className = "message-label";
    heading.textContent = label;
    const p = document.createElement("p");
    p.textContent = text;
    item.append(heading,p);
    $("#conversation").append(item);
  }
  function addHistory(title, detail) {
    const row = document.createElement("div");
    row.className = "agent-row";
    const icon = document.createElement("span");
    icon.className = "agent-icon";
    icon.textContent = "◷";
    const info = document.createElement("div");
    const strong = document.createElement("strong");
    strong.textContent = title;
    const small = document.createElement("small");
    small.textContent = detail;
    info.append(strong,small);
    const state = document.createElement("span");
    state.className = "agent-state";
    state.textContent = "Demo";
    row.append(icon,info,state);
    const history = $("#historyList");
    const empty = $(".queue-empty",history);
    if (empty) empty.remove();
    history.prepend(row);
  }
  $("#sendBtn").addEventListener("click", () => {
    const prompt = $("#promptInput").value.trim();
    if (!prompt) return toast("Write a question first.");
    const mode = $("#modeSelect").selectedOptions[0].textContent;
    addMessage("YOU",prompt,"user-message");
    addMessage("ALL ONE · DEMO",`Your request is ready to route using “${mode}”. No model API is connected yet, so no live answer was generated. Connect providers in Settings after the secure backend is installed.`);
    $("#promptInput").value = "";
    addHistory(prompt.slice(0,55),`Chat · ${mode}`);
    toast("Demo request recorded. No external AI was called.");
  });
  $("#promptInput").addEventListener("keydown", e => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") $("#sendBtn").click();
  });
  $("#compareBtn").addEventListener("click", () => {
    const value = $("#comparePrompt").value.trim();
    if (!value) return toast("Enter a question to compare.");
    toast("Comparison is ready to run when model providers are connected.");
    addHistory(value.slice(0,55),"AI Compare · Preview only");
  });
  $("#researchBtn").addEventListener("click", () => {
    const value = $("#researchPrompt").value.trim();
    if (!value) return toast("Enter a topic first.");
    toast("Research brief captured. Live source search is not connected.");
    addHistory(value.slice(0,55),"Research plan · Draft");
  });
  $("#planTaskBtn").addEventListener("click", () => {
    const task = $("#browserTask").value.trim();
    if (!task) return toast("Describe the browser task first.");
    const queue = $("#approvalQueue");
    queue.innerHTML = "";
    const card = document.createElement("div");
    card.className = "agent-row";
    const icon = document.createElement("span");
    icon.className = "agent-icon";
    icon.textContent = "◎";
    const content = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = "Task plan draft";
    const description = document.createElement("small");
    description.textContent = task;
    content.append(title,description);
    const state = document.createElement("span");
    state.className = "agent-state";
    state.textContent = "Plan only";
    card.append(icon,content,state);
    queue.append(card);
    $("#approvalCount").textContent = "0 external actions";
    addHistory(task.slice(0,55),"Browser task · Plan draft only");
    toast("Plan draft created locally. No browser was opened and no action was executed.");
  });
  $("#filesUploadBtn").addEventListener("click", () => $("#filesInput").click());
  $("#filesInput").addEventListener("change", e => {
    if (e.target.files.length) toast(`${e.target.files.length} local file(s) selected; secure upload is not connected.`);
  });
  document.addEventListener("keydown", e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      showView("chat");
      $("#promptInput").focus();
    }
    if (e.key === "Escape") $("#sidebar").classList.remove("open");
  });
})();