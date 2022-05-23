import {
    BufferAttribute,
    BufferGeometry,
    FileLoader,
    Float32BufferAttribute,
    Group,
    LineBasicMaterial,
    LineSegments,
    Loader,
    Material,
    Mesh,
    MeshPhongMaterial,
    Points,
    PointsMaterial,
    Vector3,
    Color
} from './three.module.js';

function findNumDelimiter(str) {
    const str2 = str;
    let s = str2.replace(/[+-]?\d+(?:\.\d+)?/g, ""); // regex for any number including negative sign and decimal point
    return s[0];
}

function isColor(str) {
    let c = false;
    if (typeof str === 'string' && str.length === 6 && !isNaN(Number('0x' + str))) c = true;
    if (/^#[0-9A-F]{6}$/i.test(str)) return true;
    var s = new Option().style;
    s.color = str;
    if (s.color == str) c = true;
    return c;
}

class GOCADLoader extends Loader {

    load(url, onLoad, onProgress, onError) {

        const scope = this;

        const loader = new FileLoader(this.manager);
        loader.setPath(this.path);
        loader.setRequestHeader(this.requestHeader);
        loader.setWithCredentials(this.withCredentials);
        loader.load(url, function (text) {

            try {

                onLoad(scope.parse(text));

            } catch (e) {

                if (onError) {

                    onError(e);

                } else {

                    console.error(e);

                }

                scope.manager.itemError(url);

            }

        }, onProgress, onError);

    }

    parse(text) {

        const lines = text.split('\n');

        const container = new Group();

        let material = new Material();

        let vertices = [],
            path = [],
            zones = [],
            faces = [],
            wref = {
                x: 0,
                y: 0,
                z: 0
            },
            segments = [],
            marker = [];

        let name = '',
            type = '';

        let z_mirror = false; // in case the axis has negative values upwards

        let segCounter = 0,
            numVert = 0,
            countVertices = false,
            currentCounter = 0;

        let line = '';

        for (let ln = 0; ln < lines.length; ln++) {

            line = lines[ln].trim();

            if (line.charAt(0) === '#') continue; // skip comments

            if (line.includes("GOCAD ")) {

                type = line.split(" ")[1];

                if (type == "TSurf") material = new MeshPhongMaterial({
                    flatShading: true
                });
                if (type == "PLine") material = new LineBasicMaterial();
                if (type == "VSet") material = new PointsMaterial();

                material.color = new Color("grey");

                /*if (object.type == "Voxet") object = {
                    name: "",
                    type: "Voxet",
                    origin: [],
                    n: [],
                    u: 0,
                    v: 0,
                    w: 0,
                    steps: [],
                    voxels: []
                };*/
            }
            /*if (line.startsWith("AXIS_O")) {
                let nums = line.split(/\s+/);
                object.origin = new Vector3(parseFloat(nums[1]), parseFloat(nums[2]), parseFloat(nums[3]));
                if (z_mirror) object.origin.z *= -1;
            }
            if (line.startsWith("AXIS_U ")) {
                object.u = parseFloat(line.split(/\s+/)[1]);
            }
            if (line.startsWith("AXIS_V ")) {
                object.v = parseFloat(line.split(/\s+/)[2]);
            }
            if (line.startsWith("AXIS_W ")) {
                object.w = parseFloat(line.split(/\s+/)[3]);
            }
            if (line.startsWith("AXIS_N ")) {
                let nums = line.split(/\s+/);
                object.n = new Vector3(nums[1], nums[2], nums[3]);
                let voxet_extent = new Vector3(object.u, object.v, object.w);
                console.log(voxet_extent);
                let dividend = object.n.sub(new Vector3(1, 1, 1));
                console.log(dividend)
                object.steps = voxet_extent.divide(dividend);
                console.log(object)
                // 880.34, 860.67, 676.00))
            }

            if (line.startsWith("ASCII_DATA_FILE")) {

                // indicates we resolve the promise here and not at the end.
                // problems if data loading finishes earlier than the rest of the parsing?
                loading_async_data = true;

                const loader = new FileLoader();
                let path = filename.split("\\");
                path.pop();
                path = path.join("\\");
                let propertyFile = line.substr(line.indexOf(' ') + 1);
                console.log(propertyFile);
                loader.requestHeader = new Headers({
                    'requestType': 'voxetASCII',
                    'path': path + "\\" + propertyFile
                });
                let oj = object; // the variable with the name "object" is not available within the FileLoader callback...????
                loader.load(
                    propertyFile,
                    function (data) {
                        console.log("finished loading voxet data. start parsing...")
                        let elements, line;
                        let lines = data.split("\n");
                        let v = g.objects.find(x => x.name == oj.name)
                        for (let i = 0; i < lines.length; i++) {
                            line = lines[i];
                            elements = line.split(/\s+/).filter(n => n);
                            if (!line.startsWith("*")) v.voxels.push({
                                i: elements[0],
                                j: elements[1],
                                k: elements[2],
                                property: elements[3]
                            });
                        }
                        console.log("finished loading voxet data")
                        resolve(g);
                    },
                    function (xhr) {
                        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                    },
                    function (err) {
                        console.error('An error happened loading file ' + filename);
                    });
            }*/

            if (line.includes("name:") && name == '' && !line.includes("gname:")) {
                name = line.split(":")[1];
            }

            /*if (line.includes("PROPERTIES ")) {
                let props = line.split("PROPERTIES ")[1].split(" ");

                //props.forEach(e => e = e.substring(1, e.length - 1));

                props.forEach(element => {
                    object.properties[element] = [];
                });
            }*/

            if (line.includes("color") && !line.includes("mesh")) {
                // color can be rgb, rgba or "color"
                let c;
                if (line.includes(": ")) c = line.split(": ")[1];
                if (line.includes(":")) c = line.split(":")[1];

                if (isColor(c.replace(" ", ""))) {
                    material.color = new Color(c.replace(" ", "")); // hex or css color
                } else {
                    let delim = findNumDelimiter(c);

                    c = c.split(delim);
                    c.forEach(e => e.replace(" ", ""));

                    c = c.filter(function (el) {
                        return el != "";
                    });

                    if (c[0] < 1 && c[1] < 1 && c[2] < 1) c.forEach(e => e *= 255);
                    // rgb or rgba 
                    if (c.length == 3) {
                        material.color = new Color(c[0], c[1], c[2]);
                    }
                    if (c.length == 4) {
                        material.color = new Color(c[0], c[1], c[2], c[3]);
                    }
                }
            }

            if (line.includes("ZPOSITIVE Depth")) z_mirror = true; // Z-axis is reversed

            if (line == "TFACE" || line == "ILINE") {
                // new part of surface/curve
                // check if the segments/triangle counting of the new part starts at zero, if so, update the counter
                // GST export is using this, GOCAD export has continuous counting
                if (lines[ln + 1].includes("VRTX 0") || lines[ln + 1].includes("PVRTX 0")) {
                    segCounter += numVert;
                    numVert = 0;
                    //console.log(segCounter, numVert);
                    countVertices = true;
                }
            }


            if (line.includes("VRTX") && !line.includes("PVRTX")) {
                let v = line.split(" ");
                v = v.filter(function (el) {
                    return el != "" && !isNaN(parseFloat(el));
                });
                let vert = {
                    x: v[v.length - 3],
                    y: v[v.length - 2],
                    z: v[v.length - 1],
                    id: v[v.length - 0]
                }
                if (z_mirror) {
                    vert.z *= -1;
                }
                vertices.push(vert);

                numVert += 1;
            }
            if (line.includes("PVRTX")) {
                let v = line.split(" ");
                v = v.filter(function (el) {
                    return el != "" && !isNaN(el);
                });
                let vert;
                vert = {
                    x: v[1],
                    y: v[2],
                    z: v[3],
                    id: v[0]
                };
                if (z_mirror) {
                    vert.z *= -1;
                }
                vertices.push(vert);

                /*if (v.length > 4) {
                    for (let i = 0; i < v.length - 4; i++) {
                        let value = v[i + 3];
                        var key = Object.keys(object.properties)[i];
                        object.properties[key].push(value);
                    }
                }*/
                numVert += 1;
            }
            if (line.includes("ATOM ")) {
                var n = line.split(" ")[2] - 1;
                let vert = {
                    x: vertices[n].x,
                    y: vertices[n].y,
                    z: vertices[n].z
                }
                vertices.push(vert);
            }
            if (line.includes("PATH ")) {
                let p = {
                    md: parseFloat(line.split(" ")[1]),
                    z: parseFloat(line.split(" ")[2]),
                    dx: parseFloat(line.split(" ")[3]),
                    dy: parseFloat(line.split(" ")[4])
                }
                path.push(p);
            }
            if (line.includes("STATION ")) {

                let md = parseFloat(line.split(/\s+/)[1]);
                let azi = parseFloat(line.split(/\s+/)[3]);
                let dip = parseFloat(line.split(/\s+/)[2]);
                azi = azi * Math.PI / 180;
                dip = dip * Math.PI / 180;
                let dx = md * Math.cos(azi) * Math.sin(dip);
                let dy = md * Math.sin(azi) * Math.sin(dip);
                let z = md * Math.cos(dip);

                let p = {
                    md: md,
                    dx: dx,
                    dy: dy,
                    z: z
                }
                path.push(p);
            }
            if (line.includes("ZONE ")) {
                let zone = {
                    name: line.split(" ")[1],
                    to: line.split(" ")[2],
                    from: line.split(" ")[3]
                }
                zones.push(zone);
            }
            if (line.includes("WREF")) {
                wref.x = parseFloat(line.split(" ")[1]);
                wref.y = parseFloat(line.split(" ")[2]);
                wref.z = parseFloat(line.split(" ")[3]);
            }
            if (line.includes("KB ")) {
                wref.z = parseFloat(line.split("KB")[1].replace(" ", ""));
            }
            if (line.includes("TRGL")) {
                let trgl = {
                    a: parseInt(line.split(" ")[1]) + segCounter,
                    b: parseInt(line.split(" ")[2]) + segCounter,
                    c: parseInt(line.split(" ")[3]) + segCounter
                }
                faces.push(trgl);
            }
            if (line.includes("SEG")) {
                let v = line.split(" ");
                v = v.filter(function (el) {
                    return el != "" && !isNaN(parseInt(el));
                });
                let seg = {
                    a: parseInt(v[v.length - 2]) + segCounter,
                    b: parseInt(v[v.length - 1]) + segCounter
                }
                segments.push(seg);
            }
            // if marker names contain a space, GOCAD puts them in quotes ... we have to handle both cases here
            if (line.includes("MRKR") && line.includes('"')) {
                let mrkr = {
                    name: line.split('"')[1],
                    MD: line.split("  ")[2].slice(0, -1)
                }
                marker.push(mrkr);
            }
            if (line.includes("MRKR") && !line.includes('"')) {
                let mrkr = {
                    name: line.split(" ")[1],
                    MD: line.split("  ")[1].slice(0, -1)
                }
                marker.push(mrkr);
            }
            if (line == "END") {

                // create geometry from vertices and faces

                let object;

                let geometry = new BufferGeometry();

                if (type == "TSurf") object = new Mesh();
                if (type == "PLine") object = new LineSegments();
                if (type == "VSet") object = new Points();

                let positions = [];

                if (type == "VSet") {
                    vertices.forEach(point => {
                        positions.push(point.x, point.y, point.z);
                    });
                    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
                    material.size = 3;
                }

                if (type == "PLine") {

                    positions = new Float32Array(segments.length * 3 * 2);

                    let segmentStack = 0;

                    for (var i = 0; i < segments.length; i++) {

                        let seg1, seg2;
                        if (segments[i].a && segments[i].b) {
                            seg1 = segments[i].a - 1; // +1 added in loader for GOCAD, but must start at index 0
                            seg2 = segments[i].b - 1;
                        }

                        // importing from GOCAD projects is special because parts have no different indices
                        if (segments[i].hasOwnProperty("indexVertex1") && segments[i].hasOwnProperty("indexVertex2")) {
                            seg1 = segments[i].indexVertex1 + segmentStack;
                            seg2 = segments[i].indexVertex2 + segmentStack;
                        }
                        if (segments[i].indexVertex1 == 0 && i != 0) {
                            segmentStack = segmentStack + segments[i - 1].indexVertex2 + 1;
                        }

                        positions[i * 3 * 2 + 0] = vertices[seg1].x;
                        positions[i * 3 * 2 + 1] = vertices[seg1].y;
                        positions[i * 3 * 2 + 2] = vertices[seg1].z;

                        positions[i * 3 * 2 + 3] = vertices[seg2].x;
                        positions[i * 3 * 2 + 4] = vertices[seg2].y;
                        positions[i * 3 * 2 + 5] = vertices[seg2].z;
                    }

                    geometry.setAttribute('position', new BufferAttribute(positions, 3));
                }


                if (type == "TSurf" && faces.length > 0 && vertices.length > 0) {

                    positions = new Float32Array(faces.length * 3 * 3);
                    let normals = new Float32Array(faces.length * 3 * 3);

                    let alternate = false;

                    if (faces[0].a == 0) alternate = true; // face indexing starts at zero - GST is using this

                    for (var t = 0; t < faces.length; t++) {

                        if (faces[t].a && faces[t].b && faces[t].c) {
                            // -1 because array index starts at zero and GOCAD starts at 1
                            if (!alternate) {
                                positions[t * 9 + 0] = vertices[faces[t].a - 1].x;
                                positions[t * 9 + 1] = vertices[faces[t].a - 1].y;
                                positions[t * 9 + 2] = vertices[faces[t].a - 1].z;
                                positions[t * 9 + 3] = vertices[faces[t].b - 1].x;
                                positions[t * 9 + 4] = vertices[faces[t].b - 1].y;
                                positions[t * 9 + 5] = vertices[faces[t].b - 1].z;
                                positions[t * 9 + 6] = vertices[faces[t].c - 1].x;
                                positions[t * 9 + 7] = vertices[faces[t].c - 1].y;
                                positions[t * 9 + 8] = vertices[faces[t].c - 1].z;
                            } else {
                                positions[t * 9 + 0] = vertices[faces[t].a].x;
                                positions[t * 9 + 1] = vertices[faces[t].a].y;
                                positions[t * 9 + 2] = vertices[faces[t].a].z;
                                positions[t * 9 + 3] = vertices[faces[t].b].x;
                                positions[t * 9 + 4] = vertices[faces[t].b].y;
                                positions[t * 9 + 5] = vertices[faces[t].b].z;
                                positions[t * 9 + 6] = vertices[faces[t].c].x;
                                positions[t * 9 + 7] = vertices[faces[t].c].y;
                                positions[t * 9 + 8] = vertices[faces[t].c].z;
                            }
                        }
                        // GOCAD project start indexing at zero
                        if (faces[t].hasOwnProperty("indexVertex1") && faces[t].hasOwnProperty("indexVertex2") && faces[t].hasOwnProperty("indexVertex3")) {
                            positions[t * 9 + 0] = vertices[faces[t].indexVertex1].x;
                            positions[t * 9 + 1] = vertices[faces[t].indexVertex1].y;
                            positions[t * 9 + 2] = vertices[faces[t].indexVertex1].z;
                            positions[t * 9 + 3] = vertices[faces[t].indexVertex2].x;
                            positions[t * 9 + 4] = vertices[faces[t].indexVertex2].y;
                            positions[t * 9 + 5] = vertices[faces[t].indexVertex2].z;
                            positions[t * 9 + 6] = vertices[faces[t].indexVertex3].x;
                            positions[t * 9 + 7] = vertices[faces[t].indexVertex3].y;
                            positions[t * 9 + 8] = vertices[faces[t].indexVertex3].z;
                        }
                    }

                    geometry.setAttribute('position', new BufferAttribute(positions, 3));
                    geometry.setAttribute('normal', new BufferAttribute(normals, 3));

                    // smooth shading - standard
                    //geometry = BufferGeometryUtils.mergeVertices(geometry);
                    geometry.computeVertexNormals();

                    // flat shading, see https://github.com/mrdoob/three.js/issues/7130#issuecomment-770235574
                    /*let flatgeometry = geometry.toNonIndexed();
                    flatgeometry.computeVertexNormals();
                    geometry = createBarycentricCoordinates(geometry);*/
                }
                geometry.computeBoundingBox();
                geometry.computeBoundingSphere();
                object.material = material;
                object.geometry = geometry;
                object.userData = {
                    name: object.name
                };
                container.add(object);

                // reset before next object
                type = '';
                name = '';
                vertices = [];
                path = [];
                zones = [];
                faces = [];
                wref = {
                    x: 0,
                    y: 0,
                    z: 0
                };
                segments = [];
                marker = [];

                z_mirror = false;
                segCounter = 0;
                numVert = 0;

                geometry = null;
                material = null;
            }
        }
        return container;
    }
}

export {
    GOCADLoader
};
