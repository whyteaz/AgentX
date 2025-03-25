document.addEventListener('DOMContentLoaded', async () => {
  // Skip fullPage-related code on login page
  if (window.location.pathname.includes('login')) {
    return;
  }
  // Troll Lord checkbox functionality
  const trollLordCheckbox = document.getElementById('trollLord');
  const trolllordImg = document.getElementById('trolllordImg');
  if (trollLordCheckbox && trolllordImg) {
    trollLordCheckbox.addEventListener('change', () => {
      trolllordImg.classList.toggle('hidden', !trollLordCheckbox.checked);
    });
  }

  // Fetch Supabase configuration
  let supaConfig;
  try {
    const res = await fetch('/api/config');
    supaConfig = await res.json();
    const supabaseClient = supabase.createClient(supaConfig.supabaseUrl, supaConfig.supabaseAnonKey);
    window.supabaseClient = supabaseClient;
    
    // Check session
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session && !window.location.pathname.endsWith("login.html")) {
      window.location.href = '/login.html';
      return;
    }
  } catch (error) {
    console.error("Error with Supabase config:", error);
  }
  
  // Timer functionality
  const COUNTDOWN_DURATION = 900; // 15 minutes in seconds
  const TIMER_KEY = 'submissionTimerEnd';
  const submitBtn = document.getElementById('submitBtn');
  const timerEl = document.getElementById('timer');

  function startTimer(endTime = Date.now() + COUNTDOWN_DURATION * 1000) {
    localStorage.setItem(TIMER_KEY, endTime);
    if (submitBtn) submitBtn.disabled = true;
    updateTimer();
    clearInterval(window.timerInterval);
    window.timerInterval = setInterval(updateTimer, 1000);
  }

  function updateTimer() {
    const endTime = parseInt(localStorage.getItem(TIMER_KEY), 10);
    const timeLeft = Math.floor((endTime - Date.now()) / 1000);
    if (timeLeft > 0) {
      if (timerEl) timerEl.textContent = `Please wait ${timeLeft} seconds before trying again.`;
      if (submitBtn) submitBtn.disabled = true;
    } else {
      clearInterval(window.timerInterval);
      if (timerEl) timerEl.textContent = '';
      if (submitBtn) submitBtn.disabled = false;
      localStorage.removeItem(TIMER_KEY);
    }
  }

  // Check timer on page load
  const storedEndTime = localStorage.getItem(TIMER_KEY);
  if (storedEndTime && Date.now() < parseInt(storedEndTime, 10)) {
    startTimer(parseInt(storedEndTime, 10));
  } else {
    if (submitBtn) submitBtn.disabled = false;
  }

  // Form submission
  const form = document.getElementById('tweetForm');
  const responseArea = document.getElementById('responseArea');
  
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (responseArea) {
        responseArea.innerHTML = `
          <div class="spinner-container">
            <div class="spinner"></div>
            <p style="margin-top: 15px; color: rgba(255, 255, 255, 0.8);">Processing request...</p>
          </div>
        `;
      }
      
      if (submitBtn) submitBtn.disabled = true;

      try {
        // Get form data
        const tweetLink = document.getElementById('tweetLink').value;
        const trollLord = document.getElementById('trollLord').checked;
        
        // Call API
        const params = new URLSearchParams({ tweetLink, trollLord });
        const res = await fetch('/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString()
        });
        
        const data = await res.json();
        
        if (data.error) {
          if (responseArea) responseArea.innerHTML = `<p style="color: #ef4444; font-weight: 500;">Error: ${data.error}</p>`;
          if (submitBtn) submitBtn.disabled = false;
          return;
        }
        
        // Display response
        if (data.data) {
          // Standard mode response
          if (responseArea) {
            // Get Twitter Reply URL
            const replyResp = data.data.replyResponse;
            const twitterReplyId = replyResp?.data?.id || replyResp?.id || null;
            const twitterReplyUrl = twitterReplyId 
              ? `https://twitter.com/i/web/status/${twitterReplyId}` 
              : "N/A";
              
            responseArea.innerHTML = `
              <div>
                <p style="margin-bottom: 15px;"><strong>Trolling Response: </strong></br>${data.data.trollResponse}</p>
                <p style="margin-bottom: 15px;"><strong>Original Tweet: </strong></br>${data.data.tweetContent}</p>
                <p><strong>Twitter Reply URL: </strong> ${
                  twitterReplyUrl !== "N/A"
                    ? `<a href="${twitterReplyUrl}" target="_blank" style="color: #4361ee; text-decoration: underline;"></br>${twitterReplyUrl}</a>`
                    : "N/A"
                }</p>
              </div>
            `;
          }
        } else if (data.message) {
          // Troll Lord mode response
          if (responseArea) {
            responseArea.innerHTML = `<p style="color: #10b981; font-weight: 500;">${data.message}</p>`;
          }
        }
        
        startTimer();
      } catch (error) {
        if (responseArea) responseArea.innerHTML = `<p style="color: #ef4444; font-weight: 500;">Error: ${error.message}</p>`;
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  // Add to script.js
  window.toggleLogs = function() {
    const content = document.getElementById('logContent');
    const icon = document.getElementById('logToggleIcon');
    
    if (content && icon) {
      content.classList.toggle('hidden');
      icon.style.transform = content.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
    }
  }

  // Function to poll logs
  function pollLogs() {
    fetch("/logs")
      .then(response => response.json())
      .then(data => {
        const logOutput = document.getElementById("logOutput");
        if (logOutput) logOutput.innerText = data.logs.join("\n");
      })
      .catch(err => console.error("Error fetching logs:", err));
  }
  // Poll logs every 5 seconds
  setInterval(pollLogs, 5000);
  pollLogs(); // Initial poll

});