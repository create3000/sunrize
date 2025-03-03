"use strict";

const X3DNodeTool = require ("./X3DNodeTool");

class X3DChildNodeTool extends X3DNodeTool
{
   isVisibleObject ()
   {
      return true;
   },
}

module .exports = X3DChildNodeTool;
