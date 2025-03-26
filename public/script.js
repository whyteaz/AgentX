// Constants
const CONFIG = {
  POLL_INTERVAL: 15000,
  COUNTDOWN_DURATION: 900,
  TIMER_KEYS: {
    TROLL: 'submissionTimerEnd',
    BOOTLICK: 'bootlickSubmissionTimerEnd'
  },
  DEBOUNCE_DELAY: 500
};

// Utility functions
const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

const handleApiError = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP error ${response.status}`);
  }
  return response.json();
};

document.addEventListener('DOMContentLoaded', async () => {
  // Skip fullPage-related code on login page
  if (window.location.pathname.includes('login')) {
    return;
  }
  
  // Schedule tracking
window.toggleSchedules = function() {
  const content = document.getElementById('scheduleContent');
  const icon = document.getElementById('scheduleToggleIcon');
  
  if (content && icon) {
    content.classList.toggle('hidden');
    icon.style.transform = content.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
    
    // Load schedules when panel is opened
    if (!content.classList.contains('hidden')) {
      loadSchedules();
    }
  }
}

// Function to format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Simplified function to load schedules
async function loadSchedules() {
  const scheduleContent = document.getElementById('scheduleContent');
  const loader = document.getElementById('scheduleLoader');

  if (!scheduleContent || !loader) {
    console.error("Required elements not found");
    return;
  }

  try {
    loader.classList.remove('hidden');
    
    // Add error handling for network issues
    const response = await fetch('/schedules').catch(err => {
      console.error("Network error fetching schedules:", err);
      throw new Error(`Network error: ${err.message}`);
    });
    
    // Handle non-OK responses
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(`Server error (${response.status}):`, errorText);
      throw new Error(`Server error (${response.status}): ${errorText}`);
    }
    
    // Parse JSON with error handling
    const data = await response.json().catch(err => {
      console.error("JSON parse error:", err);
      throw new Error("Invalid response format from server");
    });
    
    // Handle missing or invalid data structure
    if (!data || typeof data !== 'object') {
      throw new Error("Invalid data structure received from server");
    }
    
    renderScheduleTable(scheduleContent, data.data || []);
  } catch (error) {
    console.error("Error loading schedules:", error);
    // Create error message directly in the content area
    scheduleContent.innerHTML = `
      <div class="schedule-error">
        <p>Error: ${error.message}</p>
      </div>
    `;
  } finally {
    loader.classList.add('hidden');
  }
}

function renderScheduleTable(container, schedules) {
  if (!schedules.length) {
    container.innerHTML = '<div class="no-schedules">No schedules found</div>';
    return;
  }
  
  // Clear any existing content except the loader
  const loader = container.querySelector('#scheduleLoader');
  container.innerHTML = '';
  if (loader) {
    container.appendChild(loader);
  }
  
  // Create table element
  const table = document.createElement('table');
  table.className = 'schedule-table';
  
  // Build table HTML
  table.innerHTML = `
    <thead>
      <tr>
        <th>#</th>
        <th>Type</th>
        <th>ID</th>
        <th>Status</th>
        <th>Created</th>
      </tr>
    </thead>
    <tbody>
      ${schedules.map((schedule, index) => `
        <tr class="schedule-row" data-id="${schedule.id}">
          <td>${index+1}</td>
          <td>${schedule.type}</td>
          <td>${schedule.id}</td>
          <td><span class="status-badge status-${schedule.status.toLowerCase()}">${schedule.status}</span></td>
          <td>${formatDate(schedule.created_at)}</td>
        </tr>
      `).join('')}
    </tbody>
  `;
  
  // Append table to container
  container.appendChild(table);
  
  // Add click event listeners to each row
  document.querySelectorAll('.schedule-row').forEach(row => {
    row.addEventListener('click', () => {
      loadScheduleDetails(row.getAttribute('data-id'));
    });
  });
}

// Function to load schedule details
async function loadScheduleDetails(scheduleId) {
  const scheduleContent = document.getElementById('scheduleContent');
  const scheduleLoader = document.getElementById('scheduleLoader');
  const scheduleDetails = document.getElementById('scheduleDetails');
  
  if (scheduleDetails && scheduleLoader && scheduleContent) {
    // Show loader
    scheduleLoader.classList.remove('hidden');
    // Hide the table but keep the container visible
    const table = scheduleContent.querySelector('.schedule-table');
    if (table) table.style.display = 'none';
    scheduleDetails.classList.add('hidden');
    
    try {
      const response = await fetch(`/schedule/${scheduleId}`);
      const data = await response.json();
      
      if (data.status === 'Success' && data.data) {
        const schedule = data.data;
        
        // Create back button
        const backBtn = document.createElement('button');
        backBtn.className = 'schedule-back-button';
        backBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Back to schedules';
        backBtn.addEventListener('click', () => {
          scheduleDetails.classList.add('hidden');
          // Show the table again
          const table = scheduleContent.querySelector('.schedule-table');
          if (table) table.style.display = '';
        });
        
        // Determine schedule title based on type
        let scheduleTitle = '';
        if (schedule.type === 'troll') {
          scheduleTitle = 'Troll Lord Schedule';
        } else if (schedule.type === 'bootlick') {
          scheduleTitle = 'Bootlicking Schedule';
        }
        
        // Create schedule header
        const header = document.createElement('div');
        header.className = 'schedule-details-header';
        header.innerHTML = `<h3>${scheduleTitle}</h3>`;
        
        // Create schedule info section
        const info = document.createElement('div');
        info.className = 'schedule-details-info';
        
        // Add appropriate info based on schedule type
        if (schedule.type === 'troll') {
          info.innerHTML = `
            <p><strong>Tweet:</strong> <a href="${schedule.data.tweetLink}" target="_blank">${schedule.data.tweetLink}</a></p>
            <p><strong>Created:</strong> ${formatDate(schedule.created_at)}</p>
            <p><strong>Status:</strong> ${schedule.status}</p>
            <p><strong>Progress:</strong> ${schedule.data.completedReplies}/${schedule.data.totalReplies}</p>
          `;
        } else if (schedule.type === 'bootlick') {
          const profileLinks = schedule.data.profileUrls.map(url => 
            `<a href="${url}" target="_blank">${url}</a>`
          ).join('<br>');
          
          info.innerHTML = `
            <p><strong>Profiles:</strong><br>${profileLinks}</p>
            <p><strong>Created:</strong> ${formatDate(schedule.created_at)}</p>
            <p><strong>Status:</strong> ${schedule.status}</p>
            <p><strong>Progress:</strong> ${schedule.data.completedReplies}/${schedule.data.totalReplies}</p>
          `;
        }
        
        // Create responses section
        const responsesHeader = document.createElement('h4');
        responsesHeader.textContent = 'Responses';
        
        const responses = document.createElement('div');
        responses.className = 'schedule-responses';
        
        if (schedule.data.responses && schedule.data.responses.length > 0) {
          // Sort responses by number
          const sortedResponses = [...schedule.data.responses].sort((a, b) => a.replyNumber - b.replyNumber);
          
          sortedResponses.forEach(response => {
            const responseEl = document.createElement('div');
            responseEl.className = 'schedule-response';
            
            // Create response header with number and status
            const responseHeader = document.createElement('div');
            responseHeader.className = 'schedule-response-header';
            responseHeader.innerHTML = `
              <strong>Reply #${response.replyNumber}</strong>
              <span class="${response.success ? 'schedule-response-success' : 'schedule-response-error'}">
                ${response.success ? 'Success' : 'Failed'}
              </span>
            `;
            
            // Create response content
            const responseContent = document.createElement('div');
            
            if (response.success) {
              if (schedule.type === 'troll') {
                responseContent.innerHTML = `
                  <p><strong>Response:</strong> ${response.responseText}</p>
                  <p><strong>Time:</strong> ${formatDate(response.timestamp)}</p>
                  ${response.replyId ? `<p><strong>Tweet:</strong> <a href="https://twitter.com/i/web/status/${response.replyId}" target="_blank">View on Twitter</a></p>` : ''}
                `;
              } else if (schedule.type === 'bootlick') {
                responseContent.innerHTML = `
                  <p><strong>Profile:</strong> <a href="${response.profileUrl}" target="_blank">${response.profileUrl}</a></p>
                  <p><strong>Response:</strong> ${response.responseText}</p>
                  <p><strong>Time:</strong> ${formatDate(response.timestamp)}</p>
                  ${response.replyId ? `<p><strong>Tweet:</strong> <a href="https://twitter.com/i/web/status/${response.replyId}" target="_blank">View on Twitter</a></p>` : ''}
                `;
              }
            } else {
              responseContent.innerHTML = `
                <p><strong>Error:</strong> ${response.error}</p>
                <p><strong>Time:</strong> ${formatDate(response.timestamp)}</p>
                ${schedule.type === 'bootlick' ? `<p><strong>Profile:</strong> <a href="${response.profileUrl}" target="_blank">${response.profileUrl}</a></p>` : ''}
              `;
            }
            
            responseEl.appendChild(responseHeader);
            responseEl.appendChild(responseContent);
            responses.appendChild(responseEl);
          });
        } else {
          responses.innerHTML = '<div class="schedule-response">No responses yet</div>';
        }
        
        // Assemble the details view
        scheduleDetails.innerHTML = '';
        scheduleDetails.appendChild(backBtn);
        scheduleDetails.appendChild(header);
        scheduleDetails.appendChild(info);
        scheduleDetails.appendChild(responsesHeader);
        scheduleDetails.appendChild(responses);
      } else {
        scheduleDetails.innerHTML = `
          <button class="schedule-back-button" onclick="document.getElementById('scheduleDetails').classList.add('hidden'); document.getElementById('scheduleList').classList.remove('hidden');">
            <i class="fas fa-arrow-left"></i> Back to schedules
          </button>
          <div class="no-schedules">Error loading schedule details: ${data.error || 'Unknown error'}</div>
        `;
      }
    } catch (error) {
      scheduleDetails.innerHTML = `
        <button class="schedule-back-button" onclick="document.getElementById('scheduleDetails').classList.add('hidden'); document.querySelector('.schedule-table').style.display = '';">
          <i class="fas fa-arrow-left"></i> Back to schedules
        </button>
        <div class="no-schedules">Error loading schedule details: ${error.message}</div>
      `;
    } finally {
      // Hide loader and show details
      scheduleLoader.classList.add('hidden');
      scheduleDetails.classList.remove('hidden');
    }
  }
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
  const profileUrlsInput = document.getElementById('profileUrls');
  
  if (multipleProfilesCheckbox && profileUrlsInput) {
    // Set initial class
    profileUrlsInput.classList.add('single-profile');
    
    multipleProfilesCheckbox.addEventListener('change', () => {
      
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
            trollResponseArea.innerHTML = `
              <p style="color: #10b981; font-weight: 500;">${data.message}</p>
              ${data.scheduleId ? 
                `<p style="margin-top: 10px;">
                  You can <a href="#cta" style="color: #4361ee; text-decoration: underline;"
                  onclick="loadScheduleDetails('${data.scheduleId}'); return false;">track this schedule</a> in the "Active Schedules" panel.
                </p>` : ''
              }
            `;
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
            // Multiple profiles mode response
            if (bootlickResponseArea) {
              // Use different color based on status
              const statusColor = data.status === "Warning" ? "#f59e0b" : "#10b981";
              bootlickResponseArea.innerHTML = `
                <p style="color: ${statusColor}; font-weight: 500;">${data.message}</p>
                ${data.scheduleId ? 
                  `<p style="margin-top: 10px;">
                    You can <a href="#cta" style="color: #4361ee; text-decoration: underline;"
                    onclick="loadScheduleDetails('${data.scheduleId}'); return false;">track this schedule</a> in the "Active Schedules" panel.
                  </p>` : ''
                }
              `;
            }
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

  // Format timestamp into [DD-MM-YYYY, HH:MM:SS] format in local timezone
  function formatLogTimestamp(logEntry) {
    // Regular expression to match ISO timestamp in logs [yyyy-mm-ddThh:mm:ss.sssZ]
    const timestampRegex = /\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\]/;
    
    // Check if the log entry contains a timestamp
    const match = logEntry.match(timestampRegex);
    if (!match) return logEntry;
    
    // Extract the ISO timestamp
    const isoTimestamp = match[1];
    
    // Parse the timestamp and convert to local timezone
    const date = new Date(isoTimestamp);
    
    // Format the date in the requested format [DD-MM-YYYY, HH:MM:SS]
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    const formattedDate = `[${year}-${month}-${day}`+`T`+`${hours}:${minutes}:${seconds}]`;
    
    // Replace the ISO timestamp with the formatted one
    return logEntry.replace(timestampRegex, formattedDate);
  }

  // Function to poll logs with better error handling and timestamp formatting
  async function fetchLogs() {
    try {
      const response = await fetch("/logs");
      const data = await handleApiError(response);
      return data.logs || [];
    } catch (error) {
      console.error("Error fetching logs:", error);
      if (error.message.includes("429")) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.POLL_INTERVAL * 2));
      }
      return [];
    }
  }

  const debouncedPollLogs = debounce(async () => {
    const logOutput = document.getElementById("logOutput");
    if (!logOutput) return;
  
    const logs = await fetchLogs();
    logOutput.innerText = logs.length > 0 
      ? logs.map(formatLogTimestamp).join("\n")
      : "No logs available yet";
  }, CONFIG.DEBOUNCE_DELAY);

  // Replace existing polling setup with improved version
  setInterval(debouncedPollLogs, CONFIG.POLL_INTERVAL);
  debouncedPollLogs();

  // At the end of your DOMContentLoaded event
  console.log("Page loaded, loading schedules");
  setTimeout(loadSchedules, 1000); // Slight delay to ensure DOM is ready
});