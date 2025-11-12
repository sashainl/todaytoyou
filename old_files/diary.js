// DOM 요소
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
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="bi bi-bar-chart"></i>
                </div>
                <p class="empty-text">일기를 작성하면</p>
                <small class="empty-subtext">감정 통계가 표시됩니다</small>
            </div>
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

