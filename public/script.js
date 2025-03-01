// public/script.js
const form = document.getElementById('tweetForm');
const responseArea = document.getElementById('responseArea');
const submitBtn = document.getElementById('submitBtn');
const timerEl = document.getElementById('timer');
const trollLordCheckbox = document.getElementById('trollLord');
const trollLordImg = document.getElementById('trolllordImg');
let timerInterval;
let pollInterval;

const COUNTDOWN_DURATION = 900; // 15 minutes in seconds
const TIMER_KEY = 'submissionTimerEnd';
const POLL_INTERVAL = 60 * 1000; // 1 minute

// Spinner HTML using Tailwind CSS
const spinnerHTML = `
  <div class="flex justify-center items-center py-4">
    <svg class="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
    </svg>
  </div>
`;

// Toggle dark mode and image display based on Troll Lord checkbox.
trollLordCheckbox.addEventListener('change', () => {
  if (trollLordCheckbox.checked) {
    document.body.classList.add('dark');
    trollLordImg.classList.remove('hidden');
  } else {
    document.body.classList.remove('dark');
    trollLordImg.classList.add('hidden');
  }
});

// Start or resume the countdown timer.
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

document.addEventListener('DOMContentLoaded', () => {
  const storedEndTime = localStorage.getItem(TIMER_KEY);
  if (storedEndTime && Date.now() < parseInt(storedEndTime, 10)) {
    startTimer(parseInt(storedEndTime, 10));
  } else {
    submitBtn.disabled = false;
  }
});

// Function to call /trigger endpoint with an optional replyCount.
async function callTrigger(replyCount) {
  const tweetLink = document.getElementById('tweetLink').value;
  const params = new URLSearchParams();
  params.append('tweetLink', tweetLink);
  if (replyCount !== undefined) {
    params.append('replyCount', replyCount);
  }
  try {
    const res = await fetch('/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    return await res.json();
  } catch (error) {
    return { error: error.toString() };
  }
}

// Function to poll /troll-status for Troll Lord mode.
async function pollTrollStatus() {
  const tweetLink = document.getElementById('tweetLink').value;
  try {
    const res = await fetch(`/troll-status?tweetLink=${encodeURIComponent(tweetLink)}`);
    const data = await res.json();
    updateTrollStatusUI(data.data);
  } catch (error) {
    console.error("Error polling troll status:", error);
  }
}

// Update response area UI for Troll Lord mode.
function updateTrollStatusUI(statusArray) {
  let html = `<p class="text-blue-600 font-semibold">Troll Lord mode in progress...</p>`;
  if (!statusArray || statusArray.length === 0) {
    html += `<p>It is 10 freaking trolling, come back in a bit.</p>`;
  } else {
    statusArray.forEach(item => {
      const replyInfo = item.result ? `Reply #${item.replyNumber}: ${JSON.stringify(item.result)}` : `Reply #${item.replyNumber} Error: ${item.error}`;
      html += `<div class="border-b pb-2"><p>${replyInfo}</p></div>`;
    });
  }
  responseArea.innerHTML = html;
}

// Start polling for Troll Lord mode.
function startPolling() {
  pollTrollStatus();
  pollInterval = setInterval(pollTrollStatus, POLL_INTERVAL);
}

// Form submission handler.
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  responseArea.innerHTML = spinnerHTML;
  submitBtn.disabled = true;
  
  const isTrollLord = trollLordCheckbox.checked;
  if (isTrollLord) {
    // For Troll Lord mode, show spinner and call trigger; scheduling remains server-side.
    const resData = await callTrigger();
    responseArea.innerHTML = `<p class="text-blue-600 font-semibold">Troll Lord mode activated: 10 replies scheduled.</p>`;
    startPolling();
  } else {
    const data = await callTrigger();
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
      <div class="space-y-4">
        <div>
          <h3 class="text-xl font-semibold text-blue-700">Tweet ID</h3>
          <p class="text-gray-800">${data.data.tweetId}</p>
        </div>
        <div>
          <h3 class="text-xl font-semibold text-blue-700">Tweet Content</h3>
          <p class="text-gray-800">${data.data.tweetContent}</p>
        </div>
        <div>
          <h3 class="text-xl font-semibold text-blue-700">Trolling Response</h3>
          <p class="text-gray-800">${data.data.trollResponse}</p>
        </div>
        <div>
          <h3 class="text-xl font-semibold text-blue-700">Twitter Reply URL</h3>
          <p class="text-gray-800">${twitterReplyUrl !== "N/A" ? `<a href="${twitterReplyUrl}" target="_blank" class="text-blue-600 underline">${twitterReplyUrl}</a>` : "N/A"}</p>
        </div>
        <div>
          <h3 class="text-xl font-semibold text-blue-700">NEAR Log Transaction</h3>
          <p class="text-gray-800">${nearTxUrl}</p>
        </div>
      </div>
    `;
    responseArea.innerHTML = html;
  }
  
  if (!isTrollLord) {
    startTimer();
  }
});
