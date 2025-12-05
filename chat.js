// ============================================
// TAX RELIEF EXPERTS - CHAT FUNCTIONALITY
// Realistic Live Chat Experience
// ============================================

class TaxReliefChat {
    constructor() {
        this.messagesContainer = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.typingIndicator = document.getElementById('typingIndicator');
        
        // Set agent avatar image if configured
        this.setAgentAvatar();
        
        this.messageHistory = [];
        this.conversationData = {
            sessionId: this.generateSessionId(),
            startTime: new Date().toISOString(),
            messages: [],
            userInfo: this.getUserInfo(),
            metadata: {}
        };
        this.isTyping = false;
        this.messageQueue = [];
        
        // User IP address (fetched asynchronously)
        this.userIpAddress = null;
        this.fetchUserIpAddress();
        
        // API Configuration
        this.apiConfig = {
            endpoint: window.API_ENDPOINT || 'https://api.example.com/chat/submit', // Can be set via window.API_ENDPOINT
            enabled: window.API_ENABLED !== false, // Default to true unless explicitly disabled
            sendOnUnload: true, // Send data when user leaves page
            sendAfterEachMessage: false, // Set to true to send after each message exchange
            batchSize: 5 // Send after this many messages if batch mode
        };
        
        // Lead Posting Configuration
        this.leadPostingConfig = {
            endpoint: window.LEAD_POST_ENDPOINT || 'https://taxreliefexperts-post.leadhoop.com/incoming/leads',
            enabled: window.LEAD_POST_ENABLED !== false, // Default to true
            testMode: window.LEAD_POST_TEST_MODE || false, // Set to true for test posts
            mediaType: 'noncallcenter'
        };
        
        // Question flow properties
        this.questions = null;
        this.orderSets = null;
        this.currentOrderSet = null;
        this.currentQuestionIndex = 0;
        this.questionAnswers = {};
        this.questionFlow = [];
        this.isInQuestionFlow = false;
        this.questionStartTime = null;
        this.questionModeEnabled = window.QUESTION_MODE_ENABLED === true; // Default to disabled, must be explicitly enabled
        
        // Load question configuration
        this.loadQuestionConfig();
        
        // Always initialize question flow if questions are available (for use after welcome messages)
        if (this.questions && Object.keys(this.questions).length > 0 && 
            this.orderSets && this.orderSets.length > 0) {
            this.initializeQuestionFlow();
        }
        
        // Agent responses database
        this.agentResponses = {
            greetings: [
                "Hello! I'm Michael, and I'm here to help you with your tax relief needs. How can I assist you today?",
                "Hi there! Thanks for reaching out. I specialize in helping people resolve their tax debt. What brings you here today?",
                "Welcome! I'm here to help you find solutions for your tax problems. What would you like to know?"
            ],
            taxDebt: [
                "I understand you're dealing with tax debt. The good news is there are several options available. How much do you currently owe?",
                "Tax debt can be overwhelming, but we've helped thousands of people in similar situations. Can you tell me approximately how much you owe?",
                "We specialize in negotiating with the IRS to reduce tax debt. What's the approximate amount you're dealing with?"
            ],
            amount: [
                "Thank you for that information. Based on what you've shared, we may be able to help you reduce that amount significantly through an Offer in Compromise or other settlement options.",
                "I see. We've successfully negotiated reductions of 50-90% for many of our clients. Would you like to learn more about your options?",
                "That's definitely something we can work with. Our team has extensive experience negotiating with the IRS for amounts in that range."
            ],
            help: [
                "Absolutely! We offer several services including Offer in Compromise, Installment Agreements, and Penalty Abatement. Which would you like to learn more about?",
                "Of course! We can help with tax debt settlement, penalty reduction, and even audit defense. What's your biggest concern right now?",
                "Yes! We have a team of tax professionals ready to help. We can start by reviewing your situation and determining the best path forward."
            ],
            process: [
                "Great question! The process typically starts with a free consultation where we review your situation. Then we'll determine the best strategy and handle all communication with the IRS on your behalf.",
                "Here's how it works: First, we'll do a free assessment of your case. Then, if you decide to work with us, we'll prepare and submit all necessary paperwork to the IRS. You won't have to deal with them directly.",
                "The process is straightforward: We start with a free consultation, then we'll develop a customized strategy for your situation. Our team handles everything from there, keeping you updated every step of the way."
            ],
            time: [
                "The timeline varies depending on your specific situation, but most cases are resolved within 6-12 months. Some simpler cases can be resolved in as little as 3-4 months.",
                "It depends on the complexity of your case, but typically we see results within 6-12 months. We'll work as quickly as possible while ensuring everything is done correctly.",
                "Most of our clients see progress within 6-12 months. We'll keep you informed throughout the entire process so you always know where things stand."
            ],
            cost: [
                "We offer a free consultation to review your case. Our fees are based on the complexity of your situation and the services needed. Would you like to schedule a free consultation to discuss your specific case?",
                "The cost depends on your individual situation, but we always start with a free consultation. During that call, we'll explain our fees and payment options. No obligation!",
                "We believe in transparency. We offer a free consultation first, and then we'll discuss our fees based on your specific needs. Many of our clients find our services very affordable compared to what they save."
            ],
            contact: [
                "I'd be happy to help you get started! You can call us at 1-800-123-4567, or I can help you schedule a free consultation right now. What works best for you?",
                "Great! The best way to get started is with a free consultation. Would you like me to help you schedule one? You can also call us directly at 1-800-123-4567.",
                "Perfect! We can schedule a free consultation to review your case. Would you like to set that up now, or would you prefer to call us at 1-800-123-4567?"
            ],
            default: [
                "I understand. Let me help you with that. Can you tell me a bit more about your situation?",
                "That's a great question. Our team specializes in tax relief, and we've helped thousands of people resolve their tax issues. What specific concern do you have?",
                "I'm here to help! Could you provide a bit more detail so I can give you the most accurate information?",
                "Thanks for sharing that. We have several options that might work for your situation. Would you like to learn more about how we can help?"
            ]
        };
        
        this.init();
    }
    
