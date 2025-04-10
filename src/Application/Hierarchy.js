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
      if (this .#target ?.isLive ())
         this .#hierarchies = this .#find (this .#target);
      else
         this .set (null);
   }

   get ()
   {
      return this .#target;
   }

   set (node)
   {
      node = node ?.valueOf () ?? null;

      this .#node = node;

      if (!this .#has (this .#node))
      {
         this .#target      = this .#node;
         this .#hierarchies = this .#find (this .#target);
      }

      this .processInterests ();
   }

   clear ()
   {
      this .#node   = null;
      this .#target = null;

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

   #indices (node)
   {
      return this .#hierarchies .map (hierarchy =>
      {
         return hierarchy .findIndex (object =>
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
      return this .#indices (this .#node) .some ((index, i) =>
      {
         const first = this .#hierarchies [i] .findIndex (object => object instanceof X3D .SFNode);

         return first >= 0 && first < index;
      });
   }

   canDown ()
   {
      return this .#indices (this .#node) .some ((index, i) =>
      {
         const last = this .#hierarchies [i] .findLastIndex (object => object instanceof X3D .SFNode);

         return last >= 0 && last > index;
      });
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
