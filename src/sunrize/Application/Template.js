const
   fs   = require ("fs"),
   path = require ("path"),
   url  = require ("url")

class Template
{
   static #stats = new Map ()

   static create (template)
   {
      const
         filename = this .filename (template),
         dirname  = path .dirname (template),
         stats    = fs .statSync (dirname);

      this .#stats .set (dirname, stats)

      const file = fs .readFileSync (template)
         .toString ()
         .replace (/(url\()(.*?)(\))/sg, Template .resolve)
         .replace (/(href=")(.*?)(")/sg, Template .resolve)

      fs .writeFileSync (filename, file)
      fs .utimesSync (dirname, stats .atime, stats .mtime)

      return filename
   }

   static remove (template)
   {
      const
         dirname = path .dirname (template),
         stats   = this .#stats .get (dirname)

      fs .unlinkSync (this .filename (template))
      fs .utimesSync (dirname, stats .atime, stats .mtime)
   }

   static filename (template)
   {
      const
         dirname  = path .dirname (template),
         basename = path .basename (template),
         filename = path .resolve (dirname, basename .replace (/-template/, ""))

      return filename
   }

   static resolve (all, begin, filename, end)
   {
      const match = filename .match (/^.*?\/node_modules\/(.*?)$/)

      if (!match)
         return all

      return begin + url .pathToFileURL (require .resolve (match [1])) + end
   }
}

module .exports = Template
