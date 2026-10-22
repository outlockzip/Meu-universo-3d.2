import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const statusEl = document.querySelector("#status");
const sectorEl = document.querySelector("#sector");
const distanceEl = document.querySelector("#distance");
const nearbyEl = document.querySelector("#nearby");
const loadingEl = document.querySelector("#loading");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x02040b);
scene.fog = new THREE.FogExp2(0x02040b, 0.00012);

const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.1, 5000);
camera.position.set(0, 7, 22);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enabled = false;

scene.add(new THREE.HemisphereLight(0x9ebcff, 0x17152e, 1.5));
const sunLight = new THREE.PointLight(0xffd9a0, 2400, 800, 1.5);
scene.add(sunLight);

function makeGlowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0, "rgba(255,255,230,1)");
  g.addColorStop(.12, "rgba(255,198,100,.85)");
  g.addColorStop(.38, "rgba(255,111,40,.22)");
  g.addColorStop(1, "rgba(255,80,20,0)");
  ctx.fillStyle = g; ctx.fillRect(0,0,128,128);
  return new THREE.CanvasTexture(c);
}

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(9, 40, 40),
  new THREE.MeshBasicMaterial({ color: 0xffc35c })
);
scene.add(sun);
const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: makeGlowTexture(), color: 0xff9a42, transparent: true,
  blending: THREE.AdditiveBlending, depthWrite: false
}));
sunGlow.scale.set(48,48,1);
scene.add(sunGlow);

const starCount = 6500;
const starPositions = new Float32Array(starCount * 3);
for (let i=0;i<starCount;i++) {
  const r = 120 + Math.random()*2200;
  const a = Math.random()*Math.PI*2;
  const z = Math.random()*2-1;
  const h = Math.sqrt(1-z*z);
  starPositions[i*3] = r*h*Math.cos(a);
  starPositions[i*3+1] = r*z;
  starPositions[i*3+2] = r*h*Math.sin(a);
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions,3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
  color: 0xd9e7ff, size: 1.7, sizeAttenuation: true, transparent: true, opacity: .9
}));
scene.add(stars);

// Faraway colorful nebula-like galaxy spirals, built from points (no external assets).
function createGalaxy(position, colorA, colorB, scale=1) {
  const count = 1900;
  const arr = new Float32Array(count*3);
  const colors = new Float32Array(count*3);
  const ca = new THREE.Color(colorA), cb = new THREE.Color(colorB);
  for (let i=0;i<count;i++) {
    const arm = i%4;
    const radius = Math.random()*95*scale;
    const angle = radius*.085 + arm*Math.PI/2 + (Math.random()-.5)*.45;
    arr[i*3] = Math.cos(angle)*radius + (Math.random()-.5)*6*scale;
    arr[i*3+1] = (Math.random()-.5)*5*scale;
    arr[i*3+2] = Math.sin(angle)*radius + (Math.random()-.5)*6*scale;
    const col = ca.clone().lerp(cb, Math.random());
    colors[i*3] = col.r; colors[i*3+1] = col.g; colors[i*3+2] = col.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(arr,3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors,3));
  const mesh = new THREE.Points(geo, new THREE.PointsMaterial({
    size: 2.0*scale, vertexColors: true, transparent: true, opacity: .9,
    blending: THREE.AdditiveBlending, depthWrite: false
  }));
  mesh.position.copy(position);
  mesh.rotation.x = Math.random()*.5;
  scene.add(mesh);
  return mesh;
}
const galaxies = [
  createGalaxy(new THREE.Vector3(280, 70, -520), 0x4d82ff, 0xd17bff, 1.4),
  createGalaxy(new THREE.Vector3(-430, -90, -850), 0x31d9ff, 0x795bff, 1.8),
  createGalaxy(new THREE.Vector3(760, 160, 260), 0xff8fcf, 0x6e7dff, 1.2),
  createGalaxy(new THREE.Vector3(-850, 130, 450), 0xffc477, 0xff6f91, 1.5)
];

