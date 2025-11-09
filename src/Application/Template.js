"use strict";

const
   fs   = require ("fs"),
   path = require ("path"),
   url  = require ("url");

class Template
{
   static #templates = new Set ();
   static #stats     = new Map ();

   static create (template)
   {
      const
         filename = this .filename (template),
         dirname  = path .dirname (template),
         stats    = fs .statSync (dirname);

      this .#templates .add (template);
      this .#stats .set (dirname, stats);

      const file = fs .readFileSync (template)
         .toString ()
         .replace (/(url\()(.*?)(\))/sg, (... args) => this .resolve (template, ... args))
         .replace (/(href=")(.*?)(")/sg, (... args) => this .resolve (template, ... args));

      fs .writeFileSync (filename, file);
      fs .utimesSync (dirname, stats .atime, stats .mtime);

      return filename;
   }

   static removeAll ()
   {
      for (const template of new Set (this .#templates))
         this .remove (template);
   }

   static remove (template)
   {
      const
         dirname = path .dirname (template),
         stats   = this .#stats .get (dirname);

      fs .unlinkSync (this .filename (template));
      fs .utimesSync (dirname, stats .atime, stats .mtime);

      this .#templates .delete (template);
   }

   static filename (template)
   {
      const
         dirname  = path .dirname (template),
         basename = path .basename (template),
         filename = path .resolve (dirname, basename .replace (/-template/, ""));

      return filename;
   }

   static resolve (template, all, begin, filename, end)
   {
      const match = filename .match (/^.*?\/node_modules\/(.*?)$/);

      if (match)
         return begin + url .pathToFileURL (require .resolve (match [1])) + end;

      const resolved = new URL (filename, url .pathToFileURL (template));

      if (resolved .protocol === "file:")
         return begin + resolved + end;

      return all;
   }
}

module .exports = Template;
