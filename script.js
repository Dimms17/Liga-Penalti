document.addEventListener('DOMContentLoaded', function() {
    // --- Global Variables and Helper Functions ---
    const REGISTRATION_FEE = 200.00; // Example fee
    const API_BASE_URL = 'http://localhost:3000/api'; // Your backend API URL

    // Local storage keys (still used for temporary state between pages for the flow)
    const LOCAL_STORAGE_SELECTED_VENUE_KEY = 'selectedVenueForPayment';
    const LOCAL_STORAGE_SELECTED_SLOT_KEY = 'selectedSlotForPayment';
    const LOCAL_STORAGE_PAID_VENUE_KEY = 'paidVenueForRegistration';
    const LOCAL_STORAGE_PAID_SLOT_KEY = 'paidSlotForRegistration';

    // Get modal elements
    const messageModal = document.getElementById('message-modal');
    const modalMessage = document.getElementById('modal-message');
    const closeButton = document.querySelector('.modal .close-button');

    // Function to show custom modal message
    function showMessage(message) {
        modalMessage.textContent = message;
        messageModal.style.display = 'flex'; // Use flex to center content
    }

    // Function to hide custom modal message
    function hideMessage() {
        messageModal.style.display = 'none';
    }

    // Event listener for closing the modal
    if (closeButton) {
        closeButton.addEventListener('click', hideMessage);
    }
    window.addEventListener('click', function(event) {
        if (event.target == messageModal) {
            hideMessage();
        }
    });

    // --- API Interaction Functions ---

    // Function to load teams from the backend
    async function loadTeamsFromAPI() {
        try {
            const response = await fetch(`${API_BASE_URL}/teams`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const teams = await response.json();
            return teams;
        } catch (error) {
            console.error('Error loading teams from API:', error);
            showMessage('Failed to load teams. Please try again later.');
            return [];
        }
    }

    // Function to load booked slots from the backend
    async function loadBookedSlotsFromAPI() {
        try {
            const response = await fetch(`${API_BASE_URL}/booked-slots`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const bookedSlots = await response.json();
            return bookedSlots; // Should return in format { 'Venue A': ['A1', 'B3'] }
        } catch (error) {
            console.error('Error loading booked slots from API:', error);
            showMessage('Failed to load booked slots. Please try again later.');
            return {};
        }
    }

    // Function to register a team to the backend
    async function registerTeamToAPI(teamData) {
        try {
            const response = await fetch(`${API_BASE_URL}/register-team`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(teamData),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || `HTTP error! status: ${response.status}`);
            }
            return result;
        } catch (error) {
            console.error('Error registering team to API:', error);
            showMessage(`Registration failed: ${error.message}`);
            return null;
        }
    }

    // --- Navigation Active State ---
    const currentPageId = document.body.id; // Get the ID of the current body element
    const navLinks = document.querySelectorAll('.main-nav a');
    const dropdownButtons = document.querySelectorAll('.main-nav .dropbtn');

    navLinks.forEach(link => {
        // Handle active state for 'Home' and 'Register Team' and 'Payment' directly
        if (link.href.includes(currentPageId.replace('-page', ''))) {
            link.classList.add('active');
        }
        // Handle active state for 'All Venues' link within the dropdown
        if (currentPageId === 'venues-page' && link.href.includes('venues.html')) {
            link.classList.add('active');
        }
    });

    dropdownButtons.forEach(btn => {
        // If the current page is a venue page (venues.html, venue_a.html, etc.), activate the dropdown button
        if (currentPageId.startsWith('venue-') || currentPageId === 'venues-page') {
            btn.classList.add('active');
        }
    });


    // --- Page-specific Logic ---

    // Venue List Page Logic (venues.html)
    if (currentPageId === 'venues-page') {
        // No specific JS logic needed here other than navigation active state
        // The cards themselves handle redirection via their href attributes
    }
    // Individual Venue Pages Logic (venue_a.html, venue_b.html, venue_c.html)
    else if (currentPageId.startsWith('venue-')) {
        const venueSlotsContainer = document.getElementById('venue-slots-container');
        const proceedToPaymentBtn = document.getElementById('proceed-to-payment-btn');

        const venueNameMap = {
            'venue-a-page': 'Padang A',
            'venue-b-page': 'Padang B',
            'venue-c-page': 'Padang C'
        };
        const currentVenue = venueNameMap[currentPageId];

        // Retrieve selected slot/venue from localStorage for initial display
        let selectedSlot = localStorage.getItem(LOCAL_STORAGE_SELECTED_SLOT_KEY);
        let selectedVenueForPayment = localStorage.getItem(LOCAL_STORAGE_SELECTED_VENUE_KEY);

        async function renderVenueSlots() {
            let bookedSlots = await loadBookedSlotsFromAPI(); // Load from API
            const venueBookedSlots = bookedSlots[currentVenue] || [];

            const slotItems = venueSlotsContainer.querySelectorAll('.slot-item');

            slotItems.forEach(slotItem => {
                const slotId = slotItem.dataset.slot;

                slotItem.classList.remove('selected', 'booked');
                slotItem.style.pointerEvents = 'auto';

                if (venueBookedSlots.includes(slotId)) {
                    slotItem.classList.add('booked');
                    slotItem.style.pointerEvents = 'none';
                } else if (selectedSlot === slotId && selectedVenueForPayment === currentVenue) {
                    slotItem.classList.add('selected');
                }

                if (!slotItem.dataset.listenerAdded) {
                    slotItem.addEventListener('click', function() {
                        if (this.classList.contains('booked')) {
                            return;
                        }

                        const previouslySelected = venueSlotsContainer.querySelector('.slot-item.selected');
                        if (previouslySelected && previouslySelected !== this) {
                            previouslySelected.classList.remove('selected');
                        }

                        this.classList.toggle('selected');

                        if (this.classList.contains('selected')) {
                            selectedSlot = slotId;
                            localStorage.setItem(LOCAL_STORAGE_SELECTED_SLOT_KEY, selectedSlot);
                            localStorage.setItem(LOCAL_STORAGE_SELECTED_VENUE_KEY, currentVenue);
                            proceedToPaymentBtn.disabled = false;
                        } else {
                            selectedSlot = null;
                            localStorage.removeItem(LOCAL_STORAGE_SELECTED_SLOT_KEY);
                            localStorage.removeItem(LOCAL_STORAGE_SELECTED_VENUE_KEY);
                            proceedToPaymentBtn.disabled = true;
                        }
                    });
                    slotItem.dataset.listenerAdded = 'true';
                }
            });

            if (selectedSlot && selectedVenueForPayment === currentVenue) {
                proceedToPaymentBtn.disabled = false;
            } else {
                proceedToPaymentBtn.disabled = true;
            }
        }

        renderVenueSlots(); // Initial render

        if (proceedToPaymentBtn) {
            proceedToPaymentBtn.addEventListener('click', function() {
                if (!selectedSlot) {
                    showMessage('Please select a slot before proceeding to payment.');
                    return;
                }
                window.location.href = 'payment.html';
            });
        }
    }

    // Payment Page Logic
    else if (currentPageId === 'payment-page') {
        const venueSlotPaymentDetailsContainer = document.getElementById('venue-slot-payment-details');
        const registrationFeeSpan = document.getElementById('registration-fee');
        const paymentButtons = document.querySelectorAll('.payment-btn');
        const confirmPaymentBtn = document.getElementById('confirm-payment-btn');

        let selectedVenueForPayment = localStorage.getItem(LOCAL_STORAGE_SELECTED_VENUE_KEY);
        let selectedSlotForPayment = localStorage.getItem(LOCAL_STORAGE_SELECTED_SLOT_KEY);
        let currentPaymentMethod = 'online-banking'; // Default

        async function displayPaymentDetails() {
            if (selectedVenueForPayment && selectedSlotForPayment) {
                registrationFeeSpan.textContent = `RM ${REGISTRATION_FEE.toFixed(2)}`;
                confirmPaymentBtn.disabled = false;

                let teams = await loadTeamsFromAPI(); // Load from API
                const existingPaidTeamForSlot = teams.find(team =>
                    team.venue === selectedVenueForPayment &&
                    team.slot === selectedSlotForPayment &&
                    team.paymentStatus === 'paid'
                );

                if (existingPaidTeamForSlot) {
                    venueSlotPaymentDetailsContainer.innerHTML = `
                        <p>You have already paid for this slot:</p>
                        <p><strong>Venue:</strong> ${selectedVenueForPayment}</p>
                        <p><strong>Slot:</strong> ${selectedSlotForPayment}</p>
                        <p class="mt-4">Please proceed to <a href="register.html">register your team</a>.</p>
                    `;
                    confirmPaymentBtn.disabled = true;
                    confirmPaymentBtn.textContent = 'Payment Already Made';
                    localStorage.setItem(LOCAL_STORAGE_PAID_VENUE_KEY, selectedVenueForPayment);
                    localStorage.setItem(LOCAL_STORAGE_PAID_SLOT_KEY, selectedSlotForPayment);
                } else {
                    venueSlotPaymentDetailsContainer.innerHTML = `
                        <p>You are about to pay for registration at:</p>
                        <p><strong>Venue:</strong> ${selectedVenueForPayment}</p>
                        <p><strong>Slot:</strong> ${selectedSlotForPayment}</p>
                    `;
                }

            } else {
                venueSlotPaymentDetailsContainer.innerHTML = `
                    <p>No venue or slot selected. Please choose a venue and slot from the <a href="venues.html">Venues section</a>.</p>
                `;
                registrationFeeSpan.textContent = `RM 0.00`;
                confirmPaymentBtn.disabled = true;
            }
        }

        paymentButtons.forEach(button => {
            button.addEventListener('click', function() {
                paymentButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                currentPaymentMethod = this.dataset.method;
            });
        });

        if (confirmPaymentBtn) {
            confirmPaymentBtn.addEventListener('click', async function() {
                if (!selectedVenueForPayment || !selectedSlotForPayment) {
                    showMessage('Please select a venue and slot first.');
                    return;
                }

                // Simulate payment success (no actual payment gateway integration here)
                showMessage(`Payment confirmed for ${selectedVenueForPayment}, Slot ${selectedSlotForPayment} via ${currentPaymentMethod}! Total: RM ${REGISTRATION_FEE.toFixed(2)}.`);

                // Store payment confirmation in local storage for registration page
                localStorage.setItem(LOCAL_STORAGE_PAID_VENUE_KEY, selectedVenueForPayment);
                localStorage.setItem(LOCAL_STORAGE_PAID_SLOT_KEY, selectedSlotForPayment);

                // Clear temporary selection from local storage
                localStorage.removeItem(LOCAL_STORAGE_SELECTED_VENUE_KEY);
                localStorage.removeItem(LOCAL_STORAGE_SELECTED_SLOT_KEY);

                setTimeout(() => {
                    window.location.href = 'register.html';
                }, 2000);
            });
        }

        displayPaymentDetails();
    }

    // Registration Page Logic
    else if (currentPageId === 'register-page') {
        const registrationForm = document.getElementById('registration-form');
        const playerInputsContainer = document.getElementById('player-inputs');
        const venueSelect = document.getElementById('venue-select');
        const slotDisplay = document.getElementById('slot-display');

        const paidVenue = localStorage.getItem(LOCAL_STORAGE_PAID_VENUE_KEY);
        const paidSlot = localStorage.getItem(LOCAL_STORAGE_PAID_SLOT_KEY);
        const NUM_PLAYERS = 10;

        function generatePlayerInputs() {
            playerInputsContainer.innerHTML = '';
            for (let i = 0; i < NUM_PLAYERS; i++) {
                const playerEntryDiv = document.createElement('div');
                playerEntryDiv.classList.add('player-entry');
                playerEntryDiv.innerHTML = `
                    <input type="text" class="player-name" placeholder="Player ${i + 1} Name" required>
                    <input type="text" class="player-id" placeholder="ID Number (e.g., IC/Passport)" required>
                `;
                playerInputsContainer.appendChild(playerEntryDiv);
            }
        }

        if (paidVenue && paidSlot) {
            venueSelect.value = paidVenue;
            venueSelect.disabled = true;
            slotDisplay.value = paidSlot;
            slotDisplay.disabled = true;
            generatePlayerInputs();
        } else {
            showMessage('Please select a venue and make a payment before registering your team.');
            registrationForm.style.display = 'none';
            setTimeout(() => {
                window.location.href = 'payment.html';
            }, 3000);
        }

        if (registrationForm) {
            registrationForm.addEventListener('submit', async function(e) {
                e.preventDefault();

                const teamName = document.getElementById('team-name').value.trim();
                const venue = venueSelect.value;
                const slot = slotDisplay.value;
                const playerEntries = document.querySelectorAll('.player-entry');
                const players = [];

                if (!teamName) {
                    showMessage('Please enter a team name.');
                    return;
                }

                let allPlayersValid = true;
                playerEntries.forEach(entry => {
                    const playerName = entry.querySelector('.player-name').value.trim();
                    const playerId = entry.querySelector('.player-id').value.trim();

                    if (!playerName || !playerId) {
                        allPlayersValid = false;
                    }
                    players.push({ name: playerName, idNum: playerId });
                });

                if (!allPlayersValid) {
                    showMessage('Please fill in all player details.');
                    return;
                }

                const teamData = {
                    teamName: teamName,
                    venue: venue,
                    slot: slot,
                    players: players,
                    paymentStatus: 'paid', // Already paid
                    registrationDate: new Date().toISOString().split('T')[0]
                };

                const registrationResult = await registerTeamToAPI(teamData); // Send to API

                if (registrationResult) {
                    showMessage('Team registered successfully! You can now view your team on the venue page.');

                    // Clear the paid venue/slot flags from local storage after successful registration
                    localStorage.removeItem(LOCAL_STORAGE_PAID_VENUE_KEY);
                    localStorage.removeItem(LOCAL_STORAGE_PAID_SLOT_KEY);

                    setTimeout(() => {
                        const venuePageMap = {
                            'Padang A': 'venue_a.html',
                            'Padang B': 'venue_b.html',
                            'Padang C': 'venue_c.html'
                        };
                        window.location.href = venuePageMap[venue] || 'index.html';
                    }, 2000);
                }
            });
        }
    }
});
