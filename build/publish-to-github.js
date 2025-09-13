#!/usr/bin/env node
"use strict";

const { systemSync } = require ("shell-tools");

function main ()
{
   systemSync (`git pull origin`);
   systemSync (`npm up`);
   systemSync (`npm i -D electron`);
   systemSync (`electron-forge publish`);
   systemSync (`npm i -P electron`);
}

main ();
