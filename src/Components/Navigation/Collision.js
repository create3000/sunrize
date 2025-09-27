"use strict";

const X3D = require ("../../X3D");

function Collision (executionContext)
{
   X3D .Collision .call (this, executionContext);

   this .proxyDisplay = false;
}

Object .assign (Object .setPrototypeOf (Collision .prototype, X3D .Collision .prototype),
{
   initialize ()
   {
      X3D .Collision .prototype .initialize .call (this);

      this ._proxy .addInterest ("set_tool_proxy__", this);

      this .set_tool_proxy__ ();
   },
   getProxyDisplay ()
   {
      return this .proxyDisplay;
   },
   setProxyDisplay (proxyDisplay)
   {
      this .proxyDisplay = proxyDisplay;

      this .set_collisionObjects__ ();
   },
   set_tool_proxy__ ()
   {
      this .pointingObjects .delete (this .toolProxyNode);
      this .visibleObjects  .delete (this .toolProxyNode);

      this .toolProxyNode = X3D .X3DCast (X3D .X3DConstants .X3DChildNode, this ._proxy);

      this .set_collisionObjects__ ();
   },
   set_pointingObjects__ ()
   {
      if (this .toolProxyNode)
      {
         if (this .proxyDisplay)
            this .pointingObjects .add (this .toolProxyNode);
         else
            this .pointingObjects .delete (this .toolProxyNode);
      }

      X3D .Collision .prototype .set_pointingObjects__ .call (this);

      this .getBrowser () .addBrowserEvent ();
   },
   set_collisionObjects__ ()
   {
      this .set_pointingObjects__ ();
      this .set_visibleObjects__ ();

      X3D .Collision .prototype .set_collisionObjects__ .call (this);
   },
   set_visibleObjects__ ()
   {
      if (this .toolProxyNode)
      {
         if (this .proxyDisplay)
            this .visibleObjects .add (this .toolProxyNode);
         else
            this .visibleObjects .delete (this .toolProxyNode);
      }

      X3D .Collision .prototype .set_visibleObjects__ .call (this);

      this .getBrowser () .addBrowserEvent ();
   },
});

Object .assign (Collision, X3D .Collision);

module .exports = Collision;
