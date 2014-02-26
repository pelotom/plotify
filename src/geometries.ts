/// <reference path="declarations"/>

import _ = require('underscore');
import U = require('./util');

export function mkMark(type: string, set: Vega.PropertySet) {
  return {
    type: type,
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
  var defaultVals:{[geom:string]:Vega.ValueRef} = {
    rect: {
      fill: U.mkVal('black')
    },
    symbol: {
      fill: U.mkVal('black'),
      shape: U.mkVal('circle')
    },
    line: {
      stroke: U.mkVal('black'),
      strokeWidth: U.mkVal(2)
    },
    text: {
      fill: U.mkVal('black'),
      text: U.mkVal('label'),
      baseline: U.mkVal('middle'),
      dx: U.mkVal(3)
    },
    area: {
      x2: {scale: 'x', value: 0},
      y2: {scale: 'y', value: 0}
    }
  };
  defaults[type] = {
    aesthetics: U.basicAesthetics,
    generate: args => {
      var data = args.data;
      var mapping = args.mapping;
      var set: Vega.PropertySet = {};
      _.each(U.basicAesthetics, aes => {
        var val = U.mkVar(mapping, aes);
        if (typeof val !== 'undefined')
          set[aes] = U.mkVar(mapping, aes);
        else if (type in defaultVals && aes in defaultVals[type])
          set[aes] = defaultVals[type][aes];
      });
      return mkMark(type, set);
    }
  };
});


// 'point' is an alias for 'symbol'
defaults['point'] = defaults['symbol'];
// use 'polygon' to get a filled line
defaults['polygon'] = _.extend({}, defaults['line']);
defaults['line'].generate = args => {
  var result = defaults['polygon'].generate(args);
  delete result.properties.update.fill;
  return result;
};

defaults['bar'] = {
  aesthetics: U.basicAesthetics,
  generate: args => {
    var data = args.data;
    var mapping = args.mapping;
    var isCat = args.isCategorical;
    var set: Vega.PropertySet = _.extend({}, defaults['rect'].generate(args).properties.update);
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
    return mkMark('rect', set);
  }
};
