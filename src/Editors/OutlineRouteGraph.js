"use strict";

const
   $           = require ("jquery"),
   X3D         = require ("../X3D"),
   OutlineView = require ("./OutlineView");

const
   routeColor         = "#000000",
   routeSelectedColor = "rgb(255, 69, 58)";

module .exports = class OutlineRouteGraph extends OutlineView
{
   constructor (element)
   {
      super (element);

      this .selectedRoutes = new Set ();
   }

   selectRoutes (type, event)
   {
      // Select routes.

      const
         element = $(event .currentTarget) .closest (".field", this .sceneGraph),
         field   = this .getField (element);

      event .preventDefault ();
      event .stopImmediatePropagation ();

      this .selectedRoutes .clear ();

      switch (type)
      {
         case "input":
         {
            for (const route of field .getInputRoutes ())
            {
               this .selectedRoutes .add (route);
               this .expandTo (route .getSourceNode (), true);
            }

            break;
         }
         case "output":
         {
            for (const route of field .getOutputRoutes ())
            {
               this .selectedRoutes .add (route);
               this .expandTo (route .getDestinationNode (), true);
            }

            break;
         }
      }

      this .requestUpdateRouteGraph ();
   }

   selectSingleRoute (type, event)
   {
      // Select single route.

      const
         element = $(event .currentTarget) .closest (".route", this .sceneGraph),
         field   = this .getField (element);

      event .preventDefault ();
      event .stopImmediatePropagation ();

      this .selectedRoutes .clear ();

      switch (type)
      {
         case "input":
         {
            const route = this .getRoute (element, field .getInputRoutes ());

            this .selectedRoutes .add (route);
            this .expandTo (route .getSourceNode (), true);
            break;
         }
         case "output":
         {
            const route = this .getRoute (element, field .getOutputRoutes ());

            this .selectedRoutes .add (route);
            this .expandTo (route .getDestinationNode (), true);
            break;
         }
      }

      this .requestUpdateRouteGraph ();
   }

   #updateRouteGraphId = undefined;

   requestUpdateRouteGraph ()
   {
      clearTimeout (this .#updateRouteGraphId);

      this .#updateRouteGraphId = setTimeout (() => this .updateRouteGraph ());
   }

   updateRouteGraph ()
   {
      const canvases = this .sceneGraph .find (".route-curves");

      // Determine visible routes, those routes have a value of 2.

      const fields = new Map ();

      for (const element of this .sceneGraph .find (".field"))
      {
         const field = this .getField ($(element));

         for (const route of field .getInputRoutes ())
            fields .set (route, (fields .get (route) ?? 0) + 1);

         for (const route of field .getOutputRoutes ())
            fields .set (route, (fields .get (route) ?? 0) + 1);
      }

      this .sceneGraph
         .find (".field-routes")
         .each ((i, canvas2d) => this .updateFieldRoutes ($(canvas2d), fields));

      this .sceneGraph
         .find (".single-route")
         .each ((i, canvas2d) => this .updateSingleRoute ($(canvas2d), fields));

      this .updateRouteCurves (canvases, fields);
   }

   updateFieldRoutes (canvas, fields)
   {
      // Draw horizontal lines.

      const
         element = canvas .closest (".field", this .sceneGraph),
         field   = this .getField (element),
         parent  = canvas .parent (),
         context = canvas .get (0) .getContext ("2d");

      canvas .height (Math .ceil (parent .height ()));

      canvas .prop ("width",  canvas .width ());
      canvas .prop ("height", canvas .height ());

      context .clearRect (0, 0, canvas .prop ("width"), canvas .prop ("height"));

      switch (field .getAccessType ())
      {
         case X3D .X3DConstants .initializeOnly:
         {
            break;
         }
         case X3D .X3DConstants .inputOnly:
         {
            if (this .hasInputRoutes (field, fields))
            {
               context .strokeStyle = this .haveSelectedRoute (field .getInputRoutes ()) ? routeSelectedColor : routeColor;

               context .beginPath ();
               context .moveTo (26, 3.5);
               context .lineTo (canvas .prop ("width") + 1, 3.5);
               context .stroke ();
            }

            break
         }
         case X3D .X3DConstants .outputOnly:
         {
            if (this .hasOutputRoutes (field, fields))
            {
               context .strokeStyle = this .haveSelectedRoute (field .getOutputRoutes ()) ? routeSelectedColor : routeColor;

               context .beginPath ();
               context .moveTo (26, 8.5);
               context .lineTo (canvas .prop ("width") + 1, 8.5);
               context .stroke ();
            }

            break
         }
         case X3D .X3DConstants .inputOutput:
         {
            if (this .hasInputRoutes (field, fields))
            {
               context .strokeStyle = this .haveSelectedRoute (field .getInputRoutes ()) ? routeSelectedColor : routeColor;

               context .beginPath ();
               context .moveTo (40, 3.5);
               context .lineTo (canvas .prop ("width") + 1, 3.5);
               context .stroke ();
            }

            if (this .hasOutputRoutes (field, fields))
            {
               context .strokeStyle = this .haveSelectedRoute (field .getOutputRoutes ()) ? routeSelectedColor : routeColor;

               context .beginPath ();
               context .moveTo (field .getInputRoutes () .size ? 54 : 40, 8.5);
               context .lineTo (canvas .prop ("width") + 1, 8.5);
               context .stroke ();
            }

            break;
         }
      }
   }

   updateSingleRoute (canvas, fields)
   {
      // Draw horizontal line.

      const
         element = canvas .closest (".route", this .sceneGraph),
         type    = element .attr ("route-type"),
         parent  = canvas .parent (),
         context = canvas .get (0) .getContext ("2d");

      canvas .height (Math .ceil (parent .height ()));

      canvas .prop ("width",  canvas .width ());
      canvas .prop ("height", canvas .height ());

      context .clearRect (0, 0, canvas .prop ("width"), canvas .prop ("height"));

      switch (type)
      {
         case "input":
         {
            const
               field = this .getField (element),
               route = this .getRoute (element, field .getInputRoutes ());

            if (!route)
               break;

            if (fields .get (route) !== 2)
               break;

            context .strokeStyle = this .selectedRoutes .has (route) ? routeSelectedColor : routeColor;

            context .beginPath ();
            context .moveTo (26, 3.5);
            context .lineTo (canvas .prop ("width") + 1, 3.5);
            context .stroke ();
            break;
         }
         case "output":
         {
            const
               field = this .getField (element),
               route = this .getRoute (element, field .getOutputRoutes ());

            if (!route)
               break;

            if (fields .get (route) !== 2)
               break;

            context .strokeStyle = this .selectedRoutes .has (route) ? routeSelectedColor : routeColor;

            context .beginPath ();
            context .moveTo (26, 8.5);
            context .lineTo (canvas .prop ("width") + 1, 8.5);
            context .stroke ();
            break;
         }
      }
   }

   updateRouteCurves (canvases, fields)
   {
      // Scale canvases

      for (let i = 0, length = canvases .length - 1; i < length; ++ i)
      {
         const
            canvas1 = $(canvases [i]),
            canvas2 = $(canvases [i + 1]),
            rect1   = canvas1 .get (0) .getBoundingClientRect (),
            rect2   = canvas2 .get (0) .getBoundingClientRect ();

         canvas1 .height (Math .ceil (rect2 .y - rect1 .y));

         canvas1 .prop ("width",  canvas1 .width ());
         canvas1 .prop ("height", canvas1 .height ());
      }

      // Draw arcs or vertical lines.

      const routes = new Set ();

      for (const canvas2d of canvases)
      {
         const
            canvas  = $(canvas2d),
            element = canvas .closest ("li", this .sceneGraph),
            context = canvas .get (0) .getContext ("2d");

         // Clear canvases.

         context .clearRect (0, 0, canvas .prop ("width"), canvas .prop ("height"));

         const selectedRoutes = new Set (routes);

         if ((element .hasClass ("field") && !element .data ("full-expanded")) || element .hasClass ("route"))
         {
            const
               field   = this .getField (element),
               routeId = element .attr ("route-id") !== undefined ? parseInt (element .attr ("route-id")) : undefined;

            let
               numInputRoutesDown          = 0,
               numInputRoutesUp            = 0,
               numOutputRoutesDown         = 0,
               numOutputRoutesUp           = 0,
               numSelectedInputRoutesUp    = 0,
               numSelectedInputRoutesDown  = 0,
               numSelectedOutputRoutesUp   = 0,
               numSelectedOutputRoutesDown = 0;

            for (const route of field .getInputRoutes ())
            {
               if (routeId !== undefined && route .getId () !== routeId)
                  continue;

               if (fields .get (route) !== 2)
                  continue;

               if (routes .has (route))
               {
                  numInputRoutesUp         += 1;
                  numSelectedInputRoutesUp += this .selectedRoutes .has (route);

                  routes         .delete (route);
                  selectedRoutes .delete (route);
               }
               else
               {
                  numInputRoutesDown         += 1;
                  numSelectedInputRoutesDown += this .selectedRoutes .has (route);

                  routes .add (route);
               }
            }

            for (const route of field .getOutputRoutes ())
            {
               if (routeId !== undefined && route .getId () !== routeId)
                  continue;

               if (fields .get (route) !== 2)
                  continue;

               if (routes .has (route))
               {
                  numOutputRoutesUp         += 1;
                  numSelectedOutputRoutesUp += this .selectedRoutes .has (route);

                  routes         .delete (route);
                  selectedRoutes .delete (route);
               }
               else
               {
                  numOutputRoutesDown         += 1;
                  numSelectedOutputRoutesDown += this .selectedRoutes .has (route);

                  routes .add (route);
               }
            }

            // Determine vertical selected lines.

            const
               hasVerticalSelectedRoutes = this .haveSelectedRoute (selectedRoutes),
               draw = (state, selected) => (state === "normal" && !selected) || (state === "selected" && selected);

            for (const state of ["normal", "selected"])
            {
               // Draw curve up.

               if (numInputRoutesUp)
               {
                  // Input curve up.

                  if (draw (state, numSelectedInputRoutesUp))
                  {
                     context .strokeStyle = numSelectedInputRoutesUp ? routeSelectedColor : routeColor;

                     context .beginPath ();
                     context .arc (0, 0, 9.5, 1/2 * Math .PI, 2 * Math .PI, true);
                     context .lineTo (9.5, 0);
                     context .stroke ();
                  }
               }

               if (numOutputRoutesUp)
               {
                  // Output curve up.

                  if (draw (state, numSelectedOutputRoutesUp))
                  {
                     context .strokeStyle = numSelectedOutputRoutesUp ? routeSelectedColor : routeColor;

                     context .beginPath ();
                     context .arc (0, 5, 9.5, 1/2 * Math .PI, 2 * Math .PI, true);
                     context .lineTo (9.5, 0);
                     context .stroke ();
                  }
               }

               // Draw curve down.

               if (numInputRoutesDown)
               {
                  // Input curve down.

                  if (draw (state, numSelectedInputRoutesDown))
                  {
                     context .strokeStyle = numSelectedInputRoutesDown ? routeSelectedColor : routeColor;

                     context .beginPath ();
                     context .arc (0, 19, 9.5, 3/2 * Math .PI, 2 * Math .PI);
                     context .lineTo (9.5, canvas .prop ("height") + 1);
                     context .stroke ();
                  }
               }

               if (numOutputRoutesDown)
               {
                  // Output curve down.

                  if (draw (state, numSelectedOutputRoutesDown))
                  {
                     context .strokeStyle = numSelectedOutputRoutesDown ? routeSelectedColor : routeColor;

                     context .beginPath ();
                     context .arc (0, 24, 9.5, 3/2 * Math .PI, 2 * Math .PI);
                     context .lineTo (9.5, canvas .prop ("height") + 1);
                     context .stroke ();
                  }
               }

               // Draw vertical line.

               if (routes .size - (numInputRoutesDown + numOutputRoutesDown) > 0)
               {
                  if (draw (state, hasVerticalSelectedRoutes))
                  {
                     context .strokeStyle = hasVerticalSelectedRoutes ? routeSelectedColor : routeColor;

                     context .beginPath ();
                     context .moveTo (9.5, 0);
                     context .lineTo (9.5, canvas .prop ("height") + 1);
                     context .stroke ();
                  }
               }
            }
         }
         else
         {
            // Draw vertical line.

            if (routes .size)
            {
               context .strokeStyle = this .haveSelectedRoute (routes) ? routeSelectedColor : routeColor;

               context .beginPath ();
               context .moveTo (9.5, 0);
               context .lineTo (9.5, canvas .prop ("height") + 1);
               context .stroke ();
            }
         }
      }
   }

   hasInputRoutes (field, fields)
   {
      for (const route of field .getInputRoutes ())
      {
         if (fields .get (route) === 2)
            return true;
      }

      return false;
   }

   hasOutputRoutes (field, fields)
   {
      for (const route of field .getOutputRoutes ())
      {
         if (fields .get (route) === 2)
            return true;
      }

      return false;
   }

   haveSelectedRoute (routes)
   {
      for (const route of routes)
      {
         if (this .selectedRoutes .has (route))
            return true;
      }

      return false;
   }
};
