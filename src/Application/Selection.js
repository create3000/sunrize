module .exports = new class Selection
{
   constructor ()
   {
      this .nodes = new Map ();
   }

   has (node)
   {
      return this .nodes .has (node .valueOf ());
   }

   clear (exclude /* private option */)
   {
      for (const node of this .nodes .keys ())
      {
         if (node === exclude ?.valueOf ())
            continue;

         node .getTool () ?.setSelected (false);
         node .removeTool ("createOnSelection");
      }

      this .nodes .clear ();
   }

   set (node)
   {
      this .clear (node);
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
