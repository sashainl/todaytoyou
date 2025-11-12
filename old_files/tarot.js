// 22장 메이저 아르카나 타로 카드 데이터
const tarotCards = [
    {
        id: 0,
        name: "광대 (The Fool)",
        icon: "🃏",
        keywords: "새로운 시작, 순수함, 자유, 모험",
        upright: "새로운 시작과 무한한 가능성을 상징합니다. 순수한 마음으로 새로운 모험을 시작하세요.",
        reversed: "무모함, 경솔한 결정을 경계하세요. 신중하게 생각할 필요가 있습니다."
    },
    {
        id: 1,
        name: "마법사 (The Magician)",
        icon: "🎩",
        keywords: "창조, 의지력, 능력, 시작",
        upright: "창조와 실현의 힘을 가지고 있습니다. 당신은 필요한 모든 자원을 갖추고 있습니다.",
        reversed: "능력을 잘못 사용하거나 자신감 부족을 의미합니다. 자신을 믿으세요."
    },
    {
        id: 2,
        name: "여사제 (The High Priestess)",
        icon: "🔮",
        keywords: "직관, 신비, 무의식, 지혜",
        upright: "직관과 내면의 목소리에 귀 기울이세요. 숨겨진 지혜가 드러날 것입니다.",
        reversed: "직관을 무시하거나 비밀이 드러날 수 있습니다. 내면의 소리를 들으세요."
    },
    {
        id: 3,
        name: "여황제 (The Empress)",
        icon: "👸",
        keywords: "풍요, 창조성, 양육, 자연",
        upright: "풍요와 창조성이 넘치는 시기입니다. 자신과 타인을 보살피세요.",
        reversed: "의존성이나 과잉보호를 경계하세요. 균형을 찾으세요."
    },
    {
        id: 4,
        name: "황제 (The Emperor)",
        icon: "👑",
        keywords: "권위, 구조, 안정, 리더십",
        upright: "리더십과 권위를 발휘할 때입니다. 체계적으로 계획을 세우세요.",
        reversed: "지나친 통제나 권위주의를 경계하세요. 유연성이 필요합니다."
    },
    {
        id: 5,
        name: "교황 (The Hierophant)",
        icon: "⛪",
        keywords: "전통, 가르침, 영성, 관습",
        upright: "전통과 가르침을 따르는 것이 도움이 됩니다. 멘토를 찾으세요.",
        reversed: "관습에서 벗어나 새로운 길을 모색할 때입니다."
    },
    {
        id: 6,
        name: "연인 (The Lovers)",
        icon: "💕",
        keywords: "사랑, 선택, 조화, 관계",
        upright: "사랑과 조화로운 관계가 형성됩니다. 중요한 선택의 순간입니다.",
        reversed: "불화나 잘못된 선택을 조심하세요. 신중하게 결정하세요."
    },
    {
        id: 7,
        name: "전차 (The Chariot)",
        icon: "🏇",
        keywords: "의지, 승리, 통제, 결단",
        upright: "강한 의지로 목표를 향해 나아가세요. 승리가 가까이 있습니다.",
        reversed: "방향 상실이나 통제력 부족을 의미합니다. 집중이 필요합니다."
    },
    {
        id: 8,
        name: "힘 (Strength)",
        icon: "🦁",
        keywords: "용기, 인내, 내적 힘, 자제",
        upright: "내면의 힘과 용기로 어려움을 극복할 수 있습니다. 인내심을 가지세요.",
        reversed: "자기 의심이나 약함을 느낄 수 있습니다. 자신을 믿으세요."
    },
    {
        id: 9,
        name: "은둔자 (The Hermit)",
        icon: "🕯️",
        keywords: "성찰, 고독, 내면의 지혜, 탐구",
        upright: "혼자만의 시간이 필요합니다. 내면을 탐구하고 지혜를 얻으세요.",
        reversed: "고립이나 외로움을 경계하세요. 균형을 찾으세요."
    },
    {
        id: 10,
        name: "운명의 수레바퀴 (Wheel of Fortune)",
        icon: "☸️",
        keywords: "변화, 순환, 운명, 전환점",
        upright: "인생의 전환점이 다가옵니다. 변화의 흐름을 받아들이세요.",
        reversed: "불운이나 예상치 못한 변화를 의미합니다. 유연하게 대처하세요."
    },
    {
        id: 11,
        name: "정의 (Justice)",
        icon: "⚖️",
        keywords: "공정, 진실, 균형, 책임",
        upright: "공정한 결과와 진실이 드러납니다. 책임감 있게 행동하세요.",
        reversed: "불공정이나 불균형을 의미합니다. 객관적인 시각이 필요합니다."
    },
    {
        id: 12,
        name: "매달린 사람 (The Hanged Man)",
        icon: "🙃",
        keywords: "희생, 관점의 전환, 정지, 통찰",
        upright: "새로운 관점이 필요합니다. 잠시 멈추고 다르게 생각해보세요.",
        reversed: "불필요한 희생이나 정체를 의미합니다. 행동이 필요합니다."
    },
    {
        id: 13,
        name: "죽음 (Death)",
        icon: "💀",
        keywords: "변화, 끝과 시작, 전환, 재탄생",
        upright: "큰 변화와 새로운 시작을 의미합니다. 과거를 놓아주세요.",
        reversed: "변화에 대한 저항이나 두려움을 나타냅니다. 받아들이세요."
    },
    {
        id: 14,
        name: "절제 (Temperance)",
        icon: "🕊️",
        keywords: "균형, 조화, 인내, 절제",
        upright: "균형과 조화가 필요합니다. 중용의 길을 걸으세요.",
        reversed: "불균형이나 과도함을 경계하세요. 절제가 필요합니다."
    },
    {
        id: 15,
        name: "악마 (The Devil)",
        icon: "😈",
        keywords: "속박, 유혹, 집착, 물질주의",
        upright: "무언가에 속박되어 있습니다. 자신을 해방시키세요.",
        reversed: "속박에서 벗어나고 있습니다. 자유를 향해 나아가세요."
    },
    {
        id: 16,
        name: "탑 (The Tower)",
        icon: "🗼",
        keywords: "파괴, 갑작스런 변화, 깨달음, 해방",
        upright: "갑작스러운 변화가 올 수 있습니다. 재건의 기회로 삼으세요.",
        reversed: "위기를 피하거나 변화에 저항하고 있습니다. 받아들이세요."
    },
    {
        id: 17,
        name: "별 (The Star)",
        icon: "⭐",
        keywords: "희망, 영감, 치유, 평온",
        upright: "희망과 영감이 찾아옵니다. 미래에 대한 믿음을 가지세요.",
        reversed: "희망 상실이나 낙담을 의미합니다. 다시 일어서세요."
    },
    {
        id: 18,
        name: "달 (The Moon)",
        icon: "🌙",
        keywords: "환상, 불안, 직관, 무의식",
        upright: "직관을 믿으세요. 불확실함 속에서도 내면의 목소리를 들으세요.",
        reversed: "혼란이 걷히고 진실이 드러납니다. 명확해질 것입니다."
    },
    {
        id: 19,
        name: "태양 (The Sun)",
        icon: "☀️",
        keywords: "기쁨, 성공, 활력, 긍정",
        upright: "기쁨과 성공이 찾아옵니다. 긍정적인 에너지가 넘칩니다.",
        reversed: "일시적인 어려움이나 낙담을 의미합니다. 곧 좋아질 것입니다."
    },
    {
        id: 20,
        name: "심판 (Judgement)",
        icon: "📯",
        keywords: "재탄생, 각성, 용서, 평가",
        upright: "재탄생과 새로운 각성의 시간입니다. 과거를 평가하고 앞으로 나아가세요.",
        reversed: "자기 비판이나 후회를 경계하세요. 용서하고 나아가세요."
    },
    {
        id: 21,
        name: "세계 (The World)",
        icon: "🌍",
        keywords: "완성, 성취, 통합, 여행",
        upright: "목표 달성과 완성을 의미합니다. 축하받을 일이 있습니다.",
        reversed: "미완성이나 지연을 의미합니다. 마지막 단계를 완수하세요."
    }
];

