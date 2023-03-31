require ("../Tools")

module .exports = new class Selection
{
   constructor ()
   {
      this .nodes = new Map ()
   }

   clear (exception)
   {
      for (const node of this .nodes .values ())
      {
         if (node !== exception)
            node .removeTool ()
      }

      this .nodes .clear ()
   }

   set (node)
   {
      const tool = this .tool (node)

      this .clear (tool)
      this .add (tool ?? node)
   }

   add (node)
   {
      this .nodes .set (this .node (node), node .addTool ())
   }

   remove (node)
   {
      this .tool (node) .removeTool ()
      this .nodes .delete (this .node (node))
   }

   node (node)
   {
      return node .toolNode ?? node
   }

   tool (node)
   {
      return this .nodes .get (this .node (node))
   }
}
