/// <reference path="declarations"/>

import _ = require('underscore');
import d3 = require('d3');
import U = require('./util');

function inferScale(plot: Plot, scaleName: string): Scale {
  var mappings = [plot.mapping].concat(plot.layers.map(layer => layer.mapping));
  var vals = _.unique(_.flatten(mappings.map(m => {
    return _.flatten(_.keys(m).map(aes => {
      if (U.scaleFor(aes) === scaleName) {
        var mapsTo = m[aes];
        if (typeof mapsTo === 'string' && mapsTo.indexOf('$') === 0)
          // variable
          return plot.data.map(d => d[mapsTo.substring(1)]);
        else
          // constant
          return [mapsTo];
      }
      return []; 
    }));
  }), true));
  if (vals.length === 0)
    return undefined;
  var scale: Scale = {};
  if (_.some(vals, v => typeof v === 'string')) {
    // categorical
    scale.type = 'ordinal';
    scale.domain = vals;
  } else {
    scale.type = 'linear';
    scale.domain = d3.extent(vals);
    scale.nice = true;
  }
  scale.range = U.scaleInfos[scaleName].defaultRange;
  return scale;
}

function inferScales(plot: Plot): Scales {
  var pairs = <any[]>U.scaleNames.map(scaleName => {
    var inferred = inferScale(plot, scaleName);
    // TODO use user-specified scale fields if provided, check for inconsistencies
    return [scaleName, inferred];
  });
  var result: Scales = {};
  _.each(pairs, p => {
    if (!!p[1]) result[p[0]] = p[1];
  });
  return result;
}

function inferLayers(plot: Plot): Layer[] {
  return plot.layers;
}

export function infer(plot: Plot): Plot {
  return {
    data: plot.data,
    mapping: plot.mapping,
    scales: inferScales(plot),
    layers: inferLayers(plot)
  }
}