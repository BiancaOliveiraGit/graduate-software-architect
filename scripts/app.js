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

function renderMarkdown(markdown) {
  const container = document.getElementById('solution-content');
  if (!container) {
    return;
  }

  const lines = markdown.split(/\n/);
  const html = [];
  let inList = false;

  const flushList = () => {
    if (inList) {
      html.push('</ul>');
      inList = false;
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    if (/^#{1,3}\s/.test(trimmed)) {
      flushList();
      const level = trimmed.match(/^#{1,3}/)[0].length;
      const text = trimmed.replace(/^#{1,3}\s/, '');
      html.push(`<h${level}>${text}</h${level}>`);
      return;
    }

    if (/^-\s/.test(trimmed)) {
      if (!inList) {
        html.push('<ul>');
        inList = true;
      }
      html.push(`<li>${trimmed.replace(/^-\s/, '')}</li>`);
      return;
    }

    flushList();
    html.push(`<p>${trimmed}</p>`);
  });

  flushList();
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
  const title = document.getElementById('solution-title');
  const content = document.getElementById('solution-content');

  if (!challengeId || !title || !content) {
    return;
  }

  try {
    const challenge = await loadJson(`./datasource/${challengeId}.json`);
    title.textContent = challenge.title;
    const markdown = await loadText(challenge.solutionFile);
    renderMarkdown(markdown);
  } catch (error) {
    console.error(error);
    title.textContent = 'Solution unavailable';
    content.innerHTML = '<p>The requested solution could not be loaded.</p>';
  }
}

if (document.getElementById('challenge-list')) {
  initializeDashboard();
}

if (document.getElementById('solution-content')) {
  initializeSolutionViewer();
}
