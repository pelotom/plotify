/// <reference path="declarations"/>

import $ = require('jquery');
import _ = require('underscore');

// Error codes
export var ERR_BAD_VALUE = 0;
export var ERR_MISSING_PROP = 1;
export var ERR_EXTRA_PROP = 2;

export class Error {
  constructor(public code: number, public path: string[], public message: string) {}
}

class Input {
  constructor(public val: any, public path?: string[]) {
    this.path = path || [];
  }
}

interface Parser<T> {
  (input: Input): T;
  map<R>(f:(t:T) => R): Parser<R>;
}

function parser<T>(f:(input: Input) => T): Parser<T> {
  var p = <Parser<T>>function(input: Input) {
    return f(input);
  };
  function map<R>(g:(t:T) => R): Parser<R> {
    return parser(input => {
      return g(f(input));
    });
  }
  p.map = map;
  return p;
}

function parseAtom(expectedType?: string): Parser<any> {
  return parser(input => {
    if (typeof expectedType !== 'undefined') {
      var actualType = $.type(input.val);
      if (actualType !== expectedType)
        throw new Error(ERR_BAD_VALUE, input.path, 'expected ' + expectedType + ' but found ' + actualType);
    }
    return input.val;
  });
}

function parseProp<T>(prop: any, optional?: boolean, parseInner?: Parser<T>): Parser<T> {
  if (typeof optional === 'undefined')
    optional = false;
  if (typeof parseInner === 'undefined')
    parseInner = parseAtom();
  return parser(input => {
    var val = parseAtom()(input);
    var path = input.path;
    if (!val || !(prop in val))
      if (optional)
        return undefined;
      else
        throw new Error(ERR_MISSING_PROP, path, 'missing required property: ' + prop);
    var propVal = val[prop];
    return parseInner(new Input(propVal, path.concat([prop])));
  });
}

function parseArray<T>(parseInner?: Parser<T>): Parser<T[]> {
  if (typeof parseInner === 'undefined')
    parseInner = parseAtom();
  return parser(input => {
    return <T[]>parseAtom('array')(input).map((val, idx) =>
      parseProp(idx, false, parseInner)(input)
    );
  });
}

function parseOneOf<T>(possibilities: T[]): Parser<T> {
  return parser(input => {
    if (possibilities.indexOf(input.val) < 0)
      throw new Error(ERR_BAD_VALUE, input.path, 'must be one of: ' + possibilities.join(', '));
    return <T>input.val;
  });
}

function checkExtra<T>(input: Input, result: T, rename?: any): T {
  for (var prop in input.val) {
    if (rename && prop in rename)
      prop = rename[prop];
    if (!(prop in result))
      throw new Error(ERR_EXTRA_PROP, input.path, 'unrecognized property: ' + prop);
  }
  return result;
}

// plotify-specific parsers

var scaleTypes = [
  'categorical',
  'linear',
  'log',
  'pow',
  'sqrt',
  // 'quantile',
  // 'quantize',
  // 'threshold',
  'time',
  'utc',
  'ordinal'
];

function parseAesMap<T>(aesthetics: string[], parseInner: Parser<T>): Parser<AesMap<T>> {
  return parser(input => {
    var map: AesMap<T> = {};
    function get(prop: string) {
      var val = parseProp(prop, true, parseInner)(input);
      if (typeof val !== 'undefined')
        map[prop] = val;
    }
    _.each(aesthetics, aes => {
      var val = parseProp(aes, true, parseInner)(input);
      if (typeof val !== 'undefined')
        map[aes] = val;  
    });
    return checkExtra(input, map);
  });
}

var parseDataFormat: Parser<Vega.Data.Format> = parser(input => {
  var fmt: Vega.Data.Format = {
    type: parseProp('type', true, parseAtom('string'))(input)
  };
  return _.extend(fmt, input.val);
});

var parseDataTransform: Parser<Vega.Data.Transform> = parser(input => {
  // TODO
  return _.extend({}, input.val);
})

var parseData: Parser<Vega.Data> = parser(input => {
  return {
    name: parseProp('name', true, parseAtom('string'))(input) || 'default',
    format: parseProp('format', true, parseDataFormat)(input),
    values: parseProp('values', true, parseAtom())(input),
    source: parseProp('source', true, parseAtom('string'))(input),
    url: parseProp('url', true, parseAtom('string'))(input),
    transform: parseProp('transform', true, parseArray(parseDataTransform))(input)
  };
});

var parseDataSet: Parser<Vega.Data[]> = parseArray(parseData);

function parseMapping(aesthetics: string[]): Parser<Mapping> {
  return parseAesMap(aesthetics, parseAtom());
}

var parseScale: Parser<Scale> = parser(input => {
  var scale: Scale = {};
  // optional
  scale.type = parseProp('type', true, parseOneOf(scaleTypes))(input);
  scale.domain = parseProp('domain', true, parseArray())(input);
  return checkExtra(input, scale);
});

function parseScales(aesthetics: string[]): Parser<Scales> {
  return parseAesMap(aesthetics, parseScale);
}

function parseLayer(geomTypes: string[], aesthetics: string[], dataNames: string[]): Parser<Layer> {
  return parser(input => {
    var layer: Layer = {
      type: parseProp('type', false, parseOneOf(geomTypes))(input),
      mapping: parseProp('mapping', true, parseMapping(aesthetics))(input) || {}
    };
    var data = parseProp('data', true, parseOneOf(dataNames))(input);
    if (data)
      layer.from = { data: data };
    return checkExtra(input, layer, {data: 'from'});
  });
}

function parsePlot(geomTypes: string[], aesthetics: string[]): Parser<Plot> {
  return parser(input => {
    var data = parseProp('data', true, parseDataSet)(input) || [];
    var plot: Plot = {
      layers: parseProp('layers', false, parseArray(parseLayer(geomTypes, aesthetics, data.map(set => set.name))))(input),
      data: data,
      mapping: parseProp('mapping', true, parseMapping(aesthetics))(input) || {},
      scales: {}//parseProp('scales', true, parseScales)(input) || {}
    };
    return checkExtra(input, plot);
  });
}

export function parse(json: any, config: Config) {
  var geoms = config.geometries;
  return parsePlot(_.keys(geoms), _.flatten(_.values(geoms).map((geom: Geometry) => geom.aesthetics)))(new Input(json));
}