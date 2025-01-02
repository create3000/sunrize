#!/bin/sh
cd ../x_ite;
npm run dist;
rsync -a --delete --exclude=".*" dist/ ../sunrize/node_modules/x_ite/dist/;
git checkout -- dist;
