#!/bin/sh
cd ../x_ite;
npm run dist;
rsync -a --delete --exclude=".*" dist/ ../sunrize/x_ite/;
git checkout -- dist;
