import { LEVELS } from "./levels.js?v=3";
import { PythonInterpreter } from "./interpreter.js?v=3";

// Global Application State
let currentLevelIndex = 0;
let currentTaskIndex = 0;
let totalXP = 0;
let completedLevels = [];
let unlockedBadges = [];
let soundEnabled = true;

// Audio Context & Synth Nodes
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// Programmatic Sound Synthesizers
function playTick() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.04);
    
    gain.gain.setValueAtTime(0.015, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch (e) {
    console.warn("Audio Context failed to play sound:", e);
  }
}

function playSuccess() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const playNote = (freq, start, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(0.06, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(start);
      osc.stop(start + duration);
    };
    
    // Play a retro ascending major chord (C5 -> E5 -> G5 -> C6)
    playNote(523.25, now, 0.12);
    playNote(659.25, now + 0.08, 0.12);
    playNote(783.99, now + 0.16, 0.12);
    playNote(1046.50, now + 0.24, 0.25);
  } catch (e) {
    console.warn(e);
  }
}

function playError() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(130, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.18);
    
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch (e) {
    console.warn(e);
  }
}

function playLevelUp() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const playNote = (freq, start, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(0.05, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(start);
      osc.stop(start + duration);
    };
    
    // Upbeat retro fanfare
    playNote(392.00, now, 0.08); // G4
    playNote(523.25, now + 0.08, 0.08); // C5
    playNote(659.25, now + 0.16, 0.08); // E5
    playNote(783.99, now + 0.24, 0.15); // G5
    playNote(659.25, now + 0.40, 0.08); // E5
    playNote(783.99, now + 0.48, 0.35); // G5
  } catch (e) {
    console.warn(e);
  }
}

// DOM Elements
const pathMapContainer = document.getElementById("pathMap");
const badgesGrid = document.getElementById("badgesGrid");
const videoContainer = document.getElementById("videoContainer");
const conceptTitle = document.getElementById("conceptTitle");
const conceptBody = document.getElementById("conceptBody");
const taskList = document.getElementById("taskList");
const rankBadge = document.getElementById("rankBadge");
const xpBarFill = document.getElementById("xpBarFill");
const xpValue = document.getElementById("xpValue");
const soundToggle = document.getElementById("soundToggle");

const editorTextarea = document.getElementById("editorTextarea");
const editorHighlight = document.getElementById("editorHighlight");
const lineNumbers = document.getElementById("lineNumbers");

const resetBtn = document.getElementById("resetBtn");
const runBtn = document.getElementById("runBtn");
const submitBtn = document.getElementById("submitBtn");

const terminalLines = document.getElementById("terminalLines");
const terminalBody = document.getElementById("terminalBody");
const terminalInputPrompt = document.getElementById("terminalInputPrompt");
const terminalPromptLabel = document.getElementById("terminalPromptLabel");
const terminalInputField = document.getElementById("terminalInputField");

const celebrationModal = document.getElementById("celebrationModal");
const modalTitle = document.getElementById("modalTitle");
const modalSubtitle = document.getElementById("modalSubtitle");
const xpEarnedVal = document.getElementById("xpEarnedVal");
const rankEarnedVal = document.getElementById("rankEarnedVal");
const badgeEarnedRow = document.getElementById("badgeEarnedRow");
const badgeEarnedVal = document.getElementById("badgeEarnedVal");
const nextLevelBtn = document.getElementById("nextLevelBtn");

// Core Terminal Functions
function clearTerminal() {
  terminalLines.innerHTML = "";
  terminalInputPrompt.style.display = "none";
}

function writeToTerminal(text, type = "output") {
  const line = document.createElement("div");
  line.className = `terminal-line ${type}`;
  line.textContent = text;
  terminalLines.appendChild(line);
  terminalBody.scrollTop = terminalBody.scrollHeight;
}

let activePromptResolver = null;

async function requestTerminalInput(promptText) {
  if (promptText) {
    writeToTerminal(promptText, "output");
  }
  
  // Show input field
  terminalInputPrompt.style.display = "flex";
  terminalPromptLabel.textContent = ">>> ";
  terminalInputField.value = "";
  terminalInputField.focus();
  
  terminalBody.scrollTop = terminalBody.scrollHeight;
  
  return new Promise((resolve) => {
    activePromptResolver = resolve;
  });
}

