// ============================================
// QUESTION CONFIGURATION SYSTEM
// Modular question definitions and order sets
// ============================================

// Question definitions
const QUESTIONS = {
    1: {
        id: 1,
        text: "Approximately how much do you owe in taxes?",
        type: "amount", // amount, text, yesno, multiple_choice
        required: true,
        apiField: "TaxAmount", // Maps to lead_custom_value[TaxAmount]
        validation: {
            type: "number",
            min: 0
        },
        quickResponses: [
            "Less than $7,500",
            "$7,500 - $9,999",
            "$10,000 - $14,999",
            "$15,000 - $29,999",
            "$30,000 - $49,999",
            "$50,000 - $74,999",
            "$75,000 - $99,999",
            "Over $100,000"
        ],
        amountRanges: [
            { min: 0, max: 7499, label: "Less than $7,500" },
            { min: 7500, max: 9999, label: "$7,500 - $9,999" },
            { min: 10000, max: 14999, label: "$10,000 - $14,999" },
            { min: 15000, max: 29999, label: "$15,000 - $29,999" },
            { min: 30000, max: 49999, label: "$30,000 - $49,999" },
            { min: 50000, max: 74999, label: "$50,000 - $74,999" },
            { min: 75000, max: 99999, label: "$75,000 - $99,999" },
            { min: 100000, max: Infinity, label: "Over $100,000" }
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
        apiField: "TaxType", // Maps to lead_custom_value[TaxType]
        options: [
            "Federal",
            "State",
            "Federal & State"
        ],
        required: true
    },
    3: {
        id: 3,
        text: "What state do you live in?",
        type: "multiple_choice",
        apiField: "state", // Maps to lead_address[state]
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
        text: "Are any of your tax returns unfiled?",
        type: "yesno",
        apiField: "FileStatus", // Maps to lead_custom_value[FileStatus]
        required: true
    },
    5: {
        id: 5,
        text: "Are you currently employed?",
        type: "yesno",
        apiField: "Employment", // Maps to lead_custom_value[Employment]
        required: true
    },
    6: {
        id: 6,
        text: "What is your full name?",
        type: "text",
        apiField: "fullName", // Will be split into firstname/lastname
        required: true
    },
    7: {
        id: 7,
        text: "What is your email address? (This will be used to send you a copy of our agreement, never for spam.)",
        type: "text",
        apiField: "email", // Maps to lead[email]
        required: true
    },
    8: {
        id: 8,
        text: "What is your phone number?",
        type: "text",
        apiField: "phone1", // Maps to lead[phone1]
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
    /*{
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
    },*/
    {
        id: "set_4",
        name: "Asset-First Approach",
        order: [6, 4, 7, 2, 1, 5, 3, 8],
        description: "Prioritize asset and employment questions"
    }/*,
    {
        id: "set_5",
        name: "Contact Info First (just for testing)",
        order: [7, 8, 6, 4, 2, 1, 5, 3],
        description: "Prioritize contact information first"
    }*/
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

