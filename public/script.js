document.addEventListener('DOMContentLoaded', async () => {
  // ----------------------------
  // FETCH SUPABASE CONFIGURATION
  // ----------------------------
  let supaConfig;
  try {
    const res = await fetch('/api/config');
    supaConfig = await res.json();
  } catch (error) {
    console.error("Error fetching Supabase config:", error);
    return;
  }
  
  // Initialize Supabase client using the fetched configuration.
  const supabaseClient = supabase.createClient(supaConfig.supabaseUrl, supaConfig.supabaseAnonKey);
  
  // Determine if this is the login page.
  const isLoginPage = window.location.pathname.endsWith("login.html");

  if (isLoginPage) {
    // ----------------------------
    // LOGIN PAGE FUNCTIONALITY
    // ----------------------------
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const signUpLink = document.getElementById('sign-up');

    // Handle sign-in.
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) {
        errorMessage.textContent = error.message;
      } else {
        // On successful login, retrieve the access token.
        const token = data.session?.access_token;
        if (token) {
          // Call the server endpoint to set a secure cookie with the token.
          const setCookieRes = await fetch('/api/set-cookie', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          });
          if (setCookieRes.ok) {
            // Redirect to the protected page.
            window.location.href = '/';
          } else {
            errorMessage.textContent = 'Failed to set auth cookie.';
          }
        } else {
          errorMessage.textContent = 'Login succeeded but no token received.';
        }
      }
    });

    // Handle sign-up.
    signUpLink.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      const { error } = await supabaseClient.auth.signUp({ email, password });
      if (error) {
        errorMessage.textContent = error.message;
      } else {
        errorMessage.textContent = 'Sign-up successful! Please check your email to confirm your account.';
      }
    });
  } else {
    // ----------------------------
    // PROTECTED PAGE FUNCTIONALITY
    // ----------------------------
    // (Note: The server already ensures that only authenticated requests receive index.html.)
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
      // This is an extra client-side check.
      window.location.href = '/login.html';
      return;
    }
    
    // Optional: Set up sign-out functionality.
    const signOutBtn = document.getElementById('sign-out');
    if (signOutBtn) {
      signOutBtn.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.href = '/login.html';
      });
    }

    // ----------------------------
    // ORIGINAL UI FUNCTIONALITY
    // ----------------------------
    // Toggle collapse for UI sections (e.g., logs or "How It Works").
    function toggleCollapse(contentId) {
      const content = document.getElementById(contentId);
      const iconId = contentId === 'logContent' ? 'logToggleIcon' : 'howItWorksToggleIcon';
      const icon = document.getElementById(iconId);
      if (content && icon) {
        content.classList.toggle('hidden');
        icon.classList.toggle('rotate-180');
      }
    }
    // Expose toggleCollapse globally (for inline event handlers).
    window.toggleCollapse = toggleCollapse;

    // ----------------------------
    // TROLL LORD TOGGLE FUNCTIONALITY
    // ----------------------------
    // This will show/hide the Troll Lord image when the checkbox is toggled.
    const trollLordCheckbox = document.getElementById('trollLord');
    const trolllordImg = document.getElementById('trolllordImg');
    if (trollLordCheckbox && trolllordImg) {
      trollLordCheckbox.addEventListener('change', () => {
        if (trollLordCheckbox.checked) {
          trolllordImg.classList.remove('hidden');
        } else {
          trolllordImg.classList.add('hidden');
        }
      });
    }
    
    // ----------------------------
    // TIMER FUNCTIONALITY
    // ----------------------------
    const COUNTDOWN_DURATION = 900; // 15 minutes in seconds.
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

    // Check timer on page load.
    const storedEndTime = localStorage.getItem(TIMER_KEY);
    if (storedEndTime && Date.now() < parseInt(storedEndTime, 10)) {
      startTimer(parseInt(storedEndTime, 10));
    } else {
      if (submitBtn) submitBtn.disabled = false;
    }

    // ----------------------------
    // API CALL & FORM SUBMISSION
    // ----------------------------
    async function callTrigger(replyCount) {
      const tweetLink = document.getElementById('tweetLink').value;
      const trollLordCheckbox = document.getElementById('trollLord');
      const trollLord = trollLordCheckbox ? trollLordCheckbox.checked : false;
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

    const form = document.getElementById('tweetForm');
    const responseArea = document.getElementById('responseArea');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (responseArea) {
          responseArea.innerHTML = `
            <div class="flex justify-center items-center py-4">
              <svg class="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            </div>
          `;
        }
        if (submitBtn) submitBtn.disabled = true;

        try {
          const data = await callTrigger();
          if (data.error) {
            if (responseArea) responseArea.innerHTML = `<p class="text-red-600 font-semibold">Error occurred: ${data.error}</p>`;
            if (submitBtn) submitBtn.disabled = false;
            return;
          }
          
          // Check for response structure.
          if (data.data) {
            // Regular agent mode response.
            const replyResp = data.data.replyResponse;
            const twitterReplyId = replyResp?.data?.id || replyResp?.id || null;
            const twitterReplyUrl = twitterReplyId 
              ? `https://twitter.com/i/web/status/${twitterReplyId}` 
              : "N/A";
  
            if (responseArea) {
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
                    <p class="text-gray-800">${
                      twitterReplyUrl !== "N/A"
                        ? `<a href="${twitterReplyUrl}" target="_blank" class="text-blue-600 underline">${twitterReplyUrl}</a>`
                        : "N/A"
                    }</p>
                  </div>
                </div>
              `;
            }
          } else if (data.message) {
            // Troll Lord mode response.
            if (responseArea) {
              responseArea.innerHTML = `<p class="text-green-600 font-semibold">${data.message}</p>`;
            }
          } else {
            if (responseArea) responseArea.innerHTML = `<p class="text-red-600 font-semibold">Error: Unexpected response format.</p>`;
          }
          startTimer();
        } catch (error) {
          if (responseArea) responseArea.innerHTML = `<p class="text-red-600 font-semibold">Error occurred: ${error.message}</p>`;
          if (submitBtn) submitBtn.disabled = false;
        }
      });
    }

    // ----------------------------
    // POLL SERVER LOGS
    // ----------------------------
    function pollLogs() {
      fetch("/logs")
        .then(response => response.json())
        .then(data => {
          const logOutput = document.getElementById("logOutput");
          if (logOutput) logOutput.innerText = data.logs.join("\n");
        })
        .catch(err => console.error("Error fetching logs:", err));
    }
    setInterval(pollLogs, 5000);
    pollLogs();
  }

  // Expose supabaseClient globally if needed.
  window.supabaseClient = supabaseClient;
});
