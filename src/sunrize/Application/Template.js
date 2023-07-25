const
   fs   = require ("fs"),
   path = require ("path"),
   url  = require ("url")

class Template
{
   static create (template)
   {
      const filename = Template .filename (template)

      const file = fs .readFileSync (template)
         .toString ()
         .replace (/(url\()(.*?)(\))/sg, Template .resolve)
         .replace (/(href=")(.*?)(")/sg, Template .resolve)

      fs .writeFileSync (filename, file)

      return filename
   }

   static remove (template)
   {
      fs .unlinkSync (Template .filename (template))
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
