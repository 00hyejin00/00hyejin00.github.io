/**
 * Theme Toggle Module
 * 다크/라이트 모드 전환 및 localStorage 저장
 */
(function () {
  const THEME_KEY = 'blog-theme';
  const DARK = 'dark';
  const LIGHT = 'light';

  /**
   * 시스템 테마 감지
   */
  function getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return DARK;
    }
    return LIGHT;
  }

  /**
   * 저장된 테마 또는 시스템 테마 반환
   */
  function getSavedTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === DARK || saved === LIGHT) {
      return saved;
    }
    return getSystemTheme();
  }

  /**
   * 테마 적용
   */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }

  /**
   * 테마 토글
   */
  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === DARK ? LIGHT : DARK;
    applyTheme(newTheme);
  }

  /**
   * 초기화
   */
  function init() {
    // 초기 테마 적용 (깜빡임 방지를 위해 즉시 실행)
    const theme = getSavedTheme();
    applyTheme(theme);

    // 토글 버튼 이벤트 연결
    document.addEventListener('DOMContentLoaded', function () {
      const toggleButton = document.getElementById('theme-toggle');
      if (toggleButton) {
        toggleButton.addEventListener('click', toggleTheme);
      }
    });

    // 시스템 테마 변경 감지
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
        // 사용자가 명시적으로 테마를 설정하지 않은 경우에만 시스템 테마 따라가기
        const saved = localStorage.getItem(THEME_KEY);
        if (!saved) {
          applyTheme(e.matches ? DARK : LIGHT);
        }
      });
    }
  }

  // 즉시 초기화
  init();
})();

