const X3D = require ("../../X3D");

X3D .Box .prototype .toPrimitive = function (executionContext = this .getExecutionContext ())
{
	const
      texCoord = executionContext .createNode ("TextureCoordinate"),
	   coord    = executionContext .createNode ("Coordinate"),
	   geometry = executionContext .createNode ("IndexedFaceSet"),
      size1_2  = this ._size .divide (2);

	geometry ._solid = this ._solid;

	geometry .texCoord = texCoord;
	geometry .coord    = coord;

	// Texture Coordinates
	texCoord .point = [
      0, 0,
      1, 0,
      1, 1,
      0, 1,
   ];

	coord .point = [
      // Front Face
      -size1_2 .x, -size1_2 .y, size1_2 .z,
	    size1_2 .x, -size1_2 .y, size1_2 .z,
	    size1_2 .x,  size1_2 .y, size1_2 .z,
	   -size1_2 .x,  size1_2 .y, size1_2 .z,

	   // Back Face
      -size1_2 .x, -size1_2 .y, -size1_2 .z,
	    size1_2 .x, -size1_2 .y, -size1_2 .z,
	    size1_2 .x,  size1_2 .y, -size1_2 .z,
	   -size1_2 .x,  size1_2 .y, -size1_2 .z,
   ];

	geometry .texCoordIndex = [
		0, 1, 2, 3, -1, // front
		0, 1, 2, 3, -1, // back
		0, 1, 2, 3, -1, // top
		0, 1, 2, 3, -1, // bottom
		0, 1, 2, 3, -1, // right
		0, 1, 2, 3, -1  // left
	];

	geometry .coordIndex = [
		0, 1, 2, 3, -1, // front
		5, 4, 7, 6, -1, // back
		3, 2, 6, 7, -1, // top
		4, 5, 1, 0, -1, // bottom
		4, 0, 3, 7, -1, // left
		1, 5, 6, 2, -1  // right
	];

	return geometry;
};
