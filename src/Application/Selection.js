const Interface = require ("./Interface");

module .exports = new class Selection extends Interface
{
   constructor ()
   {
      super ("Sunrize.Selection.");

      this .nodes = [ ];

      this .setup ();
   }

   configure ()
   {
      this .clear ();
   }

   has (node)
   {
      return this .nodes .includes (node .getTool () ?? node);
   }

   clear ()
   {
      this .#clear ();
      this .processInterests ();
   }

   set (node)
   {
      this .#clear (node);
      this .#add (node);
      this .processInterests ();
   }

   add (node)
   {
      this .#add (node);
      this .processInterests ();
   }

   remove (node)
   {
      this .#remove (node);
      this .processInterests ();
   }

   #clear (exclude)
   {
      for (const node of this .nodes)
      {
         if (node === exclude)
            continue;

         node .getTool () ?.setSelected (false);
         node .removeTool ("createOnSelection");
      }

      this .nodes = exclude ? [exclude] : [ ];
   }

   #add (node)
   {
      node = node .addTool ("createOnSelection");

      this .nodes = this .nodes .filter (n => n .valueOf () !== node .valueOf ());

      this .nodes .push (node);
      node .getTool () ?.setSelected (true);
   }

   #remove (node)
   {
      node .getTool () ?.setSelected (false);
      node .removeTool ("createOnSelection");

      this .nodes = this .nodes .filter (n => n .valueOf () !== node .valueOf ());
   }

   interests = new Map ();

   addInterest (key, callback)
   {
      this .interests .set (key, callback);
   }

   removeInterest (key)
   {
      this .interests .delete (key);
   }

   processInterests ()
   {
      for (const callback of this .interests .values ())
         callback ();
   }
}
