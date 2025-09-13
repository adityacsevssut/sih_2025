document.addEventListener('DOMContentLoaded', () => {

    // ======================= MOCK DATA & IN-MEMORY STORAGE =======================
    let registeredUsers = []; // Array to store registered user objects
    let pendingRegistrationData = null; // To hold user data during OTP verification

    const civicData = {
        national: {
            total: 125432, resolved: 98765, cleanliness: 8.2,
            categories: { labels: ['Garbage', 'Potholes', 'Water Supply', 'Streetlight', 'Sewage', 'Other'], values: [35000, 22000, 18000, 15000, 28000, 7432] }
        },
        states: {
            "Odisha": {
                total: 8500, resolved: 7200, cleanliness: 8.8,
                categories: { labels: ['Garbage', 'Potholes', 'Water Supply', 'Streetlight', 'Sewage', 'Other'], values: [2200, 1500, 1100, 900, 1800, 1000] },
                cities: {
                    "Bhubaneswar": { total: 4200, resolved: 3800, cleanliness: 9.1, categories: { labels: ['Garbage', 'Potholes', 'Water Supply', 'Streetlight', 'Sewage', 'Other'], values: [1100, 800, 500, 400, 900, 500] } },
                    "Cuttack": { total: 2800, resolved: 2100, cleanliness: 8.5, categories: { labels: ['Garbage', 'Potholes', 'Water Supply', 'Streetlight', 'Sewage', 'Other'], values: [800, 500, 400, 350, 600, 150] } },
                    "Puri": { total: 1500, resolved: 1300, cleanliness: 8.9, categories: { labels: ['Garbage', 'Potholes', 'Water Supply', 'Streetlight', 'Sewage', 'Other'], values: [300, 200, 200, 150, 300, 350] } }
                }
            },
            "Maharashtra": {
                total: 15200, resolved: 12500, cleanliness: 9.2,
                categories: { labels: ['Garbage', 'Potholes', 'Water Supply', 'Streetlight', 'Sewage', 'Other'], values: [4500, 3000, 2500, 1800, 2400, 1000] },
                cities: {
                    "Mumbai": { total: 7500, resolved: 6000, cleanliness: 9.0, categories: { labels: ['Garbage', 'Potholes', 'Water Supply', 'Streetlight', 'Sewage', 'Other'], values: [2500, 1500, 1200, 800, 1000, 500] } },
                    "Pune": { total: 5200, resolved: 4500, cleanliness: 9.4, categories: { labels: ['Garbage', 'Potholes', 'Water Supply', 'Streetlight', 'Sewage', 'Other'], values: [1500, 1000, 900, 600, 900, 300] } },
                    "Navi Mumbai": { total: 2500, resolved: 2320, cleanliness: 9.7, categories: { labels: ['Garbage', 'Potholes', 'Water Supply', 'Streetlight', 'Sewage', 'Other'], values: [500, 500, 400, 400, 500, 200] } }
                }
            },
            "Gujarat": {
                total: 9800, resolved: 8900, cleanliness: 9.5,
                categories: { labels: ['Garbage', 'Potholes', 'Water Supply', 'Streetlight', 'Sewage', 'Other'], values: [2800, 1800, 1500, 1200, 1900, 600] },
                cities: {
                    "Ahmedabad": { total: 4500, resolved: 4000, cleanliness: 9.3, categories: { labels: ['Garbage', 'Potholes', 'Water Supply', 'Streetlight', 'Sewage', 'Other'], values: [1300, 900, 700, 600, 800, 200] } },
                    "Surat": { total: 5300, resolved: 4900, cleanliness: 9.8, categories: { labels: ['Garbage', 'Potholes', 'Water Supply', 'Streetlight', 'Sewage', 'Other'], values: [1500, 900, 800, 600, 1100, 400] } }
                }
            }
        },
        pincodes: {
            "751001": { state: "Odisha", city: "Bhubaneswar", total: 150, resolved: 142, cleanliness: 9.5, categories: { labels: ['Garbage', 'Potholes', 'Water Supply', 'Streetlight', 'Sewage', 'Other'], values: [40, 30, 20, 10, 35, 17] }},
            "400001": { state: "Maharashtra", city: "Mumbai", total: 210, resolved: 180, cleanliness: 8.9, categories: { labels: ['Garbage', 'Potholes', 'Water Supply', 'Streetlight', 'Sewage', 'Other'], values: [60, 45, 30, 20, 40, 15] }}
        }
    };
    
    const municipalities = { ...civicData.states.Odisha.cities, ...civicData.states.Maharashtra.cities, ...civicData.states.Gujarat.cities };


    // ======================= PAGE NAVIGATION (SPA-LIKE BEHAVIOR) =======================
    const navLinks = document.querySelectorAll('.nav-link, .page-switcher');
    const pages = document.querySelectorAll('.page');
    const navToggle = document.querySelector('.nav-toggle');
    const mainNav = document.querySelector('.main-nav');
    let impactMapInitialized = false; // Flag to check if map is already initialized

    const showPage = (pageId) => {
        pages.forEach(page => page.classList.remove('active'));
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
        } else {
            document.getElementById('home').classList.add('active'); // Fallback to home
        }
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${pageId}`) {
                link.classList.add('active');
            }
        });

        if (mainNav.classList.contains('open')) mainNav.classList.remove('open');
        window.scrollTo(0, 0);

        if (pageId === 'dashboard') updateDashboardDisplay(civicData.national, 'National');
        if (pageId === 'leaderboard') renderLeaderboard('city');
        if (pageId === 'credit') renderCreditPage('state');
        // New logic to initialize the map only when the page is viewed
        if (pageId === 'impact-map' && !impactMapInitialized) {
            initializeImpactMap();
            impactMapInitialized = true;
        }
    };

    navLinks.forEach(link => {
        if (link.id !== 'nav-chatbot-link') {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const pageId = e.target.getAttribute('href').substring(1);
                showPage(pageId);
            });
        }
    });

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            mainNav.classList.toggle('open');
            navToggle.classList.toggle('active'); // Toggles class for CSS animation
        });
    }

    // ======================= REPORT ISSUE FORM =======================
    const reportForm = document.getElementById('report-form');
    if (reportForm) {
        reportForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // ========== MODIFICATION START ==========
            // Get the selected department value
            const selectedDepartment = document.getElementById('department').value;
            
            // Display a more specific confirmation message
            alert(`Issue reported successfully to the ${selectedDepartment}! Thank you for your contribution.`);
            // ========== MODIFICATION END ==========

            reportForm.reset();
            // Reset location display after submission
            const locationDisplay = document.getElementById('location-display');
            locationDisplay.innerHTML = '<p>Location will be auto-detected.</p>';
        });
    }

    // ======================= REPORT ISSUE ENHANCEMENTS (VOICE & GPS) =======================
    const voiceInputBtn = document.getElementById('voice-input-btn');
    const issueDescription = document.getElementById('issue-description');
    const trackLocationBtn = document.getElementById('track-location-btn');
    const locationDisplay = document.getElementById('location-display');

    // --- Voice Input Logic ---
    if (voiceInputBtn && issueDescription) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'en-IN';
            recognition.interimResults = false;

            voiceInputBtn.addEventListener('click', () => {
                recognition.start();
            });

            recognition.onstart = () => {
                voiceInputBtn.textContent = 'Listening...';
                voiceInputBtn.disabled = true;
            };

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                issueDescription.value = transcript;
            };

            recognition.onerror = (event) => {
                alert(`Error occurred in speech recognition: ${event.error}. Please ensure microphone access is allowed.`);
            };

            recognition.onend = () => {
                voiceInputBtn.textContent = 'Use Voice Input';
                voiceInputBtn.disabled = false;
            };
        } else {
            voiceInputBtn.textContent = 'Voice Input Not Supported';
            voiceInputBtn.disabled = true;
        }
    }

    // --- Geolocation Logic ---
    if (trackLocationBtn && locationDisplay) {
        trackLocationBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
                locationDisplay.innerHTML = '<p>Tracking your location...</p>';
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const lat = position.coords.latitude.toFixed(6);
                        const lon = position.coords.longitude.toFixed(6);
                        locationDisplay.innerHTML = `<p><b>Location Acquired:</b><br>Latitude: ${lat}<br>Longitude: ${lon}</p>`;
                    },
                    (error) => {
                        let errorMessage = 'An unknown error occurred.';
                        switch (error.code) {
                            case error.PERMISSION_DENIED:
                                errorMessage = 'Location access was denied. Please allow location access in your browser settings.';
                                break;
                            case error.POSITION_UNAVAILABLE:
                                errorMessage = 'Location information is unavailable.';
                                break;
                            case error.TIMEOUT:
                                errorMessage = 'The request to get user location timed out.';
                                break;
                        }
                         locationDisplay.innerHTML = `<p style="color: #e53935;">${errorMessage}</p>`;
                    },
                    { enableHighAccuracy: true }
                );
            } else {
                locationDisplay.innerHTML = '<p style="color: #e53935;">Geolocation is not supported by this browser.</p>';
            }
        });
    }

    // ======================= LOGIN PAGE TABS =======================
    const tabLinks = document.querySelectorAll('.login-tabs .tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            const tabId = link.dataset.tab;
            tabLinks.forEach(item => item.classList.remove('active'));
            link.classList.add('active');
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) content.classList.add('active');
            });
        });
    });
    
    // ======================= GOV/CORP LOGIN FORM (GENERIC) =======================
    const otherLoginForms = document.querySelectorAll('#gov-login-form, #corp-login-form');
    otherLoginForms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Login successful! (Prototype for Gov/Corp)');
            form.reset();
        });
    });

    // ======================= DASHBOARD LOGIC =======================
    const dashboardTitle = document.getElementById('dashboard-title');
    const stateSelect = document.getElementById('dashboard-state-select');
    const citySelect = document.getElementById('dashboard-city-select');
    const pincodeInput = document.getElementById('dashboard-pincode-input');
    const filterBtn = document.getElementById('dashboard-filter-btn');

    for (const state in civicData.states) {
        stateSelect.add(new Option(state, state));
    }
    
    stateSelect.addEventListener('change', () => {
        citySelect.innerHTML = '<option value="">-- Select City --</option>';
        const selectedState = stateSelect.value;
        if (selectedState && civicData.states[selectedState].cities) {
            for (const city in civicData.states[selectedState].cities) {
                citySelect.add(new Option(city, city));
            }
        }
    });
    
    filterBtn.addEventListener('click', () => {
        const pincode = pincodeInput.value;
        const city = citySelect.value;
        const state = stateSelect.value;
        if (pincode && civicData.pincodes[pincode]) {
            updateDashboardDisplay(civicData.pincodes[pincode], `Pincode ${pincode}`);
        } else if (city && state && civicData.states[state].cities[city]) {
            updateDashboardDisplay(civicData.states[state].cities[city], city);
        } else if (state && civicData.states[state]) {
            updateDashboardDisplay( civicData.states[state], state);
        } else {
            updateDashboardDisplay(civicData.national, 'National');
        }
    });

    function updateDashboardDisplay(data, locationName) {
        dashboardTitle.textContent = `Dashboard Overview - ${locationName}`;
        document.getElementById('total-complaints').textContent = data.total.toLocaleString('en-IN');
        document.getElementById('complaints-resolved').textContent = data.resolved.toLocaleString('en-IN');
        const resolutionPercentage = data.total > 0 ? ((data.resolved / data.total) * 100).toFixed(2) + '%' : 'N/A';
        document.getElementById('resolution-percentage').textContent = resolutionPercentage;
        document.getElementById('cleanliness-index').textContent = `${data.cleanliness} / 10`;
        drawDashboardChart(data.categories);
    }

    const drawDashboardChart = (data) => {
        const ctx = document.getElementById('complaintsChart');
        if (!ctx || !data) return;
        const canvas = ctx.getContext('2d');
        const chartHeight = ctx.height - 40;
        const chartWidth = ctx.width - 40;
        const barWidth = chartWidth / (data.values.length * 2);
        const maxValue = Math.max(...data.values);
        canvas.clearRect(0, 0, ctx.width, ctx.height);
        canvas.font = "12px Poppins";
        canvas.fillStyle = "#666";
        for (let i = 0; i <= 5; i++) {
            const y = chartHeight - (i / 5) * chartHeight + 20;
            const labelValue = Math.round((maxValue / 5) * i);
            canvas.fillText(labelValue, 5, y + 3);
            canvas.beginPath();
            canvas.moveTo(35, y);
            canvas.lineTo(ctx.width, y);
            canvas.strokeStyle = '#e0e0e0';
            canvas.stroke();
        }
        data.values.forEach((value, i) => {
            const barHeight = maxValue > 0 ? (value / maxValue) * chartHeight : 0;
            const x = (i * (barWidth * 2)) + barWidth / 2 + 40;
            const y = chartHeight - barHeight + 20;
            canvas.fillStyle = '#0d47a1';
            canvas.fillRect(x, y, barWidth, barHeight);
            canvas.fillStyle = '#333';
            canvas.textAlign = 'center';
            canvas.fillText(data.labels[i], x + barWidth / 2, chartHeight + 35);
        });
    };
    
    // ======================= LEADERBOARD LOGIC =======================
    const sortSelect = document.getElementById('sort-leaderboard');
    const leaderboardBody = document.getElementById('leaderboard-body');
    const viewTabs = document.querySelectorAll('.leaderboard-view-tabs .tab-link');
    const regionHeader = document.getElementById('leaderboard-region-header');
    
    function renderLeaderboard(view) {
        leaderboardBody.innerHTML = '';
        regionHeader.textContent = view.charAt(0).toUpperCase() + view.slice(1);
        let dataToRender = {};
        if (view === 'state') {
            dataToRender = civicData.states;
        } else if (view === 'city') {
             Object.values(civicData.states).forEach(state => Object.assign(dataToRender, state.cities));
        } else if (view === 'municipality') {
            Object.assign(dataToRender, municipalities);
        }
        for (const name in dataToRender) {
            const item = dataToRender[name];
            const resolved = item.total > 0 ? ((item.resolved / item.total) * 100).toFixed(1) : 0;
            const cleanliness = (item.cleanliness * 10).toFixed(1);
            const row = document.createElement('tr');
            row.innerHTML = `<td>--</td><td>${name}</td><td data-resolved="${resolved}">${resolved}%</td><td data-cleanliness="${cleanliness}">${cleanliness}%</td>`;
            leaderboardBody.appendChild(row);
        }
        sortLeaderboard();
    }
    
    viewTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            viewTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderLeaderboard(tab.dataset.view);
        });
    });

    function sortLeaderboard() {
        if (!leaderboardBody) return;
        const sortBy = sortSelect.value;
        const rows = Array.from(leaderboardBody.querySelectorAll('tr'));
        const sortedRows = rows.sort((a, b) => {
            let valA = (sortBy === 'resolved') ? parseFloat(a.querySelector('td[data-resolved]').dataset.resolved) : parseFloat(a.querySelector('td[data-cleanliness]').dataset.cleanliness);
            let valB = (sortBy === 'resolved') ? parseFloat(b.querySelector('td[data-resolved]').dataset.resolved) : parseFloat(b.querySelector('td[data-cleanliness]').dataset.cleanliness);
            return valB - valA;
        });
        leaderboardBody.innerHTML = '';
        sortedRows.forEach((row, index) => {
            row.cells[0].textContent = index + 1;
            leaderboardBody.appendChild(row);
        });
    }

    if(sortSelect) sortSelect.addEventListener('change', sortLeaderboard);

    // ======================= CREDIT PAGE LOGIC (NEW) =======================
    const creditBody = document.getElementById('credit-body');
    const creditViewTabs = document.querySelectorAll('#credit-view-tabs .tab-link');

    function renderCreditPage(view) {
        if (!creditBody) return;
        creditBody.innerHTML = '';

        let dataToProcess = {};
        if (view === 'state') {
            dataToProcess = civicData.states;
        } else if (view === 'city') {
            Object.values(civicData.states).forEach(state => Object.assign(dataToProcess, state.cities));
        } else if (view === 'municipality') {
            Object.assign(dataToProcess, municipalities);
        }

        const calculatedData = Object.entries(dataToProcess).map(([name, item]) => {
            const resolutionPercentage = item.total > 0 ? (item.resolved / item.total) * 100 : 0;
            const cleanliness = item.cleanliness;
            // Credit points formula: (Resolution % is weighted as 5) + (Cleanliness index * 50)
            const creditPoints = Math.round((resolutionPercentage * 5) + (cleanliness * 50));
            return { name, resolutionPercentage, cleanliness, creditPoints };
        });
        
        // Sort by credit points descending
        calculatedData.sort((a, b) => b.creditPoints - a.creditPoints);

        calculatedData.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.name}</td>
                <td>${item.resolutionPercentage.toFixed(1)}%</td>
                <td>${item.cleanliness.toFixed(1)} / 10</td>
                <td><strong>${item.creditPoints}</strong></td>
            `;
            creditBody.appendChild(row);
        });
    }

    creditViewTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            creditViewTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderCreditPage(tab.dataset.view);
        });
    });

    // ======================= CHATBOT WIDGET =======================
    const chatbotToggler = document.querySelector('.chatbot-toggler');
    const chatbotWindow = document.querySelector('.chatbot-window');
    const navChatbotLink = document.getElementById('nav-chatbot-link');
    const chatBody = document.querySelector('.chat-body');
    const chatInput = document.querySelector('.chat-footer input');
    const chatSendBtn = document.querySelector('.chat-footer button');

    const toggleChatbot = (e) => {
        if (e) e.preventDefault();
        chatbotWindow.classList.toggle('open');
    };
    
    if (chatbotToggler) chatbotToggler.addEventListener('click', toggleChatbot);
    if (navChatbotLink) navChatbotLink.addEventListener('click', toggleChatbot);

    const appendMessage = (message, sender) => {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('chat-message', sender);
        msgDiv.textContent = message;
        chatBody.appendChild(msgDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    };
    
    const getBotResponse = (userInput) => {
        const lowerInput = userInput.toLowerCase();
        if (lowerInput.includes('hello') || lowerInput.includes('hi')) return 'Hello! How can I assist you with civic issues today?';
        if (lowerInput.includes('report') || lowerInput.includes('issue')) return 'To report an issue, please navigate to the "Report Issue" page from the main menu.';
        if (lowerInput.includes('status') || lowerInput.includes('track')) return 'You can track the status of your reported issues from your personal dashboard after logging in.';
        if (lowerInput.includes('login') || lowerInput.includes('signup')) return 'Please visit the "Login" page to access your account or to register as a new user.';
        if (lowerInput.includes('dashboard')) return 'The dashboard provides an overview of all civic complaints. You can access it from the main menu.';
        if (lowerInput.includes('bye') || lowerInput.includes('thank')) return 'You\'re welcome! Have a great day.';
        return "I'm sorry, I don't understand that. You can ask me about how to 'report' an issue, check the 'status', or how to 'login'.";
    };

    const handleChat = () => {
        const userInput = chatInput.value.trim();
        if (userInput === '') return;
        appendMessage(userInput, 'user');
        chatInput.value = '';
        setTimeout(() => appendMessage(getBotResponse(userInput), 'bot'), 500);
    };
    
    if (chatSendBtn) chatSendBtn.addEventListener('click', handleChat);
    if (chatInput) chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); handleChat(); }
    });

    // ======================= CITIZEN REGISTRATION AND LOGIN FLOW =======================
    const citizenTab = document.getElementById('citizen');
    if (citizenTab) {
        const loginForm = document.getElementById('citizen-login-form');
        const registerForm = document.getElementById('citizen-register-form');
        const otpForm = document.getElementById('otp-verify-form');
        const showRegisterLink = document.getElementById('show-register-link');
        const showLoginLink = document.getElementById('show-login-link');

        if(showRegisterLink) {
            showRegisterLink.addEventListener('click', (e) => {
                e.preventDefault();
                loginForm.classList.add('hidden');
                registerForm.classList.remove('hidden');
            });
        }

        if(showLoginLink) {
            showLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                registerForm.classList.add('hidden');
                loginForm.classList.remove('hidden');
            });
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(registerForm);
                const newUser = {
                    firstName: document.getElementById('reg-fname').value,
                    lastName: document.getElementById('reg-lname').value,
                    aadhaar: document.getElementById('reg-aadhaar').value,
                    email: document.getElementById('reg-email').value,
                    phone: document.getElementById('reg-phone').value,
                };
                
                const userExists = registeredUsers.some(user => user.email === newUser.email || user.phone === newUser.phone);
                if (userExists) {
                    alert('A user with this email or phone number already exists.');
                    return;
                }
                
                pendingRegistrationData = newUser; // Store data before OTP
                alert("A one-time password (OTP) has been sent to your registered email and phone number for verification.");
                registerForm.classList.add('hidden');
                otpForm.classList.remove('hidden');
            });
        }

        if (otpForm) {
            otpForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const otpInput = document.getElementById('otp-input');
                if (otpInput.value.trim() === '123456') { 
                    if(pendingRegistrationData) {
                        registeredUsers.push(pendingRegistrationData);
                        console.log('Registered Users:', registeredUsers); // For testing
                        pendingRegistrationData = null;
                    }
                    alert('Verification successful! Your registration is complete. You can now log in.');
                    otpForm.classList.add('hidden');
                    loginForm.classList.remove('hidden');
                    registerForm.reset(); 
                    otpInput.value = '';
                } else {
                    alert('The OTP you entered is incorrect. Please try again.');
                }
            });
        }

        if (loginForm) {
            loginForm.addEventListener('submit', e => {
                e.preventDefault();
                const identifier = document.getElementById('citizen-email').value;
                const otp = document.getElementById('citizen-password').value;
                
                const user = registeredUsers.find(u => u.email === identifier || u.phone === identifier);

                if (user && otp === '123456') { // Using dummy OTP for login as well
                    alert(`Welcome back, ${user.firstName}! Login successful.`);
                    loginForm.reset();
                } else {
                    alert('Invalid credentials or user not found. Please register first or check your details.');
                }
            });
        }
    }
    
    // ======================= DYNAMICALLY ADD SETTINGS BUTTON (Example of Dynamic DOM manipulation) =======================
    // This section is removed as it was just an example and not part of the core functionality.

    // Initial page load setup
    showPage('home');

    // =======================================================================
    // ======================= NEW IMPACT MAP LOGIC ==========================
    // =======================================================================
    function initializeImpactMap() {
        // Centered on Bhubaneswar, Odisha as an example
        const map = L.map('impact-map-container').setView([20.2961, 85.8245], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        // Mock data for map issues (simulating an API call)
        const mapIssues = [
            { lat: 20.2706, lng: 85.8213, title: 'Uncollected Garbage', status: 'Reported' },
            { lat: 20.3120, lng: 85.8335, title: 'Broken Streetlight', status: 'In Progress' },
            { lat: 20.2541, lng: 85.8011, title: 'Pothole Repair', status: 'Resolved' },
            { lat: 20.3030, lng: 85.8500, title: 'Sewage Overflow', status: 'In Progress' },
            { lat: 20.2625, lng: 85.8450, title: 'Illegal Parking', status: 'Reported' },
            { lat: 20.3344, lng: 85.8099, title: 'Water Pipe Leakage', status: 'Resolved' }
        ];

        // --- Custom Marker Icons ---
        const createIcon = (iconUrl) => new L.Icon({
            iconUrl: iconUrl,
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        const icons = {
            'Reported': createIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png'),
            'In Progress': createIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png'), // Using gold for orange
            'Resolved': createIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png')
        };
        
        // --- Add markers to the map ---
        mapIssues.forEach(issue => {
            const markerIcon = icons[issue.status] || icons['Reported']; // Fallback to a default
            L.marker([issue.lat, issue.lng], { icon: markerIcon })
             .addTo(map)
             .bindPopup(`<b>${issue.title}</b><br>Status: ${issue.status}`);
        });

        // Fix map rendering issue in a hidden container
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }
});