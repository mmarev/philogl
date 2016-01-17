var webGLStart = function() {

  var $id = function(d) { return document.getElementById(d); };

  var pgl = PhiloGL;

  new pgl.IO.XHR({
    url: 'macbook.json',
    onError: function() {
      alert('Unable to load macbook model');
    },
    onSuccess: function(jsonString) {
      var json = JSON.parse(jsonString);
      json.shininess = 5;
      json.uniforms = {
        'enableSpecularHighlights': true,
        'materialAmbientColor': [1, 1, 1],
        'materialDiffuseColor': [1, 1, 1],
        'materialSpecularColor': [1.5, 1.5, 1.5],
        'materialEmissiveColor': [0, 0, 0]
      };
      createApp(json);
    }
  }).send();

  var canvas = document.getElementById('lesson16-canvas');

  var app = new pgl.Application(canvas),
      gl = app.gl;

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  var outerCamera = new pgl.PerspectiveCamera({
    aspect: canvas.width/canvas.height,
    position: new pgl.Vec3(0, 0, -3),
  });

  function createApp(macbookJSON) {

    Promise.all([

      pgl.Program.fromShaderURIs(app, 'render-tex.vs.glsl', 'render-tex.fs.glsl', {
        path: '../../../shaders/',
      }),

      pgl.loadTextures(gl, {
        src: ['moon.gif', 'crate.gif'],
        parameters: [{
          magFilter: gl.LINEAR,
          minFilter: gl.LINEAR_MIPMAP_NEAREST,
          generateMipmap: true
        },{
          magFilter: gl.LINEAR,
          minFilter: gl.LINEAR_MIPMAP_NEAREST,
          generateMipmap: true
        }]
      })

    ]).then(function(results) {

      var program = results[0];

      var tMoon = results[1][0];
      var tCrate = results[1][1];

      var screenWidth = 512,
          screenHeight = 512,
          screenRatio = 1.66;

      var models = {};

      models.moon = new pgl.O3D.Sphere({
        nlat: 30,
        nlong: 30,
        radius: 2,
        textures: tMoon,
        uniforms: {
          shininess: 5,
          'enableSpecularHighlights': false,
          'materialAmbientColor': [1, 1, 1],
          'materialDiffuseColor': [1, 1, 1],
          'materialSpecularColor': [0, 0, 0],
          'materialEmissiveColor': [0, 0, 0]
        }
      });

      models.box = new pgl.O3D.Cube({
        textures: tCrate,
        uniforms: {
          shininess: 5,
          'enableSpecularHighlights': false,
          'materialAmbientColor': [1, 1, 1],
          'materialDiffuseColor': [1, 1, 1],
          'materialSpecularColor': [0, 0, 0],
          'materialEmissiveColor': [0, 0, 0]
        }
      });
      models.box.scale.set(2, 2, 2);

      models.macbookscreen = new pgl.O3D.Model({
        normals: [
          0, -0.965926, 0.258819,
          0, -0.965926, 0.258819,
          0, -0.965926, 0.258819,
          0, -0.965926, 0.258819
        ],
        vertices: [
          0.580687, 0.659, 0.813106,
          -0.580687, 0.659, 0.813107,
          0.580687, 0.472, 0.113121,
          -0.580687, 0.472, 0.113121
        ],
        texCoords: [
          1.0, 1.0,
          0.0, 1.0,
          1.0, 0.0,
          0.0, 0.0
        ],
        drawType: 'TRIANGLE_STRIP',
        uniforms: {
          shininess: 0.2,
          'enableSpecularHighlights': false,
          'materialAmbientColor': [0, 0, 0],
          'materialDiffuseColor': [0, 0, 0],
          'materialSpecularColor': [0.5, 0.5, 0.5],
          'materialEmissiveColor': [1.5, 1.5, 1.5]
        }
      });

      program.use();

      models.macbook = new pgl.O3D.Model(macbookJSON);

      var outerScene = new pgl.Scene(app, program, outerCamera, {
        lights: {
          enable: true,
          points: {
            position: {
              x: 1, y: 2, z: -1
            },
            diffuse: {
              r: 0.8, g: 0.8, b: 0.8
            },
            specular: {
              r: 0.8, g: 0.8, b: 0.8
            }
          }
        }
      });

      var innerCamera = new pgl.PerspectiveCamera({
          fov: 45,
          aspect: screenRatio,
          near: 0.1,
          far: 100,
          position: new pgl.Vec3(0, 0, -17)
        }),
        innerScene = new pgl.Scene(app, program, innerCamera, {
          lights: {
            enable: true,
            points: {
              position: {
                x: -1, y: 2, z: -1
              },
              diffuse: {
                r: 0.8, g: 0.8, b: 0.8
              },
              specular: {
                r: 0.8, g: 0.8, b: 0.8
              }
            }
          }
        }),
        rho = 4,
        theta = 0,
        laptopTheta = Math.PI,
        //models
        macbook = models.macbook,
        macbookscreen = models.macbookscreen,
        box = models.box,
        moon = models.moon;

      //create framebuffer
      var fb = new pgl.Framebuffer(gl, {
        width: screenWidth,
        height: screenHeight,
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,
      });

      models.macbookscreen.textures = fb.texture;

      //Add objects to different scenes
      outerScene.add(macbook, macbookscreen);
      innerScene.add(moon, box);

      outerCamera.update();
      innerCamera.update();

      outerCamera.view.$translate(0, -0.5, 0);

      function drawInnerScene() {
        theta += 0.04;

        moon.position = {
          x: rho * Math.cos(theta),
          y: 0,
          z: rho * Math.sin(theta)
        };
        moon.update();

        box.position = {
          x: rho * Math.cos(Math.PI + theta),
          y: 0,
          z: rho * Math.sin(Math.PI + theta)
        };
        box.update();

        gl.viewport(0, 0, screenWidth, screenHeight);

        fb.bind();
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        innerScene.render();
        fb.unbind();
      }

      function drawOuterScene() {
        gl.viewport(0, 0, screenWidth, screenHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        laptopTheta += 0.005;

        var phi = Math.sin(laptopTheta) * 1.77 + Math.PI;

        macbook.rotation.set(-Math.PI/2, phi, 0);
        macbook.update();

        macbookscreen.rotation.set(-Math.PI/2, phi, 0);
        macbookscreen.update();

        outerScene.render();
      }

      function draw() {
        drawInnerScene();
        drawOuterScene();
        pgl.Fx.requestAnimationFrame(draw);
      }

      //Animate
      draw();
    });
  }
}
