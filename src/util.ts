/// <reference path="declarations"/>

import _ = require('underscore');
import E = require('./expression');

var DEFAULT_OPACITY_RANGE = [0,1];
var DEFAULT_COLOR_RANGE = 'category10';

export var scaleInfos: { [scale: string]: ScaleInfo } = {
  x: {
    defaultRange: 'width'
  },
  y: {
    defaultRange: 'height'
  },
  opacity: {
    defaultRange: DEFAULT_OPACITY_RANGE
  },
  fill: {
    defaultRange: DEFAULT_COLOR_RANGE
  },
  fillOpacity: {
    defaultRange: DEFAULT_OPACITY_RANGE
  },
  stroke: {
    defaultRange: DEFAULT_COLOR_RANGE
  },
  strokeWidth: {
    defaultRange: [1,15]
  },
  strokeOpacity: {
    defaultRange: DEFAULT_OPACITY_RANGE
  },
  strokeDash: {
    defaultRange: [
      [5,5],
      [10,10],
      [20,10,5,5,5,10]
    ]
  },

  // -- symbol
  size: {
    defaultRange: [10, 1000]
  },
  shape: {
    defaultRange: [
      'circle',
      'square',
      'cross',
      'diamond',
      'triangle-up',
      'triangle-down'
    ]
  },
};

export var scaleNames = _.keys(scaleInfos);

// Usually the scale name is the same as the aesthetic; if not
// the mapping is stored in this table
var scaledAesthetics = {
  x2: 'x',
  y2: 'y',
};

var unscaledAesthetics = [
  'height',
  'width',
  'strokeDashOffset',

  // -- path
  // 'path',

  // -- arc
  'innerRadius',
  'outerRadius',
  'startAngle',
  'endAngle',

  // -- area / line
  'interpolate',
  'tension',

  // -- image / text
  'align',
  'baseline',

  // -- image
  'url',

  // -- text
  'text',
  'dx',
  'dy',
  'angle',
  'font',
  'fontSize',
  'fontWeight',
  'fontStyle'
]

// The aesthetic attributes to which scales may be attached
export var scalarAttrs = scaleNames.concat(_.keys(scaledAesthetics));

export var basicAesthetics = scalarAttrs.concat(unscaledAesthetics);

// For a given aesthetic, tells which scale it belongs to.
export function scaleFor(aesthetic: string) {
  if (unscaledAesthetics.indexOf(aesthetic) >= 0)
    return undefined;
  return scaledAesthetics[aesthetic] || aesthetic;
}

// Find the appropriate range for a given scale
function rangeFor(aesthetic: string) {
  var scale = scaleFor(aesthetic);
  if (!scale)
    throw 'No scale found for aesthetic: ' + aesthetic;
  return scaleInfos[scale];
}

export function mkVal(v: any): Vega.ValueRef {
  return { value: v };
}

export function mkVar(mapping: Mapping, aesthetic: string): Vega.ValueRef {
  if (aesthetic in mapping) {
    var mappedTo: string = mapping[aesthetic];
    var scale = scaleFor(aesthetic);

    return E.parse(mappedTo).match({
      ifConst: (c: E.Const) => {
        var valRef: Vega.ValueRef = mkVal(c.val);
        if (scale === 'x' || scale === 'y')
          valRef.scale = scale;
        return valRef;
      },
      ifVar: (v: E.Var) => {
        var valRef: Vega.ValueRef = { field: v.field };
        if (scale)
          valRef.scale = scale;
        return valRef;
      }
    });
  }
  return undefined;
}