import Aes = require('./aes');
import Scale = require('./scale');

interface Geom {
  extents: Extent[];
  render();
}

interface Extent {
  aes: Aes.Name;
  type: Scale.Type;
  values: any[];
}

interface Factory {
  (args: Factory.Args): Geom;
}

module Factory {
  export interface Args {
    scaleType(aes: Aes.Name): Scale.Type;
  }
}

var bar: Factory = (args) => ({
  extents: [
    {
      aes: Aes.Name.x,
      type: Scale.Type.numeric,
      values: []
    }
  ],
  render: () => {
    console.log('hello world');
  }
});