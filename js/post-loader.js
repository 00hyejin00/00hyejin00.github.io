/**
 * Post Loader Module
 * 마크다운 게시글 로딩, 파싱, Giscus 댓글 설정
 */
(function () {
  /**
   * URL에서 파일명 파라미터 추출
   */
  function getFileParam() {
    const params = new URLSearchParams(window.location.search);
    return params.get('file');
  }

  /**
   * Front Matter 파싱
   */
  function parseFrontMatter(content) {
    // UTF-8 BOM 제거
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
    }

    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    
    if (!match) {
      return { metadata: {}, content: content };
    }

    const frontMatter = match[1];
    const postContent = match[2];
    const metadata = {};

    frontMatter.split(/\r?\n/).forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();

        // 따옴표 제거
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }

        // 배열 파싱 (tags)
        if (key === 'tags' && value.startsWith('[') && value.endsWith(']')) {
          try {
            value = JSON.parse(value);
          } catch {
            value = value.slice(1, -1)
              .split(',')
              .map(tag => tag.trim().replace(/^['"]|['"]$/g, ''));
          }
        }

        metadata[key] = value;
      }
    });

    return { metadata, content: postContent };
  }

  /**
   * 게시글 로드 및 렌더링
   */
  async function loadPost() {
    const filename = getFileParam();
    
    if (!filename) {
      showError('게시글을 찾을 수 없습니다.');
      return;
    }

    try {
      const response = await fetch(`pages/${filename}`);
      
      if (!response.ok) {
        throw new Error('Failed to load post');
      }

      const rawContent = await response.text();
      const { metadata, content } = parseFrontMatter(rawContent);

      // 제목 설정
      const titleEl = document.getElementById('post-title');
      if (titleEl) {
        titleEl.textContent = metadata.title || filename.replace('.md', '');
        document.title = `${metadata.title || filename.replace('.md', '')} - 00hyejin00's Blog`;
      }

      // 날짜 설정
      const dateEl = document.getElementById('post-date');
      if (dateEl && metadata.date) {
        dateEl.textContent = formatDate(metadata.date);
      }

      // 태그 설정
      const tagsEl = document.getElementById('post-tags');
      if (tagsEl && Array.isArray(metadata.tags) && metadata.tags.length > 0) {
        tagsEl.innerHTML = metadata.tags
          .map(tag => `<span class="post-tag">${escapeHtml(tag)}</span>`)
          .join('');
      }

      // 마크다운 → HTML 변환
      const contentEl = document.getElementById('post-content');
      if (contentEl) {
        // marked.js 설정
        if (typeof marked !== 'undefined') {
          marked.setOptions({
            breaks: true,
            gfm: true,
            headerIds: true,
            mangle: false
          });
          contentEl.innerHTML = marked.parse(content);
        } else {
          contentEl.innerHTML = `<pre>${escapeHtml(content)}</pre>`;
        }

        // Prism.js 코드 하이라이팅
        if (typeof Prism !== 'undefined') {
          Prism.highlightAllUnder(contentEl);
        }
      }

      // Giscus 댓글 로드
      loadGiscus();

    } catch (error) {
      console.error('Error loading post:', error);
      showError('게시글을 불러오는데 실패했습니다.');
    }
  }

  /**
   * Giscus 댓글 시스템 로드
   */
  function loadGiscus() {
    const container = document.getElementById('giscus-container');
    if (!container) return;

    // 기존 Giscus 제거
    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', '00hyejin00/00hyejin00.github.io');
    script.setAttribute('data-repo-id', 'YOUR_REPO_ID'); // TODO: 실제 repo-id로 변경
    script.setAttribute('data-category', 'General');
    script.setAttribute('data-category-id', 'YOUR_CATEGORY_ID'); // TODO: 실제 category-id로 변경
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '1');
    script.setAttribute('data-input-position', 'bottom');
    script.setAttribute('data-theme', getGiscusTheme());
    script.setAttribute('data-lang', 'ko');
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;

    container.appendChild(script);

    // 테마 변경 감지
    observeThemeChange();
  }

  /**
   * 현재 테마에 맞는 Giscus 테마 반환
   */
  function getGiscusTheme() {
    const theme = document.documentElement.getAttribute('data-theme');
    return theme === 'dark' ? 'dark' : 'light';
  }

  /**
   * 테마 변경 시 Giscus 테마 업데이트
   */
  function observeThemeChange() {
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.attributeName === 'data-theme') {
          const iframe = document.querySelector('iframe.giscus-frame');
          if (iframe) {
            iframe.contentWindow.postMessage(
              { giscus: { setConfig: { theme: getGiscusTheme() } } },
              'https://giscus.app'
            );
          }
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }

  /**
   * 에러 메시지 표시
   */
  function showError(message) {
    const titleEl = document.getElementById('post-title');
    const contentEl = document.getElementById('post-content');
    
    if (titleEl) {
      titleEl.textContent = '오류';
    }
    
    if (contentEl) {
      contentEl.innerHTML = `<p class="no-results">${escapeHtml(message)}</p>`;
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
   * 초기화
   */
  document.addEventListener('DOMContentLoaded', loadPost);
})();

