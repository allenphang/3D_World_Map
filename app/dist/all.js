'use strict';

$(function () {
    var main = document.querySelector('.main');
    // console.log(main.offsetWidth)
    var worldMap = void 0;
    var mouse = { x: 0, y: 0 };

    function Map() {
        this.width = main.offsetWidth;
        this.height = main.offsetHeight;

        this.viewAngle = 45;
        this.near = 0.1;
        this.far = 10000;
        this.cameraX = 0;
        this.cameraY = 350;
        this.cameraZ = 500;
        this.cameraLX = 0;
        this.cameraLY = 0;
        this.cameraLZ = 0;

        this.geo;
        this.scene = {};
        this.renderer = {};
        this.camera = {};
        this.controls = {};

        this.intersected = null;
    }

    Map.prototype = {

        init_d3: function init_d3() {
            var geoConfig = function geoConfig() {
                this.projection = d3.geoMercator().scale(120).translate([450, 0]);
                this.path = d3.geoPath().projection(this.projection);
            };

            this.geo = new geoConfig();
        },

        init_three: function init_three() {
            //*========================== support if
            if (Detector.webgl) {
                this.renderer = new THREE.WebGLRenderer({
                    antialias: true
                });
                this.renderer.setClearColor(0x888888);
            } else {
                this.renderer = new THREE.CanvasRenderer();
            }

            //support if ==========================*

            main.appendChild(this.renderer.domElement);
            this.renderer.setSize(this.width, this.height);

            this.scene = new THREE.Scene();

            this.camera = new THREE.PerspectiveCamera(this.viewAngle, this.width / this.height, this.near, this.far);
            this.camera.position.x = this.cameraX;
            this.camera.position.y = this.cameraY;
            this.camera.position.z = this.cameraZ;
            this.camera.lookAt({ x: this.cameraLX, y: 0, z: this.cameraLZ });

            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        },

        addCountry: function addCountry(data) {
            var countries = [];

            for (var i in data.features) {
                var geoFeature = data.features[i];
                var properties = geoFeature.properties;
                var feature = this.geo.path(geoFeature);

                var mesh = transformSVGPathExposed(feature);
                for (var j in mesh) {
                    countries.push({ 'data': properties, 'mesh': mesh[j] });
                }
            }

            for (var _i in countries) {
                var shape3d = new THREE.ExtrudeGeometry(countries[_i].mesh, {
                    amount: 1,
                    bevelEnabled: false
                });

                var material = new THREE.MeshPhongMaterial({
                    color: this.getColor(countries[_i].data),
                    opacity: 0.5,
                    transparent: true
                });

                var toAdd = new THREE.Mesh(shape3d, material);
                toAdd.name = countries[_i].data.name;

                toAdd.rotation.x = Math.PI / 2;
                toAdd.translateX(-490);
                toAdd.translateY(50);
                toAdd.translateX(20);

                this.scene.add(toAdd);
            }
        },

        getColor: function getColor(data) {
            switch (data.name) {
                case 'United Kingdom':
                    return 0x46a3ff;
                case 'Canada':
                    return 0xff3b3b;
                case 'Thailand':
                    return 0x0dff0d;
                default:
                    return 0xd8d8d8;
            }

            // let multiplier = 0;
            //
            // for (let i = 0; i < 3; i++) {
            //     multiplier += data.iso_a3.charCodeAt(i);
            // }
            //
            // multiplier = (1.0 / 366) * multiplier;
            // return multiplier * 0xffffff
        },

        addLight: function addLight(x, y, z, intensity, color) {
            var pointLight = new THREE.PointLight(color);
            pointLight.position.x = x;
            pointLight.position.y = y;
            pointLight.position.z = z;
            pointLight.intensity = intensity;
            this.scene.add(pointLight);
        },

        addPlane: function addPlane(x, y, z, color) {
            var planeGeo = new THREE.CubeGeometry(x, y, z);
            var planeMat = new THREE.MeshLambertMaterial({ color: color });
            var plane = new THREE.Mesh(planeGeo, planeMat);

            // plane.rotation.y = -Math.PI / 2;
            this.scene.add(plane);
        },

        // setCameraPosition: function(x, y, z, lx, lz) {
        //     this.cameraX = x;
        //     this.cameraY = y;
        //     this.cameraZ = z;
        //     this.cameraLX = lx;
        //     this.cameraLZ = lz;
        // },

        // moveCamera: function() {
        //     let speed = 0.2;
        //     let targetX = (this.cameraX = this.camera.position.x) * speed;
        //     let targetY = (this.cameraY = this.camera.position.y) * speed;
        //     let targetZ = (this.cameraZ = this.camera.position.z) * speed;
        //
        //     this.camera.position.x += targetX;
        //     this.camera.position.y += targetY;
        //     this.camera.position.z += targetZ;
        //     this.camera.lookAt({ x: this.cameraLX, y: 0, z: this.cameraLZ });
        // },

        animate: function animate() {
            // if (this.cameraX !== this.camera.position.x ||
            //     this.cameraY !== this.camera.position.y ||
            //     this.cameraZ !== this.camera.position.z) {
            //     this.moveCamera();
            // }
            var vector = new THREE.Vector3(mouse.x, mouse.y, 1);
            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(vector, this.camera);
            var intersects = raycaster.intersectObjects(this.scene.children);

            var objects = this.scene.children;
            if (intersects.length >= 1) {
                if (this.intersected != intersects[0].object) {
                    if (this.intersected) {
                        for (var i = 0; i < objects.length; i++) {
                            if (objects[i].name === this.intersected.name) {
                                objects[i].material.opacity = 0.5;
                                objects[i].scale.z = 1;
                            }
                        }
                        this.intersected = null;
                    }
                }
                this.intersected = intersects[0].object;
                for (var _i2 = 0; _i2 < objects.length; _i2++) {
                    if (objects[_i2].name == this.intersected.name) {
                        objects[_i2].material.opacity = 1.0;
                        objects[_i2].scale.z = 5;
                    }
                }
            } else if (this.intersected) {
                for (var _i3 = 0; _i3 < objects.length; _i3++) {
                    if (objects[_i3].name == this.intersected.name) {
                        objects[_i3].material.opacity = 0.5;
                        objects[_i3].scale.z = 1;
                    }
                }
                this.intersected = null;
            }
            this.render();
        },

        render: function render() {
            // this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.renderer.render(this.scene, this.camera);
        }

    };

    function init() {
        $.when($.getJSON('data/countries.json')).then(function (data) {
            console.log(data);
            worldMap = new Map();
            worldMap.init_d3();
            worldMap.init_three();
            // worldMap.addPlane(1400, 700, 30, 0xEEEEEE);
            worldMap.addCountry(data);
            worldMap.addLight(0, 3000, 0, 1.0, 0xFFFFFF);

            var onFrame = window.requestAnimationFrame;

            function tick(timestamp) {
                worldMap.animate();

                if (worldMap.intersected) {
                    $('#country-name').html(worldMap.intersected.name);
                } else {
                    $('#country-name').html("move mouse over map");
                }

                onFrame(tick);
            }

            onFrame(tick);
            main.addEventListener('mousemove', mouseMove, false);
            window.addEventListener('resize', function () {
                worldMap.camera.aspect = main.offsetWidth / main.offsetHeight;
                worldMap.camera.updateProjectionMatrix();
                worldMap.renderer.setSize(main.offsetWidth, main.offsetHeight);
            });
        });
    }

    function mouseMove(e) {
        e.preventDefault();
        mouse.x = (e.clientX - main.offsetLeft) / main.offsetWidth * 2 - 1;
        mouse.y = -((e.clientY - main.offsetTop) / main.offsetHeight) * 2 + 1;
    }

    window.onunload = init();
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFsbC5qcyJdLCJuYW1lcyI6WyIkIiwibWFpbiIsImRvY3VtZW50IiwicXVlcnlTZWxlY3RvciIsIndvcmxkTWFwIiwibW91c2UiLCJ4IiwieSIsIk1hcCIsIndpZHRoIiwib2Zmc2V0V2lkdGgiLCJoZWlnaHQiLCJvZmZzZXRIZWlnaHQiLCJ2aWV3QW5nbGUiLCJuZWFyIiwiZmFyIiwiY2FtZXJhWCIsImNhbWVyYVkiLCJjYW1lcmFaIiwiY2FtZXJhTFgiLCJjYW1lcmFMWSIsImNhbWVyYUxaIiwiZ2VvIiwic2NlbmUiLCJyZW5kZXJlciIsImNhbWVyYSIsImNvbnRyb2xzIiwiaW50ZXJzZWN0ZWQiLCJwcm90b3R5cGUiLCJpbml0X2QzIiwiZ2VvQ29uZmlnIiwicHJvamVjdGlvbiIsImQzIiwiZ2VvTWVyY2F0b3IiLCJzY2FsZSIsInRyYW5zbGF0ZSIsInBhdGgiLCJnZW9QYXRoIiwiaW5pdF90aHJlZSIsIkRldGVjdG9yIiwid2ViZ2wiLCJUSFJFRSIsIldlYkdMUmVuZGVyZXIiLCJhbnRpYWxpYXMiLCJzZXRDbGVhckNvbG9yIiwiQ2FudmFzUmVuZGVyZXIiLCJhcHBlbmRDaGlsZCIsImRvbUVsZW1lbnQiLCJzZXRTaXplIiwiU2NlbmUiLCJQZXJzcGVjdGl2ZUNhbWVyYSIsInBvc2l0aW9uIiwieiIsImxvb2tBdCIsIk9yYml0Q29udHJvbHMiLCJhZGRDb3VudHJ5IiwiZGF0YSIsImNvdW50cmllcyIsImkiLCJmZWF0dXJlcyIsImdlb0ZlYXR1cmUiLCJwcm9wZXJ0aWVzIiwiZmVhdHVyZSIsIm1lc2giLCJ0cmFuc2Zvcm1TVkdQYXRoRXhwb3NlZCIsImoiLCJwdXNoIiwic2hhcGUzZCIsIkV4dHJ1ZGVHZW9tZXRyeSIsImFtb3VudCIsImJldmVsRW5hYmxlZCIsIm1hdGVyaWFsIiwiTWVzaFBob25nTWF0ZXJpYWwiLCJjb2xvciIsImdldENvbG9yIiwib3BhY2l0eSIsInRyYW5zcGFyZW50IiwidG9BZGQiLCJNZXNoIiwibmFtZSIsInJvdGF0aW9uIiwiTWF0aCIsIlBJIiwidHJhbnNsYXRlWCIsInRyYW5zbGF0ZVkiLCJhZGQiLCJhZGRMaWdodCIsImludGVuc2l0eSIsInBvaW50TGlnaHQiLCJQb2ludExpZ2h0IiwiYWRkUGxhbmUiLCJwbGFuZUdlbyIsIkN1YmVHZW9tZXRyeSIsInBsYW5lTWF0IiwiTWVzaExhbWJlcnRNYXRlcmlhbCIsInBsYW5lIiwiYW5pbWF0ZSIsInZlY3RvciIsIlZlY3RvcjMiLCJyYXljYXN0ZXIiLCJSYXljYXN0ZXIiLCJzZXRGcm9tQ2FtZXJhIiwiaW50ZXJzZWN0cyIsImludGVyc2VjdE9iamVjdHMiLCJjaGlsZHJlbiIsIm9iamVjdHMiLCJsZW5ndGgiLCJvYmplY3QiLCJyZW5kZXIiLCJpbml0Iiwid2hlbiIsImdldEpTT04iLCJ0aGVuIiwiY29uc29sZSIsImxvZyIsIm9uRnJhbWUiLCJ3aW5kb3ciLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJ0aWNrIiwidGltZXN0YW1wIiwiaHRtbCIsImFkZEV2ZW50TGlzdGVuZXIiLCJtb3VzZU1vdmUiLCJhc3BlY3QiLCJ1cGRhdGVQcm9qZWN0aW9uTWF0cml4IiwiZSIsInByZXZlbnREZWZhdWx0IiwiY2xpZW50WCIsIm9mZnNldExlZnQiLCJjbGllbnRZIiwib2Zmc2V0VG9wIiwib251bmxvYWQiXSwibWFwcGluZ3MiOiI7O0FBQUFBLEVBQUUsWUFBVztBQUNULFFBQU1DLE9BQU9DLFNBQVNDLGFBQVQsQ0FBdUIsT0FBdkIsQ0FBYjtBQUNBO0FBQ0EsUUFBSUMsaUJBQUo7QUFDQSxRQUFJQyxRQUFRLEVBQUNDLEdBQUcsQ0FBSixFQUFPQyxHQUFHLENBQVYsRUFBWjs7QUFFQSxhQUFTQyxHQUFULEdBQWU7QUFDWCxhQUFLQyxLQUFMLEdBQWFSLEtBQUtTLFdBQWxCO0FBQ0EsYUFBS0MsTUFBTCxHQUFjVixLQUFLVyxZQUFuQjs7QUFFQSxhQUFLQyxTQUFMLEdBQWlCLEVBQWpCO0FBQ0EsYUFBS0MsSUFBTCxHQUFZLEdBQVo7QUFDQSxhQUFLQyxHQUFMLEdBQVcsS0FB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VyxDQUFDdUgsRUFBRUUsT0FBRixHQUFZOUgsS0FBSytILFVBQWxCLElBQWlDL0gsS0FBS1MsV0FBdkMsR0FBc0QsQ0FBdEQsR0FBMEQsQ0FBcEU7QUFDQUwsY0FBTUUsQ0FBTixHQUFVLEVBQUcsQ0FBQ3NILEVBQUVJLE9BQUYsR0FBWWhJLEtBQUtpSSxTQUFsQixJQUFnQ2pJLEtBQUtXLFlBQXhDLElBQXdELENBQXhELEdBQTRELENBQXRFO0FBQ0Y7O0FBR0R3RyxXQUFPZSxRQUFQLEdBQWtCdEIsTUFBbEI7QUFDSCxDQXRRRCIsImZpbGUiOiJhbGwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIkKGZ1bmN0aW9uKCkge1xyXG4gICAgY29uc3QgbWFpbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5tYWluJyk7XHJcbiAgICAvLyBjb25zb2xlLmxvZyhtYWluLm9mZnNldFdpZHRoKVxyXG4gICAgbGV0IHdvcmxkTWFwO1xyXG4gICAgbGV0IG1vdXNlID0ge3g6IDAsIHk6IDB9O1xyXG5cclxuICAgIGZ1bmN0aW9uIE1hcCgpIHtcclxuICAgICAgICB0aGlzLndpZHRoID0gbWFpbi5vZmZzZXRXaWR0aDtcclxuICAgICAgICB0aGlzLmhlaWdodCA9IG1haW4ub2Zmc2V0SGVpZ2h0O1xyXG5cclxuICAgICAgICB0aGlzLnZpZXdBbmdsZSA9IDQ1O1xyXG4gICAgICAgIHRoaXMubmVhciA9IDAuMTtcclxuICAgICAgICB0aGlzLmZhciA9IDEwMDAwO1xyXG4gICAgICAgIHRoaXMuY2FtZXJhWCA9IDA7XHJcbiAgICAgICAgdGhpcy5jYW1lcmFZID0gMzUwO1xyXG4gICAgICAgIHRoaXMuY2FtZXJhWiA9IDUwMDtcclxuICAgICAgICB0aGlzLmNhbWVyYUxYID0gMDtcclxuICAgICAgICB0aGlzLmNhbWVyYUxZID0gMDtcclxuICAgICAgICB0aGlzLmNhbWVyYUxaID0gMDtcclxuXHJcbiAgICAgICAgdGhpcy5nZW87XHJcbiAgICAgICAgdGhpcy5zY2VuZSA9IHt9O1xyXG4gICAgICAgIHRoaXMucmVuZGVyZXIgPSB7fTtcclxuICAgICAgICB0aGlzLmNhbWVyYSA9IHt9O1xyXG4gICAgICAgIHRoaXMuY29udHJvbHMgPSB7fTtcclxuXHJcbiAgICAgICAgdGhpcy5pbnRlcnNlY3RlZCA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgTWFwLnByb3RvdHlwZSA9IHtcclxuXHJcbiAgICAgICAgaW5pdF9kMzogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGxldCBnZW9Db25maWcgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHJvamVjdGlvbiA9IGQzLmdlb01lcmNhdG9yKCkuc2NhbGUoMTIwKS50cmFuc2xhdGUoWzQ1MCwgMF0pO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wYXRoID0gZDMuZ2VvUGF0aCgpLnByb2plY3Rpb24odGhpcy5wcm9qZWN0aW9uKTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuZ2VvID0gbmV3IGdlb0NvbmZpZygpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGluaXRfdGhyZWU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAvLyo9PT09PT09PT09PT09PT09PT09PT09PT09PSBzdXBwb3J0IGlmXHJcbiAgICAgICAgICAgIGlmIChEZXRlY3Rvci53ZWJnbCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJlciA9IG5ldyBUSFJFRS5XZWJHTFJlbmRlcmVyKHtcclxuICAgICAgICAgICAgICAgICAgICBhbnRpYWxpYXM6IHRydWVcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRDbGVhckNvbG9yKDB4ODg4ODg4KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyZXIgPSBuZXcgVEhSRUUuQ2FudmFzUmVuZGVyZXIoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy9zdXBwb3J0IGlmID09PT09PT09PT09PT09PT09PT09PT09PT09KlxyXG5cclxuICAgICAgICAgICAgbWFpbi5hcHBlbmRDaGlsZCh0aGlzLnJlbmRlcmVyLmRvbUVsZW1lbnQpO1xyXG4gICAgICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFNpemUodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zY2VuZSA9IG5ldyBUSFJFRS5TY2VuZSgpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jYW1lcmEgPSBuZXcgVEhSRUUuUGVyc3BlY3RpdmVDYW1lcmEodGhpcy52aWV3QW5nbGUsIHRoaXMud2lkdGggLyB0aGlzLmhlaWdodCwgdGhpcy5uZWFyLCB0aGlzLmZhcik7XHJcbiAgICAgICAgICAgIHRoaXMuY2FtZXJhLnBvc2l0aW9uLnggPSB0aGlzLmNhbWVyYVg7XHJcbiAgICAgICAgICAgIHRoaXMuY2FtZXJhLnBvc2l0aW9uLnkgPSB0aGlzLmNhbWVyYVk7XHJcbiAgICAgICAgICAgIHRoaXMuY2FtZXJhLnBvc2l0aW9uLnogPSB0aGlzLmNhbWVyYVo7XHJcbiAgICAgICAgICAgIHRoaXMuY2FtZXJhLmxvb2tBdCh7IHg6IHRoaXMuY2FtZXJhTFgsIHk6IDAsIHo6IHRoaXMuY2FtZXJhTFogfSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xzID0gbmV3IFRIUkVFLk9yYml0Q29udHJvbHModGhpcy5jYW1lcmEsIHRoaXMucmVuZGVyZXIuZG9tRWxlbWVudCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGFkZENvdW50cnk6IGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgICAgICAgbGV0IGNvdW50cmllcyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgaSBpbiBkYXRhLmZlYXR1cmVzKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgZ2VvRmVhdHVyZSA9IGRhdGEuZmVhdHVyZXNbaV07XHJcbiAgICAgICAgICAgICAgICBsZXQgcHJvcGVydGllcyA9IGdlb0ZlYXR1cmUucHJvcGVydGllcztcclxuICAgICAgICAgICAgICAgIGxldCBmZWF0dXJlID0gdGhpcy5nZW8ucGF0aChnZW9GZWF0dXJlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbWVzaCA9IHRyYW5zZm9ybVNWR1BhdGhFeHBvc2VkKGZlYXR1cmUpO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaiBpbiBtZXNoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY291bnRyaWVzLnB1c2goeyAnZGF0YSc6IHByb3BlcnRpZXMsICdtZXNoJzogbWVzaFtqXSB9KVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCBpIGluIGNvdW50cmllcykge1xyXG4gICAgICAgICAgICAgICAgbGV0IHNoYXBlM2QgPSBuZXcgVEhSRUUuRXh0cnVkZUdlb21ldHJ5KGNvdW50cmllc1tpXS5tZXNoLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgYW1vdW50OiAxLFxyXG4gICAgICAgICAgICAgICAgICAgIGJldmVsRW5hYmxlZDogZmFsc2VcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBtYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoUGhvbmdNYXRlcmlhbCh7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6IHRoaXMuZ2V0Q29sb3IoY291bnRyaWVzW2ldLmRhdGEpLFxyXG4gICAgICAgICAgICAgICAgICAgIG9wYWNpdHk6IDAuNSxcclxuICAgICAgICAgICAgICAgICAgICB0cmFuc3BhcmVudDogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHRvQWRkID0gbmV3IFRIUkVFLk1lc2goc2hhcGUzZCwgbWF0ZXJpYWwpO1xyXG4gICAgICAgICAgICAgICAgdG9BZGQubmFtZSA9IGNvdW50cmllc1tpXS5kYXRhLm5hbWU7XHJcblxyXG4gICAgICAgICAgICAgICAgdG9BZGQucm90YXRpb24ueCA9IE1hdGguUEkgLyAyO1xyXG4gICAgICAgICAgICAgICAgdG9BZGQudHJhbnNsYXRlWCgtNDkwKTtcclxuICAgICAgICAgICAgICAgIHRvQWRkLnRyYW5zbGF0ZVkoNTApO1xyXG4gICAgICAgICAgICAgICAgdG9BZGQudHJhbnNsYXRlWCgyMCk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5zY2VuZS5hZGQodG9BZGQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZ2V0Q29sb3I6IGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgICAgICAgc3dpdGNoIChkYXRhLm5hbWUpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ1VuaXRlZCBLaW5nZG9tJzpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMHg0NmEzZmY7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdDYW5hZGEnOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAweGZmM2IzYjtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ1RoYWlsYW5kJzpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMHgwZGZmMGQ7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAweGQ4ZDhkODtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gbGV0IG11bHRpcGxpZXIgPSAwO1xyXG4gICAgICAgICAgICAvL1xyXG4gICAgICAgICAgICAvLyBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykge1xyXG4gICAgICAgICAgICAvLyAgICAgbXVsdGlwbGllciArPSBkYXRhLmlzb19hMy5jaGFyQ29kZUF0KGkpO1xyXG4gICAgICAgICAgICAvLyB9XHJcbiAgICAgICAgICAgIC8vXHJcbiAgICAgICAgICAgIC8vIG11bHRpcGxpZXIgPSAoMS4wIC8gMzY2KSAqIG11bHRpcGxpZXI7XHJcbiAgICAgICAgICAgIC8vIHJldHVybiBtdWx0aXBsaWVyICogMHhmZmZmZmZcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBhZGRMaWdodDogZnVuY3Rpb24oeCwgeSwgeiwgaW50ZW5zaXR5LCBjb2xvcikge1xyXG4gICAgICAgICAgICBsZXQgcG9pbnRMaWdodCA9IG5ldyBUSFJFRS5Qb2ludExpZ2h0KGNvbG9yKTtcclxuICAgICAgICAgICAgcG9pbnRMaWdodC5wb3NpdGlvbi54ID0geDtcclxuICAgICAgICAgICAgcG9pbnRMaWdodC5wb3NpdGlvbi55ID0geTtcclxuICAgICAgICAgICAgcG9pbnRMaWdodC5wb3NpdGlvbi56ID0gejtcclxuICAgICAgICAgICAgcG9pbnRMaWdodC5pbnRlbnNpdHkgPSBpbnRlbnNpdHk7XHJcbiAgICAgICAgICAgIHRoaXMuc2NlbmUuYWRkKHBvaW50TGlnaHQpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGFkZFBsYW5lOiBmdW5jdGlvbih4LCB5LCB6LCBjb2xvcikge1xyXG4gICAgICAgICAgICBsZXQgcGxhbmVHZW8gPSBuZXcgVEhSRUUuQ3ViZUdlb21ldHJ5KHgsIHksIHopO1xyXG4gICAgICAgICAgICBsZXQgcGxhbmVNYXQgPSBuZXcgVEhSRUUuTWVzaExhbWJlcnRNYXRlcmlhbCh7IGNvbG9yOiBjb2xvciB9KTtcclxuICAgICAgICAgICAgbGV0IHBsYW5lID0gbmV3IFRIUkVFLk1lc2gocGxhbmVHZW8sIHBsYW5lTWF0KTtcclxuXHJcbiAgICAgICAgICAgIC8vIHBsYW5lLnJvdGF0aW9uLnkgPSAtTWF0aC5QSSAvIDI7XHJcbiAgICAgICAgICAgIHRoaXMuc2NlbmUuYWRkKHBsYW5lKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLyBzZXRDYW1lcmFQb3NpdGlvbjogZnVuY3Rpb24oeCwgeSwgeiwgbHgsIGx6KSB7XHJcbiAgICAgICAgLy8gICAgIHRoaXMuY2FtZXJhWCA9IHg7XHJcbiAgICAgICAgLy8gICAgIHRoaXMuY2FtZXJhWSA9IHk7XHJcbiAgICAgICAgLy8gICAgIHRoaXMuY2FtZXJhWiA9IHo7XHJcbiAgICAgICAgLy8gICAgIHRoaXMuY2FtZXJhTFggPSBseDtcclxuICAgICAgICAvLyAgICAgdGhpcy5jYW1lcmFMWiA9IGx6O1xyXG4gICAgICAgIC8vIH0sXHJcblxyXG4gICAgICAgIC8vIG1vdmVDYW1lcmE6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIC8vICAgICBsZXQgc3BlZWQgPSAwLjI7XHJcbiAgICAgICAgLy8gICAgIGxldCB0YXJnZXRYID0gKHRoaXMuY2FtZXJhWCA9IHRoaXMuY2FtZXJhLnBvc2l0aW9uLngpICogc3BlZWQ7XHJcbiAgICAgICAgLy8gICAgIGxldCB0YXJnZXRZID0gKHRoaXMuY2FtZXJhWSA9IHRoaXMuY2FtZXJhLnBvc2l0aW9uLnkpICogc3BlZWQ7XHJcbiAgICAgICAgLy8gICAgIGxldCB0YXJnZXRaID0gKHRoaXMuY2FtZXJhWiA9IHRoaXMuY2FtZXJhLnBvc2l0aW9uLnopICogc3BlZWQ7XHJcbiAgICAgICAgLy9cclxuICAgICAgICAvLyAgICAgdGhpcy5jYW1lcmEucG9zaXRpb24ueCArPSB0YXJnZXRYO1xyXG4gICAgICAgIC8vICAgICB0aGlzLmNhbWVyYS5wb3NpdGlvbi55ICs9IHRhcmdldFk7XHJcbiAgICAgICAgLy8gICAgIHRoaXMuY2FtZXJhLnBvc2l0aW9uLnogKz0gdGFyZ2V0WjtcclxuICAgICAgICAvLyAgICAgdGhpcy5jYW1lcmEubG9va0F0KHsgeDogdGhpcy5jYW1lcmFMWCwgeTogMCwgejogdGhpcy5jYW1lcmFMWiB9KTtcclxuICAgICAgICAvLyB9LFxyXG5cclxuICAgICAgICBhbmltYXRlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgLy8gaWYgKHRoaXMuY2FtZXJhWCAhPT0gdGhpcy5jYW1lcmEucG9zaXRpb24ueCB8fFxyXG4gICAgICAgICAgICAvLyAgICAgdGhpcy5jYW1lcmFZICE9PSB0aGlzLmNhbWVyYS5wb3NpdGlvbi55IHx8XHJcbiAgICAgICAgICAgIC8vICAgICB0aGlzLmNhbWVyYVogIT09IHRoaXMuY2FtZXJhLnBvc2l0aW9uLnopIHtcclxuICAgICAgICAgICAgLy8gICAgIHRoaXMubW92ZUNhbWVyYSgpO1xyXG4gICAgICAgICAgICAvLyB9XHJcbiAgICAgICAgICAgIGxldCB2ZWN0b3IgPSBuZXcgVEhSRUUuVmVjdG9yMyhtb3VzZS54LCBtb3VzZS55LCAxKTtcclxuICAgICAgICAgICAgbGV0IHJheWNhc3RlciA9IG5ldyBUSFJFRS5SYXljYXN0ZXIoKTtcclxuICAgICAgICAgICAgcmF5Y2FzdGVyLnNldEZyb21DYW1lcmEodmVjdG9yLCB0aGlzLmNhbWVyYSk7XHJcbiAgICAgICAgICAgIGxldCBpbnRlcnNlY3RzID1yYXljYXN0ZXIuaW50ZXJzZWN0T2JqZWN0cyh0aGlzLnNjZW5lLmNoaWxkcmVuKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBvYmplY3RzID0gdGhpcy5zY2VuZS5jaGlsZHJlbjtcclxuICAgICAgICAgICAgaWYgKGludGVyc2VjdHMubGVuZ3RoID49IDEpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmludGVyc2VjdGVkICE9IGludGVyc2VjdHNbMF0ub2JqZWN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuaW50ZXJzZWN0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvYmplY3RzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob2JqZWN0c1tpXS5uYW1lID09PSB0aGlzLmludGVyc2VjdGVkLm5hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmplY3RzW2ldLm1hdGVyaWFsLm9wYWNpdHkgPSAwLjU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0c1tpXS5zY2FsZS56ID0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVyc2VjdGVkID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmludGVyc2VjdGVkID0gaW50ZXJzZWN0c1swXS5vYmplY3Q7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9iamVjdHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAob2JqZWN0c1tpXS5uYW1lID09IHRoaXMuaW50ZXJzZWN0ZWQubmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmplY3RzW2ldLm1hdGVyaWFsLm9wYWNpdHkgPSAxLjA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdHNbaV0uc2NhbGUueiA9IDU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmludGVyc2VjdGVkKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9iamVjdHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAob2JqZWN0c1tpXS5uYW1lID09IHRoaXMuaW50ZXJzZWN0ZWQubmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmplY3RzW2ldLm1hdGVyaWFsLm9wYWNpdHkgPSAwLjU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdHNbaV0uc2NhbGUueiA9IDE7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5pbnRlcnNlY3RlZCA9IG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5yZW5kZXIoKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAvLyB0aGlzLmNvbnRyb2xzID0gbmV3IFRIUkVFLk9yYml0Q29udHJvbHModGhpcy5jYW1lcmEsIHRoaXMucmVuZGVyZXIuZG9tRWxlbWVudCk7XHJcbiAgICAgICAgICAgIHRoaXMucmVuZGVyZXIucmVuZGVyKHRoaXMuc2NlbmUsIHRoaXMuY2FtZXJhKTtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgIH07XHJcblxyXG4gICAgZnVuY3Rpb24gaW5pdCgpIHtcclxuICAgICAgICAkLndoZW4oJC5nZXRKU09OKCdkYXRhL2NvdW50cmllcy5qc29uJykpLnRoZW4oKGRhdGEpID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XHJcbiAgICAgICAgICAgIHdvcmxkTWFwID0gbmV3IE1hcCgpO1xyXG4gICAgICAgICAgICB3b3JsZE1hcC5pbml0X2QzKCk7XHJcbiAgICAgICAgICAgIHdvcmxkTWFwLmluaXRfdGhyZWUoKTtcclxuICAgICAgICAgICAgLy8gd29ybGRNYXAuYWRkUGxhbmUoMTQwMCwgNzAwLCAzMCwgMHhFRUVFRUUpO1xyXG4gICAgICAgICAgICB3b3JsZE1hcC5hZGRDb3VudHJ5KGRhdGEpO1xyXG4gICAgICAgICAgICB3b3JsZE1hcC5hZGRMaWdodCgwLCAzMDAwLCAwLCAxLjAsIDB4RkZGRkZGKTtcclxuXHJcblxyXG4gICAgICAgICAgICBsZXQgb25GcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XHJcblxyXG4gICAgICAgICAgICBmdW5jdGlvbiB0aWNrKHRpbWVzdGFtcCkge1xyXG4gICAgICAgICAgICAgICAgd29ybGRNYXAuYW5pbWF0ZSgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh3b3JsZE1hcC5pbnRlcnNlY3RlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICQoJyNjb3VudHJ5LW5hbWUnKS5odG1sKHdvcmxkTWFwLmludGVyc2VjdGVkLm5hbWUpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAkKCcjY291bnRyeS1uYW1lJykuaHRtbChcIm1vdmUgbW91c2Ugb3ZlciBtYXBcIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgb25GcmFtZSh0aWNrKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgb25GcmFtZSh0aWNrKTtcclxuICAgICAgICAgICAgbWFpbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBtb3VzZU1vdmUsIGZhbHNlKTtcclxuICAgICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHdvcmxkTWFwLmNhbWVyYS5hc3BlY3QgPSBtYWluLm9mZnNldFdpZHRoIC8gbWFpbi5vZmZzZXRIZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICB3b3JsZE1hcC5jYW1lcmEudXBkYXRlUHJvamVjdGlvbk1hdHJpeCgpO1xyXG4gICAgICAgICAgICAgICAgd29ybGRNYXAucmVuZGVyZXIuc2V0U2l6ZShtYWluLm9mZnNldFdpZHRoLCBtYWluLm9mZnNldEhlaWdodClcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbW91c2VNb3ZlKGUpIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICBtb3VzZS54ID0gKChlLmNsaWVudFggLSBtYWluLm9mZnNldExlZnQgKSAvIG1haW4ub2Zmc2V0V2lkdGgpICogMiAtIDE7XHJcbiAgICAgICBtb3VzZS55ID0gLSAoKGUuY2xpZW50WSAtIG1haW4ub2Zmc2V0VG9wICkgLyBtYWluLm9mZnNldEhlaWdodCkgKiAyICsgMTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgd2luZG93Lm9udW5sb2FkID0gaW5pdCgpO1xyXG59KTsiXX0=
