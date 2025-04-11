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
      const
         target = this .#target,
         nodes  = this .#nodes;

      this .target (target ?.isLive () ? target : null);
      nodes .forEach (node => this .add (node));
   }

   target (node)
   {
      node = node ?.valueOf () ?? null;

      this .#target      = node;
      this .#nodes       = [ ];
      this .#hierarchies = this .#find (node);

      this .processInterests ();
   }

   set (node)
   {
      node = node ?.valueOf () ?? null;

      if (!this .#has (node))
         return;

      this .#nodes = [node];

      this .processInterests ();
   }

   add (node)
   {
      node = node ?.valueOf () ?? null;

      if (!this .#has (node))
         return;

      this .#nodes = Array .from (new Set (this .#nodes .toSpliced (-1, 0, node)));

      this .processInterests ();
   }

   remove (node)
   {
      node = node ?.valueOf () ?? null;

      this .#nodes = this .#nodes .filter (n => n !== node);
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

      // Find target node.

      let flags = Traverse .NONE;

      flags |= Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY;
      flags |= Traverse .ROOT_NODES;
      flags |= Traverse .PROTOTYPE_INSTANCES;

      return Array .from (this .executionContext .find (target, flags),
         hierarchy => hierarchy .filter (object => object instanceof X3D .SFNode)
            .map (node => node .getValue () .valueOf ()));
   }

   #has (node)
   {
      return this .#hierarchies .some (hierarchy => hierarchy .includes (node));
   }

   #indices (node)
   {
      return this .#hierarchies .map (hierarchy => hierarchy .indexOf (node));
   }

   up ()
   {
      const selection = require ("./Selection");

      const nodes = this .#nodes .flatMap (node => this .#indices (node) .map (index =>
      {
         return index - 1 >= 0 ? index - 1 : index;
      })
      .map ((index, i) => this .#hierarchies [i] [index])
      .filter (node => node));

      this .#nodes = Array .from (new Set (nodes));

      selection .clear ()
      this .#nodes .forEach (node => selection .add (node));

      this .processInterests ();
   }

   down ()
   {
      const selection = require ("./Selection");

      const nodes = this .#nodes .flatMap (node => this .#indices (node) .map ((index, i) =>
      {
         return index >= 0 && index + 1 < this .#hierarchies [i] .length ? index + 1 : index;
      })
      .map ((index, i) => this .#hierarchies [i] [index])
      .filter (node => node));

      this .#nodes = Array .from (new Set (nodes));

      selection .clear ()
      this .#nodes .forEach (node => selection .add (node));

      this .processInterests ();
   }

   canUp ()
   {
      return this .#nodes .some (node => this .#indices (node) .some (index => index > 0));
   }

   canDown ()
   {
      return this .#nodes .some (node => this .#indices (node)
         .some ((index, i) => index >= 0 && index < this .#hierarchies [i] .length - 1));
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
