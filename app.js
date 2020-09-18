const markdown  = require('markdown-it')({highlight: markdownItHighlight});
const highlight = require('highlight.js');
const express   = require('express');
const app       = express();
const port      = 3000;
const git       = require('isomorphic-git');
const http      = require('isomorphic-git/http/node');
const fs        = require('fs');

let lastPull;

// Fresh repository pull
clone().then(pull).then(runServer);

function runServer() {
  app.get('/', async (req, res) => {
    const page = Number(req.params.page) || 0;

    await poll()
    const dir = await fs.promises.readdir('./blog/posts/');

    const sorted = dir.sort((a, b) => a < b ? 1 : -1);
    newestSixPosts = sorted.slice(0 + page * 6, 6 + page * 6);

    const promises = newestSixPosts.map(async (d) => {
      return fs.promises.readFile('./blog/posts/' + d, 'utf8');
    });

    const contents = await Promise.all(promises);

    res.send(HTMLFormat(contents, dir));
  });

  app.get('/:filename', async (req, res) => {
    const filename = req.params.filename;

    await poll()

    try {
      contents = await fs.promises.readFile('./blog/posts/' + filename, 'utf8');
      res.send(HTMLFormat([contents], [filename]));
    } catch (e) {
      res.sendStatus(404);
    }
  });

  app.listen(port, () => console.log(`blog running on http://localhost:${port}`));
}

// ----------------------------------------------------------------
// Helper functions
// ----------------------------------------------------------------
async function clone() {
  const remote = 'https://github.com/siriusastrebe/blog.git';
  const dir = './blog';
  console.log(`Git - Clone ${remote} to ${dir}`);

  await git.clone({
    fs,
    http,
    dir: dir,
    url: remote,
    singleBranch: true
  });
}

async function pull() {
  const dir = './blog';
  lastPull = new Date();
  console.log(`Git - Pull ${dir}`);

  await git.pull({
    fs,
    http,
    dir: dir,
    ref: 'master',
    author: {name: 'siriusastrebe', email: ''},
    singleBranch: true
  });
}

async function poll() {
  if (new Date() - lastPull > 6000) {
    return await pull();
  }
}

function HTMLFormat(posts, filenames) {
  let html = "<!DOCTYPE html><html><body>";

  posts.forEach((post, i) => {
    html += formatFile(post, filenames[i]);
  });

  html += "</body>";
  html += "<style type=\"text/css\">body{margin:40px auto;max-width:800px;font-size:18px;color:#333;padding:0 10px;}h1,h2,h3{line-height:1.2}pre{background:lightyellow;overflow:scroll;padding:0 20px}</style>";
  html += "<style type=\"text/css\">.hljs{display:block;overflow-x:auto;padding:.5em;background:#f0f0f0}.hljs,.hljs-subst{color:#444}.hljs-comment{color:#888}.hljs-attribute,.hljs-doctag,.hljs-keyword,.hljs-meta-keyword,.hljs-name,.hljs-selector-tag{font-weight:700}.hljs-deletion,.hljs-number,.hljs-quote,.hljs-selector-class,.hljs-selector-id,.hljs-string,.hljs-template-tag,.hljs-type{color:#800}.hljs-section,.hljs-title{color:#800;font-weight:700}.hljs-link,.hljs-regexp,.hljs-selector-attr,.hljs-selector-pseudo,.hljs-symbol,.hljs-template-variable,.hljs-variable{color:#bc6060}.hljs-literal{color:#78a960}.hljs-addition,.hljs-built_in,.hljs-bullet,.hljs-code{color:#397300}.hljs-meta{color:#1f7199}.hljs-meta-string{color:#4d99bf}.hljs-emphasis{font-style:italic}.hljs-strong{font-weight:700}</style>"
  html += "</html>";
  return html;
}

function formatFile(contents, filename) {
  if (filename.substring(filename.length - 3) === '.md') {
    return markdown.render(contents);
  } else if (filename.substring(filename.length - 5) === '.html') {
    return contents;
  }
}

function markdownItHighlight(str, lang) {
  if (lang && highlight.getLanguage(lang)) {
    try {
      return highlight.highlight(lang, str).value;
    } catch (__) {}
  }

  return ''; // use external default escaping
}
