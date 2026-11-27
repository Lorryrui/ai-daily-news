/* 主题：auto → light → dark 循环，默认跟随系统。 */
(function () {
  var STORAGE_KEY = 'ainews-theme';
  var root = document.documentElement;

  function readMode() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'auto') return saved;
    } catch (error) {
      /* 隐私模式下忽略 */
    }
    return 'auto';
  }

  function apply(mode) {
    if (mode === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', mode);
    root.setAttribute('data-mode', mode);
    document.querySelectorAll('[data-theme-toggle]').forEach(function (button) {
      button.setAttribute('data-mode', mode);
      button.setAttribute(
        'aria-label',
        mode === 'auto' ? '主题：跟随系统' : mode === 'dark' ? '主题：深色' : '主题：浅色',
      );
      button.setAttribute('title', button.getAttribute('aria-label') + '（点击切换）');
    });
  }

  apply(readMode());

  document.addEventListener('click', function (event) {
    var toggle = event.target.closest('[data-theme-toggle]');
    if (!toggle) return;
    var next = readMode() === 'auto' ? 'light' : readMode() === 'light' ? 'dark' : 'auto';
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (error) {
      /* 忽略写入失败 */
    }
    apply(next);
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
    if (readMode() === 'auto') apply('auto');
  });
})();

/* 搜索：按需加载索引，本地过滤 + 高亮。 */
(function () {
  var panel = document.querySelector('[data-search-panel]');
  if (!panel) return;

  var input = panel.querySelector('input[type="search"]');
  var results = panel.querySelector('[data-search-results]');
  var hint = panel.querySelector('[data-search-hint]');
  var toggles = document.querySelectorAll('[data-search-toggle]');
  var indexUrl = panel.getAttribute('data-index') || 'search-index.json';
  var cache = null;
  var loading = null;

  function normalize(value) {
    return String(value || '').toLowerCase();
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function highlight(text, terms) {
    var out = escapeHtml(text);
    if (!terms.length) return out;
    var pattern = terms
      .filter(function (term) {
        return term.length > 1;
      })
      .map(function (term) {
        return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      })
      .join('|');
    if (!pattern) return out;
    return out.replace(new RegExp('(' + pattern + ')', 'gi'), '<mark>$1</mark>');
  }

  function loadIndex() {
    if (cache) return Promise.resolve(cache);
    if (loading) return loading;
    loading = fetch(indexUrl, { cache: 'force-cache' })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function (data) {
        cache = Array.isArray(data.items) ? data.items : [];
        return cache;
      })
      .catch(function () {
        cache = [];
        return cache;
      });
    return loading;
  }

  function render(items, terms) {
    if (!items.length) {
      results.innerHTML = '';
      hint.textContent = terms.length ? '没有找到匹配的内容，换个关键词试试。' : '';
      return;
    }
    hint.textContent = '';
    results.innerHTML = items
      .map(function (item) {
        var summary = item.s
          ? '<p class="card__summary search-hit">' + highlight(item.s, terms) + '</p>'
          : '';
        return (
          '<article class="card">' +
          '<div class="card__top">' +
          '<span class="badge badge--' +
          escapeHtml(item.k || 'news') +
          '">' +
          escapeHtml(item.n) +
          '</span>' +
          '<span class="card__time">' +
          escapeHtml(item.d) +
          '</span>' +
          '</div>' +
          '<h3><a href="' +
          escapeHtml(item.u) +
          '">' +
          highlight(item.t, terms) +
          '</a></h3>' +
          summary +
          '</article>'
        );
      })
      .join('');
  }

  function run() {
    var query = normalize(input.value).trim();
    if (!query) {
      results.innerHTML = '';
      hint.textContent = '';
      return;
    }
    var terms = query.split(/\s+/).filter(Boolean);
    loadIndex().then(function (items) {
      var scored = [];
      for (var i = 0; i < items.length; i += 1) {
        var item = items[i];
        var haystack = normalize(item.t + ' ' + (item.s || '') + ' ' + (item.g || '') + ' ' + item.n);
        var score = 0;
        for (var j = 0; j < terms.length; j += 1) {
          if (haystack.indexOf(terms[j]) === -1) {
            score = 0;
            break;
          }
          score += normalize(item.t).indexOf(terms[j]) !== -1 ? 3 : 1;
        }
        if (score > 0) scored.push({ item: item, score: score });
      }
      scored.sort(function (a, b) {
        return b.score - a.score || (a.item.d < b.item.d ? 1 : -1);
      });
      render(
        scored.slice(0, 24).map(function (entry) {
          return entry.item;
        }),
        terms,
      );
    });
  }

  function open() {
    panel.setAttribute('data-open', 'true');
    toggles.forEach(function (button) {
      button.setAttribute('aria-expanded', 'true');
    });
    loadIndex();
    setTimeout(function () {
      input.focus();
    }, 10);
  }

  function close() {
    panel.setAttribute('data-open', 'false');
    toggles.forEach(function (button) {
      button.setAttribute('aria-expanded', 'false');
    });
  }

  toggles.forEach(function (button) {
    button.addEventListener('click', function () {
      if (panel.getAttribute('data-open') === 'true') close();
      else open();
    });
  });

  var timer = null;
  input.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(run, 140);
  });

  document.addEventListener('keydown', function (event) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if ((event.key === '/' && !typing) || ((event.metaKey || event.ctrlKey) && event.key === 'k')) {
      event.preventDefault();
      open();
    } else if (event.key === 'Escape' && panel.getAttribute('data-open') === 'true') {
      close();
      input.blur();
    }
  });
})();

/* 归档页：按关键词即时过滤日期卡片。 */
(function () {
  var input = document.querySelector('[data-archive-filter]');
  if (!input) return;
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-archive-card]'));
  var groups = Array.prototype.slice.call(document.querySelectorAll('[data-archive-year]'));
  var empty = document.querySelector('[data-archive-empty]');

  input.addEventListener('input', function () {
    var query = input.value.trim().toLowerCase();
    var visible = 0;
    cards.forEach(function (card) {
      var match = !query || card.getAttribute('data-key').indexOf(query) !== -1;
      card.style.display = match ? '' : 'none';
      if (match) visible += 1;
    });
    groups.forEach(function (group) {
      var any = Array.prototype.some.call(
        group.parentNode.querySelectorAll('[data-archive-card]'),
        function (card) {
          return card.style.display !== 'none';
        },
      );
      group.style.display = any ? '' : 'none';
    });
    if (empty) empty.style.display = visible ? 'none' : '';
  });
})();