// 로컬 스토리지에서 타로 히스토리 불러오기
let tarotHistory = JSON.parse(localStorage.getItem('tarotHistory')) || [];

// 현재 상태 관리
let shuffledDeck = [];
let selectedCards = [];
let spreadMode = 'past-present-future'; // 또는 'situation-advice-outcome'
let currentTopic = 'love'; // 현재 선택된 주제
let isShuffled = false;

// 주제별 정보
const topicInfo = {
    love: {
        name: '연애운',
        icon: '💝',
        placeholder: '예: 나의 연애운은 어떨까요?',
        hint: '현재의 연애 상황이나 앞으로의 만남에 대해 물어보세요',
        defaultQuestion: '나의 연애운은?'
    },
    money: {
        name: '재물운',
        icon: '💰',
        placeholder: '예: 나의 재물운은 어떨까요?',
        hint: '금전적인 상황, 투자, 재정 관리에 대해 물어보세요',
        defaultQuestion: '나의 재물운은?'
    },
    study: {
        name: '학업운',
        icon: '📚',
        placeholder: '예: 시험 결과는 어떨까요?',
        hint: '학업 성취, 시험, 학습 방향에 대해 물어보세요',
        defaultQuestion: '나의 학업운은?'
    },
    career: {
        name: '직업운',
        icon: '💼',
        placeholder: '예: 이직이나 승진은 어떨까요?',
        hint: '직장 생활, 이직, 승진, 업무 관계에 대해 물어보세요',
        defaultQuestion: '나의 직업운은?'
    },
    health: {
        name: '건강운',
        icon: '🏥',
        placeholder: '예: 건강 상태는 어떨까요?',
        hint: '신체적, 정신적 건강 상태에 대해 물어보세요',
        defaultQuestion: '나의 건강운은?'
    },
    general: {
        name: '종합운',
        icon: '🌟',
        placeholder: '예: 오늘 하루는 어떨까요?',
        hint: '전반적인 운세나 오늘의 운세에 대해 물어보세요',
        defaultQuestion: '나의 종합운은?'
    }
};

