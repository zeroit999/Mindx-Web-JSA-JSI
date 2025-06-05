// Khởi tạo sau khi trang đã tải xong
document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo database khi trang được tải
    initDatabase();
    
    // Các phần tử DOM
    const uploadForm = document.getElementById('upload-form');
    const fileUpload = document.getElementById('file-upload');
    const uploadStatus = document.getElementById('upload-status');
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    
    // Biến đếm cho ID tin nhắn
    let messageIdCounter = 0;
    
    // Hiển thị tên file đã chọn
    fileUpload.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const fileName = document.createElement('span');
            fileName.textContent = this.files[0].name;
            fileName.classList.add('file-name');
            
            const customFileUpload = document.querySelector('.custom-file-upload');
            customFileUpload.innerHTML = '<i class="fas fa-file-alt"></i> ';
            customFileUpload.appendChild(fileName);
        }
    });
    
    // Xử lý tải lên tài liệu
    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData();
        const fileInput = document.getElementById('file-upload');
        
        if (fileInput.files.length === 0) {
            uploadStatus.textContent = 'Vui lòng chọn tệp để tải lên';
            uploadStatus.style.color = '#e74c3c';
            return;
        }
        
        formData.append('file', fileInput.files[0]);
        
        // Hiển thị trạng thái đang tải
        uploadStatus.textContent = 'Đang tải lên và xử lý tài liệu...';
        uploadStatus.style.color = '#3498db';
        
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                uploadStatus.textContent = data.message;
                uploadStatus.style.color = '#2ecc71';
                
                // Thêm tin nhắn thông báo trong chat
                addMessage('Tài liệu đã được tải lên thành công! Bạn có thể đặt câu hỏi ngay bây giờ.', 'bot');
                
                // Reset form
                const customFileUpload = document.querySelector('.custom-file-upload');
                customFileUpload.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Chọn tài liệu';
                fileInput.value = '';
            } else {
                uploadStatus.textContent = data.error || 'Có lỗi xảy ra';
                uploadStatus.style.color = '#e74c3c';
            }
        })
        .catch(error => {
            uploadStatus.textContent = 'Lỗi kết nối: ' + error.message;
            uploadStatus.style.color = '#e74c3c';
        });
    });
    
    // Tự động điều chỉnh độ cao của ô nhập liệu
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        
        // Giới hạn chiều cao tối đa
        if (this.scrollHeight > 150) {
            this.style.height = '150px';
            this.style.overflowY = 'auto';
        } else {
            this.style.overflowY = 'hidden';
        }
    });
    
    // Gửi tin nhắn khi nhấn Enter (không phải Shift+Enter)
    userInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Xử lý khi nhấn nút gửi
    sendButton.addEventListener('click', sendMessage);
    
    // Khởi tạo vector database từ các tài liệu hiện có
    function initDatabase() {
        fetch('/init')
            .then(response => response.json())
            .then(data => {
                console.log('Khởi tạo database:', data.message || data.error);
            })
            .catch(error => {
                console.error('Lỗi khởi tạo database:', error);
            });
    }
    
    // Thêm tin nhắn vào khung chat
    function addMessage(text, sender, isLoading = false) {
        const messageId = 'msg-' + messageIdCounter++;
        const messageDiv = document.createElement('div');
        messageDiv.id = messageId;
        messageDiv.className = `message ${sender}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        
        if (isLoading) {
            paragraph.classList.add('loading');
        }
        
        contentDiv.appendChild(paragraph);
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        
        // Cuộn xuống cuối cùng
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return messageId;
    }
    
    // Xóa tin nhắn theo ID
    function removeMessage(messageId) {
        const message = document.getElementById(messageId);
        if (message) {
            message.remove();
        }
    }
    
    // Hàm gửi tin nhắn
    function sendMessage() {
        const message = userInput.value.trim();
        
        if (!message) return;
        
        // Hiển thị tin nhắn của người dùng
        addMessage(message, 'user');
        
        // Xóa nội dung đã nhập
        userInput.value = '';
        userInput.style.height = 'auto';
        
        // Hiển thị tin nhắn đang nhập từ bot
        const loadingMessageId = addMessage('Đang suy nghĩ...', 'bot', true);
        
        // Gửi câu hỏi tới server
        fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ question: message })
        })
        .then(response => response.json())
        .then(data => {
            // Xóa tin nhắn loading
            removeMessage(loadingMessageId);
            
            if (data.answer) {
                // Hiển thị câu trả lời
                addMessage(data.answer, 'bot');
            } else {
                // Hiển thị lỗi nếu có
                addMessage(data.error || 'Có lỗi xảy ra khi xử lý câu hỏi của bạn', 'bot');
            }
        })
        .catch(error => {
            // Xóa tin nhắn loading
            removeMessage(loadingMessageId);
            
            // Hiển thị lỗi
            addMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.', 'bot');
            console.error('Lỗi:', error);
        });
    }
})