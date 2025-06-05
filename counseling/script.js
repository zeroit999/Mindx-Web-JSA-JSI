import displayName from '../Profile/profile.js';

// DOM Element
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const messageList = document.getElementById('messageList');

// Hàm lấy thời gian hiện tại
function getCurrentTime() {
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Khi loaded trang
window.addEventListener('DOMContentLoaded', () => {
    const currentTime = getCurrentTime();
    const welcomeMessage = document.createElement('div');
    welcomeMessage.classList.add('botMessage');

    welcomeMessage.innerHTML = `
        <div class="messageText">Xin chào ${displayName.textContent}</div>
        <div class="currentTime">${currentTime}</div>
    `;

    messageList.appendChild(welcomeMessage);

})

function sendMessage() {
    const messageText = userInput.value.trim();

    if (messageText !== "") {
        const currentTime = getCurrentTime();

        // Tạo tin nhắn người dùng
        const userMessage = document.createElement('div');
        userMessage.classList.add('userMessage');

        // Thêm vào danh sách tin nhắn + thời gian
        userMessage.innerHTML = `
            <div class="messageText">${messageText}</div>
            <div class="currentTime">${currentTime}</div>
        `;

        // Thêm vào danh sách tin nhắn
        messageList.appendChild(userMessage);

        // Cuộn xuống tin nhắn cuối cùng
        messageList.scrollTop = messageList.scrollHeight;

        // Xóa nội dung Input
        userInput.value = "";
    }
}

// Gửi khi nhấn nút sendButton
sendButton.addEventListener('click', sendMessage);

// Gửi khi nhấn nút Enter (Không nhấn giữ nút Shift)
userInput.addEventListener('keydown', (e) => {
    if(e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
})