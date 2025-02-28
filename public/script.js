const form = document.getElementById('tweetForm');
const responseArea = document.getElementById('responseArea');
const submitBtn = document.getElementById('submitBtn');
const timerEl = document.getElementById('timer');
let timerInterval;

const COUNTDOWN_DURATION = 900; // 15 minutes in seconds
const TIMER_KEY = 'submissionTimerEnd';

// Utility delay function
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Start or resume the countdown timer
function startTimer(endTime) {
  // Set endTime if not provided (new countdown)
  if (!endTime) {
    endTime = Date.now() + COUNTDOWN_DURATION * 1000;
    localStorage.setItem(TIMER_KEY, endTime);
  }

  submitBtn.disabled = true;
  updateTimer();

  timerInterval = setInterval(() => {
    updateTimer();
  }, 1000);
}

function updateTimer() {
  const endTime = parseInt(localStorage.getItem(TIMER_KEY), 10);
  const timeLeft = Math.floor((endTime - Date.now()) / 1000);
  
  if (timeLeft > 0) {
    timerEl.textContent = `Please wait ${timeLeft} seconds before trying again.`;
    submitBtn.disabled = true;
  } else {
    clearInterval(timerInterval);
    timerEl.textContent = '';
    submitBtn.disabled = false;
    localStorage.removeItem(TIMER_KEY);
  }
}

// Check if there's an active timer on page load
document.addEventListener('DOMContentLoaded', () => {
  const storedEndTime = localStorage.getItem(TIMER_KEY);
  if (storedEndTime && Date.now() < parseInt(storedEndTime, 10)) {
    startTimer(parseInt(storedEndTime, 10));
  } else {
    submitBtn.disabled = false;
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  responseArea.textContent = '';
  submitBtn.disabled = true;
  
  const tweetLink = document.getElementById('tweetLink').value;
  
  try {
    const res = await fetch('/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ tweetLink })
    });
    const data = await res.json();
    responseArea.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    responseArea.textContent = 'Error: ' + error;
  }
  
  // Start (or restart) the 15-minute countdown timer
  startTimer();
});
