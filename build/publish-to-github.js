#!/usr/bin/env node
"use strict";

const { systemSync, sh } = require ("shell-tools");

function main ()
{
   const electron = sh ("npm list electron") .match (/(electron@.*?)\n/s);

   systemSync (`git pull origin`);
   systemSync (`npm up`);
   systemSync (`npm i -D ${electron}`);
   systemSync (`electron-forge publish`);
   systemSync (`npm i -P ${electron}`);
}

main ();
