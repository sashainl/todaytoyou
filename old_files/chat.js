// DOM 요소
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatSendBtn = document.getElementById('chatSendBtn');
const typingIndicator = document.getElementById('typingIndicator');

// 페이지 로드 시 초기화
window.addEventListener('load', () => {
    // Enter 키로 전송
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
});

// 현재 시간 포맷
function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

// 메시지 추가
function addChatMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    const icon = isUser ? 'bi-person-fill' : 'bi-robot';
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="bi ${icon}"></i>
        </div>
        <div class="message-bubble">
            <p class="mb-1">${text}</p>
            <small class="text-muted">${getCurrentTime()}</small>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 감정 공감 응답 생성
function getEmotionalResponse(message) {
    const msg = message.toLowerCase();
    
    // 긍정적 감정
    if (msg.includes('기쁘') || msg.includes('행복') || msg.includes('좋아')) {
        const responses = [
            '그렇게 기쁜 일이 있었다니 정말 다행이네요! 😊 그 기쁨을 계속 간직하시길 바랍니다.',
            '와, 정말 좋은 일이네요! 행복한 순간은 오래 기억에 남죠. ✨',
            '당신의 기쁨이 느껴집니다. 앞으로도 좋은 일만 가득하시길! 🌟'
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // 슬픔
    if (msg.includes('슬프') || msg.includes('우울') || msg.includes('힘들')) {
        const responses = [
            '힘든 시간을 보내고 계시는군요. 당신의 감정을 인정합니다. 괜찮아요, 천천히 가도 돼요. 💙',
            '슬픔을 느끼는 것은 자연스러운 일이에요. 혼자가 아니에요, 제가 함께할게요. 🫂',
            '지금은 힘들겠지만, 이 또한 지나갈 거예요. 당신은 충분히 잘하고 있어요. 💪',
            '울고 싶으면 우셔도 괜찮아요. 감정을 억누르지 마세요. 당신 곁에 있을게요. 🌙'
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // 불안
    if (msg.includes('불안') || msg.includes('걱정') || msg.includes('두렵')) {
        const responses = [
            '불안한 마음이 드시는군요. 깊게 숨을 쉬어보세요. 지금 이 순간, 당신은 안전해요. 🌸',
            '걱정이 많으시네요. 하나씩 천천히 생각해보면 괜찮을 거예요. 제가 함께할게요. 🕊️',
            '두려움은 용기의 다른 모습이에요. 이미 잘 대처하고 계시는 거예요. 💫'
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // 화
    if (msg.includes('화나') || msg.includes('짜증') || msg.includes('분노')) {
        const responses = [
            '화가 나셨군요. 그 감정도 충분히 타당해요. 마음껏 표현하셔도 좋아요. 🌊',
            '짜증나는 일이 있었나 봐요. 당신의 감정은 소중해요. 충분히 이해합니다. 🔥',
            '분노를 느끼는 것도 괜찮아요. 천천히 진정하고, 함께 이야기해봐요. 🍃'
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // 피곤함
    if (msg.includes('피곤') || msg.includes('지쳤') || msg.includes('번아웃')) {
        const responses = [
            '많이 지치셨나 봐요. 충분히 쉬셔도 괜찮아요. 자신을 돌보는 것도 중요해요. 😴',
            '번아웃이 온 것 같네요. 잠시 멈춰서 당신 자신을 돌봐주세요. 당신은 소중해요. 🌿',
            '너무 열심히 사셨어요. 이제는 좀 쉬어가도 괜찮습니다. 💆'
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // 감사 인사
    if (msg.includes('감사') || msg.includes('고마워')) {
        return '천만에요. 당신의 마음이 조금이라도 편안해졌다면 기뻐요. 언제든 찾아와 주세요. 💝';
    }
    
    // 기본 공감 응답
    const defaultResponses = [
        '말씀해주셔서 고마워요. 당신의 감정은 모두 소중합니다. 더 이야기하고 싶으신 것이 있나요? 🌟',
        '그렇군요. 당신의 이야기를 듣고 있어요. 편하게 마음을 나눠주세요. 💙',
        '알겠습니다. 당신의 감정을 존중해요. 어떤 생각이 드시나요? 🌈',
        '이야기해주셔서 감사해요. 당신은 혼자가 아니에요. 더 나누고 싶은 이야기가 있나요? 🫂'
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

// 챗봇 메시지 전송
function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    
    // 사용자 메시지 추가
    addChatMessage(message, true);
    chatInput.value = '';
    
    // 타이핑 인디케이터 표시
    typingIndicator.classList.add('active');
    chatSendBtn.disabled = true;
    
    // 봇 응답 (1-2초 후)
    setTimeout(() => {
        typingIndicator.classList.remove('active');
        const response = getEmotionalResponse(message);
        addChatMessage(response, false);
        chatSendBtn.disabled = false;
        chatInput.focus();
    }, 1000 + Math.random() * 1000);
}

// 감정 퀵 버튼
function quickEmotion(emotion) {
    chatInput.value = emotion;
    chatInput.focus();
    sendChatMessage();
}

