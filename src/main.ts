/// <reference path="declarations"/>
/// <amd-dependency path='codemirror-yaml'/>
/// <amd-dependency path='js-yaml'/>

import $ = require('jquery');
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
  tabSize: 2,
  lineWrapping: true
});

function setSize() {
  if (view) {
    var ratio = 1/3;
    var w = $win.width();
    var h = $win.height() - 40;
    codeMirror.setSize(ratio*w, h);
    $chart.css({
      'margin-left': ratio*w + 5
    });
    var pad = view.padding();
    var viewWidth = (1-ratio) * w - pad.left - pad.right - 20;
    view
      .width(viewWidth)
      .height(h - 30)
      .update();
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


