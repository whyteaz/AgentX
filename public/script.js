// public/script.js

// Collapse toggle function moved from index.html
function toggleCollapse(contentId) {
  const content = document.getElementById(contentId);
  // Determine the icon based on contentId
  const iconId = (contentId === 'logContent') ? 'logToggleIcon' : 'testTransferToggleIcon';
  const icon = document.getElementById(iconId);
  if (content.classList.contains('hidden')) {
    content.classList.remove('hidden');
    icon.classList.add('rotate-180');
  } else {
    content.classList.add('hidden');
    icon.classList.remove('rotate-180');
  }
}

// Existing script.js content follows...

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
const POLL_INTERVAL = 15 * 60 * 1000; // 15 minutes in ms for mention polling

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
  const hotWallet = document.getElementById('hotWallet').value; // Capture HOT wallet address
  const params = new URLSearchParams();
  params.append('tweetLink', tweetLink);
  params.append('hotWallet', hotWallet); // Include HOT wallet address
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

// Form submission handler.
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  responseArea.innerHTML = spinnerHTML;
  submitBtn.disabled = true;
  
  const isTrollLord = trollLordCheckbox.checked;
  if (isTrollLord) {
    const resData = await callTrigger();
    responseArea.innerHTML = `<p class="text-blue-600 font-semibold">Troll Lord mode activated: 10 replies scheduled.</p>`;
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

// Test transfer button functionality
const testTransferBtn = document.getElementById('testTransferBtn');
const testTransferResult = document.getElementById('testTransferResult');

if (testTransferBtn) {
  testTransferBtn.addEventListener('click', async () => {
    try {
      const res = await fetch('/test-transfer?wallet=example.hotwallet&amount=1');
      const data = await res.json();
      console.log("Test Transfer Result:", data);
      testTransferResult.textContent = JSON.stringify(data);
    } catch (err) {
      console.error("Error testing transfer:", err);
      testTransferResult.textContent = "Error testing transfer: " + err.toString();
    }
  });
}

// New function to poll server logs and display in the "Server Logs" section
function pollLogs() {
  fetch("/logs")
    .then(response => response.json())
    .then(data => {
      document.getElementById("logOutput").innerText = data.logs.join("\n");
    })
    .catch(err => console.error("Error fetching logs:", err));
}
setInterval(pollLogs, 5000); // Update logs every 5 seconds
pollLogs();

// Collapse toggle function moved from index.html
function toggleCollapse(contentId) {
    const content = document.getElementById(contentId);
    // Determine the icon based on contentId
    const iconId = (contentId === 'logContent') ? 'logToggleIcon' : 'testTransferToggleIcon';
    const icon = document.getElementById(iconId);
    if (content.classList.contains('hidden')) {
      content.classList.remove('hidden');
      icon.classList.add('rotate-180');
    } else {
      content.classList.add('hidden');
      icon.classList.remove('rotate-180');
    }
  }