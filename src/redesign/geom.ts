import Aes = require('./aes');
import Scale = require('./scale');

interface ExtentArgs {
  scaleType(aes: Aes.Name): Scale.Type;
}

interface Extent {
  aes: Aes.Name;
  type: Scale.Type;
  values: any[];
}

interface Geom {
  extents(args: ExtentArgs): Extent[];
}