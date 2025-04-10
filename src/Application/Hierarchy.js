const
   X3D       = require ("../X3D"),
   Interface = require ("./Interface"),
   Traverse  = require ("x3d-traverse") (X3D);

module .exports = new class Hierarchy extends Interface
{
   #target      = null;
   #node        = null;
   #hierarchies = [ ];

   constructor ()
   {
      super ("Sunrize.Hierarchy.");

      this .setup ();
   }

   configure ()
   {
      this .executionContext ?.sceneGraph_changed .removeInterest ("update", this);

      this .executionContext = this .browser .currentScene;

      this .executionContext .sceneGraph_changed .addInterest ("update", this);
   }

   update ()
   {
      if (this .#target .isLive ())
         return;

      this .setTarget (null);
   }

   setTarget (node)
   {
      this .#node = node ?.valueOf () ?? null;

      if (!this .#has (this .#node))
      {
         this .#target      = this .#node;
         this .#hierarchies = this .#find (this .#target);

         console .log (this .#target ?.getTypeName (), this .#hierarchies .length);
      }

      this .processInterests ();
   }

   #find (target)
   {
      if (!target)
         return [ ];

      // Find node

      let flags = Traverse .NONE;

      flags |= Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY;
      flags |= Traverse .ROOT_NODES;
      flags |= Traverse .PROTOTYPE_INSTANCES;

      return Array .from (this .executionContext .find (this .#target, flags));
   }

   #has (node)
   {
      return !!this .#hierarchies .find (hierarchy =>
      {
         return hierarchy .find (object =>
         {
            if (object instanceof X3D .SFNode)
               return object .getValue () .valueOf () === node;

            return false;
         });
      });
   }

   up ()
   {

   }

   down ()
   {

   }

   canUp ()
   {

   }

   canDown ()
   {

   }

   #interest = new Map ();

   addInterest (key, callback)
   {
      this .#interest .set (key, callback);
   }

   removeInterest (key)
   {
      this .#interest .delete (key);
   }

   processInterests ()
   {
      for (const callback of this .#interest .values ())
         callback (this .nodes);
   }
}
