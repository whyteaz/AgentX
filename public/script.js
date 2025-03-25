document.addEventListener('DOMContentLoaded', async () => {
  // Skip fullPage-related code on login page
  if (window.location.pathname.includes('login')) {
    return;
  }
  
  // Checkbox functionality for troll lord and multiple profiles
  const trollLordCheckbox = document.getElementById('trollLord');
  const trolllordImg = document.getElementById('trolllordImg');
  if (trollLordCheckbox && trolllordImg) {
    trollLordCheckbox.addEventListener('change', () => {
      trolllordImg.classList.toggle('hidden', !trollLordCheckbox.checked);
    });
  }
  
  const multipleProfilesCheckbox = document.getElementById('multipleProfiles');
  const multipleProfilesImg = document.getElementById('multipleProfilesImg');
  const profileUrlsInput = document.getElementById('profileUrls');
  
  if (multipleProfilesCheckbox && multipleProfilesImg && profileUrlsInput) {
    // Set initial class
    profileUrlsInput.classList.add('single-profile');
    
    multipleProfilesCheckbox.addEventListener('change', () => {
      multipleProfilesImg.classList.toggle('hidden', !multipleProfilesCheckbox.checked);
      
      // Update textarea classes and placeholder
      if (multipleProfilesCheckbox.checked) {
        profileUrlsInput.classList.remove('single-profile');
        profileUrlsInput.classList.add('multiple-profiles');
        profileUrlsInput.placeholder = "https://twitter.com/username1\nhttps://twitter.com/username2\nhttps://twitter.com/username3";
      } else {
        profileUrlsInput.classList.remove('multiple-profiles');
        profileUrlsInput.classList.add('single-profile');
        profileUrlsInput.placeholder = "https://twitter.com/username";
      }
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
  const BOOTLICK_TIMER_KEY = 'bootlickSubmissionTimerEnd';
  
  // Get both submit buttons
  const submitBtn = document.getElementById('submitBtn');
  const bootlickSubmitBtn = document.getElementById('bootlickSubmitBtn');
  
  // Get both timer elements
  const timerEl = document.getElementById('timer');
  const bootlickTimerEl = document.getElementById('bootlickTimer');

  function startTimer(type = 'troll', endTime = Date.now() + COUNTDOWN_DURATION * 1000) {
    const timerKey = type === 'bootlick' ? BOOTLICK_TIMER_KEY : TIMER_KEY;
    const timerElement = type === 'bootlick' ? bootlickTimerEl : timerEl;
    const submitButton = type === 'bootlick' ? bootlickSubmitBtn : submitBtn;
    
    localStorage.setItem(timerKey, endTime);
    
    if (submitButton) submitButton.disabled = true;
    
    updateTimer(type);
    clearInterval(window[`${type}TimerInterval`]);
    window[`${type}TimerInterval`] = setInterval(() => updateTimer(type), 1000);
  }

  function updateTimer(type = 'troll') {
    const timerKey = type === 'bootlick' ? BOOTLICK_TIMER_KEY : TIMER_KEY;
    const timerElement = type === 'bootlick' ? bootlickTimerEl : timerEl;
    const submitButton = type === 'bootlick' ? bootlickSubmitBtn : submitBtn;
    
    const endTime = parseInt(localStorage.getItem(timerKey), 10);
    const timeLeft = Math.floor((endTime - Date.now()) / 1000);
    
    if (timeLeft > 0) {
      if (timerElement) {
        timerElement.textContent = `Please wait ${timeLeft} seconds before trying again.`;
        timerElement.style.color = '#e74c3c';
      }
      if (submitButton) submitButton.disabled = true;
    } else {
      clearInterval(window[`${type}TimerInterval`]);
      if (timerElement) timerElement.textContent = '';
      if (submitButton) submitButton.disabled = false;
      localStorage.removeItem(timerKey);
    }
  }

  // Check timers on page load
  const storedTrollEndTime = localStorage.getItem(TIMER_KEY);
  if (storedTrollEndTime && Date.now() < parseInt(storedTrollEndTime, 10)) {
    startTimer('troll', parseInt(storedTrollEndTime, 10));
  } else {
    if (submitBtn) submitBtn.disabled = false;
  }
  
  const storedBootlickEndTime = localStorage.getItem(BOOTLICK_TIMER_KEY);
  if (storedBootlickEndTime && Date.now() < parseInt(storedBootlickEndTime, 10)) {
    startTimer('bootlick', parseInt(storedBootlickEndTime, 10));
  } else {
    if (bootlickSubmitBtn) bootlickSubmitBtn.disabled = false;
  }

  // Form submission - Trolling
  const trollForm = document.getElementById('tweetForm');
  const trollResponseArea = document.getElementById('responseArea');
  
  if (trollForm) {
    trollForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (trollResponseArea) {
        trollResponseArea.innerHTML = `
          <div class="spinner-container">
            <div class="spinner"></div>
            <p style="margin-top: 15px; color: #555;">Processing request...</p>
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
          if (trollResponseArea) trollResponseArea.innerHTML = `<p style="color: #ef4444; font-weight: 500;">Error: ${data.error}</p>`;
          if (submitBtn) submitBtn.disabled = false;
          return;
        }
        
        // Display response
        if (data.data) {
          // Standard mode response
          if (trollResponseArea) {
            // Get Twitter Reply URL
            const replyResp = data.data.replyResponse;
            const twitterReplyId = replyResp?.data?.id || replyResp?.id || null;
            const twitterReplyUrl = twitterReplyId 
              ? `https://twitter.com/i/web/status/${twitterReplyId}` 
              : "N/A";
              
            trollResponseArea.innerHTML = `
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
          if (trollResponseArea) {
            trollResponseArea.innerHTML = `<p style="color: #10b981; font-weight: 500;">${data.message}</p>`;
          }
        }
        
        startTimer('troll');
      } catch (error) {
        if (trollResponseArea) trollResponseArea.innerHTML = `<p style="color: #ef4444; font-weight: 500;">Error: ${error.message}</p>`;
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
  
  // Form submission - Bootlicking
  const bootlickForm = document.getElementById('bootlickForm');
  const bootlickResponseArea = document.getElementById('bootlickResponseArea');
  
  if (bootlickForm) {
    bootlickForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (bootlickResponseArea) {
        bootlickResponseArea.innerHTML = `
          <div class="spinner-container">
            <div class="spinner"></div>
            <p style="margin-top: 15px; color: #555;">Processing request...</p>
          </div>
        `;
      }
      
      if (bootlickSubmitBtn) bootlickSubmitBtn.disabled = true;

      try {
        // Get form data
        const profileUrls = document.getElementById('profileUrls').value;
        const multipleProfiles = document.getElementById('multipleProfiles').checked;
        
        // Call API
        const params = new URLSearchParams({ profileUrls, multipleProfiles });
        const res = await fetch('/bootlick', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString()
        });
        
        const data = await res.json();
        
        if (data.error) {
          if (bootlickResponseArea) bootlickResponseArea.innerHTML = `<p style="color: #ef4444; font-weight: 500;">Error: ${data.error}</p>`;
          if (bootlickSubmitBtn) bootlickSubmitBtn.disabled = false;
          return;
        }
        
        // Display response
        if (data.data) {
          // Standard mode response (single profile)
          if (bootlickResponseArea) {
            // Get Twitter Reply URL
            const replyResp = data.data.replyResponse;
            const twitterReplyId = replyResp?.data?.id || replyResp?.id || null;
            const twitterReplyUrl = twitterReplyId 
              ? `https://twitter.com/i/web/status/${twitterReplyId}` 
              : "N/A";
              
            bootlickResponseArea.innerHTML = `
              <div>
                <p style="margin-bottom: 15px;"><strong>Bootlicking Response: </strong></br>${data.data.bootlickResponse}</p>
                <p style="margin-bottom: 15px;"><strong>Original Tweet: </strong></br>${data.data.tweetContent}</p>
                <p style="margin-bottom: 15px;"><strong>Profile: </strong></br>${data.data.username}</p>
                <p><strong>Twitter Reply URL: </strong> ${
                  twitterReplyUrl !== "N/A"
                    ? `<a href="${twitterReplyUrl}" target="_blank" style="color: #4361ee; text-decoration: underline;"></br>${twitterReplyUrl}</a>`
                    : "N/A"
                }</p>
              </div>
            `;
          }
        } else if (data.message) {
          // Multiple profiles mode response
          if (bootlickResponseArea) {
            // Use different color based on status
            const statusColor = data.status === "Warning" ? "#f59e0b" : "#10b981";
            bootlickResponseArea.innerHTML = `<p style="color: ${statusColor}; font-weight: 500;">${data.message}</p>`;
          }
        }
        
        startTimer('bootlick');
      } catch (error) {
        if (bootlickResponseArea) bootlickResponseArea.innerHTML = `<p style="color: #ef4444; font-weight: 500;">Error: ${error.message}</p>`;
        if (bootlickSubmitBtn) bootlickSubmitBtn.disabled = false;
      }
    });
  }

  // Toggle logs
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