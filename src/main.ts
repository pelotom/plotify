/// <reference path="declarations"/>
/// <amd-dependency path='codemirror-yaml'/>
/// <amd-dependency path='js-yaml'/>

import $ = require('jquery');
import _ = require('underscore');
import vg = require('vega');
import CodeMirror = require('codemirror');
import JsYaml = require('js-yaml');
import Geoms = require('./geometries');
import Parse = require('./parse');
import Infer = require('./infer');
import Generate = require('./generate');

var config: Config = {
  geometries: Geoms.defaults
};

var $win = $(window);
var $chart = $('#chart');
var $error = $('#error');
var view: Vega.View;

var codeMirror = CodeMirror.fromTextArea(<HTMLTextAreaElement>$('#input')[0], {
  mode:  'yaml',
  theme: 'base16-light',
  indentUnit: 2,
  smartIndent: true,
  indentWithTabs: false,
  lineWrapping: true,
  extraKeys: {
    Tab: function(cm) {
      var spaces = new Array(cm.getOption("indentUnit") + 1).join(" ");
      cm.replaceSelection(spaces, "end", "+input");
    }
  }
});

function setSize() {
  if (view) {
    var ratio = 1/3;
    var w = $win.width();
    var h = $win.height() - 40;
    codeMirror.setSize(ratio*w, h);

    var pad = view.padding();
    var availWidth = (1-ratio) * w - pad.left - pad.right - 20;
    var availHeight = h - pad.top - pad.bottom + 10;

    var scales = _.object((<Vega.Scale[]>view['_model']['_defs']['marks']['scales']).map(s => [s.name, s.name]));
    var viewWidth = 'x' in scales ? availWidth : 0,
        viewHeight = 'y' in scales ? availHeight : 0;
    view
      .width(viewWidth)
      .height(viewHeight)
      .update();

    $chart.css({
      'margin-left': ratio*w + 5 + (availWidth - viewWidth)/2,
      'margin-top': (availHeight - viewHeight)/2 
    });
  }
}

$win.resize(setSize);

function makeChart(input: string) {
  try {
    var plot = Parse.parse(JsYaml.safeLoad(input), config);
    plot = Infer.infer(plot);
    var spec = Generate.genSpec(plot, config);
    // console.log(JSON.stringify(spec, null, 4));
    vg.parse.spec(spec, chart => {
      $error.text('');
      view = chart({
        el: $chart[0],
        renderer: 'svg'
      }).update();
      setSize();
    });
  } catch (e) {
    if (typeof e['code'] === 'undefined') {
      $error.text(e);
    } else {
      var err: Parse.Error = e;
      $error.text('[' + ['spec'].concat(err.path).join('.') + '] ' + err.message);
    }
  }
}

codeMirror.on('change', editor => {
  makeChart(editor.getDoc().getValue());
});

$.ajax('examples/tutorial.yaml', {dataType:'text'}).done(input => {
  codeMirror.getDoc().setValue(input);
  makeChart(input);
});


