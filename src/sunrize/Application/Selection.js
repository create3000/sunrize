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
      this .nodes .delete (this .node (node))

      this .clear ()
      this .add (node)
   }

   add (node)
   {
      this .nodes .set (this .node (node), node .addTool ())
   }

   remove (node)
   {
      this .tool (node) ?.removeTool ()
      this .nodes .delete (this .node (node))
   }

   node (node)
   {
      return node .valueOf ()
   }

   tool (node)
   {
      return this .nodes .get (this .node (node))
   }
}
