async function loadJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to load ${url}`);
  }
  return response.json();
}

async function loadText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to load ${url}`);
  }
  return response.text();
}

function renderChallenges(challenges) {
  const container = document.getElementById('challenge-list');
  if (!container) {
    return;
  }

  container.innerHTML = '';

  challenges.forEach((challenge) => {
    const card = document.createElement('a');
    card.className = 'card';
    card.href = `./solution.html?challenge=${challenge.id}`;

    card.innerHTML = `
      <img class="card__thumb" src="${challenge.thumbnail}" alt="${challenge.title}" />
      <div class="card__title">${challenge.title}</div>
      <div class="card__summary">${challenge.summary}</div>
    `;

    container.appendChild(card);
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function resolveMarkdownUrl(target, basePath) {
  if (!target) {
    return target;
  }

  const trimmed = target.trim().replace(/^<|>$/g, '');
  if (/^(https?:)?\/\//i.test(trimmed) || /^(mailto|tel):/i.test(trimmed) || trimmed.startsWith('#')) {
    return trimmed;
  }

  try {
    const baseUrl = basePath ? new URL(basePath, window.location.href) : window.location.href;
    const resolvedUrl = new URL(trimmed, baseUrl);

    if (/\.(md|markdown)$/i.test(resolvedUrl.pathname)) {
      const reviewPage = new URL('./review-board.html', window.location.href);
      reviewPage.searchParams.set('file', resolvedUrl.pathname.replace(/^\/+/, ''));
      return reviewPage.toString();
    }

    return resolvedUrl.toString();
  } catch (error) {
    console.warn('Unable to resolve markdown URL', trimmed, error);
    return trimmed;
  }
}

function renderInlineMarkdown(text, basePath) {
  const pattern = /(!?)\[([^\]]*)\]\(([^)]+)\)/g;
  let html = '';
  let lastIndex = 0;
  let match = pattern.exec(text);

  while (match) {
    html += escapeHtml(text.slice(lastIndex, match.index));

    const [, isImage, label, target] = match;
    const resolvedUrl = resolveMarkdownUrl(target, basePath);

    if (isImage) {
      html += `<img src="${escapeHtml(resolvedUrl)}" alt="${escapeHtml(label)}" />`;
    } else {
      html += `<a href="${escapeHtml(resolvedUrl)}">${escapeHtml(label)}</a>`;
    }

    lastIndex = pattern.lastIndex;
    match = pattern.exec(text);
  }

  html += escapeHtml(text.slice(lastIndex));
  return html;
}

function renderMarkdown(markdown, sourcePath = '') {
  const container = document.getElementById('solution-content');
  if (!container) {
    return;
  }

  const lines = markdown.split(/\r?\n/);
  const html = [];
  let paragraphLines = [];
  let listItems = [];
  let tableRows = [];

  const flushParagraph = () => {
    if (paragraphLines.length) {
      html.push(`<p>${renderInlineMarkdown(paragraphLines.join(' '), sourcePath)}</p>`);
      paragraphLines = [];
    }
  };

  const flushList = () => {
    if (listItems.length) {
      html.push(`<ul>${listItems.map((item) => `<li>${renderInlineMarkdown(item, sourcePath)}</li>`).join('')}</ul>`);
      listItems = [];
    }
  };

  const flushTable = () => {
    if (tableRows.length) {
      const [headerRow, ...rows] = tableRows;
      const headers = headerRow.map((cell) => `<th>${renderInlineMarkdown(cell, sourcePath)}</th>`).join('');
      const body = rows.map((row) => `<tr>${row.map((cell) => `<td>${renderInlineMarkdown(cell, sourcePath)}</td>`).join('')}</tr>`).join('');
      html.push(`<table><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table>`);
      tableRows = [];
    }
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      flushTable();
      continue;
    }

    if (/^#{1,6}\s/.test(trimmed)) {
      flushParagraph();
      flushList();
      flushTable();
      const level = trimmed.match(/^#{1,6}/)[0].length;
      const text = trimmed.replace(/^#{1,6}\s/, '');
      html.push(`<h${level}>${renderInlineMarkdown(text, sourcePath)}</h${level}>`);
      continue;
    }

    if (/^-\s/.test(trimmed)) {
      flushParagraph();
      flushTable();
      listItems.push(trimmed.replace(/^-\s/, ''));
      continue;
    }

    const isTableRow = /^\|.*\|$/.test(trimmed);
    const nextLine = lines[index + 1] ? lines[index + 1].trim() : '';
    const isSeparatorRow = /^\|?(\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?$/.test(nextLine);

    if (isTableRow && isSeparatorRow) {
      flushParagraph();
      flushList();
      tableRows = [trimmed.split('|').slice(1, -1).map((cell) => cell.trim())];
      index += 1;
      continue;
    }

    if (tableRows.length) {
      const rowCells = trimmed.split('|').slice(1, -1).map((cell) => cell.trim());
      tableRows.push(rowCells);
      continue;
    }

    flushList();
    flushTable();
    paragraphLines.push(trimmed);
  }

  flushParagraph();
  flushList();
  flushTable();
  container.innerHTML = html.join('');
}

async function initializeDashboard() {
  try {
    const manifest = await loadJson('./datasource/manifest.json');
    const challenges = await Promise.all(
      manifest.files.map((file) => loadJson(`./datasource/${file}`))
    );
    renderChallenges(challenges);
  } catch (error) {
    console.error(error);
    const container = document.getElementById('challenge-list');
    if (container) {
      container.innerHTML = '<p>Unable to load challenges right now.</p>';
    }
  }
}

async function initializeSolutionViewer() {
  const params = new URLSearchParams(window.location.search);
  const challengeId = params.get('challenge');
  const fileParam = params.get('file');
  const title = document.getElementById('solution-title');
  const content = document.getElementById('solution-content');

  if (!title || !content) {
    return;
  }

  try {
    if (challengeId) {
      const challenge = await loadJson(`./datasource/${challengeId}.json`);
      title.textContent = challenge.title;
      const markdown = await loadText(challenge.solutionFile);
      renderMarkdown(markdown, challenge.solutionFile);
      return;
    }

    const markdownPath = fileParam ? new URL(fileParam, window.location.href).toString() : './solutions/review-board/review-challenge1.md';
    title.textContent = 'Architecture Review Board';
    const markdown = await loadText(markdownPath);
    renderMarkdown(markdown, markdownPath);
  } catch (error) {
    console.error(error);
    title.textContent = 'Content unavailable';
    content.innerHTML = '<p>The requested content could not be loaded.</p>';
  }
}

if (document.getElementById('challenge-list')) {
  initializeDashboard();
}

if (document.getElementById('solution-content')) {
  initializeSolutionViewer();
}
