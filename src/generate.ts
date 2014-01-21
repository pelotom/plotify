/// <reference path="declarations"/>

import _ = require('underscore');
import U = require('./util');

function genScales(plot: Plot, scaleName: string): Vega.Scale[] {
  var scale: Scale = plot.scales[scaleName];
  var result: Vega.Scale = {
    name: scaleName
  };
  var type = scale.type;
  var vegaScale: Vega.Scale = {
    name: scaleName,
    type: type,
    domain: scale.domain,
    range: scale.range
  };

  if ('nice' in scale)
    vegaScale.nice = scale.nice;

  var results = [vegaScale];
  if ((scaleName === 'x' || scaleName === 'y') && type === 'ordinal') {
    results.push(_.extend({}, vegaScale, {
      name: scaleName + '-bands',
      points: false
    }));
    vegaScale.points = true;
    vegaScale.padding = 1.0;
  }
  return results;
}

export function genSpec(plot: Plot, config: Config): Vega.Spec {
  var scales = _.flatten(_.keys(plot.scales).map(scaleName => genScales(plot, scaleName)));

  return {
    data: [
      {
        name: U.DATA_NAME,
        values: plot.data
      }
    ],
    scales: scales,
    axes: [
      {type:'x', scale:'x'},
      {type:'y', scale:'y'}
    ],
    // legends: [
    //   {
    //     title: 'foo',
    //     fill: 'color',
    //     stroke: 'color',
    //   }
    // ],
    marks: plot.layers.map(layer => {
      var args: Geometry.GenerateArgs = {
        mapping: _.extend({}, plot.mapping, layer.mapping),
        isCategorical: attr => {
          var scale = _.find(scales, scale => {
            return scale.name === attr;
          });
          return scale && scale.type === 'ordinal';
        }
      };
      return config.geometries[layer.type].generate(args);
    })
  };
}