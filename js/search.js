/**
 * Search Module
 * 클라이언트 사이드 게시글 검색
 */
(function () {
  let searchTimeout = null;
  const DEBOUNCE_DELAY = 300;

  /**
   * 검색 실행 (디바운스 적용)
   */
  function handleSearch(event) {
    const query = event.target.value.trim();

    // 이전 타이머 취소
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // 디바운스: 입력이 멈춘 후 실행
    searchTimeout = setTimeout(function () {
      if (window.BlogApp && typeof window.BlogApp.filterAndRenderPosts === 'function') {
        window.BlogApp.filterAndRenderPosts();
      }
    }, DEBOUNCE_DELAY);
  }

  /**
   * 검색어 초기화 (Enter 키로 즉시 검색)
   */
  function handleKeydown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      
      // 타이머 취소 후 즉시 검색
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      
      if (window.BlogApp && typeof window.BlogApp.filterAndRenderPosts === 'function') {
        window.BlogApp.filterAndRenderPosts();
      }
    }
  }

  /**
   * 초기화
   */
  function init() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', handleSearch);
      searchInput.addEventListener('keydown', handleKeydown);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();