// Listen to terminal input field enter
terminalInputField.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const enteredText = terminalInputField.value;
    terminalInputPrompt.style.display = "none";
    writeToTerminal(`> ${enteredText}`, "output");
    
    if (activePromptResolver) {
      const resolve = activePromptResolver;
      activePromptResolver = null;
      resolve(enteredText);
    }
  }
});

// Focus terminal input if anywhere on terminal body is clicked during input
terminalBody.addEventListener("click", () => {
  if (terminalInputPrompt.style.display === "flex") {
    terminalInputField.focus();
  }
});

// Syntax Highlighting Engine
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlightPython(code) {
  const escaped = escapeHtml(code);
  const tokenRegex = /(\/\/.*|#.*|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:if|elif|else|and|or|not|int)\b|\b(?:print|input)\b|\b\d+\b)/g;

  return escaped.replace(tokenRegex, (match) => {
    if (match.startsWith("#")) {
      return `<span class="hl-comment">${match}</span>`;
    }
    if (match.startsWith('"') || match.startsWith("'")) {
      return `<span class="hl-string">${match}</span>`;
    }
    if (["if", "elif", "else", "and", "or", "not", "int"].includes(match)) {
      return `<span class="hl-keyword">${match}</span>`;
    }
    if (["print", "input"].includes(match)) {
      return `<span class="hl-function">${match}</span>`;
    }
    if (/^\d+$/.test(match)) {
      return `<span class="hl-number">${match}</span>`;
    }
    return match;
  });
}

function updateEditor() {
  const code = editorTextarea.value;
  // Standardize ending to allow trailing newlines
  const codeEnd = code.endsWith("\n") ? code + " " : code;
  editorHighlight.innerHTML = highlightPython(codeEnd);
  
  // Update line numbers
  const linesCount = code.split("\n").length;
  lineNumbers.innerHTML = Array.from({ length: linesCount }, (_, i) => `<div>${i + 1}</div>`).join("");
}

// Sync Editor Scrolling
editorTextarea.addEventListener("scroll", () => {
  editorHighlight.scrollTop = editorTextarea.scrollTop;
  editorHighlight.scrollLeft = editorTextarea.scrollLeft;
  lineNumbers.scrollTop = editorTextarea.scrollTop;
});

// Editor interactions: tab keys, closing brackets, keystroke ticks
editorTextarea.addEventListener("keydown", (e) => {
  if (e.key !== "Shift" && e.key !== "Control" && e.key !== "Alt") {
    playTick();
  }
  
  const start = editorTextarea.selectionStart;
  const end = editorTextarea.selectionEnd;
  const val = editorTextarea.value;

  // Tab key indent
  if (e.key === "Tab") {
    e.preventDefault();
    editorTextarea.value = val.substring(0, start) + "    " + val.substring(end);
    editorTextarea.selectionStart = editorTextarea.selectionEnd = start + 4;
    updateEditor();
  }

  // Bracket auto-closing
  const brackets = { "(": ")", "[": "]", "{": "}", '"': '"', "'": "'" };
  if (brackets[e.key] !== undefined) {
    // Only auto-close quotes if not immediately before characters
    if ((e.key === '"' || e.key === "'") && val.substring(start, start + 1).trim() !== "") {
      return;
    }
    e.preventDefault();
    const close = brackets[e.key];
    editorTextarea.value = val.substring(0, start) + e.key + close + val.substring(end);
    editorTextarea.selectionStart = editorTextarea.selectionEnd = start + 1;
    updateEditor();
  }
});

editorTextarea.addEventListener("input", updateEditor);

// Load state from LocalStorage
function loadProgress() {
  totalXP = parseInt(localStorage.getItem("c2c_xp") || "0", 10);
  completedLevels = JSON.parse(localStorage.getItem("c2c_completed") || "[]");
  unlockedBadges = JSON.parse(localStorage.getItem("c2c_badges") || "[]");
  
  // Set levels unlocked index to first uncompleted level
  let unlockedIndex = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (completedLevels.includes(LEVELS[i].id)) {
      unlockedIndex = i + 1;
    }
  }
  // Cap inside range
  currentLevelIndex = Math.min(unlockedIndex, LEVELS.length - 1);
  currentTaskIndex = 0;
  
  updateSidebar();
  updateXPDisplay();
  loadCurrentLevel();
}

