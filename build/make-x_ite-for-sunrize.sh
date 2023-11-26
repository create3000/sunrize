#!/bin/sh
cd ../x_ite;
make dist;
rsync -a --delete --exclude=".*" dist/ ../sunrize/x_ite/;
git checkout -- dist;
