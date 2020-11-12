const express  = require('express');
const markdown = require('markdown-it')();
const app      = express();
const git      = require('isomorphic-git');
const http     = require('isomorphic-git/http/node');
const fs       = require('fs');
const port     = 3000;

clone().then(pull).then(runServer);

function runServer() {
  app.get('/', async (req, res) => {
    await pull()

    const dir = await fs.promises.readdir('./blog/posts/');

    const promises = dir.map(async (d) => {
      return fs.promises.readFile('./blog/posts/' + d, 'utf8');
    });

    const contents = await Promise.all(promises);

    res.send(markdown.render(contents.join('\n\n')));
  });

  app.listen(port, () => console.log(`blog running on http://localhost:${port}`));
}

async function clone() {
  const remote = 'https://github.com/siriusastrebe/blog.git';
  const dir = './blog';
  console.log(`Git - Clone ${remote} to ${dir}`);

  await git.clone({
    fs,
    http,
    dir: dir,
    url: remote
  });
}

async function pull() {
  const dir = './blog';
  console.log(`Git - Pull ${dir}`);

  await git.pull({
    fs,
    http,
    dir: dir,
    ref: 'master',
    author: {name: 'siriusastrebe', email: ''},
  });
}
