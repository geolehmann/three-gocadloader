# three-gocadloader
A GOCAD ASCII file loader for three.js. Currently only supports points, lines and surfaces.  

Usage:  

```
import { GOCADLoader } from "./GOCADLoader.js";

const loader = new GOCADLoader();

loader.load("./models/test.mx", (obj) => {
  
  scene.add(obj);
  
});
```
