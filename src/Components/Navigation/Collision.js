"use strict";

const X3D = require ("../../X3D");

function Collision (executionContext)
{
   X3D .Collision .call (this, executionContext);

   this .proxyDisplay = false;
}

Object .assign (Object .setPrototypeOf (Collision .prototype, X3D .Collision .prototype),
{
   getProxyDisplay ()
   {
      return this .proxyDisplay;
   },
   setProxyDisplay (proxyDisplay)
   {
      this .proxyDisplay = proxyDisplay;

      this .set_collisionObjects__ ();
   },
   set_proxy__ ()
   {
      this .pointingObjects .delete (this .proxyNode);
      this .visibleObjects  .delete (this .proxyNode);

      X3D .Collision .prototype .set_proxy__ .call (this);
   },
   set_pointingObjects__ ()
   {
      if (this .proxyNode)
      {
         if (this .proxyDisplay)
            this .pointingObjects .add (this .proxyNode);
         else
            this .pointingObjects .delete (this .proxyNode);
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
      if (this .proxyNode)
      {
         if (this .proxyDisplay)
            this .visibleObjects .add (this .proxyNode);
         else
            this .visibleObjects .delete (this .proxyNode);
      }

      X3D .Collision .prototype .set_visibleObjects__ .call (this);

      this .getBrowser () .addBrowserEvent ();
   },
});

Object .assign (Collision, X3D .Collision);

module .exports = Collision;
