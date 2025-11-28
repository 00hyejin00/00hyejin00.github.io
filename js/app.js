/**
 * Main Application Module
 * 게시글 목록 렌더링 및 태그 필터링
 */
(function () {
  let allPosts = [];
  let allTags = {};
  let activeTag = null;

  /**
   * 게시글 목록 로드
   */
  async function loadPosts() {
    try {
      const response = await fetch('posts.json');
      if (!response.ok) {
        throw new Error('Failed to load posts.json');
      }
      allPosts = await response.json();
      
      // 태그 집계
      allTags = {};
      allPosts.forEach(post => {
        if (Array.isArray(post.tags)) {
          post.tags.forEach(tag => {
            allTags[tag] = (allTags[tag] || 0) + 1;
          });
        }
      });

      renderTags();
      renderPosts(allPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      showError('게시글을 불러오는데 실패했습니다.');
    }
  }

  /**
   * 태그 목록 렌더링
   */
  function renderTags() {
    const container = document.getElementById('tags-container');
    if (!container) return;

    const sortedTags = Object.entries(allTags)
      .sort((a, b) => b[1] - a[1]);

    if (sortedTags.length === 0) {
      container.innerHTML = '';
      return;
    }

    // "전체" 태그 추가
    let html = `<span class="tag ${activeTag === null ? 'active' : ''}" data-tag="">전체<span class="tag-count">${allPosts.length}</span></span>`;

    sortedTags.forEach(([tag, count]) => {
      const isActive = activeTag === tag ? 'active' : '';
      html += `<span class="tag ${isActive}" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}<span class="tag-count">${count}</span></span>`;
    });

    container.innerHTML = html;

    // 태그 클릭 이벤트
    container.querySelectorAll('.tag').forEach(tagEl => {
      tagEl.addEventListener('click', function () {
        const tag = this.getAttribute('data-tag');
        activeTag = tag === '' ? null : tag;
        
        // 활성 상태 업데이트
        container.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
        this.classList.add('active');

        // 필터링된 게시글 표시
        filterAndRenderPosts();
      });
    });
  }

  /**
   * 게시글 목록 렌더링
   */
  function renderPosts(posts) {
    const container = document.getElementById('posts-container');
    if (!container) return;

    if (posts.length === 0) {
      container.innerHTML = '<p class="no-results">게시글이 없습니다.</p>';
      return;
    }

    const html = posts.map(post => {
      const tagsHtml = Array.isArray(post.tags) 
        ? post.tags.map(tag => `<span class="post-card-tag">${escapeHtml(tag)}</span>`).join('')
        : '';

      return `
        <article class="post-card">
          <h2 class="post-card-title">
            <a href="post.html?file=${encodeURIComponent(post.file)}">${escapeHtml(post.title)}</a>
          </h2>
          <p class="post-card-excerpt">${escapeHtml(post.excerpt || post.description || '')}</p>
          <div class="post-card-meta">
            <span class="post-card-date">${formatDate(post.date)}</span>
            ${tagsHtml ? `<div class="post-card-tags">${tagsHtml}</div>` : ''}
          </div>
        </article>
      `;
    }).join('');

    container.innerHTML = html;
  }

  /**
   * 필터링된 게시글 렌더링 (태그 + 검색어)
   */
  function filterAndRenderPosts() {
    let filtered = allPosts;

    // 태그 필터
    if (activeTag) {
      filtered = filtered.filter(post => 
        Array.isArray(post.tags) && post.tags.includes(activeTag)
      );
    }

    // 검색어 필터 (search.js에서 호출)
    const searchInput = document.getElementById('search-input');
    if (searchInput && searchInput.value.trim()) {
      const query = searchInput.value.trim().toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(query) ||
        (post.excerpt && post.excerpt.toLowerCase().includes(query)) ||
        (post.description && post.description.toLowerCase().includes(query)) ||
        (Array.isArray(post.tags) && post.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    renderPosts(filtered);
  }

  /**
   * 에러 메시지 표시
   */
  function showError(message) {
    const container = document.getElementById('posts-container');
    if (container) {
      container.innerHTML = `<p class="no-results">${escapeHtml(message)}</p>`;
    }
  }

  /**
   * 날짜 포맷팅
   */
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * HTML 이스케이프
   */
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 외부에서 접근 가능하도록 전역 함수 노출
   */
  window.BlogApp = {
    filterAndRenderPosts: filterAndRenderPosts,
    getAllPosts: function () { return allPosts; }
  };

  /**
   * 초기화
   */
  document.addEventListener('DOMContentLoaded', loadPosts);
})();

