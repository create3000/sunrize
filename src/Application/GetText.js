"use strict";

const strings = require ("../assets/locale/languages.json");

let locale, language;

function gettext (string)
{
   return strings [string] ?.[locale] ?? string [string] ?.[language] ?? string;
}

gettext .set = function (loc)
{
   gettext .locale   = loc;
   gettext .language = loc .split ("-") [0];

   locale   = gettext .locale;
   language = gettext .language;
};

gettext .set (Intl .DateTimeFormat () .resolvedOptions() .locale);

module .exports = gettext;