    init() {
        // Scroll page to chat window on load
        this.scrollToChatWindow();
        
        // Add event listeners
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Auto-resize textarea
        this.chatInput.addEventListener('input', () => {
            this.autoResizeTextarea();
        });
        
        // Focus input on load (prevent scroll by focusing after scroll completes)
        // Wait longer to ensure smooth scroll completes (smooth scrolls typically take 300-500ms)
        setTimeout(() => {
            // Store current scroll position before focusing
            const scrollY = window.scrollY;
            // Focus the input
            this.chatInput.focus({ preventScroll: true });
            // If preventScroll doesn't work, restore scroll position
            requestAnimationFrame(() => {
                if (Math.abs(window.scrollY - scrollY) > 5) {
                    window.scrollTo({
                        top: scrollY,
                        behavior: 'auto'
                    });
                }
            });
        }, 800); // Wait for smooth scroll to complete (100ms start + ~500ms duration + buffer)
        
        // Set up page unload handler to save conversation
        if (this.apiConfig.sendOnUnload) {
            window.addEventListener('beforeunload', () => {
                this.sendConversationToAPI(true); // Send synchronously on unload
            });
            
            // Also handle visibility change (tab switch, minimize)
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.sendConversationToAPI();
                }
            });
        }
        
        // Start with welcome message or question flow
        setTimeout(() => {
            this.showTypingIndicator();
            setTimeout(() => {
                this.hideTypingIndicator();
                setTimeout(() => {
                    if (this.questionModeEnabled && this.isInQuestionFlow) {
                        // Start question flow
                        this.startQuestionFlow();
                    } else {
                        // Regular welcome message
                        this.addAgentMessage("Hello! 👋 I'm Michael from Tax Relief Experts.  If you owe taxes, we can help cut your debt by up to 90%. You're entitled to a FREE case evaluation to see if you see qualify to have your debt forgiven.");
                        // Add second message after a delay
                        setTimeout(() => {
                            this.showTypingIndicator();
                            setTimeout(() => {
                                this.hideTypingIndicator();
                                setTimeout(() => {
                                    this.addAgentMessage("I'll just need some details from you to get started.");
                                    // Start question flow after second message
                                    setTimeout(() => {
                                        if (this.isInQuestionFlow && this.questionFlow.length > 0) {
                                            this.startQuestionFlow();
                                        }
                                    }, 1500);
                                }, 300);
                            }, 1500);
                        }, 2500);
                    }
                }, 300);
            }, 1000);
        }, 500);
    }
    
    // ============================================
    // QUESTION FLOW METHODS
    // ============================================
    
    loadQuestionConfig() {
        // Load from global variables set by questions.config.js
        this.questions = window.QUESTIONS || {};
        this.orderSets = window.ORDER_SETS || [];
        
        if (!this.questions || Object.keys(this.questions).length === 0) {
            console.warn('Questions configuration not loaded. Question flow disabled.');
            this.questionModeEnabled = false;
        }
        
        if (!this.orderSets || this.orderSets.length === 0) {
            console.warn('Order sets configuration not loaded. Question flow disabled.');
            this.questionModeEnabled = false;
        }
    }
    
    initializeQuestionFlow() {
        if (!this.orderSets || this.orderSets.length === 0) {
            return;
        }
        
        // Randomly select an order set
        const randomIndex = Math.floor(Math.random() * this.orderSets.length);
        this.currentOrderSet = this.orderSets[randomIndex];
        //this.currentOrderSet = this.orderSets[3];
        // Build question flow array
        this.questionFlow = this.currentOrderSet.order.map(qId => ({
            questionId: qId,
            question: this.questions[qId],
            answered: false,
            answer: null,
            timestamp: null,
            timeToAnswer: null,
            questionStartTime: null
        }));
        
        // Mark that we're ready for question flow
        this.isInQuestionFlow = true;
        
        // Track order set selection
        this.trackOrderSetSelection();
    }
    
    trackOrderSetSelection() {
        if (!this.currentOrderSet) return;
        
        // Send to analytics API
        this.sendAnalyticsEvent('order_set_selected', {
            orderSetId: this.currentOrderSet.id,
            orderSetName: this.currentOrderSet.name,
            questionOrder: this.currentOrderSet.order,
            userInfo: this.conversationData.userInfo
        });
    }
    
    startQuestionFlow() {
        if (!this.isInQuestionFlow || this.questionFlow.length === 0) {
            return;
        }
        
        this.questionStartTime = Date.now();
        this.currentQuestionIndex = 0;
        this.askNextQuestion();
    }
    
    askNextQuestion() {
        if (this.currentQuestionIndex >= this.questionFlow.length) {
            this.completeQuestionFlow();
            return;
        }
        
        const currentQuestion = this.questionFlow[this.currentQuestionIndex];
        const questionData = currentQuestion.question;
        
        if (!questionData) {
            console.error(`Question ${currentQuestion.questionId} not found in configuration`);
            this.currentQuestionIndex++;
            this.askNextQuestion();
            return;
        }
        
        // Track question start
        currentQuestion.questionStartTime = Date.now();
        this.trackQuestionStart(currentQuestion.questionId);
        
        // Format question based on type
        let questionText = questionData.text;
        
        // Show typing indicator before adding question (if not already showing)
        if (!this.isTyping) {
            this.showTypingIndicator();
            setTimeout(() => {
                this.hideTypingIndicator();
                setTimeout(() => {
                    // Add question to chat
                    this.addAgentMessage(questionText);
                    
                    // Show quick-response buttons in messages area for question 1 (if configured)
                    if (currentQuestion.questionId === 1 && questionData.quickResponses) {
                        this.showQuickResponseButtons(questionData.quickResponses, currentQuestion.questionId);
                    }
                    
                    // Show appropriate input UI based on question type
                    this.showQuestionInput(questionData);
                }, 300);
            }, 1500);
        } else {
            // If typing indicator is already showing, just add the message after it hides
            // Add question to chat
            this.addAgentMessage(questionText);
            
            // Show quick-response buttons in messages area for question 1 (if configured)
            if (currentQuestion.questionId === 1 && questionData.quickResponses) {
                this.showQuickResponseButtons(questionData.quickResponses, currentQuestion.questionId);
            }
            
            // Show appropriate input UI based on question type
            this.showQuestionInput(questionData);
        }
    }
    
    showQuestionInput(questionData) {
        const inputWrapper = document.querySelector('.chat-input-wrapper');
        
        if (!inputWrapper) return;
        
        // Clear existing custom inputs
        const existingButtons = inputWrapper.querySelector('.question-buttons');
        if (existingButtons) {
            existingButtons.remove();
        }
        
        // Reset input
        this.chatInput.value = '';
        this.chatInput.style.display = 'block';
        
        // Reset input attributes before setting new ones
        this.chatInput.removeAttribute('inputmode');
        this.chatInput.removeAttribute('pattern');
        this.chatInput.removeAttribute('maxLength');
        
        // Show appropriate input based on question type
        switch(questionData.type) {
            case 'yesno':
                this.showYesNoButtons(inputWrapper);
                break;
            case 'multiple_choice':
                this.showMultipleChoiceButtons(questionData.options, inputWrapper, questionData);
                break;
            case 'amount':
                this.chatInput.placeholder = 'Enter amount (e.g., 5000)';
                this.chatInput.setAttribute('inputmode', 'numeric');
                this.chatInput.setAttribute('pattern', '[0-9]*');
                break;
            case 'text':
                this.chatInput.placeholder = 'Type your answer...';
                this.chatInput.setAttribute('inputmode', 'text');
                this.chatInput.maxLength = questionData.maxLength || 500;
                break;
            default:
                this.chatInput.placeholder = 'Type your answer...';
                this.chatInput.setAttribute('inputmode', 'text');
        }
        
        // Focus input
        setTimeout(() => {
            if (this.chatInput.style.display !== 'none') {
                this.chatInput.focus();
            }
        }, 300);
    }
    
    showYesNoButtons(container) {
        // Create yes/no buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'question-buttons question-buttons--yesno';
        
        buttonContainer.innerHTML = `
            <button class="question-btn question-btn--yes" data-answer="yes">
                <i class="fas fa-check"></i> Yes
            </button>
            <button class="question-btn question-btn--no" data-answer="no">
                <i class="fas fa-times"></i> No
            </button>
        `;
        
        // Hide text input temporarily
        const input = container.querySelector('.chat-input');
        if (input) {
            input.style.display = 'none';
        }
        
        container.appendChild(buttonContainer);
        
        // Add event listeners
        buttonContainer.querySelectorAll('.question-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const answer = e.target.closest('.question-btn').dataset.answer;
                this.handleQuestionAnswer(answer);
            });
        });
    }
    
    showMultipleChoiceButtons(options, container, questionData) {
        const isStateQuestion = questionData.validation && questionData.validation.type === 'state';
        const currentQuestion = this.questionFlow[this.currentQuestionIndex];
        const questionId = currentQuestion ? currentQuestion.questionId : null;
        
        // Create wrapper for state questions with filter
        let wrapper = null;
        let buttonContainer = null;
        let filterInput = null;
        
        if (isStateQuestion) {
            // Create wrapper that contains both scrollable list and filter input
            wrapper = document.createElement('div');
            wrapper.className = 'question-buttons-wrapper';
            
            buttonContainer = document.createElement('div');
            buttonContainer.className = 'question-buttons question-buttons--multiple question-buttons--scrollable';
            
            // Add grid class for question 3 (state)
            if (questionId === 3) {
                buttonContainer.classList.add('question-buttons--grid');
            }
            
            // Create filter input
            filterInput = document.createElement('input');
            filterInput.type = 'text';
            filterInput.className = 'state-filter-input';
            filterInput.placeholder = 'Type to filter states...';
            filterInput.setAttribute('autocomplete', 'off');
            
            // Append filter input first (at top), then button container (below)
            wrapper.appendChild(filterInput);
            wrapper.appendChild(buttonContainer);
        } else {
            // Regular multiple choice without filter
            buttonContainer = document.createElement('div');
            buttonContainer.className = 'question-buttons question-buttons--multiple';
            
            // Add scrollable class if there are many options
            if (options.length > 10) {
                buttonContainer.classList.add('question-buttons--scrollable');
            }
        }
        
        // Store original options for filtering
        const originalOptions = [...options];
        
        // Create buttons with data attributes for filtering
        const createButtonsHTML = (optionsList) => {
            return optionsList.map((option) => 
                `<button class="question-btn question-btn--choice" data-answer="${this.escapeHtml(option)}" data-search-text="${this.escapeHtml(option.toLowerCase())}">${this.escapeHtml(option)}</button>`
            ).join('');
        };
        
        buttonContainer.innerHTML = createButtonsHTML(originalOptions);
        
        // Hide main text input temporarily
        const input = container.querySelector('.chat-input');
        if (input) {
            input.style.display = 'none';
        }
        
        // Append to container
        if (isStateQuestion) {
            container.appendChild(wrapper);
            
            // Ensure scrollable container can scroll after it's added to DOM
            setTimeout(() => {
                if (buttonContainer && buttonContainer.classList.contains('question-buttons--scrollable')) {
                    // Force a reflow to ensure styles are applied
                    buttonContainer.offsetHeight;
                    
                    // Force height and overflow to ensure scrolling works
                    buttonContainer.style.height = '18rem';
                    buttonContainer.style.maxHeight = '18rem';
                    buttonContainer.style.overflowY = 'scroll';
                    buttonContainer.style.overflowX = 'hidden';
                    buttonContainer.style.flex = '0 0 auto'; // Prevent flex from overriding
                    
                    // Wait for layout to calculate, then verify scrolling
                    requestAnimationFrame(() => {
                        const contentHeight = buttonContainer.scrollHeight;
                        const containerHeight = buttonContainer.clientHeight;
                        
                        // If content fits without scrolling, reduce height further
                        if (contentHeight <= containerHeight && contentHeight > 0) {
                            buttonContainer.style.height = '12rem';
                            buttonContainer.style.maxHeight = '12rem';
                        }
                        
                        // Verify scrolling is working
                        if (contentHeight > containerHeight) {
                            console.log('State buttons container is scrollable:', {
                                contentHeight,
                                containerHeight,
                                canScroll: contentHeight > containerHeight,
                                scrollTop: buttonContainer.scrollTop,
                                scrollHeight: buttonContainer.scrollHeight
                            });
                        } else {
                            console.warn('State buttons container may not be scrollable:', {
                                contentHeight,
                                containerHeight
                            });
                        }
                    });
                }
            }, 100);
        } else {
            container.appendChild(buttonContainer);
        }
        
        // Add filter functionality for state questions
        if (isStateQuestion && filterInput) {
            const stateCodeMap = {
                'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
                'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
                'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
                'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
                'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
                'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
                'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
                'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
                'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
                'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
            };
            
            // Create reverse mapping: state name -> code
            const stateNameToCode = {};
            Object.keys(stateCodeMap).forEach(code => {
                stateNameToCode[stateCodeMap[code].toLowerCase()] = code;
            });
            
            filterInput.addEventListener('input', (e) => {
                const filterText = e.target.value.toLowerCase().trim();
                const buttons = buttonContainer.querySelectorAll('.question-btn');
                
                buttons.forEach(btn => {
                    const stateName = btn.dataset.answer;
                    const stateNameLower = stateName.toLowerCase();
                    const stateCode = stateNameToCode[stateNameLower] || '';
                    
                    // Show if:
                    // 1. Filter is empty (show all)
                    // 2. State name contains filter text
                    // 3. Filter text matches state code (2 letters)
                    const matchesName = stateNameLower.includes(filterText);
                    const matchesCode = filterText.length === 2 && stateCode === filterText.toUpperCase();
                    
                    if (filterText === '' || matchesName || matchesCode) {
                        btn.style.display = 'flex';
                    } else {
                        btn.style.display = 'none';
                    }
                });
            });
            
            // Allow Enter key to select state
            filterInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const filterText = filterInput.value.trim();
                    const allButtons = buttonContainer.querySelectorAll('.question-btn');
                    const visibleButtons = Array.from(allButtons)
                        .filter(btn => btn.style.display !== 'none');
                    
                    // If exactly one match, select it
                    if (visibleButtons.length === 1) {
                        visibleButtons[0].click();
                    } 
                    // If filter is a 2-letter state code, try to find and select it
                    else if (filterText.length === 2) {
                        const stateCode = filterText.toUpperCase();
                        const stateName = stateCodeMap[stateCode];
                        if (stateName) {
                            const matchingButton = Array.from(allButtons).find(btn => 
                                btn.dataset.answer === stateName
                            );
                            if (matchingButton) {
                                matchingButton.click();
                            }
                        }
                    }
                    // If multiple matches, don't auto-select - user should click or type more
                }
            });
        }
        
        // Add event listeners for button clicks
        buttonContainer.querySelectorAll('.question-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const answer = e.target.closest('.question-btn').dataset.answer;
                this.handleQuestionAnswer(answer);
                // Clean up wrapper if it exists
                if (wrapper) {
                    wrapper.remove();
                } else {
                    buttonContainer.remove();
                }
                // Restore main input
                if (input) {
                    input.style.display = 'block';
                }
            });
        });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showQuickResponseButtons(options, questionId) {
        // Create quick-response buttons container
        const quickResponseContainer = document.createElement('div');
        quickResponseContainer.className = 'quick-response-buttons';
        
        // Add grid class for questions 1 (amount) and 3 (state)
        if (questionId === 1 || questionId === 3) {
            quickResponseContainer.classList.add('quick-response-buttons--grid');
        }
        
        const buttonsHTML = options.map((option) => 
            `<button class="quick-response-btn" data-answer="${this.escapeHtml(option)}">${this.escapeHtml(option)}</button>`
        ).join('');
        
        quickResponseContainer.innerHTML = buttonsHTML;
        
        // Add to messages container
        this.messagesContainer.appendChild(quickResponseContainer);
        
        // Scroll to show buttons fully (with extra offset for mobile)
        setTimeout(() => {
            const container = this.messagesContainer;
            // Scroll to bottom with extra padding to ensure buttons are fully visible
            const scrollHeight = container.scrollHeight;
            const clientHeight = container.clientHeight;
            const extraPadding = 150; // Extra padding to ensure buttons aren't cut off
            
            container.scrollTop = scrollHeight - clientHeight + extraPadding;
            
            // If that doesn't work, try scrolling the button into view
            requestAnimationFrame(() => {
                const buttonsRect = quickResponseContainer.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                
                // Check if buttons are cut off at bottom
                if (buttonsRect.bottom > containerRect.bottom - 50) {
                    // Scroll more to show buttons fully
                    const additionalScroll = buttonsRect.bottom - containerRect.bottom + 100;
                    container.scrollTop = container.scrollTop + additionalScroll;
                }
            });
        }, 150);
        
        // Add event listeners
        quickResponseContainer.querySelectorAll('.quick-response-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const answer = e.target.closest('.quick-response-btn').dataset.answer;
                // Remove all quick-response buttons
                const allQuickResponses = this.messagesContainer.querySelectorAll('.quick-response-buttons');
                allQuickResponses.forEach(container => container.remove());
                // Handle the answer
                this.handleQuestionAnswer(answer);
            });
        });
    }
    
    categorizeAmount(amount, questionData) {
        // Extract numeric value from string (handles $, commas, etc.)
        const numericValue = parseFloat(amount.toString().replace(/[^0-9.]/g, ''));
        
        if (isNaN(numericValue) || !questionData.amountRanges) {
            return amount; // Return original if can't parse or no ranges defined
        }
        
        // Find the matching range
        for (const range of questionData.amountRanges) {
            if (numericValue >= range.min && numericValue <= range.max) {
                return range.label;
            }
        }
        
        // If no match found, return original
        return amount;
    }
    
    handleQuestionAnswer(answer) {
        // This will be called from button clicks or regular input
        const currentQuestion = this.questionFlow[this.currentQuestionIndex];
        
        if (!currentQuestion) {
            return;
        }
        
        const questionStartTime = currentQuestion.questionStartTime || Date.now();
        const questionData = currentQuestion.question;
        
        // For question 1 (amount), categorize the answer if it's a typed numeric value
        let categorizedAnswer = answer;
        if (currentQuestion.questionId === 1 && questionData.amountRanges) {
            // Check if answer is already a quick-response label
            const isQuickResponse = questionData.quickResponses && questionData.quickResponses.includes(answer);
            
            if (!isQuickResponse) {
                // Try to categorize the typed answer
                categorizedAnswer = this.categorizeAmount(answer, questionData);
            }
        }
        
        // For state questions, normalize state codes to full state names
        if (questionData.validation && questionData.validation.type === 'state' && questionData.validation.acceptCodes) {
            const stateCodeMap = {
                'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
                'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
                'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
                'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
                'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
                'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
                'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
                'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
                'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
                'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
            };
            const upperAnswer = answer.toUpperCase().trim();
            // If answer is a state code, normalize to full state name
            if (stateCodeMap[upperAnswer] && questionData.options.includes(stateCodeMap[upperAnswer])) {
                categorizedAnswer = stateCodeMap[upperAnswer];
            }
        }
        
        // Remove quick-response buttons if they exist
        const quickResponseContainers = this.messagesContainer.querySelectorAll('.quick-response-buttons');
        quickResponseContainers.forEach(container => container.remove());
        
        // Add user message first (so it always appears, even if validation fails)
        this.addUserMessage(answer);
        
        // Validate answer (use original answer for validation)
        const isValid = this.validateAnswer(answer, questionData, currentQuestion.questionId);
        if (!isValid) {
            // Show typing indicator before error message
            this.showTypingIndicator();
            
            // Determine error message
            let errorMessage;
            if (currentQuestion.questionId === 6) {
                errorMessage = "Please provide your full first and last name.";
            } else if (currentQuestion.questionId === 7) {
                errorMessage = "That doesn't appear to be a valid email address. It's important that you supply your correct email so we can send you a copy of your tax settlement agreement. Please type out your correct email address.";
            } else if (currentQuestion.questionId === 8) {
                errorMessage = "That doesn't appear to be a valid phone number. Please enter your phone number in a format like (555) 123-4567 or 555-123-4567.";
            } else {
                errorMessage = "I didn't understand that. Could you please try again?";
            }
            
            // Show error message after typing delay
            setTimeout(() => {
                this.hideTypingIndicator();
                setTimeout(() => {
                    this.addAgentMessage(errorMessage);
                }, 300);
            }, 1500);
            
            return;
        }
        
        // Store categorized answer (or original if no categorization)
        currentQuestion.answered = true;
        currentQuestion.answer = categorizedAnswer;
        currentQuestion.rawAnswer = answer; // Store original answer too
        currentQuestion.timestamp = Date.now();
        currentQuestion.timeToAnswer = currentQuestion.timestamp - questionStartTime;
        
        // Track answer (store categorized version)
        this.trackQuestionAnswer(
            currentQuestion.questionId,
            categorizedAnswer,
            currentQuestion.timeToAnswer
        );
        
        // Check for follow-up message (use categorized answer for condition check)
        if (questionData.followUp) {
            const followUp = questionData.followUp;
            // Simple condition check (can be enhanced)
            if (followUp.condition && this.evaluateCondition(categorizedAnswer, followUp.condition)) {
                setTimeout(() => {
                    this.addAgentMessage(followUp.message);
                }, 500);
            }
        }
        
        // Move to next question
        this.currentQuestionIndex++;
        
        // Small delay before next question (typing indicator will be shown in askNextQuestion)
        setTimeout(() => {
            this.askNextQuestion();
        }, 500);
    }
    
    evaluateCondition(answer, condition) {
        // Simple condition evaluation (can be enhanced)
        // Handle both numeric values and range labels
        if (condition.includes('>')) {
            // Extract numeric value from answer (handles range labels like "$50,000 to $74,999")
            let numericValue;
            if (typeof answer === 'string' && answer.includes('$')) {
                // Try to extract the first number from the range
                const match = answer.match(/\$?([\d,]+)/);
                if (match) {
                    numericValue = parseFloat(match[1].replace(/,/g, ''));
                } else {
                    numericValue = parseFloat(answer.replace(/[^0-9.]/g, ''));
                }
            } else {
                numericValue = parseFloat(answer.toString().replace(/[^0-9.]/g, ''));
            }
            
            const threshold = parseFloat(condition.split('>')[1].trim());
            return !isNaN(numericValue) && numericValue > threshold;
        }
        return false;
    }
    
    validateEmail(email) {
        // Basic email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    }
    
    validatePhone(phone) {
        // Remove common phone number formatting characters
        const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
        // Check if it's a valid phone number (10 digits, optionally with country code)
        const phoneRegex = /^(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
        // Also check for just digits (10 or 11 digits)
        const digitsOnly = cleaned.replace(/\D/g, '');
        return (phoneRegex.test(phone) || (digitsOnly.length >= 10 && digitsOnly.length <= 11));
    }
    
    validateFullName(name) {
        // Trim whitespace
        const trimmed = name.trim();
        
        // Must contain at least one space (at least 2 words)
        if (!trimmed.includes(' ')) {
            return false;
        }
        
        // Check for invalid characters - only letters, spaces, and hyphens allowed
        // Allow letters (including accented characters), spaces, and hyphens
        const validNameRegex = /^[a-zA-ZÀ-ÿ\s\-]+$/;
        if (!validNameRegex.test(trimmed)) {
            return false;
        }
        
        // Split by spaces and filter out empty strings
        const words = trimmed.split(/\s+/).filter(word => word.length > 0);
        
        // Must have at least 2 words
        if (words.length < 2) {
            return false;
        }
        
        // Each word must be at least 2 characters (after removing hyphens for length check)
        for (const word of words) {
            // Check word length (hyphens don't count toward minimum length)
            const wordWithoutHyphens = word.replace(/-/g, '');
            if (wordWithoutHyphens.length < 2) {
                return false;
            }
            
            // Ensure word doesn't start or end with hyphen
            if (word.startsWith('-') || word.endsWith('-')) {
                return false;
            }
        }
        
        return true;
    }
    
    validateAnswer(answer, question, questionId) {
        if (!answer || (typeof answer === 'string' && !answer.trim())) {
            if (question.required) {
                return false;
            }
            return true; // Optional questions can be empty
        }
        
        // Validate full name for question 6
        if (questionId === 6) {
            return this.validateFullName(answer);
        }
        
        // Validate email for question 7
        if (questionId === 7) {
            return this.validateEmail(answer);
        }
        
        // Validate phone for question 8
        if (questionId === 8) {
            return this.validatePhone(answer);
        }
        
        switch(question.type) {
            case 'amount':
                // Check if answer is a quick-response label (for question 1)
                if (question.quickResponses && question.quickResponses.includes(answer)) {
                    return true;
                }
                // Otherwise, validate as numeric
                const num = parseFloat(answer.toString().replace(/[^0-9.]/g, ''));
                if (isNaN(num)) return false;
                if (question.validation && question.validation.min !== undefined) {
                    return num >= question.validation.min;
                }
                return true;
            case 'yesno':
                const lowerAnswer = answer.toLowerCase();
                return ['yes', 'no', 'y', 'n', 'true', 'false'].includes(lowerAnswer);
            case 'multiple_choice':
                // Check if answer is in options
                if (question.options && question.options.includes(answer)) {
                    return true;
                }
                // If state validation is enabled, also check for 2-letter state codes
                if (question.validation && question.validation.type === 'state' && question.validation.acceptCodes) {
                    const stateCodeMap = {
                        'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
                        'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
                        'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
                        'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
                        'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
                        'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
                        'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
                        'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
                        'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
                        'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
                    };
                    const upperAnswer = answer.toUpperCase().trim();
                    // Check if it's a valid state code and maps to a state in options
                    if (stateCodeMap[upperAnswer] && question.options.includes(stateCodeMap[upperAnswer])) {
                        return true;
                    }
                }
                return false;
            case 'text':
                if (question.maxLength) {
                    return answer.length <= question.maxLength;
                }
                return answer.trim().length > 0;
            default:
                return answer && answer.trim().length > 0;
        }
    }
    
    completeQuestionFlow() {
        this.isInQuestionFlow = false;
        const completionTime = Date.now() - this.questionStartTime;
        
        // Calculate completion percentage
        const answeredCount = this.questionFlow.filter(q => q.answered).length;
        const completionPercentage = (answeredCount / this.questionFlow.length) * 100;
        
        // Track completion
        this.trackQuestionFlowCompletion(completionPercentage, completionTime);
        
        // Check CTA mode
        const ctaMode = window.CTA_MODE || 'popup';
        const phoneNumber = window.CTA_PHONE_NUMBER || '1-888-614-2994';
        
        if (ctaMode === 'chat') {
            // Send next steps as chat messages
            setTimeout(() => {
                this.addAgentMessage("Thank you for providing that information! Based on the info you've provided, you are eligible for a completely free case evaluation. There is ZERO payment required for this evaluation.");
                
                // Second message after a delay
                setTimeout(() => {
                    this.showTypingIndicator();
                    setTimeout(() => {
                        this.hideTypingIndicator();
                        setTimeout(() => {
                            // Format phone for tel: link (remove dashes and spaces)
                            const phoneForLink = phoneNumber.replace(/[^0-9+]/g, '');
                            this.addAgentMessageWithHTML(`In 2024 alone, the IRS forgave $163.4M in tax debt. We know how to get them to forgive yours. If you want to put a stop to the phone calls and letters from the IRS, and put an end to your tax nightmare, take the first step by giving us a call right now. One of our highly experienced agents is standing by to help you. <a href="tel:${phoneForLink}" class="chat-phone-link">Call us at ${phoneNumber}</a>`);
                        }, 300);
                    }, 2000);
                }, 3000);
            }, 1000);
        } else {
            // Default: Show CTA popup
            setTimeout(() => {
                this.addAgentMessage("Thank you for providing that information! Based on that info, you are eligible for a completely free case evaluation. One of our specialists will assess your situation and determine if we can qualify you for a tax settlement to eliminate up to 90% of your tax debt");
                
                // After 8 seconds, collapse chat and show call button
                setTimeout(() => {
                    this.showCallToAction();
                }, 8000);
            }, 1000);
        }
        
        // Send complete data to API
        this.sendQuestionFlowData();
        
        // Post lead to LeadHoop endpoint
        this.postLeadToEndpoint().then(result => {
            if (result.success) {
                console.log('Lead successfully posted to LeadHoop');
                // Track successful lead post
                this.sendAnalyticsEvent('lead_posted', {
                    success: true,
                    sessionId: this.conversationData.sessionId
                });
            } else {
                console.warn('Lead post was not successful:', result);
                // Track failed lead post
                this.sendAnalyticsEvent('lead_post_failed', {
                    success: false,
                    reason: result.reason || result.error || 'unknown',
                    sessionId: this.conversationData.sessionId
                });
            }
        }).catch(error => {
            console.error('Lead posting error:', error);
            this.sendAnalyticsEvent('lead_post_error', {
                error: error.message,
                sessionId: this.conversationData.sessionId
            });
        });
    }
    
    showCallToAction() {
        // Collapse the chat window
        const chatWindow = document.getElementById('chatWindow');
        if (chatWindow) {
            chatWindow.classList.add('chat-window--collapsed');
        }
        
        // Show eligibility message and call button
        const ctaContainer = document.getElementById('ctaContainer');
        if (ctaContainer) {
            ctaContainer.classList.add('cta-container--visible');
        }
    }
    
    trackQuestionStart(questionId) {
        this.sendAnalyticsEvent('question_started', {
            orderSetId: this.currentOrderSet?.id,
            questionId: questionId,
            questionIndex: this.currentQuestionIndex,
            timestamp: Date.now()
        });
    }
    
    trackQuestionAnswer(questionId, answer, timeToAnswer) {
        this.sendAnalyticsEvent('question_answered', {
            orderSetId: this.currentOrderSet?.id,
            questionId: questionId,
            questionIndex: this.currentQuestionIndex,
            answer: answer,
            timeToAnswer: timeToAnswer,
            timestamp: Date.now()
        });
    }
    
    trackQuestionFlowCompletion(completionPercentage, totalTime) {
        this.sendAnalyticsEvent('question_flow_completed', {
            orderSetId: this.currentOrderSet?.id,
            completionPercentage: completionPercentage,
            totalTime: totalTime,
            questionsAnswered: this.questionFlow.filter(q => q.answered).length,
            totalQuestions: this.questionFlow.length,
            timestamp: Date.now()
        });
    }
    
    sendQuestionFlowData() {
        if (!this.currentOrderSet) return;
        
        const flowData = {
            sessionId: this.conversationData.sessionId,
            orderSetId: this.currentOrderSet.id,
            orderSetName: this.currentOrderSet.name,
            questionOrder: this.currentOrderSet.order,
            questions: this.questionFlow.map(q => ({
                questionId: q.questionId,
                answered: q.answered,
                answer: q.answer,
                timestamp: q.timestamp,
                timeToAnswer: q.timeToAnswer
            })),
            completionPercentage: (this.questionFlow.filter(q => q.answered).length / this.questionFlow.length) * 100,
            totalTime: Date.now() - this.questionStartTime,
            userInfo: this.conversationData.userInfo
        };
        
        // Send to analytics API
        this.sendAnalyticsEvent('question_flow_data', flowData);
    }
    
    sendAnalyticsEvent(eventType, data) {
        // Send to analytics endpoint if configured
        if (this.apiConfig.enabled) {
            const endpoint = window.ANALYTICS_ENDPOINT || 
                           (this.apiConfig.endpoint && this.apiConfig.endpoint.replace('/submit', '/analytics/event')) ||
                           'http://localhost:3000/api/analytics/event';
            
            fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventType: eventType,
                    sessionId: this.conversationData.sessionId,
                    timestamp: new Date().toISOString(),
                    data: data
                })
            }).catch(err => {
                // Silently fail - analytics shouldn't break the chat experience
                if (window.ANALYTICS_ENDPOINT) {
                    console.warn('Analytics error:', err);
                }
            });
        }
        
        // Also store locally for dashboard
        this.storeAnalyticsLocally(eventType, data);
    }
    
    storeAnalyticsLocally(eventType, data) {
        try {
            const analytics = JSON.parse(localStorage.getItem('chatAnalytics') || '[]');
            analytics.push({
                eventType,
                timestamp: Date.now(),
                data
            });
            // Keep last 1000 events
            if (analytics.length > 1000) {
                analytics.shift();
            }
            localStorage.setItem('chatAnalytics', JSON.stringify(analytics));
        } catch (e) {
            console.error('Error storing analytics:', e);
        }
    }
    
    sendMessage() {
        const message = this.chatInput.value.trim();
        
        if (!message || this.isTyping) {
            return;
        }
        
        // Check if we're in question flow mode
        if (this.isInQuestionFlow && this.currentQuestionIndex < this.questionFlow.length) {
            // Handle as question answer
            this.handleQuestionAnswer(message);
            // Clear input and reset height
            this.chatInput.value = '';
            this.autoResizeTextarea();
            return;
        }
        
        // Regular chat mode
        // Add user message
        this.addUserMessage(message);
        
        // Clear input and reset height
        this.chatInput.value = '';
        this.autoResizeTextarea();
        this.chatInput.focus();
        
        // Disable send button
        this.sendBtn.disabled = true;
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Generate and send agent response
        setTimeout(() => {
            const response = this.generateResponse(message);
            this.hideTypingIndicator();
            setTimeout(() => {
                this.addAgentMessage(response);
                this.sendBtn.disabled = false;
                
                // Send to API if configured to send after each message
                if (this.apiConfig.sendAfterEachMessage) {
                    this.sendConversationToAPI();
                } else if (this.conversationData.messages.length >= this.apiConfig.batchSize) {
                    // Send in batches if batch mode
                    this.sendConversationToAPI();
                }
            }, 300);
        }, this.calculateTypingTime(message));
    }
    
    addUserMessage(text) {
        const message = this.createMessageElement('user', text);
        this.messagesContainer.appendChild(message);
        this.scrollToBottom();
        
        const messageData = {
            type: 'user',
            text: text,
            timestamp: new Date().toISOString(),
            displayTime: this.getCurrentTime()
        };
        
        this.messageHistory.push({ type: 'user', text });
        this.conversationData.messages.push(messageData);
    }
    
    addAgentMessage(text) {
        const message = this.createMessageElement('agent', text);
        this.messagesContainer.appendChild(message);
        this.scrollToBottom();
        
        const messageData = {
            type: 'agent',
            text: text,
            timestamp: new Date().toISOString(),
            displayTime: this.getCurrentTime(),
            agentName: 'Michael D.'
        };
        
        this.messageHistory.push({ type: 'agent', text });
        this.conversationData.messages.push(messageData);
    }
    
    addAgentMessageWithHTML(html) {
        const message = this.createMessageElementWithHTML('agent', html);
        this.messagesContainer.appendChild(message);
        this.scrollToBottom();
        
        const messageData = {
            type: 'agent',
            text: html.replace(/<[^>]*>/g, ''), // Strip HTML for storage
            timestamp: new Date().toISOString(),
            displayTime: this.getCurrentTime(),
            agentName: 'Michael D.'
        };
        
        this.messageHistory.push({ type: 'agent', text: html.replace(/<[^>]*>/g, '') });
        this.conversationData.messages.push(messageData);
    }
    
    createMessageElement(type, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message--${type}`;
        messageDiv.style.opacity = '0';
        
        const avatar = document.createElement('div');
        avatar.className = 'message__avatar';
        
        if (type === 'agent') {
            const avatarUrl = window.AGENT_AVATAR_URL || 'img/agent-avatar.jpg';
            avatar.innerHTML = `<img src="${avatarUrl}" alt="Agent Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        } else {
            avatar.innerHTML = '<i class="fas fa-user"></i>';
        }
        
        const bubble = document.createElement('div');
        bubble.className = 'message__bubble';
        bubble.textContent = text;
        
        const time = document.createElement('div');
        time.className = 'message__time';
        time.textContent = this.getCurrentTime();
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);
        bubble.appendChild(time);
        
        // Animate message appearance with slight delay
        setTimeout(() => {
            messageDiv.style.transition = 'opacity 0.3s ease-out';
            messageDiv.style.opacity = '1';
        }, 50);
        
        return messageDiv;
    }
    
    createMessageElementWithHTML(type, html) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message--${type}`;
        messageDiv.style.opacity = '0';
        
        const avatar = document.createElement('div');
        avatar.className = 'message__avatar';
        
        if (type === 'agent') {
            const avatarUrl = window.AGENT_AVATAR_URL || 'img/agent-avatar.jpg';
            avatar.innerHTML = `<img src="${avatarUrl}" alt="Agent Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        } else {
            avatar.innerHTML = '<i class="fas fa-user"></i>';
        }
        
        const bubble = document.createElement('div');
        bubble.className = 'message__bubble';
        bubble.innerHTML = html; // Use innerHTML instead of textContent
        
        const time = document.createElement('div');
        time.className = 'message__time';
        time.textContent = this.getCurrentTime();
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);
        bubble.appendChild(time);
        
        // Animate message appearance with slight delay
        setTimeout(() => {
            messageDiv.style.transition = 'opacity 0.3s ease-out';
            messageDiv.style.opacity = '1';
        }, 50);
        
        return messageDiv;
    }
    
    generateResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        
        // Determine response category based on user message
        let category = 'default';
        
        if (lowerMessage.match(/hi|hello|hey|good morning|good afternoon|good evening/)) {
            category = 'greetings';
        } else if (lowerMessage.match(/tax debt|owe|owing|debt|back taxes|unpaid taxes/)) {
            category = 'taxDebt';
        } else if (lowerMessage.match(/\$|\d+.*(thousand|k|dollar|amount)/)) {
            category = 'amount';
        } else if (lowerMessage.match(/help|assist|support|can you|what can|options/)) {
            category = 'help';
        } else if (lowerMessage.match(/process|how.*work|steps|procedure/)) {
            category = 'process';
        } else if (lowerMessage.match(/time|long|how long|when|timeline|duration/)) {
            category = 'time';
        } else if (lowerMessage.match(/cost|price|fee|charge|how much|payment/)) {
            category = 'cost';
        } else if (lowerMessage.match(/contact|call|phone|speak|talk|consultation|schedule/)) {
            category = 'contact';
        }
        
        // Get random response from category
        const responses = this.agentResponses[category] || this.agentResponses.default;
        const randomIndex = Math.floor(Math.random() * responses.length);
        return responses[randomIndex];
    }
    
    calculateTypingTime(userMessage) {
        // Estimate response length based on user message
        // Simulate realistic typing time (40-70 words per minute)
        const estimatedWords = 15 + Math.random() * 25; // Estimate 15-40 word response
        const wpm = 40 + Math.random() * 30; // Random between 40-70 WPM
        const seconds = (estimatedWords / wpm) * 60;
        return Math.max(1500, Math.min(5000, seconds * 1000)); // Between 1.5-5 seconds
    }
    
    showTypingIndicator() {
        this.isTyping = true;
        this.typingIndicator.classList.add('active');
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        this.isTyping = false;
        this.typingIndicator.classList.remove('active');
    }
    
    scrollToChatWindow() {
        // Scroll page to the top of the chat window on load with 10px offset from top
        const chatWindow = document.querySelector('.chat-hero__text');
        if (chatWindow) {
            setTimeout(() => {
                const elementPosition = chatWindow.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - 10;
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }, 100);
        }
    }
    
    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 100);
    }
    
    getCurrentTime() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
        return `${displayHours}:${displayMinutes} ${ampm}`;
    }
    
    // ============================================
    // API INTEGRATION METHODS
    // ============================================
    
    // Fetch user's IP address using ipify API
    async fetchUserIpAddress() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            if (response.ok) {
                const data = await response.json();
                this.userIpAddress = data.ip;
                console.log('User IP detected:', this.userIpAddress);
            }
        } catch (error) {
            console.warn('Could not fetch IP address:', error);
            // Fallback: try alternative service
            try {
                const fallbackResponse = await fetch('https://ipapi.co/json/');
                if (fallbackResponse.ok) {
                    const fallbackData = await fallbackResponse.json();
                    this.userIpAddress = fallbackData.ip;
                    console.log('User IP detected (fallback):', this.userIpAddress);
                }
            } catch (fallbackError) {
                console.warn('Fallback IP detection also failed:', fallbackError);
            }
        }
    }
    
    // Post lead data to LeadHoop endpoint
    async postLeadToEndpoint() {
        if (!this.leadPostingConfig.enabled) {
            console.log('Lead posting is disabled');
            return { success: false, reason: 'disabled' };
        }
        
        // Extract answers from question flow
        const answers = {};
        this.questionFlow.forEach(q => {
            if (q.answered && q.answer) {
                answers[q.questionId] = q.answer;
            }
        });
        
        // Map question answers to API fields
        // Question 1: TaxAmount
        // Question 2: TaxType
        // Question 3: State
        // Question 4: FileStatus (yes/no -> Yes/No)
        // Question 5: Employment (yes/no -> Yes/No)
        // Question 6: Full Name -> firstname, lastname
        // Question 7: Email
        // Question 8: Phone
        
        // Parse full name into first and last name
        const fullName = answers[6] || '';
        const nameParts = fullName.trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        // Normalize yes/no answers to Yes/No
        const normalizeYesNo = (answer) => {
            if (!answer) return '';
            const lower = answer.toLowerCase();
            if (lower === 'yes' || lower === 'y' || lower === 'true') return 'Yes';
            if (lower === 'no' || lower === 'n' || lower === 'false') return 'No';
            return answer;
        };
        
        // Convert full state name to 2-letter code
        const stateToCode = {
            'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
            'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
            'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
            'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
            'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
            'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
            'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
            'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
            'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
            'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
        };
        const stateCode = stateToCode[answers[3]] || answers[3] || '';
        
        // Build form data for POST request
        const formData = new URLSearchParams();
        
        // Campaign code (required)
        formData.append('campaign_code', 'JpKMMzg6icSizHycH0jT0g');
        
        // Required lead fields
        formData.append('lead[firstname]', firstName);
        formData.append('lead[lastname]', lastName);
        formData.append('lead[email]', answers[7] || '');
        formData.append('lead[phone1]', answers[8] || '');
        
        // Address field (state as 2-letter code)
        formData.append('lead_address[state]', stateCode);
        
        // Custom value fields
        formData.append('lead_custom_value[TaxAmount]', answers[1] || '');
        formData.append('lead_custom_value[TaxType]', answers[2] || '');
        formData.append('lead_custom_value[Employment]', normalizeYesNo(answers[5]));
        formData.append('lead_custom_value[FileStatus]', normalizeYesNo(answers[4]));
        
        // System fields
        formData.append('lead[ip]', this.userIpAddress || '');
        formData.append('lead[signup_url]', window.location.href);
        formData.append('lead[media_type]', this.leadPostingConfig.mediaType);
        formData.append('lead[test]', this.leadPostingConfig.testMode ? 'true' : 'false');
        
        // TrustedForm certificate URL (populated by TrustedForm script)
        // TrustedForm creates a hidden input with name="xxTrustedFormCertUrl"
        const trustedFormCert = document.querySelector('input[name="xxTrustedFormCertUrl"]');
        const trustedFormValue = trustedFormCert ? trustedFormCert.value : '';
        console.log('TrustedForm cert value:', trustedFormValue);
        formData.append('lead[service_trusted_form]', trustedFormValue);
        
        // TCPA consent (hardcoded for now)
        formData.append('lead_consent[tcpa_consent]', 'Yes');
        
        console.log('Posting lead data:', Object.fromEntries(formData));
        
        try {
            const response = await fetch(this.leadPostingConfig.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString()
            });
            
            const responseText = await response.text();
            console.log('Lead post response:', responseText);
            
            // Check for success response
            if (responseText.includes('"status":"success"')) {
                console.log('Lead posted successfully!');
                return { success: true, response: responseText };
            } else {
                console.warn('Lead post did not return success:', responseText);
                return { success: false, response: responseText };
            }
        } catch (error) {
            console.error('Error posting lead:', error);
            return { success: false, error: error.message };
        }
    }
    
    setAgentAvatar() {
        // Set the agent avatar image in the header if configured
        const avatarImg = document.getElementById('agentAvatarImg');
        if (avatarImg) {
            const avatarUrl = window.AGENT_AVATAR_URL || 'img/agent-avatar.jpg';
            avatarImg.src = avatarUrl;
            // Add error handler in case image doesn't load
            avatarImg.onerror = () => {
                // Fallback to icon if image fails to load
                const avatarContainer = avatarImg.parentElement;
                if (avatarContainer) {
                    avatarContainer.innerHTML = '<i class="fas fa-user-circle"></i>';
                }
            };
        }
    }
    
    generateSessionId() {
        // Generate a unique session ID
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    getUserInfo() {
        // Collect user information (can be extended)
        return {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            referrer: document.referrer || '',
            url: window.location.href,
            timestamp: new Date().toISOString()
        };
    }
    
    getConversationData() {
        // Prepare complete conversation data for API
        return {
            ...this.conversationData,
            endTime: new Date().toISOString(),
            messageCount: this.conversationData.messages.length,
            duration: this.calculateDuration()
        };
    }
    
    calculateDuration() {
        const start = new Date(this.conversationData.startTime);
        const end = new Date();
        const diff = end - start;
        return {
            milliseconds: diff,
            seconds: Math.floor(diff / 1000),
            minutes: Math.floor(diff / 60000),
            formatted: this.formatDuration(diff)
        };
    }
    
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
    
    async sendConversationToAPI(sync = false) {
        // Don't send if API is disabled or no messages
        if (!this.apiConfig.enabled || this.conversationData.messages.length === 0) {
            return;
        }
        
        const data = this.getConversationData();
        
        // If sync is true (like on page unload), use sendBeacon for reliability
        if (sync && navigator.sendBeacon) {
            try {
                const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
                const sent = navigator.sendBeacon(this.apiConfig.endpoint, blob);
                if (sent) {
                    console.log('Conversation data sent via sendBeacon');
                } else {
                    console.warn('Failed to send conversation data via sendBeacon');
                }
            } catch (error) {
                console.error('Error sending conversation data via sendBeacon:', error);
            }
            return;
        }
        
        // Otherwise use fetch API
        try {
            const response = await fetch(this.apiConfig.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('Conversation data sent successfully:', result);
                return result;
            } else {
                console.error('Failed to send conversation data:', response.status, response.statusText);
                throw new Error(`API request failed: ${response.status}`);
            }
        } catch (error) {
            console.error('Error sending conversation data:', error);
            // Optionally store failed requests for retry
            this.storeFailedRequest(data);
            throw error;
        }
    }
    
    storeFailedRequest(data) {
        // Store failed requests in localStorage for potential retry
        try {
            const failedRequests = JSON.parse(localStorage.getItem('failedChatRequests') || '[]');
            failedRequests.push({
                data: data,
                timestamp: new Date().toISOString(),
                retryCount: 0
            });
            // Keep only last 10 failed requests
            if (failedRequests.length > 10) {
                failedRequests.shift();
            }
            localStorage.setItem('failedChatRequests', JSON.stringify(failedRequests));
        } catch (error) {
            console.error('Error storing failed request:', error);
        }
    }
    
    // Method to manually send conversation (can be called from outside)
    async submitConversation() {
        return await this.sendConversationToAPI();
    }
    
    // Method to update API configuration
    updateApiConfig(config) {
        this.apiConfig = { ...this.apiConfig, ...config };
    }
    
    // Auto-resize textarea based on content
    autoResizeTextarea() {
        const textarea = this.chatInput;
        
        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = 'auto';
        
        // Calculate new height based on content - no max limit
        const newHeight = textarea.scrollHeight;
        textarea.style.height = newHeight + 'px';
        
        // Show scrollbar if content is very long (but let it grow)
        textarea.style.overflowY = newHeight > 300 ? 'auto' : 'hidden';
    }
}