function saveProgress() {
  localStorage.setItem("c2c_xp", totalXP.toString());
  localStorage.setItem("c2c_completed", JSON.stringify(completedLevels));
  localStorage.setItem("c2c_badges", JSON.stringify(unlockedBadges));
}

// XP Progression system
function getCareerTitle(xp) {
  if (xp >= 750) return "Code Architect";
  if (xp >= 450) return "Logic Knight";
  if (xp >= 250) return "Variables Squire";
  if (xp >= 100) return "Logic Surveyor";
  return "Script Apprentice";
}

function updateXPDisplay() {
  rankBadge.textContent = getCareerTitle(totalXP);
  
  // XP Progress towards next rank boundary
  // boundaries: 0 -> 100 -> 250 -> 450 -> 750
  const boundaries = [0, 100, 250, 450, 750];
  let currentBoundaryIdx = 0;
  for (let i = 0; i < boundaries.length; i++) {
    if (totalXP >= boundaries[i]) {
      currentBoundaryIdx = i;
    }
  }
  
  const minXP = boundaries[currentBoundaryIdx];
  const maxXP = boundaries[currentBoundaryIdx + 1] || 1000;
  const currentLevelProgress = totalXP - minXP;
  const levelXPRequired = maxXP - minXP;
  const percentage = Math.min(100, (currentLevelProgress / levelXPRequired) * 100);
  
  xpBarFill.style.width = `${percentage}%`;
  xpValue.textContent = `${totalXP} XP`;
}

// Render Map Sidebar
function updateSidebar() {
  pathMapContainer.innerHTML = "";
  
  LEVELS.forEach((level, index) => {
    const isCompleted = completedLevels.includes(level.id);
    // Unlocked if first level or the previous one is completed
    const isUnlocked = index === 0 || completedLevels.includes(LEVELS[index - 1].id);
    const isActive = index === currentLevelIndex;
    
    const node = document.createElement("div");
    node.className = `level-node ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""} ${!isUnlocked ? "locked" : ""}`;
    
    // Lock character display
    let subtitleText = level.subtitle;
    if (!isUnlocked) {
      subtitleText = "🔒 Locked Episode";
    }
    
    node.innerHTML = `
      <div class="node-dot"></div>
      <div class="node-info">
        <div class="node-title">${level.title}</div>
        <div class="node-subtitle">${subtitleText}</div>
      </div>
    `;
    
    if (isUnlocked) {
      node.addEventListener("click", () => {
        playTick();
        currentLevelIndex = index;
        currentTaskIndex = 0;
        updateSidebar();
        loadCurrentLevel();
      });
    }
    
    pathMapContainer.appendChild(node);
  });
  
  // Badges grid
  badgesGrid.innerHTML = "";
  LEVELS.forEach(level => {
    if (level.badge) {
      const isUnlocked = unlockedBadges.includes(level.badge.name);
      const item = document.createElement("div");
      item.className = `badge-item ${isUnlocked ? "unlocked" : ""}`;
      item.title = level.badge.desc;
      item.innerHTML = `
        <div class="badge-icon">${level.badge.icon}</div>
        <div class="badge-name">${level.badge.name}</div>
      `;
      badgesGrid.appendChild(item);
    }
  });
}

