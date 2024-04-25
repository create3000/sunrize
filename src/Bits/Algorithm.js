module .exports = {
   cmp: (a, b) => a < b ? -1 : a > b ? 1 : 0,

   clamp: (num, min, max) => Math .min (Math .max (num, min), max),
};
