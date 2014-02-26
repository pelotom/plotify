/// <reference path="declarations"/>

import $ = require('jquery');
import _ = require('underscore');
import d3 = require('d3');
import U = require('./util');
import E = require('./expression');

export function inferScale(plot: Plot, scaleName: string): Scale {
  var mappingPairs = plot.layers.map(layer => {
    var layerMapping: Mapping = _.extend({}, plot.mapping, layer.mapping);
    return {fromData: layer.from.data, mapping: layerMapping};
  });
  // var mappings = [plot.mapping].concat(plot.layers.map(layer => layer.mapping));
  var vals = _.unique(_.flatten(mappingPairs.map(mp => {
    var m = mp.mapping;
    return _.keys(m).map(aes => {
      if (U.scaleFor(aes) === scaleName)
        return E.parse(m[aes]).evaluate(plot.rtDataSets[mp.fromData]);
      return []; 
    });
  })));
  if (vals.length === 0)
    return undefined;
  var scale: Scale = {};
  if (_.some(vals, v => typeof v === 'string')) {
    // categorical
    scale.type = 'ordinal';
    scale.domain = vals;
  } else if (_.every(vals, v => $.type(v) === 'date')) {
    scale.type = 'time';
    scale.domain = d3.extent(vals).map(v => v['getTime']());
  } else {
    scale.type = 'linear';
    scale.domain = d3.extent(vals);
    scale.nice = true;
  }
  scale.range = U.scaleInfos[scaleName].defaultRange;
  return scale;
}

function inferScales(plot: Plot) {
  var pairs = <any[]>U.scaleNames.map(scaleName => {
    var inferred = inferScale(plot, scaleName);
    return [scaleName, inferred];
  });
  // TODO use user-specified scale fields if provided, check for inconsistencies
  _.each(pairs, p => {
    if (!!p[1]) plot.scales[p[0]] = p[1];
  });
}

export function inferLayers(plot: Plot) {
  var dataKeys = _.keys(plot.rtDataSets);
  plot.layers.forEach(layer => {
    if (!layer.from) {
      if (dataKeys.length === 1) {
        layer.from = {
          data: dataKeys[0]
        };
      } else throw "Layer's data source is ambiguous; provide a 'data' declaration within the layer";
    }
  });
}

export function infer(plot: Plot) {
  inferLayers(plot);
  inferScales(plot);
}