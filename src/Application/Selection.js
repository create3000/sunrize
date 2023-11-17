module .exports = new class Selection
{
   constructor ()
   {
      this .nodes = new Map ();
   }

   clear ()
   {
      for (const node of this .nodes .values ())
      {
         node .getTool () ?.setSelected (false);
         node .removeTool ("createOnSelection");
      }

      this .nodes .clear ();
   }

   set (node)
   {
      this .clear ();
      this .add (node);
   }

   add (node)
   {
      this .nodes .set (node .valueOf (), node .addTool ("createOnSelection"));
      node .getTool () ?.setSelected (true);
   }

   remove (node)
   {
      node .getTool () ?.setSelected (false);
      node .removeTool ("createOnSelection");
      this .nodes .delete (node .valueOf ());
   }
}