// Initialize chat when DOM is ready
let chatInstance = null;
document.addEventListener('DOMContentLoaded', () => {
    chatInstance = new TaxReliefChat();
    // Make instance available globally for API configuration
    window.taxReliefChat = chatInstance;
    
    // Send completion data when user leaves/closes the page
    window.addEventListener('beforeunload', () => {
        if (chatInstance && chatInstance.isInQuestionFlow) {
            // Calculate completion percentage
            const answeredCount = chatInstance.questionFlow.filter(q => q.answered).length;
            const totalQuestions = chatInstance.questionFlow.length;
            const completionPercentage = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
            const completionTime = Date.now() - chatInstance.questionStartTime;
            
            // Send completion event using sendBeacon for reliability
            const endpoint = window.ANALYTICS_ENDPOINT || 
                           'https://tre-chatbot-analytics-api-x2aka.ondigitalocean.app/api/analytics/event';
            
            const data = JSON.stringify({
                eventType: 'question_flow_completed',
                sessionId: chatInstance.conversationData.sessionId,
                timestamp: new Date().toISOString(),
                data: {
                    orderSetId: chatInstance.currentOrderSet?.id,
                    completionPercentage: completionPercentage,
                    totalTime: completionTime,
                    questionsAnswered: answeredCount,
                    totalQuestions: totalQuestions
                }
            });
            
            // Use sendBeacon for reliable delivery during page unload
            // Note: sendBeacon may not work with file:// protocol, so we use fetch with keepalive
            if (navigator.sendBeacon && window.location.protocol !== 'file:') {
                // sendBeacon requires Blob with proper content type
                const blob = new Blob([data], { type: 'application/json' });
                navigator.sendBeacon(endpoint, blob);
            } else {
                // Fallback to fetch with keepalive (works better with file://)
                fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: data,
                    keepalive: true
                }).catch(() => {});
            }
        }
    });
});

// Add some interactive features
document.addEventListener('DOMContentLoaded', () => {
    // Add smooth scroll behavior
    const messagesContainer = document.getElementById('chatMessages');
    if (messagesContainer) {
        messagesContainer.addEventListener('scroll', () => {
            // Auto-scroll to bottom when near bottom
            const isNearBottom = messagesContainer.scrollHeight - messagesContainer.clientHeight <= messagesContainer.scrollTop + 100;
            if (isNearBottom) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        });
    }
    
    // Add input character counter (optional enhancement)
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('input', () => {
            const maxLength = 500;
            if (chatInput.value.length > maxLength) {
                chatInput.value = chatInput.value.substring(0, maxLength);
            }
        });
    }
});

