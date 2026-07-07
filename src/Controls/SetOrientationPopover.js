"use strict";

const
   Editor      = require("../Undo/Editor"),
   UndoManager = require ("../Undo/UndoManager"),
   X3D         = require ("../X3D"),
   $           = require ("jquery"),
   _           = require ("../Application/GetText");

require ("./Popover");

$.fn.setOrientationPopover = function (executionContext, textureProjectorNode)
{
   // Create content.

   const content = $("<div></div>");

   $("<span></span>")
      .text (_("Orientation"))
      .appendTo (content);

   const orientationInput = $("<input></input>")
      .attr ("placeholder", _("Enter orientation values"))
      .appendTo (content);

   // Create tooltip.

   const tooltip = this .popover ({
      content: content,
      extension: {
         wide: true,
      },
      events: {
         show: (event, api) =>
         {
            orientationInput .on ("keydown.setOrientationPopover", event =>
            {
               if (event .key !== "Enter")
                  return;

               event .preventDefault ();

               const orientation = new X3D .SFRotation ();

               try
               {
                  orientation .fromString (orientationInput .val ());
               }
               catch
               {
                  return;
               }

               api .toggle (false);

               const
                  upVector  = orientation .multVec (X3D .SFVec3f .Y_AXIS),
                  direction = orientation .multVec (X3D .SFVec3f .NEGATIVE_Z_AXIS);

               UndoManager .shared .beginUndo (_("Set Orientation of %s"), textureProjectorNode .getTypeName ());

               Editor .setFieldValue (executionContext, textureProjectorNode, textureProjectorNode ._upVector,  upVector);
               Editor .setFieldValue (executionContext, textureProjectorNode, textureProjectorNode ._direction, direction);

               UndoManager .shared .endUndo ();
            });

            setTimeout (() => orientationInput .trigger ("select"), 1);
         },
      },
   });

   return this;
};