// Solar system with orbital rings and colorful planets.
const planetsData = [
  ["Mercúrio", 1.5, 19, 0xa8a39d, .9],
  ["Vênus", 2.4, 29, 0xe3b875, .65],
  ["Terra", 2.7, 42, 0x258bff, .48],
  ["Marte", 2.0, 55, 0xe45b3c, .38],
  ["Júpiter", 5.7, 78, 0xd5ad85, .23],
  ["Saturno", 4.8, 103, 0xe6d09b, .17],
  ["Urano", 3.3, 128, 0x83e5e9, .12],
  ["Netuno", 3.5, 153, 0x426bff, .09]
];
const planets = [];
for (const [name,radius,orbit,color,speed] of planetsData) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: .82, metalness: .03, emissive: color, emissiveIntensity: .025 });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32), mat);
  group.add(mesh);
  if (name === "Saturno") {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius*1.35, radius*2.15, 64),
      new THREE.MeshBasicMaterial({ color: 0xc8b58f, side: THREE.DoubleSide, transparent: true, opacity: .8 })
    );
    ring.rotation.x = Math.PI/2.35;
    group.add(ring);
  }
  const points = [];
  for (let j=0;j<=160;j++) {
    const a = j/160*Math.PI*2;
    points.push(new THREE.Vector3(Math.cos(a)*orbit, 0, Math.sin(a)*orbit));
  }
  const line = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: 0x35466f, transparent: true, opacity: .5 })
  );
  scene.add(line);
  scene.add(group);
  planets.push({ name, radius, orbit, speed, group, angle: Math.random()*Math.PI*2 });
}

// Small drifting asteroids in a belt.
const asteroidCount = 1100;
const asteroidPositions = new Float32Array(asteroidCount*3);
for (let i=0;i<asteroidCount;i++) {
  const a = Math.random()*Math.PI*2;
  const r = 61 + Math.random()*10;
  asteroidPositions[i*3] = Math.cos(a)*r;
  asteroidPositions[i*3+1] = (Math.random()-.5)*3;
  asteroidPositions[i*3+2] = Math.sin(a)*r;
}
const asteroidGeo = new THREE.BufferGeometry();
asteroidGeo.setAttribute("position", new THREE.BufferAttribute(asteroidPositions,3));
const asteroids = new THREE.Points(asteroidGeo, new THREE.PointsMaterial({ color: 0xa8b3c6, size: .65 }));
scene.add(asteroids);

// Player ship: a sleek low-poly arrow-shaped spacecraft.
const ship = new THREE.Group();
const hullMat = new THREE.MeshStandardMaterial({ color: 0xc8e9ff, metalness: .75, roughness: .25, emissive: 0x153b69, emissiveIntensity: .5 });
const hull = new THREE.Mesh(new THREE.ConeGeometry(1.25, 5.2, 6), hullMat);
hull.rotation.x = -Math.PI/2; // cone tip faces forward (-Z)
ship.add(hull);
const cockpit = new THREE.Mesh(new THREE.SphereGeometry(.62, 16, 12), new THREE.MeshStandardMaterial({ color: 0x42d9ff, metalness: .45, roughness: .12, emissive: 0x168eff, emissiveIntensity: 1.2 }));
cockpit.position.set(0,.55,-.45);
cockpit.scale.set(.8,.55,1.25);
ship.add(cockpit);
const wingMat = new THREE.MeshStandardMaterial({ color: 0x5278c9, metalness: .55, roughness: .35 });
for (const side of [-1,1]) {
  const wing = new THREE.Mesh(new THREE.BoxGeometry(2.7,.18,1.1), wingMat);
  wing.position.set(side*1.45,-.15,.6);
  wing.rotation.y = side*.12;
  ship.add(wing);
}
const engineGlow = new THREE.Mesh(
  new THREE.ConeGeometry(.45, 2.6, 12),
  new THREE.MeshBasicMaterial({ color: 0x42cfff, transparent: true, opacity: .8, blending: THREE.AdditiveBlending })
);
engineGlow.rotation.x = Math.PI/2;
engineGlow.position.z = 3.0;
ship.add(engineGlow);
scene.add(ship);
ship.position.set(0,0,16);

const keys = { forward:false, back:false, left:false, right:false, up:false, down:false, boost:false };
const controlsButtons = document.querySelectorAll("[data-control]");
controlsButtons.forEach(btn => {
  const key = btn.dataset.control;
  const down = e => { e.preventDefault(); keys[key]=true; btn.classList.add("pressed"); };
  const up = e => { e.preventDefault(); keys[key]=false; btn.classList.remove("pressed"); };
  btn.addEventListener("pointerdown", down);
  ["pointerup","pointercancel","pointerleave"].forEach(ev=>btn.addEventListener(ev,up));
});
const keyMap = {
  ArrowUp:"forward", w:"forward", ArrowDown:"back", s:"back",
  ArrowLeft:"left", a:"left", ArrowRight:"right", d:"right",
  q:"up", e:"down", Shift:"boost"
};
window.addEventListener("keydown", e => { const k=keyMap[e.key]; if(k){keys[k]=true; e.preventDefault();} });
window.addEventListener("keyup", e => { const k=keyMap[e.key]; if(k) keys[k]=false; });

