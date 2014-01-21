/// <reference path="declarations"/>

import _ = require('underscore');

export var DATA_NAME = 'data';

export var scaleInfos: { [scale: string]: ScaleInfo } = {};
scaleInfos['x'] = {
  defaultRange: 'width'
};
scaleInfos['y'] = {
  defaultRange: 'height'
};
scaleInfos['color'] = {
  defaultRange: 'category10'
};
scaleInfos['size'] = {
  defaultRange: [10, 100]
};
scaleInfos['shape'] = {
  defaultRange: [
    'circle',
    'square',
    'cross',
    'diamond',
    'triangle-up',
    'triangle-down'
  ]
};

// Find the appropriate range for a given scale
function rangeFor(scaleName: string) {
  return scaleInfos[aestheticFor(scaleName)];
}

// The aesthetic attributes to which scales may be attached
export var scalarAttrs = _.keys(scaleInfos);

// For a given geometric attribute, tells which aesthetic domain it belongs to.
export function aestheticFor(attr: string) {
  // Usually the aesthetic domain is the same as the geometric attribute; if not
  // the mapping is stored in this table
  var exceptions = {
    x2: 'x',
    y2: 'y',
  };
  return exceptions[attr] || attr;
}

export function mkVal(v: any): Vega.Mark.ValueRef {
  return { value: v };
}

export function mkVar(mapping: Mapping, attribute: string, defaultVal?: any): Vega.Mark.ValueRef {
  if (attribute in mapping) {
    var mappedTo: string = mapping[attribute];
    if (mappedTo.indexOf('$') === 0)
      return { scale: aestheticFor(attribute), field: 'data.' + mappedTo.substring(1) };
    else
      return mkVal(mappedTo);
  }
  if (typeof defaultVal !== 'undefined')
    return mkVal(defaultVal);
  throw 'Unable to define ValueRef: ' + attribute;
}