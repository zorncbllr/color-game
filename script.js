const colors = {
  yellow: 0xffeb3b,
  green: 0x4caf50,
  red: 0xf44336,
  blue: 0x2196f3,
  pink: 0xe91e63,
  white: 0xffffff,
};

const colorNames = Object.keys(colors);

let scene,
  camera,
  renderer,
  cubes = [];
let isRolling = false;

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0a);

  const aspect = window.innerWidth / (window.innerHeight * 0.7);
  camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
  camera.position.z = 10;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight * 0.7);
  document.getElementById("canvas-container").appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  createCubes();
  animate();
}

function createRoundedBoxGeometry(size, radius, smoothness) {
  const shape = new THREE.Shape();
  const eps = 0.00001;
  const radius0 = radius - eps;

  shape.absarc(eps, eps, eps, -Math.PI / 2, -Math.PI, true);
  shape.absarc(eps, size - radius * 2, eps, Math.PI, Math.PI / 2, true);
  shape.absarc(size - radius * 2, size - radius * 2, eps, Math.PI / 2, 0, true);
  shape.absarc(size - radius * 2, eps, eps, 0, -Math.PI / 2, true);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: size - radius * 2,
    bevelEnabled: true,
    bevelSegments: smoothness,
    steps: 1,
    bevelSize: radius0,
    bevelThickness: radius,
    curveSegments: smoothness,
  });

  geometry.center();
  return geometry;
}

function createCubes() {
  const spacing = 3;
  for (let i = 0; i < 3; i++) {
    // Use RoundedBoxGeometry approach with proper material handling
    const radius = 0.2;
    const smoothness = 10;

    const geometry = new THREE.BoxGeometry(
      2,
      2,
      2,
      smoothness,
      smoothness,
      smoothness
    );

    // Manually round the corners
    const positionAttribute = geometry.getAttribute("position");
    const vertex = new THREE.Vector3();

    for (let j = 0; j < positionAttribute.count; j++) {
      vertex.fromBufferAttribute(positionAttribute, j);

      const x = vertex.x;
      const y = vertex.y;
      const z = vertex.z;

      // Calculate how far from center on each axis
      const fx = Math.abs(x) - (1 - radius);
      const fy = Math.abs(y) - (1 - radius);
      const fz = Math.abs(z) - (1 - radius);

      if (fx > 0 || fy > 0 || fz > 0) {
        const dx = Math.max(fx, 0);
        const dy = Math.max(fy, 0);
        const dz = Math.max(fz, 0);

        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance > 0) {
          const factor = radius / (distance + radius);

          if (fx > 0) vertex.x = Math.sign(x) * (1 - radius + dx * factor);
          if (fy > 0) vertex.y = Math.sign(y) * (1 - radius + dy * factor);
          if (fz > 0) vertex.z = Math.sign(z) * (1 - radius + dz * factor);
        }
      }

      positionAttribute.setXYZ(j, vertex.x, vertex.y, vertex.z);
    }

    geometry.computeVertexNormals();

    // Define materials in specific order: right, left, top, bottom, front, back
    const materials = [
      new THREE.MeshStandardMaterial({
        color: colors.red,
        roughness: 0.3,
        metalness: 0.2,
      }),
      new THREE.MeshStandardMaterial({
        color: colors.blue,
        roughness: 0.3,
        metalness: 0.2,
      }),
      new THREE.MeshStandardMaterial({
        color: colors.yellow,
        roughness: 0.3,
        metalness: 0.2,
      }),
      new THREE.MeshStandardMaterial({
        color: colors.white,
        roughness: 0.3,
        metalness: 0.2,
      }),
      new THREE.MeshStandardMaterial({
        color: colors.green,
        roughness: 0.3,
        metalness: 0.2,
      }),
      new THREE.MeshStandardMaterial({
        color: colors.pink,
        roughness: 0.3,
        metalness: 0.2,
      }),
    ];

    const cube = new THREE.Mesh(geometry, materials);
    cube.position.x = (i - 1) * spacing;
    cube.userData.spinning = false;
    cube.userData.targetRotation = { x: 0, y: 0, z: 0 };
    cube.userData.currentVelocity = { x: 0, y: 0, z: 0 };

    scene.add(cube);
    cubes.push(cube);
  }
}

