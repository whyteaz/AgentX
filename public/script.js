const form = document.getElementById('tweetForm');
const responseArea = document.getElementById('responseArea');
const submitBtn = document.getElementById('submitBtn');
const timerEl = document.getElementById('timer');
let timerInterval;

const COUNTDOWN_DURATION = 900; // 15 minutes in seconds
const TIMER_KEY = 'submissionTimerEnd';

// Utility function to delay execution
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Start or resume the countdown timer
function startTimer(endTime) {
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

// On page load, resume timer if exists
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
  responseArea.innerHTML = ''; // Clear previous response
  submitBtn.disabled = true;
  
  const tweetLink = document.getElementById('tweetLink').value;
  
  try {
    const res = await fetch('/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ tweetLink })
    });
    const data = await res.json();
    
    // Format the response in a human-readable layout
    const nearTxUrl = data.data.nearTxHash && data.data.nearTxHash !== "N/A" 
      ? `<a href="https://testnet.nearblocks.io/tx/${data.data.nearTxHash}" target="_blank" class="text-blue-600 underline">${data.data.nearTxHash}</a>`
      : "N/A";
    
    const html = `
      <div>
        <h3 class="text-xl font-semibold text-blue-700">Tweet ID</h3>
        <p>${data.data.tweetId}</p>
      </div>
      <div>
        <h3 class="text-xl font-semibold text-blue-700">Tweet Content</h3>
        <p>${data.data.tweetContent}</p>
      </div>
      <div>
        <h3 class="text-xl font-semibold text-blue-700">Trolling Response</h3>
        <p>${data.data.trollResponse}</p>
      </div>
      <div>
        <h3 class="text-xl font-semibold text-blue-700">Twitter Reply Response</h3>
        <pre class="whitespace-pre-wrap">${JSON.stringify(data.data.replyResponse, null, 2)}</pre>
      </div>
      <div>
        <h3 class="text-xl font-semibold text-blue-700">NEAR Log Transaction</h3>
        <p>${nearTxUrl}</p>
      </div>
    `;
    responseArea.innerHTML = html;
  } catch (error) {
    responseArea.textContent = 'Error: ' + error;
  }
  
  // Start the 15-minute countdown timer after submission
  startTimer();
});
