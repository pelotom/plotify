import Data.Map (Map)

type Aes = String

type Expr = String

type Mapping = Map Aes Expr

type Datum = Map String Val

type Data = [Datum]

data ScaleName
  = X
  | Y
  | Fill
  | Stroke
  | Opacity
  | StrokeOpacity
  | Size
  | Shape

data ScaleType
  = Categorical
  | Continuous
  | Time

data Val
  = BoolVal Bool
  | NumVal  Double
  | StrVal  String
  | TimeVal String
  | ArrVal  [Val]
  | ObjVal  Datum

data Extents = Extents
  { extentType :: ScaleType
  , values :: [Val]
  }

data Geom = Geom
  { geomExtents :: Map Aes [Val] -> ScaleName -> Extents
  }

data Layer = Layer
  { layerGeom :: Geom
  , layerData :: Data
  , layerMap  :: Mapping
  }

data Plot = Plot
  { plotData   :: Data
  , plotMap    :: Mapping
  , plotLayers :: [Layer]
  }

