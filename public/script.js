// public/script.js

// Constants for timer and polling intervals.
const COUNTDOWN_DURATION = 900; // 15 minutes in seconds
const TIMER_KEY = 'submissionTimerEnd';

// Helper: Single collapse toggle function.
function toggleCollapse(contentId) {
  const content = document.getElementById(contentId);
  const iconId = contentId === 'logContent' ? 'logToggleIcon' : 'howItWorksToggleIcon';
  const icon = document.getElementById(iconId);
  content.classList.toggle('hidden');
  icon.classList.toggle('rotate-180');
}

// DOM Elements
const form = document.getElementById('tweetForm');
const responseArea = document.getElementById('responseArea');
const submitBtn = document.getElementById('submitBtn');
const timerEl = document.getElementById('timer');
const trollLordCheckbox = document.getElementById('trollLord');
const trollLordImg = document.getElementById('trolllordImg');

// Spinner HTML (Tailwind CSS)
const spinnerHTML = `
  <div class="flex justify-center items-center py-4">
    <svg class="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
    </svg>
  </div>
`;

// Dark mode toggle for Troll Lord
trollLordCheckbox.addEventListener('change', () => {
  document.body.classList.toggle('dark', trollLordCheckbox.checked);
  trollLordImg.classList.toggle('hidden', !trollLordCheckbox.checked);
});

// Timer functions
function startTimer(endTime = Date.now() + COUNTDOWN_DURATION * 1000) {
  localStorage.setItem(TIMER_KEY, endTime);
  submitBtn.disabled = true;
  updateTimer();
  clearInterval(window.timerInterval);
  window.timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
  const endTime = parseInt(localStorage.getItem(TIMER_KEY), 10);
  const timeLeft = Math.floor((endTime - Date.now()) / 1000);
  if (timeLeft > 0) {
    timerEl.textContent = `Please wait ${timeLeft} seconds before trying again.`;
    submitBtn.disabled = true;
  } else {
    clearInterval(window.timerInterval);
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

// API call helper.
async function callTrigger(replyCount) {
  const tweetLink = document.getElementById('tweetLink').value;
  const trollLord = trollLordCheckbox.checked;
  const params = new URLSearchParams({ tweetLink, trollLord });
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

  try {
    const data = await callTrigger();

    // Check for errors in the API response.
    if (data.error) {
      responseArea.innerHTML = `<p class="text-red-600 font-semibold">Error occurred: ${data.error}</p>`;
      submitBtn.disabled = false;
      return;
    }

    // Validate that data.data exists.
    if (!data.data) {
      responseArea.innerHTML = `<p class="text-red-600 font-semibold">Error: Unexpected response format.</p>`;
      submitBtn.disabled = false;
      return;
    }

    const replyResp = data.data.replyResponse;
    const twitterReplyId = replyResp?.data?.id || replyResp?.id || null;
    const twitterReplyUrl = twitterReplyId 
      ? `https://twitter.com/i/web/status/${twitterReplyId}` 
      : "N/A";

    responseArea.innerHTML = `
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
      </div>
    `;
    startTimer();
  } catch (error) {
    responseArea.innerHTML = `<p class="text-red-600 font-semibold">Error occurred: ${error.message}</p>`;
    submitBtn.disabled = false;
  }
});

// Poll server logs every 5 seconds.
function pollLogs() {
  fetch("/logs")
    .then(response => response.json())
    .then(data => {
      document.getElementById("logOutput").innerText = data.logs.join("\n");
    })
    .catch(err => console.error("Error fetching logs:", err));
}
setInterval(pollLogs, 5000);
pollLogs();
