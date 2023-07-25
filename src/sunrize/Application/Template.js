const
   fs   = require ("fs"),
   path = require ("path")

function template (template)
{
   const
      dirname  = path .dirname (template),
      basename = path .basename (template),
      filename = path .resolve (dirname, basename .replace (/-template/, ""))

   const file = fs .readFileSync (template)
      .toString ()
      .replace (/(url\()(.*?)(\))/sg, resolve)
      .replace (/(href=")(.*?)(")/sg, resolve)

   fs .writeFileSync (filename, file)

   return filename
}

function resolve (all, begin, filename, end)
{
   const match = filename .match (/^.*?\/node_modules\/(.*?)$/)

   if (!match)
      return all

   return begin + require .resolve (match [1]) + end
}

module .exports = template
