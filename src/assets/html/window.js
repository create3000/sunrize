"use strict";

window .addEventListener ("DOMContentLoaded", () =>
{
   const electron = require ("electron");

   electron .ipcRenderer .on ("activate", () => require ("../../Application/Window"));
});