// Drag on empty screen rotates ship direction; movement remains independent.
let dragging = false, lastX = 0, lastY = 0;
let yaw = 0, pitch = 0;
renderer.domElement.addEventListener("pointerdown", e => { dragging=true; lastX=e.clientX; lastY=e.clientY; });
window.addEventListener("pointerup", () => dragging=false);
window.addEventListener("pointermove", e => {
  if (!dragging) return;
  const dx=e.clientX-lastX, dy=e.clientY-lastY;
  lastX=e.clientX; lastY=e.clientY;
  yaw -= dx*.004;
  pitch = THREE.MathUtils.clamp(pitch-dy*.003, -.9, .9);
});

const clock = new THREE.Clock();
const velocity = new THREE.Vector3();
const forward = new THREE.Vector3();
const desiredCamera = new THREE.Vector3();
const lookTarget = new THREE.Vector3();
let travelled = 0;
let closestName = "Exploração livre";
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .04);
  const turn = 1.55*dt;
  if (keys.left) yaw += turn;
  if (keys.right) yaw -= turn;
  if (keys.up) pitch = THREE.MathUtils.clamp(pitch+turn*.65, -.9, .9);
  if (keys.down) pitch = THREE.MathUtils.clamp(pitch-turn*.65, -.9, .9);

  ship.rotation.order = "YXZ";
  ship.rotation.y = yaw;
  ship.rotation.x = pitch;
  ship.rotation.z = (keys.left ? .25 : 0) - (keys.right ? .25 : 0);

  const speed = keys.boost ? 115 : 46;
  if (keys.forward) {
    forward.set(-Math.sin(yaw)*Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw)*Math.cos(pitch)).normalize();
    velocity.addScaledVector(forward, speed*dt);
  }
  if (keys.back) {
    forward.set(-Math.sin(yaw)*Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw)*Math.cos(pitch)).normalize();
    velocity.addScaledVector(forward, -speed*.55*dt);
  }
  if (keys.up) velocity.y += speed*.28*dt;
  if (keys.down) velocity.y -= speed*.28*dt;
  velocity.multiplyScalar(Math.pow(.965, dt*60));
  const step = velocity.clone().multiplyScalar(dt);
  ship.position.add(step);
  travelled += step.length();

  const speedNow = velocity.length();
  engineGlow.scale.setScalar(keys.boost ? 1.5 : keys.forward ? 1 : .55);
  engineGlow.material.opacity = keys.boost ? .98 : keys.forward ? .72 : .35;

  // Follow camera, behind and above the ship.
  const backDir = new THREE.Vector3(Math.sin(yaw)*13, 5 + pitch*3, Math.cos(yaw)*13);
  desiredCamera.copy(ship.position).add(backDir);
  camera.position.lerp(desiredCamera, 1-Math.pow(.001,dt));
  lookTarget.copy(ship.position).add(new THREE.Vector3(-Math.sin(yaw)*8, pitch*4, -Math.cos(yaw)*8));
  camera.lookAt(lookTarget);

  sun.rotation.y += dt*.08;
  sunGlow.position.copy(sun.position);
  stars.rotation.y += dt*.0005;
  asteroids.rotation.y += dt*.012;
  galaxies.forEach((g,i)=> { g.rotation.y += dt*(i%2 ? .001 : -.0012); });

  let nearest = null, nearestD = Infinity;
  for (const p of planets) {
    p.angle += dt*p.speed*.12;
    p.group.position.set(Math.cos(p.angle)*p.orbit, 0, Math.sin(p.angle)*p.orbit);
    p.group.rotation.y += dt*.22;
    const d = ship.position.distanceTo(p.group.position);
    if (d < nearestD) { nearestD=d; nearest=p; }
  }
  if (nearest && nearestD < 35) {
    closestName = nearest.name;
    nearbyEl.textContent = `${nearest.name} · ${Math.round(nearestD)} u`;
  } else {
    closestName = "Exploração livre";
    nearbyEl.textContent = "Exploração livre";
  }

  const sector = ship.position.length() < 210 ? "Sistema Sol" :
    ship.position.length() < 650 ? "Espaço profundo" : "Fronteira galáctica";
  sectorEl.textContent = sector;
  distanceEl.textContent = `Distância: ${Math.round(ship.position.length())} u`;
  statusEl.textContent = `VELOCIDADE ${Math.round(speedNow)} · ${keys.boost ? "BOOST ATIVO" : "MOTORES ONLINE"}`;
  renderer.render(scene,camera);
}
animate();
setTimeout(() => {
  loadingEl.style.opacity = "0";
  setTimeout(()=>loadingEl.remove(),750);
}, 900);

window.addEventListener("resize", () => {
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
});