// 페이지 로드 시 초기화
window.addEventListener('load', () => {
    initializeTarot();
    renderTarotHistory();
});

// 타로 초기화
function initializeTarot() {
    // 카드 덱 섞기
    shuffleDeck();
    // 카드 덱 생성
    createCardDeck();
}

// 카드 덱 섞기
function shuffleDeck() {
    shuffledDeck = [...tarotCards];
    for (let i = shuffledDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
    }
    isShuffled = true;
}

// 카드 덱 생성 (22장 모두 표시)
function createCardDeck() {
    const deck = document.getElementById('tarotDeck');
    deck.innerHTML = '';
    
    shuffledDeck.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'tarot-card';
        cardElement.dataset.index = index;
        cardElement.innerHTML = `
            <div class="card-back-pattern">
                <i class="bi bi-stars"></i>
            </div>
        `;
        
        // 이미 선택된 카드는 클릭 불가
        if (!selectedCards.some(sc => sc.index === index)) {
            cardElement.onclick = () => selectCard(index, cardElement);
        } else {
            cardElement.classList.add('selected');
        }
        
        deck.appendChild(cardElement);
    });
}

// 카드 선택
function selectCard(index, cardElement) {
    // 이미 3장을 선택했으면 더 이상 선택 불가
    if (selectedCards.length >= 3) {
        alert('이미 3장의 카드를 선택하셨습니다.');
        return;
    }
    
    // 선택된 카드 저장
    const card = shuffledDeck[index];
    const isReversed = Math.random() > 0.5; // 50% 확률로 역방향
    
    selectedCards.push({
        index: index,
        card: card,
        reversed: isReversed
    });
    
    // 카드 선택 표시
    cardElement.classList.add('selected');
    cardElement.onclick = null; // 클릭 비활성화
    
    // 3장을 모두 선택했으면 결과 표시
    if (selectedCards.length === 3) {
        setTimeout(() => {
            showResult();
        }, 500);
    }
}

