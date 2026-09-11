"use strict";

window .addEventListener ("DOMContentLoaded", () =>
{
   const electron = require ("electron");

   electron .ipcRenderer .once ("activate", () => require ("../../Application/Window"));
});
