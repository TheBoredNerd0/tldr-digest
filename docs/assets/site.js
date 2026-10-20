
(function () {
  // Each feature below is independently wrapped: a failure in one (a browser
  // without matchMedia, localStorage disabled in a privacy mode, days.json
  // missing) must not take down the others.
  var root = document.documentElement;
  var MONTHS = ["january","february","march","april","may","june","july","august","september","october","november","december"];
  function getItem(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function setItem(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function slugOf(d) { var p = d.split('-'); return p[2] + '-' + MONTHS[+p[1] - 1] + '-' + p[0]; }
  // "2026-09-24" -> "24 Sep", by hand to match the server-rendered dates
  // (toLocaleDateString gives "24 Sept" in some browsers).
  function shortDate(d) {
    var p = d.split('-');
    var m = MONTHS[+p[1] - 1] || '';
    return (+p[2]) + ' ' + m.charAt(0).toUpperCase() + m.slice(1, 3);
  }
  function isHttp(u) { return /^https?:\/\//i.test(u || ''); }

  try {
    var toggle = document.getElementById('theme-toggle');
    var currentIsDark = function () {
      var attr = root.getAttribute('data-theme');
      if (attr) return attr === 'dark';
      try { return window.matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { return false; }
    };
    var paintTheme = function () {
      var dark = currentIsDark();
      toggle.textContent = dark ? '☀️' : '🌙';
      toggle.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    };
    if (toggle) {
      paintTheme();
      toggle.addEventListener('click', function () {
        var next = currentIsDark() ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        setItem('tldr-theme', next);
        paintTheme();
      });
    }
  } catch (e) {}

  try {
    var viewBtn = document.getElementById('view-toggle');
    var paintView = function () {
      var compact = root.getAttribute('data-view') === 'compact';
      viewBtn.setAttribute('aria-pressed', compact ? 'true' : 'false');
      viewBtn.textContent = compact ? '▦' : '☰';
      viewBtn.title = compact ? 'Switch to card view' : 'Switch to compact list';
    };
    if (viewBtn) {
      paintView();
      viewBtn.addEventListener('click', function () {
        if (root.getAttribute('data-view') === 'compact') { root.removeAttribute('data-view'); setItem('tldr-view', null); }
        else { root.setAttribute('data-view', 'compact'); setItem('tldr-view', 'compact'); }
        paintView();
      });
    }
  } catch (e) {}

  try {
    var newBtn = document.getElementById('new-only');
    var paintNew = function () {
      var on = root.hasAttribute('data-newonly');
      newBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      newBtn.textContent = on ? 'Showing new only' : 'Show new only';
    };
    if (newBtn) {
      paintNew();
      newBtn.addEventListener('click', function () {
        if (root.hasAttribute('data-newonly')) { root.removeAttribute('data-newonly'); setItem('tldr-new-only', null); }
        else { root.setAttribute('data-newonly', ''); setItem('tldr-new-only', '1'); }
        paintNew();
      });
    }
  } catch (e) {}

  // Saved articles: kept in this browser only (no accounts, no server), keyed by
  // article URL, with enough fields for saved.html to render them on its own.
  var SAVED_KEY = 'tldr-saved';
  function loadSaved() { try { return JSON.parse(getItem(SAVED_KEY) || '{}') || {}; } catch (e) { return {}; } }
  function persistSaved(s) { setItem(SAVED_KEY, JSON.stringify(s)); }
  function paintSavedCount() {
    var n = Object.keys(loadSaved()).length;
    document.querySelectorAll('[data-saved-count]').forEach(function (el) { el.textContent = n ? String(n) : ''; });
  }
  try { paintSavedCount(); } catch (e) {}

  var cards = document.querySelectorAll('.card[data-url]');

  try {
    // Cover images are hotlinked from the publishers. On older days ~8% have
    // expired or get rate-limited, which left a blank box; swap those for the
    // same gradient placeholder used when an article never had an image.
    var hue = function (s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; };
    var fallback = function (img) {
      if (!img.parentNode) return;
      var card = img.closest('.card');
      var h = hue(card ? (card.getAttribute('data-source') || '') + (card.getAttribute('data-headline') || '') : img.src);
      var ph = document.createElement('div');
      ph.className = 'cover placeholder';
      ph.setAttribute('aria-hidden', 'true');
      ph.style.background = 'linear-gradient(135deg, hsl(' + h + ',55%,45%), hsl(' + ((h + 40) % 360) + ',55%,30%))';
      ph.textContent = '📰';
      img.parentNode.replaceChild(ph, img);
    };
    document.addEventListener('error', function (evt) {
      var t = evt.target;
      if (t && t.tagName === 'IMG' && /\bcover\b/.test(t.className)) fallback(t);
    }, true);
    // Images that already failed before this script ran.
    document.querySelectorAll('img.cover').forEach(function (img) {
      if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) fallback(img);
    });
  } catch (e) {}

  try {
    // The page's own date and each card's cover image are read from the DOM
    // rather than repeated as attributes on all ~400 cards.
    var dayEl = document.querySelector('.daynav[data-date]');
    var pageDate = dayEl ? dayEl.getAttribute('data-date') : '';
    var saved = loadSaved();
    // The ☆ button is added here rather than in the HTML: it only works with JS,
    // and ~400 copies of its markup were ~30 KB of every page.
    cards.forEach(function (card) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'save';
      card.insertBefore(btn, card.firstChild);
      var url = card.getAttribute('data-url');
      var paint = function (on) {
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.textContent = on ? '★' : '☆';
        btn.setAttribute('aria-label', (on ? 'Remove from saved: ' : 'Save for later: ') + card.getAttribute('data-headline'));
      };
      paint(!!saved[url]);
      btn.addEventListener('click', function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
        var s = loadSaved();
        if (s[url]) delete s[url];
        else s[url] = {
          u: url, h: card.getAttribute('data-headline'), s: card.getAttribute('data-source'),
          d: pageDate, i: (card.querySelector('img.cover') || {}).src || '', t: Date.now()
        };
        persistSaved(s);
        paint(!!s[url]);
        paintSavedCount();
      });
    });
  } catch (e) {}

  try {
    // Read-state: mark a card faded once its details has been opened, persisted
    // across visits by article URL so re-opening the same day's page still shows
    // what you've already looked at.
    var READ_KEY = 'tldr-read-urls';
    var readUrls = {};
    try { readUrls = JSON.parse(getItem(READ_KEY) || '{}') || {}; } catch (e) {}
    cards.forEach(function (card) {
      if (readUrls[card.getAttribute('data-url')]) card.classList.add('is-read');
      var details = card.querySelector('details');
      if (details) {
        details.addEventListener('toggle', function () {
          if (details.open) {
            readUrls[card.getAttribute('data-url')] = 1;
            setItem(READ_KEY, JSON.stringify(readUrls));
            card.classList.add('is-read');
          }
        });
      }
    });
  } catch (e) {}

  try {
    // Share / copy link, added the first time a card is expanded (so ~400
    // buttons aren't built up front). Uses the native share sheet on phones,
    // otherwise copies the article link.
    var canShare = typeof navigator.share === 'function';
    cards.forEach(function (card) {
      var details = card.querySelector('details');
      if (!details) return;
      details.addEventListener('toggle', function () {
        if (!details.open || details.querySelector('.share')) return;
        var label = canShare ? 'Share' : 'Copy link';
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chip share';
        btn.textContent = label;
        btn.addEventListener('click', function () {
          var url = card.getAttribute('data-url');
          if (canShare) {
            navigator.share({ title: card.getAttribute('data-headline'), url: url }).catch(function () {});
          } else if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(function () {
              btn.textContent = 'Copied ✓';
              setTimeout(function () { btn.textContent = label; }, 1500);
            }).catch(function () {});
          }
        });
        var wrap = details.querySelector('.blurb-wrap');
        if (wrap) wrap.appendChild(btn);
      });
    });
  } catch (e) {}

  try {
    // Tab filter: clicking a quicknav pill or a category tile shows only that
    // topic's section. "All" shows Featured + the category-grid browse view.
    var navLinks = document.querySelectorAll('.quicknav a[data-target]');
    var tileLinks = document.querySelectorAll('.category-tile[data-target]');
    var allSections = document.querySelectorAll('section[id]');
    var grid = document.getElementById('category-grid');

    var applyFilter = function (target) {
      navLinks.forEach(function (l) {
        var on = l.getAttribute('data-target') === target;
        l.classList.toggle('active', on);
        if (on) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
      });
      var targetSection = null;
      allSections.forEach(function (section) {
        var visible = section.id === target || (target === 'all' && section.id === 'featured');
        section.hidden = !visible;
        if (target !== 'all' && section.id === target) targetSection = section;
      });
      if (grid) grid.hidden = target !== 'all';
      if (targetSection) {
        var d = targetSection.querySelector('details.edition-toggle');
        if (d) d.open = true;
        try { targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
      }
    };

    var bind = function (el) {
      el.addEventListener('click', function (evt) { evt.preventDefault(); applyFilter(el.getAttribute('data-target')); });
    };
    navLinks.forEach(bind);
    tileLinks.forEach(bind);

    // The server-rendered page has every section visible (works with JS off).
    // Once JS runs, switch to the browse view: Featured + topic tiles.
    if (navLinks.length) applyFilter('all');
  } catch (e) {}

  try {
    // Live search over everything on the card (headline, source, summary). The
    // summary is read from the card's own text rather than a duplicate data-blurb
    // attribute, which used to roughly double the page's text payload.
    var search = document.getElementById('search-input');
    var countEl = document.getElementById('search-count');
    if (search && cards.length) {
      var haystacks = [];
      cards.forEach(function (card) { haystacks.push(card.textContent.toLowerCase()); });
      search.addEventListener('input', function () {
        var q = search.value.trim().toLowerCase();
        var sections = document.querySelectorAll('section[id]');
        var browseGrid = document.getElementById('category-grid');
        if (q !== '') {
          sections.forEach(function (section) { section.hidden = false; });
          if (browseGrid) browseGrid.hidden = true;
        }
        var shown = 0;
        var withMatch = [];
        cards.forEach(function (card, i) {
          var match = q === '' || haystacks[i].indexOf(q) !== -1;
          if (match && q !== '' && root.hasAttribute('data-newonly') && card.classList.contains('repeat')) match = false;
          card.hidden = !match;
          if (match) {
            shown++;
            var section = card.closest('section[id]');
            if (section && withMatch.indexOf(section) === -1) withMatch.push(section);
          }
        });
        countEl.textContent = '';
        if (q !== '') {
          withMatch.forEach(function (section) {
            var d = section.querySelector('details.edition-toggle');
            if (d) d.open = true;
          });
          countEl.appendChild(document.createTextNode(shown + ' matching article' + (shown === 1 ? '' : 's') + ' today · '));
          var all = document.createElement('a');
          all.href = 'search.html?q=' + encodeURIComponent(search.value.trim());
          all.textContent = 'search every day →';
          countEl.appendChild(all);
        } else {
          var allPill = document.querySelector('.quicknav a[data-target="all"]');
          if (allPill) allPill.dispatchEvent(new Event('click'));
          else if (browseGrid) browseGrid.hidden = false;
        }
      });
      // Arriving from "search every day" (?q=…): show this day's matches straight away.
      var incoming = '';
      try { incoming = new URLSearchParams(location.search).get('q') || ''; } catch (e) {}
      if (incoming) { search.value = incoming; search.dispatchEvent(new Event('input')); }
    }
  } catch (e) {}

  try {
    // "/" jumps to the search box from anywhere; Escape clears it.
    document.addEventListener('keydown', function (evt) {
      var box = document.querySelector('[data-search]');
      if (!box) return;
      var tag = (evt.target && evt.target.tagName) || '';
      if (evt.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(tag) && !evt.metaKey && !evt.ctrlKey) {
        evt.preventDefault();
        box.focus();
      } else if (evt.key === 'Escape' && evt.target === box && box.value) {
        box.value = '';
        box.dispatchEvent(new Event('input'));
      }
    });
  } catch (e) {}

  try {
    // Reader keys on day pages: j / k = next / previous story, o or Enter =
    // expand it (native <summary>), s = save it. Only stories currently shown
    // count, so this follows the topic filter, search and "new only".
    if (cards.length) {
      var visibleSummaries = function () {
        var out = [];
        cards.forEach(function (card) {
          if (card.offsetParent === null) return; // hidden by filter/search/new-only
          var sum = card.querySelector('summary');
          if (sum) out.push(sum);
        });
        return out;
      };
      document.addEventListener('keydown', function (evt) {
        var tag = (evt.target && evt.target.tagName) || '';
        if (/INPUT|TEXTAREA|SELECT/.test(tag) || evt.metaKey || evt.ctrlKey || evt.altKey) return;
        var k = evt.key;
        if (k !== 'j' && k !== 'k' && k !== 'o' && k !== 's') return;
        var list = visibleSummaries();
        if (!list.length) return;
        var current = document.activeElement && document.activeElement.closest ? document.activeElement.closest('.card') : null;
        var idx = -1;
        for (var i = 0; i < list.length; i++) if (current && list[i].closest('.card') === current) { idx = i; break; }
        if (k === 'j' || k === 'k') {
          var next = k === 'j' ? Math.min(idx + 1, list.length - 1) : Math.max(idx - 1, 0);
          if (idx === -1) next = 0;
          list[next].focus();
          try { list[next].scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {}
        } else if (k === 'o' && idx !== -1) {
          list[idx].click();
        } else if (k === 's' && idx !== -1) {
          var btn = current.querySelector('.save');
          if (btn) btn.click();
        } else {
          return;
        }
        evt.preventDefault();
      });
    }
  } catch (e) {}

  try {
    // Previous / next day. Rendered server-side as an "All days" link only, so an
    // old page never points at a stale neighbour; the real neighbours come from
    // days.json, which is rewritten on every publish.
    // Remember which days have been opened, so the archive can mark the ones
    // you haven't read yet (only days newer than your first visit count as
    // unread; the backlog from before you started isn't nagged about).
    var VISITED_KEY = 'tldr-visited-days';
    var visited = {};
    try { visited = JSON.parse(getItem(VISITED_KEY) || '{}') || {}; } catch (e) {}
    var thisDay = document.querySelector('.daynav[data-date]');
    if (thisDay) {
      visited[thisDay.getAttribute('data-date')] = 1;
      setItem(VISITED_KEY, JSON.stringify(visited));
    }
    var rows = document.querySelectorAll('.day-row[data-date]');
    var seenDays = Object.keys(visited).sort();
    if (rows.length && seenDays.length) {
      var firstSeen = seenDays[0];
      rows.forEach(function (row) {
        var d = row.getAttribute('data-date');
        if (visited[d]) row.classList.add('visited');
        else if (d > firstSeen) row.classList.add('unread');
      });
    }
  } catch (e) {}

  try {
    var dayNav = document.querySelector('.daynav[data-date]');
    if (dayNav && window.fetch) {
      var me = dayNav.getAttribute('data-date');
      fetch('days.json').then(function (r) { return r.json(); }).then(function (days) {
        var idx = -1;
        for (var i = 0; i < days.length; i++) if (days[i].date === me) { idx = i; break; }
        if (idx === -1) return;
        var link = function (sel, day, label) {
          var a = dayNav.querySelector(sel);
          if (!a || !day) return;
          a.href = day.slug + '.html';
          a.textContent = label.replace('%', shortDate(day.date));
          a.hidden = false;
        };
        link('.older', days[idx + 1], '← %');
        link('.newer', days[idx - 1], '% →');
      }).catch(function () {});
    }
  } catch (e) {}

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function resultRow(item, extra) {
    var li = el('li', 'result');
    if (isHttp(item.i)) { var img = el('img'); img.src = item.i; img.alt = ''; img.loading = 'lazy'; li.appendChild(img); }
    var body = el('div', 'body');
    var a = el('a', 'title', item.h);
    a.href = isHttp(item.u) ? item.u : '#';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    body.appendChild(a);
    var meta = el('div', 'meta', item.s || '');
    if (item.d) {
      meta.appendChild(document.createTextNode(item.s ? ' · ' : ''));
      var day = el('a', null, shortDate(item.d) + ' digest');
      day.href = slugOf(item.d) + '.html' + (item.q ? '?q=' + encodeURIComponent(item.q) : '');
      meta.appendChild(day);
    }
    body.appendChild(meta);
    li.appendChild(body);
    if (extra) li.appendChild(extra);
    return li;
  }

  try {
    // saved.html
    var savedList = document.getElementById('saved-list');
    if (savedList) {
      var renderSaved = function () {
        var s = loadSaved();
        var items = Object.keys(s).map(function (k) { return s[k]; }).sort(function (a, b) { return (b.t || 0) - (a.t || 0); });
        savedList.textContent = '';
        document.getElementById('saved-empty').hidden = items.length > 0;
        items.forEach(function (item) {
          var rm = el('button', 'tool remove', '✕');
          rm.setAttribute('aria-label', 'Remove from saved: ' + item.h);
          rm.addEventListener('click', function () {
            var cur = loadSaved();
            delete cur[item.u];
            persistSaved(cur);
            renderSaved();
            paintSavedCount();
          });
          savedList.appendChild(resultRow(item, rm));
        });
      };
      renderSaved();
    }
  } catch (e) {}

  try {
    // search.html: month-split index, newest month first, fetched once and cached.
    var allInput = document.getElementById('all-search');
    if (allInput && window.fetch) {
      var status = document.getElementById('all-status');
      var list = document.getElementById('all-results');
      var cache = {};
      var monthsP = fetch('search/months.json').then(function (r) { return r.json(); });
      var loadMonth = function (m) {
        if (!cache[m]) cache[m] = fetch('search/' + m + '.json').then(function (r) { return r.json(); });
        return cache[m];
      };
      var LIMIT = 200;
      var run = 0;
      var doSearch = function () {
        var q = allInput.value.trim().toLowerCase();
        var mine = ++run;
        try { history.replaceState(null, '', q ? '?q=' + encodeURIComponent(allInput.value.trim()) : location.pathname); } catch (e) {}
        list.textContent = '';
        if (q.length < 2) { status.textContent = 'Type at least 2 characters.'; return; }
        var terms = q.split(/\s+/);
        var found = 0;
        var seen = {};
        monthsP.then(function (months) {
          var step = function (i) {
            if (mine !== run) return;
            if (i >= months.length || found >= LIMIT) {
              status.textContent = found ? (found >= LIMIT ? 'Showing the newest ' + LIMIT + ' matches' : found + ' match' + (found === 1 ? '' : 'es')) : 'No matches in any digest.';
              return;
            }
            status.textContent = 'Searching ' + months[i] + '…';
            loadMonth(months[i]).then(function (rows) {
              if (mine !== run) return;
              for (var r = 0; r < rows.length && found < LIMIT; r++) {
                var row = rows[r];
                if (seen[row[2]]) continue;
                var hay = (row[1] + ' ' + row[3] + ' ' + row[4]).toLowerCase();
                var ok = true;
                for (var t = 0; t < terms.length; t++) if (hay.indexOf(terms[t]) === -1) { ok = false; break; }
                if (!ok) continue;
                seen[row[2]] = 1;
                found++;
                list.appendChild(resultRow({ d: row[0], h: row[1], u: row[2], s: row[3], q: allInput.value.trim() }));
              }
              step(i + 1);
            }).catch(function () { step(i + 1); });
          };
          step(0);
        }).catch(function () { status.textContent = 'Search index unavailable.'; });
      };
      var timer = null;
      allInput.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(doSearch, 150); });
      var initial = '';
      try { initial = new URLSearchParams(location.search).get('q') || ''; } catch (e) {}
      if (initial) { allInput.value = initial; doSearch(); }
    }
  } catch (e) {}
})();
