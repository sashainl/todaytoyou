// DOM 요소
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatSendBtn = document.getElementById('chatSendBtn');
const typingIndicator = document.getElementById('typingIndicator');
const diaryForm = document.getElementById('diaryForm');
const diaryList = document.getElementById('diaryList');
const diaryDate = document.getElementById('diaryDate');
const diaryContent = document.getElementById('diaryContent');
const charCount = document.getElementById('charCount');

// 로컬 스토리지에서 일기 목록 불러오기
let diaries = JSON.parse(localStorage.getItem('emotionDiaries')) || [];

// 페이지 로드 시 초기화
window.addEventListener('load', () => {
    // 오늘 날짜 설정
    const today = new Date().toISOString().split('T')[0];
    diaryDate.value = today;
    
    // 일기 목록 렌더링
    renderDiaryList();
    updateEmotionStats();
    
    // 문자 카운터 초기화
    if (charCount && diaryContent) {
        updateCharCount();
        diaryContent.addEventListener('input', updateCharCount);
    }
    
    // 부드러운 스크롤
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
});

// 문자 카운터 업데이트
function updateCharCount() {
    if (charCount && diaryContent) {
        const currentLength = diaryContent.value.length;
        const maxLength = 500;
        charCount.textContent = `${currentLength} / ${maxLength}`;
        
        // 글자 수에 따른 색상 변경
        if (currentLength > maxLength * 0.9) {
            charCount.style.color = '#ef4444';
        } else if (currentLength > maxLength * 0.7) {
            charCount.style.color = '#f59e0b';
        } else {
            charCount.style.color = '#6b7280';
        }
        
        // 최대 글자 수 초과 시 제한
        if (currentLength > maxLength) {
            diaryContent.value = diaryContent.value.substring(0, maxLength);
            updateCharCount();
        }
    }
}

// ===== 챗봇 기능 =====

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

// Enter 키로 전송
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendChatMessage();
    }
});

// 감정 퀵 버튼
function quickEmotion(emotion) {
    chatInput.value = emotion;
    chatInput.focus();
    sendChatMessage();
}

// ===== 일기 기능 =====

// 일기 저장
diaryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const diary = {
        id: Date.now(),
        date: diaryDate.value,
        title: document.getElementById('diaryTitle').value,
        mood: document.querySelector('input[name="mood"]:checked').value,
        content: document.getElementById('diaryContent').value,
        createdAt: new Date().toISOString()
    };
    
    diaries.unshift(diary);
    localStorage.setItem('emotionDiaries', JSON.stringify(diaries));
    
    // 폼 초기화
    diaryForm.reset();
    diaryDate.value = new Date().toISOString().split('T')[0];
    
    // 목록 업데이트
    renderDiaryList();
    updateEmotionStats();
    
    // 성공 메시지
    showToast('일기가 저장되었습니다! 💝');
});

