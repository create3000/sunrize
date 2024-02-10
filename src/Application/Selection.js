const Interface = require ("./Interface");

const _changing = Symbol .for ("Sunrize.changing");

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
      this .executionContext ?.sceneGraph_changed .removeInterest ("update", this);

      this .executionContext = this .browser .currentScene;

      this .executionContext .sceneGraph_changed .addInterest ("update", this);

      this .clear ();
   }

   update ()
   {
      for (const node of [... this .nodes])
      {
         if (node .isLive ())
            continue;

         this .remove (node);
         node .setUserData (_changing, false);
      }
   }

   has (node)
   {
      return this .nodes .includes (node .valueOf ());
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
      exclude = exclude ?.valueOf ();

      for (const node of this .nodes)
      {
         if (node === exclude)
            continue;

         node .getTool () ?.setSelected (false);
         node .removeTool ("createOnSelection");
      }

      this .nodes = this .nodes .filter (n => n === exclude);
   }

   #add (node)
   {
      node = node .valueOf ();

      node .addTool ("createOnSelection");
      node .getTool () ?.setSelected (true);

      this .nodes = this .nodes .filter (n => n !== node);

      this .nodes .push (node);
   }

   #remove (node)
   {
      node = node .valueOf ();

      node .getTool () ?.setSelected (false);
      node .removeTool ("createOnSelection");

      this .nodes = this .nodes .filter (n => n !== node);
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
