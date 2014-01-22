/// <reference path="declarations"/>

import _ = require('underscore');
import U = require('./util');

export function mkMark(type: string, set: Vega.Mark.PropertySet) {
  return {
    type: type,
    from: { data: U.DATA_NAME },
    properties: { update: set }
  };
}

export var defaults: Geometries = {};

var vegaTypes = [
  'rect',
  'symbol',
  // 'path',
  'arc',
  'area',
  'line',
  'image',
  'text'
];

_.each(vegaTypes, type => {
  var defaultVals = {
    symbol: {
      fill: 'black',
      shape: 'circle'
    },
    line: {
      stroke: 'black',
      strokeWidth: 2
    },
    text: {
      fill: 'black',
      text: 'label'
    }
  };
  defaults[type] = {
    aesthetics: U.basicAesthetics,
    generate: args => {
      var mapping = args.mapping;
      var set: Vega.Mark.PropertySet = {};
      _.each(U.basicAesthetics, aes => {
        var val = U.mkVar(mapping, aes);
        if (typeof val !== 'undefined')
          set[aes] = U.mkVar(mapping, aes);
        else if (type in defaultVals && aes in defaultVals[type])
          set[aes] = U.mkVal(defaultVals[type][aes]);
      });
      return mkMark(type, set);
    }
  };
});

defaults['bar'] = {
  aesthetics: U.basicAesthetics,
  generate: args => {
    var mapping = args.mapping;
    var isCat = args.isCategorical;
    var set: Vega.Mark.PropertySet = {};
    set.x = U.mkVar(mapping, 'x');
    set.y = U.mkVar(mapping, 'y');
    var xScale = 'x', yScale = 'y';
    if (isCat('x') && !isCat('y')) {
      set.x.scale = 'x-bands';
      set.width = U.mkVar(mapping, 'width') || {scale: 'x-bands', band: true, offset: -1};
      set.y2 = U.mkVar(mapping, 'y2') || {scale: 'y', value: 0};
    } else if (isCat('y') && !isCat('x')) {
      set.y.scale = 'y-bands';
      set.height = U.mkVar(mapping, 'height') || {scale: 'y-bands', band: true, offset: -1};
      set.x2 = U.mkVar(mapping, 'x2') || {scale: 'x', value: 0};
    } else throw 'A bar chart requires one discrete and one continuous spacial dimension';
    set.fill = U.mkVar(mapping, 'fill');
    return mkMark('rect', set);
  }
};