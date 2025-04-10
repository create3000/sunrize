const
   X3D       = require ("../X3D"),
   Interface = require ("./Interface"),
   Traverse  = require ("x3d-traverse") (X3D);

module .exports = new class Hierarchy extends Interface
{
   #target      = null;
   #nodes       = [ ];
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

      this .#nodes = [node];

      if (!this .#has (node))
      {
         this .#target      = node;
         this .#hierarchies = this .#find (this .#target);
      }

      this .processInterests ();
   }

   clear ()
   {
      this .#target      = null;
      this .#nodes       = [ ];
      this .#hierarchies = [ ];

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
      const nodes = Array .from (new Set (this .#nodes .flatMap (node => this .#indices (node) .map ((index, i) =>
      {
         const before = this .#hierarchies [i] .findLastIndex ((object, i) => i < index && object instanceof X3D .SFNode);

         return before >= 0 ? before : index;
      })
      .map ((index, i) => this .#hierarchies [i] [index] .getValue () .valueOf ()))));

      this .#nodes = nodes;

      console .log (nodes)

      this .processInterests ();
   }

   down ()
   {
      const nodes = Array .from (new Set (this .#nodes .flatMap (node => this .#indices (node) .map ((index, i) =>
      {
         const after = this .#hierarchies [i] .findIndex ((object, i) => i > index && object instanceof X3D .SFNode);

         return after >= 0 ? after : index;
      })
      .map ((index, i) => this .#hierarchies [i] [index] .getValue () .valueOf ()))));

      this .#nodes = nodes;

      console .log (nodes)

      this .processInterests ();
   }

   canUp ()
   {
      return this .#nodes .some (node => this .#indices (node) .some ((index, i) =>
      {
         const first = this .#hierarchies [i] .findIndex (object => object instanceof X3D .SFNode);

         return first >= 0 && first < index;
      }));
   }

   canDown ()
   {
      return this .#nodes .some (node => this .#indices (node) .some ((index, i) =>
      {
         const last = this .#hierarchies [i] .findLastIndex (object => object instanceof X3D .SFNode);

         return last >= 0 && last > index;
      }));
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