// Set up UI for current Level and Task
function loadCurrentLevel() {
  const level = LEVELS[currentLevelIndex];
  const task = level.tasks[currentTaskIndex];
  
  conceptTitle.textContent = `${level.title} - Task ${currentTaskIndex + 1}`;
  conceptBody.textContent = task.description;
  
  // Set up video thumbnail card
  const currentWrapper = videoContainer.querySelector(".video-thumbnail-wrapper");
  const currentIframe = videoContainer.querySelector("iframe");
  
  if (level.videoId) {
    videoContainer.style.display = "block";
    
    // Only rebuild the thumbnail if we don't have the current video loaded or playing
    const hasCurrentVideo = (currentWrapper && currentWrapper.dataset.videoId === level.videoId) || 
                            (currentIframe && currentIframe.src.includes(level.videoId));
                            
    if (!hasCurrentVideo) {
      const thumbnailUrl = `https://img.youtube.com/vi/${level.videoId}/maxresdefault.jpg`;
      videoContainer.innerHTML = `
        <div class="video-thumbnail-wrapper" data-video-id="${level.videoId}" style="background-image: url('${thumbnailUrl}')">
          <div class="video-play-overlay">
            <div class="play-button-circle" aria-label="Play video guide">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M8 5v14l11-7z" fill="currentColor"></path>
              </svg>
            </div>
          </div>
        </div>
      `;
      
      const wrapper = videoContainer.querySelector(".video-thumbnail-wrapper");
      wrapper.addEventListener("click", () => {
        playTick();
        videoContainer.innerHTML = `
          <iframe src="https://www.youtube.com/embed/${level.videoId}?autoplay=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        `;
      });
    }
  } else {
    videoContainer.style.display = "none";
    videoContainer.innerHTML = "";
  }
  
  // Set up task subgoals checklist
  taskList.innerHTML = "";
  level.tasks.forEach((t, i) => {
    const item = document.createElement("div");
    const isTaskCompleted = i < currentTaskIndex;
    const isTaskActive = i === currentTaskIndex;
    
    item.className = `task-item ${isTaskCompleted ? "completed" : ""} ${isTaskActive ? "active" : ""}`;
    item.innerHTML = `
      <div class="task-checkbox"></div>
      <div class="task-content">
        <div class="task-title">${t.title}</div>
        <div class="task-desc">${t.id === task.id ? "Complete the instructions and submit." : "Pending preceding tasks."}</div>
      </div>
    `;
    taskList.appendChild(item);
  });
  
  // Load code template
  editorTextarea.value = task.defaultCode;
  updateEditor();
}

// Sound toggle controls
soundToggle.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundToggle.textContent = soundEnabled ? "🔊" : "🔇";
  playTick();
});

// Run Code Action
async function executeCode(silent = false) {
  if (!silent) {
    clearTerminal();
    writeToTerminal(">>> Running script.py...", "system");
  }
  
  const code = editorTextarea.value;
  const interpreter = new PythonInterpreter({
    onPrint: (text) => {
      if (!silent) writeToTerminal(text, "output");
    },
    onInput: async (prompt) => {
      if (silent) return "";
      return requestTerminalInput(prompt);
    }
  });
  
  const result = await interpreter.run(code);
  
  if (result.success) {
    if (!silent) writeToTerminal("\nProgram terminated successfully.", "success");
  } else {
    if (!silent) writeToTerminal(`\nTraceback (most recent call):\n  ${result.error}`, "error");
  }
  return result;
}

runBtn.addEventListener("click", () => {
  getAudioContext();
  executeCode(false);
});

// Keyboard shortcut (Ctrl+Enter) to run code
window.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "Enter") {
    e.preventDefault();
    runBtn.click();
  }
});

