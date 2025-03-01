// public/script.js
const form = document.getElementById('tweetForm');
const responseArea = document.getElementById('responseArea');
const submitBtn = document.getElementById('submitBtn');
const timerEl = document.getElementById('timer');
let timerInterval;

const COUNTDOWN_DURATION = 900; // 15 minutes in seconds
const TIMER_KEY = 'submissionTimerEnd';

// Spinner HTML using Tailwind CSS
const spinnerHTML = `
  <div class="flex justify-center items-center py-4">
    <svg class="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
    </svg>
  </div>
`;

// Start or resume the countdown timer
function startTimer(endTime) {
  if (!endTime) {
    endTime = Date.now() + COUNTDOWN_DURATION * 1000;
    localStorage.setItem(TIMER_KEY, endTime);
  }
  submitBtn.disabled = true;
  updateTimer();
  timerInterval = setInterval(() => { updateTimer(); }, 1000);
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

// AI Agent form submission handler
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  responseArea.innerHTML = spinnerHTML;
  submitBtn.disabled = true;
  
  const formData = new FormData(form);
  const params = new URLSearchParams();
  for (const pair of formData.entries()) {
    params.append(pair[0], pair[1]);
  }
  
  try {
    const res = await fetch('/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const data = await res.json();
    
    const nearTxUrl = data.data && data.data.nearTxHash && data.data.nearTxHash !== "N/A" 
      ? `<a href="https://testnet.nearblocks.io/tx/${data.data.nearTxHash}" target="_blank" class="text-blue-600 underline">${data.data.nearTxHash}</a>`
      : "N/A";
    
    const replyResp = data.data && data.data.replyResponse;
    const twitterReplyId = replyResp && replyResp.data && replyResp.data.id 
                            ? replyResp.data.id 
                            : replyResp && replyResp.id 
                              ? replyResp.id 
                              : null;
    const twitterReplyUrl = twitterReplyId 
      ? `https://twitter.com/i/web/status/${twitterReplyId}` 
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
        <h3 class="text-xl font-semibold text-blue-700">Twitter Reply URL</h3>
        <p>${twitterReplyUrl !== "N/A" ? `<a href="${twitterReplyUrl}" target="_blank" class="text-blue-600 underline">${twitterReplyUrl}</a>` : "N/A"}</p>
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
  
  startTimer();
});
