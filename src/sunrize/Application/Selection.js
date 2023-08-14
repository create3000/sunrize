require ("../Tools")

module .exports = new class Selection
{
   constructor ()
   {
      this .nodes = new Map ()
   }

   clear ()
   {
      for (const node of this .nodes .values ())
         node .removeTool ()

      this .nodes .clear ()
   }

   set (node)
   {
      this .clear ()
      this .add (node)
   }

   add (node)
   {
      this .nodes .set (node .valueOf (), node .addTool ("createOnSelection"))
   }

   remove (node)
   {
      node .getTool () ?.removeTool ()
      this .nodes .delete (node .valueOf ())
   }
}
