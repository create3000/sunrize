"use strict";

const X3DGeometryNodeTool = require ("../Rendering/X3DGeometryNodeTool");

class TextTool extends X3DGeometryNodeTool
{
   traverseAfter (type, renderObject)
   {
      const modelViewMatrix = renderObject .getModelViewMatrix ();

      modelViewMatrix .push ();
      modelViewMatrix .multLeft (this .node .getMatrix ());

      super .traverseAfter (type, renderObject);

      modelViewMatrix .pop ();
   }
}

module .exports = TextTool;
