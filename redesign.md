
Dependencies
============
scales:
- domain:
  - the dimensions and extents therein of the geometries used in each layer
    - value of each expression used in a mapping
      - data
  - specified domain?
- range:
  - default ranges
  - specified range?


Example
=======
type: bar
mapping:
  start: $startTime
  end: $endTime
  orientation?: horizontal
    # inference can happen here based on continuity of variables / scale spec

bar geom reports that it needs an extent of at least [startTime, endTime] for the x dimension

So each geom reports the minimal domain it requires to show all of itself based on the data. It must be known ahead of time whether each data attribute is continuous or categorical.

Initial chart creation
======================
- Parse data
- Parse scales
- Ask each geom for its extents in each aesthetic dimension
  - Inputs are data and any specified scales
  - If the spec has a scale spec that specifies a type or domain, the geom must respect that or throw an error if it can't conform
- For each aesthetic dimension mentioned by a geom, create a scale such that
  - the type is given by the types of the extents returned by the geoms:
    - if any of the extents is ordinal, the scale is ordinal
    - if all of the extents are date ranges, the scale is time (or UTC if overridden)
    - otherwise the scale is linear (or log, etc. if overridden)
  - the domain is (the convex hull of) the union of the extents given by each of the geoms for that dimension
  - the range is taken from defaults, can be overridden by spec
    - x and y need access to width and height of the container
