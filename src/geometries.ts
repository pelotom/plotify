/// <reference path="declarations"/>

import U = require('./util');

var DEFAULT_SIZE = 2;

export function mkMark(type: string, set: Vega.Mark.PropertySet) {
  return {
    type: type,
    from: { data: U.DATA_NAME },
    properties: { update: set }
  };
}

export var defaults: Geometries = {};

defaults['point'] = {
  generate: args => {
    var mapping = args.mapping;
    var set: Vega.Mark.PropertySet = {};
    set.x = U.mkVar(mapping, 'x');
    set.y = U.mkVar(mapping, 'y');
    set.fill = U.mkVar(mapping, 'color', 'black');
    set.stroke = U.mkVal('white');
    set.shape = U.mkVar(mapping, 'shape', 'circle');
    set.size = U.mkVar(mapping, 'size', DEFAULT_SIZE * 30);
    return mkMark('symbol', set);
  }
};

defaults['line'] = {
  generate: args => {
    var mapping = args.mapping;
    var set: Vega.Mark.PropertySet = {};
    set.x = U.mkVar(mapping, 'x');
    set.y = U.mkVar(mapping, 'y');
    set.stroke = U.mkVar(mapping, 'color', 'black');
    set.strokeWidth = U.mkVar(mapping, 'size', DEFAULT_SIZE);
    return mkMark('line', set);
  }
};

defaults['bar'] = {
  generate: args => {
    var mapping = args.mapping;
    var isCat = args.isCategorical;
    var set: Vega.Mark.PropertySet = {};
    set.x = U.mkVar(mapping, 'x');
    set.y = U.mkVar(mapping, 'y');
    var xScale = 'x', yScale = 'y';
    if (isCat('x') && !isCat('y')) {
      set.x.scale = 'x-bands';
      set.width = {scale: 'x-bands', band: true, offset: -1};
      set.y2 = {scale: 'y', value: 0};
    } else if (isCat('y') && !isCat('x')) {
      set.y.scale = 'y-bands';
      set.height = {scale: 'y-bands', band: true, offset: -1};
      set.x2 = {scale: 'x', value: 0};
    } else throw 'A bar chart requires one discrete and one continuous spacial dimension';
    set.fill = U.mkVar(mapping, 'color', 'black');
    return mkMark('rect', set);
  }
};
