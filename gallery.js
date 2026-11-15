const el = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const selected = specimens.find(item => item.id === params.get('loader'));
const order = [...specimens];
const groups = [...new Set(specimens.map(item => item.group))];
const surfaces = ['#dfece9', '#d4e3f0', '#efe4c9', '#dfdfeb'];
const galleryTitle = 'Driftmark';
function element(tag, text, cls) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (cls) node.className = cls;
  return node;
}
function linkFor(item) {
  return '?' + new URLSearchParams({loader:item.id});
}
function makeLoader(item, label = 'Loading') {
  const loader = element('span', undefined, 'dm dm-' + item.id);
  loader.setAttribute('role', 'status');
  const art = element('i');
  art.setAttribute('aria-hidden', 'true');
  loader.append(art, element('span', label, 'dm-label'));
  return loader;
}
function mountDemo(target, item) {
  target.setAttribute('aria-hidden', 'true');
  target.replaceChildren(makeLoader(item));
}
function shuffle() {
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
}
function render() {
  const search = el('search').value.trim().toLowerCase();
  const category = el('category').value;
  const matches = order.filter(item => (!category || category === item.group) &&
    [item.name,item.group,item.description].join(' ').toLowerCase().includes(search));
  el('count').textContent = matches.length ? matches.length + ' of ' + specimens.length + ' loaders' : 'No matching loaders. Try another name or collection.';
  el('grid').replaceChildren(...matches.map(item => {
    const card = element('article');
    const stage = element('div', undefined, 'stage');
    stage.style.setProperty('--surface', surfaces[groups.indexOf(item.group)]);
    mountDemo(stage, item);
    const info = element('div', undefined, 'info');
    const title = element('div');
    title.append(element('h3',item.name),element('p',item.group,'meta'));
    const link = element('a','Get code ↗');
    link.href = linkFor(item);
    link.setAttribute('aria-label','Get code for ' + item.name);
    info.append(title,link);
    card.append(stage,info);
    return card;
  }));
}
function initGallery() {
  let index = 0;
  const showFeatured = () => {
    const item = specimens[index];
    el('hero-name').textContent = item.name;
    mountDemo(el('hero-stage'), item);
    el('hero-period').textContent = item.seconds + ' s / cycle';
  };
  el('advance').onclick = () => { index = (index + 1) % specimens.length; showFeatured(); };
  showFeatured();
  groups.forEach(group => el('category').add(new Option(group,group)));
  el('shuffle').onclick = () => { shuffle(); render(); };
  el('search').oninput = render;
  el('category').onchange = render;
  shuffle();
  render();
}
async function initDetail(item) {
  el('home').hidden = true;
  el('detail').hidden = false;
  document.title = item.name + ' — ' + galleryTitle;
  el('name').textContent = item.name;
  el('family').textContent = item.group;
  el('description').textContent = item.description;
  const update = () => {
    const loader = makeLoader(item, el('edit').value.trim() || 'Loading');
    const speed = Number(el('speed').value);
    const size = Number(el('size').value);
    const cycle = Number((item.seconds / speed).toFixed(3));
    if (size !== 1) loader.style.setProperty('--dm-size', size + 'rem');
    if (speed !== 1) loader.style.setProperty('--dm-cycle', cycle + 's');
    el('markup').textContent = loader.outerHTML;
    el('detail-stage').setAttribute('aria-hidden', 'true');
    el('detail-stage').replaceChildren(loader);
    el('period').textContent = cycle + ' s / cycle';
    el('notice').textContent = '';
  };
  update();
  el('edit').oninput = update;
  el('speed').onchange = el('size').onchange = update;
  const index = specimens.indexOf(item);
  for (const [id,delta] of [['prev',-1],['next',1]]) {
    const sibling = specimens[(index + delta + specimens.length) % specimens.length];
    el(id).href = linkFor(sibling);
    el(id).textContent = delta < 0 ? '← ' + sibling.name : sibling.name + ' →';
  }
  try {
    const response = await fetch('loaders.css');
    if (!response.ok) throw Error('Styles unavailable');
    const blocks = (await response.text()).split(/\/\* Specimen: ([\w-]+) \*\//);
    const entry = blocks.indexOf(item.id);
    if (entry < 1) throw Error('Missing specimen');
    el('css').textContent = blocks[0].trim() + '\n\n' + blocks[entry+1].trim();
    el('copy').disabled = false;
  } catch {
    el('notice').textContent = 'The stylesheet could not be loaded. Reload the page or download loaders.css below.';
  }
  el('copy').onclick = async () => {
    const snippet = '<style>\n' + el('css').textContent + '\n</style>\n' + el('markup').textContent;
    try {
      await navigator.clipboard.writeText(snippet);
      el('notice').textContent = 'HTML and CSS copied.';
    } catch {
      el('notice').textContent = 'Copy the selected snippet.';
      const field = element('textarea');
      field.setAttribute('aria-label','Complete snippet');
      field.value = snippet;
      el('notice').append(field);
      field.select();
    }
  };
}
function syncTheme() { el('theme').textContent = document.documentElement.dataset.theme === 'dark' ? 'Light view' : 'Dark view'; }
el('theme').onclick = () => {
  const root = document.documentElement;
  root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
  try { localStorage.setItem('dm-theme',root.dataset.theme); } catch {}
  syncTheme();
};
syncTheme();
el('motion').onclick = () => {
  const paused = document.body.classList.toggle('paused');
  el('motion').setAttribute('aria-pressed', String(paused));
  el('motion').textContent = paused ? 'Resume motion' : 'Pause motion';
};
if (selected) initDetail(selected);
else initGallery();