function animate() {
  requestAnimationFrame(animate);

  cubes.forEach((cube) => {
    if (cube.userData.spinning) {
      cube.rotation.x += cube.userData.currentVelocity.x;
      cube.rotation.y += cube.userData.currentVelocity.y;
      cube.rotation.z += cube.userData.currentVelocity.z;
    }
  });

  renderer.render(scene, camera);
}

function rollCubes() {
  if (isRolling) return;

  isRolling = true;
  document.getElementById("roll-btn").disabled = true;
  document.getElementById("result").classList.remove("show");

  cubes.forEach((cube) => {
    cube.userData.spinning = true;
    cube.userData.currentVelocity = {
      x: (Math.random() - 0.5) * 0.3,
      y: (Math.random() - 0.5) * 0.3,
      z: (Math.random() - 0.5) * 0.3,
    };
  });

  setTimeout(() => {
    stopCubes();
  }, 1500);
}

function stopCubes() {
  const results = [];

  cubes.forEach((cube) => {
    cube.userData.spinning = false;

    // Pick a random face
    const faceIndex = Math.floor(Math.random() * 6);

    // Map face index to color based on material array order
    // materials order: right, left, top, bottom, front, back
    const faceToColor = ["red", "blue", "yellow", "white", "green", "pink"];
    const colorName = faceToColor[faceIndex];
    results.push(colorName);

    // Rotate cube to show the chosen face towards the camera
    const rotations = [
      { x: 0, y: -Math.PI / 2, z: 0 }, // red (right face) - rotate left to show it
      { x: 0, y: Math.PI / 2, z: 0 }, // blue (left face) - rotate right to show it
      { x: Math.PI / 2, y: 0, z: 0 }, // yellow (top face) - rotate down to show it
      { x: -Math.PI / 2, y: 0, z: 0 }, // white (bottom face) - rotate up to show it
      { x: 0, y: 0, z: 0 }, // green (front face) - already facing forward
      { x: 0, y: Math.PI, z: 0 }, // pink (back face) - rotate 180 to show it
    ];

    cube.rotation.set(
      rotations[faceIndex].x,
      rotations[faceIndex].y,
      rotations[faceIndex].z
    );
  });

  displayResults(results);
  isRolling = false;
  document.getElementById("roll-btn").disabled = false;
}

function displayResults(results) {
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "";

  results.forEach((colorName, idx) => {
    const colorResult = document.createElement("div");
    colorResult.className = "color-result";

    const colorBox = document.createElement("div");
    colorBox.className = "color-box";
    colorBox.style.background = `#${colors[colorName]
      .toString(16)
      .padStart(6, "0")}`;

    const colorNameEl = document.createElement("div");
    colorNameEl.className = "color-name";
    colorNameEl.textContent = colorName;

    colorResult.appendChild(colorBox);
    colorResult.appendChild(colorNameEl);
    resultDiv.appendChild(colorResult);
  });

  setTimeout(() => {
    resultDiv.classList.add("show");
  }, 100);
}

function resetCubes() {
  cubes.forEach((cube) => {
    cube.userData.spinning = false;
    cube.rotation.set(0, 0, 0);
  });
  document.getElementById("result").classList.remove("show");
  document.getElementById("result").innerHTML = "";
}

document.getElementById("roll-btn").addEventListener("click", rollCubes);
document.getElementById("reset-btn").addEventListener("click", resetCubes);

window.addEventListener("resize", () => {
  const aspect = window.innerWidth / (window.innerHeight * 0.7);
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight * 0.7);
});

init();