// Submit Logic with Branch/Multi-Test Validation
async function verifySubmission() {
  getAudioContext();
  const code = editorTextarea.value;
  const level = LEVELS[currentLevelIndex];
  const task = level.tasks[currentTaskIndex];
  
  clearTerminal();
  writeToTerminal(">>> Running automated verification checks...", "system");
  
  // Map target tests based on active Level Task
  let tests = [];
  if (task.id === "1_1") {
    tests = [{ inputs: [], check: (output) => output.trim() === "Hello World" }];
  } else if (task.id === "1_2") {
    tests = [
      { inputs: [], check: (output) => output.includes("2027") || output.includes("15") }
    ];
  } else if (task.id === "2_1") {
    tests = [{ inputs: ["Ready!"], check: (output, vars, capInputs) => capInputs.length > 0 }];
  } else if (task.id === "2_2") {
    tests = [{ inputs: ["Python"], check: (output) => output.includes("Python") }];
  } else if (task.id === "3_1") {
    tests = [
      { inputs: ["Alice"], check: (output, vars) => vars.username === "Alice" && output.toLowerCase().includes("hello alice") }
    ];
  } else if (task.id === "3_2") {
    tests = [{ inputs: [], check: (output, vars) => vars.number === 15 && output.includes("Greater") }];
  } else if (task.id === "4_1") {
    // Check all branches of the conditional structures
    tests = [
      { inputs: ["95"], check: (output) => output.includes("Grade A") },
      { inputs: ["70"], check: (output) => output.includes("Grade B") },
      { inputs: ["40"], check: (output) => output.includes("Grade F") }
    ];
  }
  
  let allPassed = true;
  let errorMessage = "";
  
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    const testOutputs = [];
    let inputIdx = 0;
    
    const testInterpreter = new PythonInterpreter({
      onPrint: (text) => testOutputs.push(text),
      onInput: async () => {
        const val = test.inputs[inputIdx++];
        return val !== undefined ? val : "";
      }
    });
    
    const result = await testInterpreter.run(code);
    const combinedOutput = testOutputs.join("\n");
    
    if (!result.success) {
      allPassed = false;
      errorMessage = `Syntax or Logic Error: ${result.error}`;
      break;
    }
    
    const validationResult = task.validate(combinedOutput, result.variables, code, test.inputs, result.capturedInputs);
    if (validationResult !== true) {
      allPassed = false;
      errorMessage = typeof validationResult === "string" ? validationResult : "Output evaluation failed.";
      break;
    }
    
    // Check custom callback validator rules
    if (!test.check(combinedOutput, result.variables, result.capturedInputs)) {
      allPassed = false;
      errorMessage = `Incorrect logic branching behavior for inputs [${test.inputs.join(", ")}].`;
      break;
    }
  }
  
  if (allPassed) {
    playSuccess();
    writeToTerminal("\n✔ STATUS: ALL TESTS PASSED SUCCESSFULLY!", "success");
    handleTaskSuccess();
  } else {
    playError();
    writeToTerminal(`\n❌ ERROR: Validation failed.\nDetails: ${errorMessage}`, "error");
  }
}

submitBtn.addEventListener("click", verifySubmission);

// Logic when a subtask or overall level succeeds
function handleTaskSuccess() {
  const level = LEVELS[currentLevelIndex];
  
  // Check if there are more tasks in the level
  if (currentTaskIndex < level.tasks.length - 1) {
    currentTaskIndex++;
    setTimeout(() => {
      loadCurrentLevel();
      writeToTerminal("\nTask complete! Load next instruction.", "success");
    }, 1000);
  } else {
    // Current level is completed
    setTimeout(() => {
      triggerLevelCompletion();
    }, 1000);
  }
}

function triggerLevelCompletion() {
  const level = LEVELS[currentLevelIndex];
  
  // Award XP
  const xpReward = level.xpReward;
  totalXP += xpReward;
  
  // Check if level was already completed
  const isFirstCompletion = !completedLevels.includes(level.id);
  if (isFirstCompletion) {
    completedLevels.push(level.id);
    if (level.badge) {
      unlockedBadges.push(level.badge.name);
    }
  }
  
  saveProgress();
  playLevelUp();
  
  // Populate Level Up celebration modal
  modalTitle.textContent = `Episode Completed!`;
  modalSubtitle.textContent = `You have mastered the concepts of: ${level.title}`;
  xpEarnedVal.textContent = `+${xpReward} XP`;
  rankEarnedVal.textContent = getCareerTitle(totalXP);
  
  if (level.badge && isFirstCompletion) {
    badgeEarnedRow.style.display = "flex";
    badgeEarnedVal.textContent = `${level.badge.icon} ${level.badge.name}`;
  } else {
    badgeEarnedRow.style.display = "none";
  }
  
  celebrationModal.classList.add("active");
}

nextLevelBtn.addEventListener("click", () => {
  celebrationModal.classList.remove("active");
  
  // Advance currentLevelIndex if possible
  if (currentLevelIndex < LEVELS.length - 1) {
    currentLevelIndex++;
    currentTaskIndex = 0;
  }
  
  updateSidebar();
  updateXPDisplay();
  loadCurrentLevel();
  clearTerminal();
});

// Reset template logic
resetBtn.addEventListener("click", () => {
  playTick();
  const task = LEVELS[currentLevelIndex].tasks[currentTaskIndex];
  editorTextarea.value = task.defaultCode;
  updateEditor();
});

// Init
window.addEventListener("DOMContentLoaded", () => {
  loadProgress();
});
