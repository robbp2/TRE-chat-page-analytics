// ============================================
// API CONFIGURATION EXAMPLE
// ============================================
// 
// To configure the API endpoint, add this script BEFORE chat.js in your HTML:
//
// <script>
//     // Set your API endpoint
//     window.API_ENDPOINT = 'https://your-api-endpoint.com/chat/submit';
//     
//     // Optionally disable API if needed
//     // window.API_ENABLED = false;
// </script>
// <script src="chat.js"></script>
//
// Or configure after page load:
//
// <script>
//     document.addEventListener('DOMContentLoaded', () => {
//         setTimeout(() => {
//             if (window.taxReliefChat) {
//                 window.taxReliefChat.updateApiConfig({
//                     endpoint: 'https://your-api-endpoint.com/chat/submit',
//                     sendAfterEachMessage: true, // Send after each message exchange
//                     sendOnUnload: true, // Send when user leaves page
//                     batchSize: 5 // Send after this many messages
//                 });
//             }
//         }, 100);
//     });
// </script>
//
// ============================================
// API REQUEST FORMAT
// ============================================
//
// The API will receive POST requests with the following JSON structure:
//
// {
//     "sessionId": "session_1234567890_abc123",
//     "startTime": "2025-01-13T12:00:00.000Z",
//     "endTime": "2025-01-13T12:05:30.000Z",
//     "messageCount": 10,
//     "duration": {
//         "milliseconds": 330000,
//         "seconds": 330,
//         "minutes": 5,
//         "formatted": "5m 30s"
//     },
//     "messages": [
//         {
//             "type": "user",
//             "text": "Hello, I need help with tax debt",
//             "timestamp": "2025-01-13T12:00:15.000Z",
//             "displayTime": "12:00 PM"
//         },
//         {
//             "type": "agent",
//             "text": "Hello! I'm Sarah...",
//             "timestamp": "2025-01-13T12:00:18.000Z",
//             "displayTime": "12:00 PM",
//             "agentName": "Sarah Johnson"
//         }
//     ],
//     "userInfo": {
//         "userAgent": "Mozilla/5.0...",
//         "language": "en-US",
//         "platform": "MacIntel",
//         "screenWidth": 1920,
//         "screenHeight": 1080,
//         "referrer": "https://google.com",
//         "url": "https://taxreliefexperts.com/chat",
//         "timestamp": "2025-01-13T12:00:00.000Z"
//     },
//     "metadata": {}
// }
//
// ============================================
// MANUAL SUBMISSION
// ============================================
//
// You can also manually trigger submission:
//
// window.taxReliefChat.submitConversation()
//     .then(result => console.log('Submitted:', result))
//     .catch(error => console.error('Error:', error));
//
// ============================================