// 일기 목록 렌더링
function renderDiaryList() {
    if (diaries.length === 0) {
        diaryList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="bi bi-inbox"></i>
                </div>
                <p class="empty-text">아직 작성된 일기가 없습니다</p>
                <small class="empty-subtext">첫 번째 일기를 작성해보세요</small>
            </div>
        `;
        return;
    }
    
    const moodEmojis = {
        '매우 좋음': '😄',
        '좋음': '😊',
        '보통': '😐',
        '안 좋음': '😔',
        '매우 안 좋음': '😢'
    };
    
    const moodColors = {
        '매우 좋음': '#10b981',
        '좋음': '#3b82f6',
        '보통': '#6b7280',
        '안 좋음': '#f59e0b',
        '매우 안 좋음': '#ef4444'
    };
    
    diaryList.innerHTML = diaries.slice(0, 5).map(diary => `
        <div class="diary-list-item" onclick="showDiaryDetail(${diary.id})">
            <div class="diary-item-mood-indicator" style="background: ${moodColors[diary.mood]}20; border-left-color: ${moodColors[diary.mood]};">
                <span class="mood-emoji-small">${moodEmojis[diary.mood]}</span>
            </div>
            <div class="diary-item-content">
                <h6 class="diary-item-title">${diary.title}</h6>
                <p class="diary-item-date">
                    <i class="bi bi-calendar3 me-1"></i>${formatDate(diary.date)}
                </p>
                <p class="diary-item-preview">${diary.content.substring(0, 60)}${diary.content.length > 60 ? '...' : ''}</p>
            </div>
            <div class="diary-item-action">
                <i class="bi bi-chevron-right"></i>
            </div>
        </div>
    `).join('');
}

// 날짜 포맷팅
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// 일기 상세보기
function showDiaryDetail(id) {
    const diary = diaries.find(d => d.id === id);
    if (!diary) return;
    
    const moodEmojis = {
        '매우 좋음': '😄',
        '좋음': '😊',
        '보통': '😐',
        '안 좋음': '😔',
        '매우 안 좋음': '😢'
    };
    
    const modalHTML = `
        <div class="modal fade" id="diaryModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-journal-text me-2"></i>${diary.title}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <span class="badge bg-secondary me-2">
                                <i class="bi bi-calendar3 me-1"></i>${formatDate(diary.date)}
                            </span>
                            <span class="badge bg-primary">
                                ${moodEmojis[diary.mood]} ${diary.mood}
                            </span>
                        </div>
                        <div class="border-start border-4 border-primary ps-3">
                            <p style="white-space: pre-wrap; line-height: 1.8;">${diary.content}</p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-danger" onclick="deleteDiary(${diary.id})">
                            <i class="bi bi-trash me-2"></i>삭제
                        </button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">닫기</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 기존 모달 제거
    const existingModal = document.getElementById('diaryModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 새 모달 추가 및 표시
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('diaryModal'));
    modal.show();
}

// 일기 삭제
function deleteDiary(id) {
    if (confirm('정말 이 일기를 삭제하시겠습니까?')) {
        diaries = diaries.filter(d => d.id !== id);
        localStorage.setItem('emotionDiaries', JSON.stringify(diaries));
        renderDiaryList();
        updateEmotionStats();
        
        // 모달 닫기
        const modal = bootstrap.Modal.getInstance(document.getElementById('diaryModal'));
        modal.hide();
        
        showToast('일기가 삭제되었습니다.');
    }
}

// 감정 통계 업데이트
function updateEmotionStats() {
    const statsDiv = document.getElementById('emotionStats');
    
    if (diaries.length === 0) {
        statsDiv.innerHTML = `
            <p class="text-muted text-center py-3">
                일기를 작성하면<br>감정 통계가 표시됩니다
            </p>
        `;
        return;
    }
    
    const moodCount = {};
    diaries.forEach(diary => {
        moodCount[diary.mood] = (moodCount[diary.mood] || 0) + 1;
    });
    
    const moodEmojis = {
        '매우 좋음': '😄',
        '좋음': '😊',
        '보통': '😐',
        '안 좋음': '😔',
        '매우 안 좋음': '😢'
    };
    
    const moodColors = {
        '매우 좋음': '#10b981',
        '좋음': '#3b82f6',
        '보통': '#6b7280',
        '안 좋음': '#f59e0b',
        '매우 안 좋음': '#ef4444'
    };
    
    const total = diaries.length;
    
    statsDiv.innerHTML = Object.entries(moodCount)
        .sort((a, b) => b[1] - a[1])
        .map(([mood, count]) => {
            const percentage = Math.round((count / total) * 100);
            return `
                <div class="stat-item">
                    <span class="stat-emoji">${moodEmojis[mood]}</span>
                    <div class="stat-bar">
                        <div class="stat-fill" style="width: ${percentage}%; background: ${moodColors[mood]};"></div>
                    </div>
                    <span class="fw-bold">${count}회</span>
                </div>
            `;
        }).join('');
}

// 토스트 메시지 표시
function showToast(message) {
    const toastHTML = `
        <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 11">
            <div class="toast show" role="alert">
                <div class="toast-header bg-primary text-white">
                    <i class="bi bi-check-circle-fill me-2"></i>
                    <strong class="me-auto">알림</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        </div>
    `;
    
    const toastContainer = document.createElement('div');
    toastContainer.innerHTML = toastHTML;
    document.body.appendChild(toastContainer);
    
    setTimeout(() => {
        toastContainer.remove();
    }, 3000);
}
