/// <reference path="../typings/jquery/jquery"/>
/// <reference path="../typings/underscore/underscore"/>
/// <reference path="../typings/d3/d3"/>
/// <reference path="../typings/vega/vega"/>
/// <reference path="../typings/codemirror/codemirror"/>
/// <reference path="../typings/moment/moment"/>

declare module 'd3' {
  export = d3;
}

declare module 'vega' {
  export = vg;
}

declare module 'codemirror' {
  export = CodeMirror;
}

declare module 'js-yaml' {
  export function safeLoad(input, options?);
}

declare module 'moment' {
  export = moment;
}

// Spec format

// A mapping of aesthetic attributes to something
interface AesMap<T> {
  [aes: string]: T;
}

interface Scale {
  type?: string;
  domain?: any[];
  range?: any;
  nice?: any;
}

// Maps aesthetics to data variables
interface Mapping extends AesMap<any> {}

// Maps primary aesthetics to their corresponding scale configuration
interface Scales extends AesMap<Scale> {}

interface Layer {
  type: string;
  from?: Vega.Mark.From;
  mapping: Mapping;
}

interface RtDatum {
  [key: string]: any
}

interface RtDataSets {
  [name: string]: RtDatum[];
}

interface Plot {
  data: Vega.Data[];
  rtDataSets?: RtDataSets;
  layers: Layer[];
  mapping: Mapping;
  scales: Scales;
}

// Compiler configuration

interface Config {
  geometries: Geometries;
}

declare module Geometry {
  export interface GenerateArgs {
    data: RtDatum[];
    mapping: Mapping;
    isCategorical: (attribute: string) => boolean;
  }
}

interface Geometry {
  aesthetics: string[];
  generate(args: Geometry.GenerateArgs): Vega.Mark;
}

interface Geometries {
  [name: string]: Geometry;
}

// Misc

interface ScaleInfo {
  defaultRange: any;
}