// 결과 표시
function showResult() {
    const questionInput = document.getElementById('tarotQuestion').value.trim();
    const question = questionInput || topicInfo[currentTopic].defaultQuestion;
    
    // 섹션 전환
    document.getElementById('cardSelectionSection').classList.add('d-none');
    document.getElementById('cardResultSection').classList.remove('d-none');
    
    // 스프레드 모드에 따른 제목
    const spreadLabels = spreadMode === 'past-present-future' 
        ? ['과거', '현재', '미래']
        : ['상황', '조언', '결과'];
    
    // 결과 표시
    const topicIcon = topicInfo[currentTopic].icon;
    const topicName = topicInfo[currentTopic].name;
    document.getElementById('resultQuestion').textContent = `${topicIcon} ${topicName}: ${question}`;
    document.getElementById('spreadMode').textContent = spreadMode === 'past-present-future' 
        ? '과거 / 현재 / 미래' 
        : '상황 / 조언 / 결과';
    
    // 각 카드 표시
    const cardsContainer = document.getElementById('selectedCardsContainer');
    cardsContainer.innerHTML = '';
    
    selectedCards.forEach((selectedCard, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'col-md-4 mb-4';
        
        const interpretation = selectedCard.reversed 
            ? selectedCard.card.reversed 
            : selectedCard.card.upright;
        
        cardDiv.innerHTML = `
            <div class="selected-card-item">
                <div class="card-position-label">${spreadLabels[index]}</div>
                <div class="tarot-card-display ${selectedCard.reversed ? 'reversed' : ''}">
                    <div class="card-icon-large">${selectedCard.card.icon}</div>
                    <h5 class="card-name-result">${selectedCard.card.name}</h5>
                    <p class="card-keywords">${selectedCard.card.keywords}</p>
                    ${selectedCard.reversed ? '<span class="badge bg-secondary mb-2">역방향</span>' : '<span class="badge bg-primary mb-2">정방향</span>'}
                </div>
                <div class="card-interpretation-box">
                    <p>${interpretation}</p>
                </div>
            </div>
        `;
        
        cardsContainer.appendChild(cardDiv);
    });
    
    // 히스토리 저장
    saveTarotHistory(question, selectedCards, spreadMode, currentTopic);
    
    // 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 타로 히스토리 저장
function saveTarotHistory(question, cards, mode, topic) {
    const historyItem = {
        id: Date.now(),
        question: question,
        cards: cards,
        mode: mode,
        topic: topic,
        date: new Date().toISOString()
    };
    
    tarotHistory.unshift(historyItem);
    
    // 최대 10개까지만 저장
    if (tarotHistory.length > 10) {
        tarotHistory = tarotHistory.slice(0, 10);
    }
    
    localStorage.setItem('tarotHistory', JSON.stringify(tarotHistory));
    renderTarotHistory();
}

// 타로 히스토리 렌더링
function renderTarotHistory() {
    const historyDiv = document.getElementById('tarotHistory');
    
    if (tarotHistory.length === 0) {
        historyDiv.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="bi bi-inbox"></i>
                </div>
                <p class="empty-text">아직 뽑은 카드가 없습니다</p>
                <small class="empty-subtext">첫 번째 카드를 선택해보세요</small>
            </div>
        `;
        return;
    }
    
    historyDiv.innerHTML = tarotHistory.slice(0, 5).map(item => {
        const date = new Date(item.date);
        const dateStr = date.toLocaleDateString('ko-KR', { 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const modeText = item.mode === 'past-present-future' ? '과거/현재/미래' : '상황/조언/결과';
        const cardIcons = item.cards.map(c => c.card.icon).join(' ');
        const topicIcon = item.topic && topicInfo[item.topic] ? topicInfo[item.topic].icon : '🌟';
        const topicName = item.topic && topicInfo[item.topic] ? topicInfo[item.topic].name : '종합운';
        
        return `
            <div class="diary-list-item" onclick="showHistoryDetail(${item.id})">
                <div class="diary-item-mood-indicator" style="background: linear-gradient(135deg, #ec489920 0%, #8b5cf620 100%); border-left-color: #ec4899;">
                    <span class="mood-emoji-small" style="font-size: 0.8rem;">${cardIcons}</span>
                </div>
                <div class="diary-item-content">
                    <h6 class="diary-item-title">${topicIcon} ${topicName} - ${modeText}</h6>
                    <p class="diary-item-date">
                        <i class="bi bi-calendar3 me-1"></i>${dateStr}
                    </p>
                    <p class="diary-item-preview">${item.question}</p>
                </div>
                <div class="diary-item-action">
                    <i class="bi bi-chevron-right"></i>
                </div>
            </div>
        `;
    }).join('');
}

// 주제 변경
function changeTopic(topic, button) {
    currentTopic = topic;
    
    // 버튼 활성화 상태 변경
    document.querySelectorAll('.topic-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    button.classList.add('active');
    
    // 플레이스홀더와 힌트 업데이트
    const questionInput = document.getElementById('tarotQuestion');
    const hintText = document.getElementById('topicHintText');
    
    if (questionInput && topicInfo[topic]) {
        questionInput.placeholder = topicInfo[topic].placeholder;
    }
    
    if (hintText && topicInfo[topic]) {
        hintText.textContent = topicInfo[topic].hint;
    }
}

// 스프레드 모드 변경
function changeSpreadMode(mode) {
    spreadMode = mode;
    
    // 버튼 활성화 상태 변경
    document.querySelectorAll('.spread-mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

// 카드 섞기 애니메이션
function shuffleCards() {
    const deck = document.getElementById('tarotDeck');
    deck.classList.add('shuffling');
    
    setTimeout(() => {
        shuffleDeck();
        createCardDeck();
        deck.classList.remove('shuffling');
    }, 1000);
}

// 히스토리 상세보기
function showHistoryDetail(id) {
    const item = tarotHistory.find(h => h.id === id);
    if (!item) return;
    
    const date = new Date(item.date);
    const dateStr = date.toLocaleDateString('ko-KR', { 
        year: 'numeric',
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const modeText = item.mode === 'past-present-future' ? '과거 / 현재 / 미래' : '상황 / 조언 / 결과';
    const spreadLabels = item.mode === 'past-present-future' 
        ? ['과거', '현재', '미래']
        : ['상황', '조언', '결과'];
    const topicIcon = item.topic && topicInfo[item.topic] ? topicInfo[item.topic].icon : '🌟';
    const topicName = item.topic && topicInfo[item.topic] ? topicInfo[item.topic].name : '종합운';
    
    const cardsHTML = item.cards.map((selectedCard, index) => {
        const interpretation = selectedCard.reversed 
            ? selectedCard.card.reversed 
            : selectedCard.card.upright;
        
        return `
            <div class="col-md-4 mb-3">
                <div class="text-center">
                    <div class="card-position-label">${spreadLabels[index]}</div>
                    <div style="font-size: 3rem; margin: 0.5rem 0;">${selectedCard.card.icon}</div>
                    <h6 class="fw-bold">${selectedCard.card.name}</h6>
                    ${selectedCard.reversed ? '<span class="badge bg-secondary mb-2">역방향</span>' : '<span class="badge bg-primary mb-2">정방향</span>'}
                    <p class="small mt-2">${interpretation}</p>
                </div>
            </div>
        `;
    }).join('');
    
    const modalHTML = `
        <div class="modal fade" id="historyModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered modal-xl">
                <div class="modal-content">
                    <div class="modal-header" style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white;">
                        <h5 class="modal-title">
                            <i class="bi bi-stars me-2"></i>${topicIcon} ${topicName} - ${modeText}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="text-center mb-4">
                            <span class="badge bg-secondary">
                                <i class="bi bi-calendar3 me-1"></i>${dateStr}
                            </span>
                        </div>
                        
                        <div class="mb-4">
                            <h6 class="fw-bold text-muted mb-2">질문</h6>
                            <p class="lead">${item.question}</p>
                        </div>
                        
                        <hr>
                        
                        <div class="row">
                            ${cardsHTML}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-danger" onclick="deleteHistory(${item.id})">
                            <i class="bi bi-trash me-2"></i>삭제
                        </button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">닫기</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 기존 모달 제거
    const existingModal = document.getElementById('historyModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 새 모달 추가 및 표시
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('historyModal'));
    modal.show();
}

// 히스토리 삭제
function deleteHistory(id) {
    if (confirm('이 기록을 삭제하시겠습니까?')) {
        tarotHistory = tarotHistory.filter(h => h.id !== id);
        localStorage.setItem('tarotHistory', JSON.stringify(tarotHistory));
        renderTarotHistory();
        
        // 모달 닫기
        const modal = bootstrap.Modal.getInstance(document.getElementById('historyModal'));
        if (modal) modal.hide();
    }
}

// 다시 뽑기
function resetTarot() {
    // 상태 초기화
    selectedCards = [];
    document.getElementById('tarotQuestion').value = '';
    
    // 섹션 전환
    document.getElementById('cardResultSection').classList.add('d-none');
    document.getElementById('cardSelectionSection').classList.remove('d-none');
    
    // 새 카드 덱 생성
    shuffleDeck();
    createCardDeck();
    
    // 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

