"use strict";

const strings = require ("../assets/locale/languages.json");

let locale, language;

function gettext (string)
{
   return strings [string] ?.[locale] ?? string [string] ?.[language] ?? string;
}

gettext .setLocale = function (value)
{
   gettext .locale   = value;
   gettext .language = value .split ("-") [0];

   locale   = gettext .locale;
   language = gettext .language;
};

gettext .setLocale (Intl .DateTimeFormat () .resolvedOptions() .locale);

module .exports = gettext;
