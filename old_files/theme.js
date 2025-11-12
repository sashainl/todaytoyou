// 다크 모드 관리
(function() {
    // 저장된 테마 불러오기 또는 시스템 설정 확인
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    // 초기 테마 적용
    document.documentElement.setAttribute('data-theme', initialTheme);
    
    // 페이지 로드 후 아이콘 업데이트
    window.addEventListener('DOMContentLoaded', () => {
        updateThemeIcon(initialTheme);
    });
})();

// 테마 전환
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

// 테마 아이콘 업데이트
function updateThemeIcon(theme) {
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
    }
}

// 시스템 테마 변경 감지
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        updateThemeIcon(newTheme);
    }
});

