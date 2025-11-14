// ============================================
// QUESTION CONFIGURATION SYSTEM
// Modular question definitions and order sets
// ============================================

// Question definitions
const QUESTIONS = {
    1: {
        id: 1,
        text: "What is your approximate tax debt amount?",
        type: "amount", // amount, text, yesno, multiple_choice
        required: true,
        validation: {
            type: "number",
            min: 0
        },
        quickResponses: [
            "$7,500 or less",
            "$7,500 to $9,999",
            "$10,000 to $14,999",
            "$15,000 to $29,999",
            "$30,000 to $49,999",
            "$50,000 to $74,999",
            "$75,000 to $99,999",
            "$100,000 or more"
        ],
        amountRanges: [
            { min: 0, max: 7500, label: "$7,500 or less" },
            { min: 7500, max: 9999, label: "$7,500 to $9,999" },
            { min: 10000, max: 14999, label: "$10,000 to $14,999" },
            { min: 15000, max: 29999, label: "$15,000 to $29,999" },
            { min: 30000, max: 49999, label: "$30,000 to $49,999" },
            { min: 50000, max: 74999, label: "$50,000 to $74,999" },
            { min: 75000, max: 99999, label: "$75,000 to $99,999" },
            { min: 100000, max: Infinity, label: "$100,000 or more" }
        ],
        followUp: {
            condition: "> 10000",
            message: "We specialize in cases over $10,000. Let me help you explore your options."
        }
    },
    2: {
        id: 2,
        text: "What type of tax debt do you have?",
        type: "multiple_choice",
        options: [
            "Federal",
            "State",
            "Both"
        ],
        required: true
    },
    3: {
        id: 3,
        text: "What state do you live in?",
        type: "multiple_choice",
        options: [
            "Alabama", "Alaska", "Arizona", "Arkansas", "California",
            "Colorado", "Connecticut", "Delaware", "Florida", "Georgia",
            "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
            "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland",
            "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri",
            "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
            "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
            "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
            "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
            "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
        ],
        required: true,
        validation: {
            type: "state",
            acceptCodes: true // Accepts both full names and 2-letter codes (AL, AK, etc.)
        }
    },
    4: {
        id: 4,
        text: "Are you missing any tax returns?",
        type: "yesno",
        required: true
    },
    5: {
        id: 5,
        text: "Are you currently employed?",
        type: "yesno",
        required: true
    },
    6: {
        id: 6,
        text: "What is your full name?",
        type: "text",
        required: true
    },
    7: {
        id: 7,
        text: "What is your email address?",
        type: "text",
        required: true
    },
    8: {
        id: 8,
        text: "What is your phone number?",
        type: "text",
        required: true
    }
};

// Order set configurations
const ORDER_SETS = [
    {
        id: "set_1",
        name: "Standard Flow",
        order: [1, 2, 3, 4, 5, 6, 7, 8],
        description: "Traditional question flow"
    },
    {
        id: "set_2",
        name: "Debt-First Approach",
        order: [2, 1, 3, 5, 6, 4, 7, 8],
        description: "Focus on debt duration first"
    },
    {
        id: "set_3",
        name: "Financial-First Approach",
        order: [3, 1, 2, 5, 6, 4, 7, 8],
        description: "Start with IRS notices and financial situation"
    },
    {
        id: "set_4",
        name: "Asset-First Approach",
        order: [6, 4, 7, 2, 1, 5, 3, 8],
        description: "Prioritize asset and employment questions"
    }
];

// Make available globally
if (typeof window !== 'undefined') {
    window.QUESTIONS = QUESTIONS;
    window.ORDER_SETS = ORDER_SETS;
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { QUESTIONS, ORDER_SETS };
}

