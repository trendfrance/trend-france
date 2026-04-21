/* ============================================
   TREND.FRANCE — Hero 3D
   Stratégie hybride :
   - Texte "trend." en CSS avec gradient chrome (toujours net, typo exacte)
   - Canvas Three.js derrière : formes chrome flottantes, réflexions qui suivent la souris
   - Le texte a un tilt 3D + le background-position du gradient se décale selon la souris
     (simule le déplacement des reflets sur une surface métallique)
   ============================================ */

(() => {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const canvas = hero.querySelector('.hero__canvas');
  const fallback = hero.querySelector('.hero__fallback');

  // ---- Tilt + reflection shift sur le texte CSS ----
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

  function onMouseMove(e) {
    const rect = hero.getBoundingClientRect();
    mouse.tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1..1
    mouse.ty = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  }
  hero.addEventListener('mousemove', onMouseMove);

  hero.addEventListener('mouseleave', () => { mouse.tx = 0; mouse.ty = 0; });

  function tickTilt() {
    // lissage
    mouse.x += (mouse.tx - mouse.x) * 0.08;
    mouse.y += (mouse.ty - mouse.y) * 0.08;

    if (fallback) {
      const rx = -mouse.y * 10;   // rotateX
      const ry = mouse.x * 14;    // rotateY
      fallback.style.transform = `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;

      // Reflets : le gradient chrome se déplace avec la souris
      const bx = 50 + mouse.x * 40;
      const by = 50 + mouse.y * 40;
      fallback.style.backgroundPosition = `${bx}% ${by}%`;
    }

    requestAnimationFrame(tickTilt);
  }
  requestAnimationFrame(tickTilt);

  // ---- Three.js ambient scene ----
  if (!canvas || !window.THREE) return;

  const THREE = window.THREE;
  let renderer, scene, camera, shapes = [], envMap;
  let w = hero.clientWidth, h = hero.clientHeight;

  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
  } catch (err) {
    console.warn('WebGL indisponible, fallback CSS actif.', err);
    return;
  }

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
  camera.position.set(0, 0, 7);

  // Environment map procédurale (gradient radial violet + blanc)
  function buildEnvMap() {
    const size = 512;
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    // fond noir
    ctx.fillStyle = '#080808';
    ctx.fillRect(0, 0, size, size);
    // gros spot violet
    let g = ctx.createRadialGradient(size * 0.3, size * 0.35, 20, size * 0.3, size * 0.35, size * 0.55);
    g.addColorStop(0, '#d794ff');
    g.addColorStop(0.3, '#8B2FC9');
    g.addColorStop(1, 'rgba(139,47,201,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    // spot blanc
    g = ctx.createRadialGradient(size * 0.75, size * 0.7, 10, size * 0.75, size * 0.7, size * 0.35);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.4, '#888');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    // halo secondaire
    g = ctx.createRadialGradient(size * 0.15, size * 0.85, 5, size * 0.15, size * 0.85, size * 0.4);
    g.addColorStop(0, '#b45cff');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  envMap = buildEnvMap();
  scene.environment = envMap;

  // Matériau chrome
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 1,
    roughness: 0.12,
    envMapIntensity: 1.4,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x8B2FC9,
    metalness: 1,
    roughness: 0.2,
    envMapIntensity: 1.2,
  });

  // Ajout de shapes flottantes (torus, spheres)
  const geos = [
    new THREE.TorusGeometry(0.45, 0.16, 48, 96),
    new THREE.TorusKnotGeometry(0.35, 0.12, 96, 16),
    new THREE.IcosahedronGeometry(0.5, 1),
    new THREE.SphereGeometry(0.4, 48, 48),
    new THREE.TorusGeometry(0.3, 0.1, 32, 64),
  ];

  const positions = [
    { x: -4.2, y:  1.6, z: -1, s: 1.0,  mat: chromeMat },
    { x:  4.4, y: -1.4, z: -1.5, s: 1.1, mat: chromeMat },
    { x: -3.6, y: -1.9, z: -0.8, s: 0.8, mat: accentMat },
    { x:  3.8, y:  1.9, z: -1.2, s: 0.9, mat: chromeMat },
    { x: -5.0, y:  0.1, z: -2, s: 0.7, mat: chromeMat },
    { x:  5.2, y:  0.3, z: -2, s: 0.7, mat: accentMat },
  ];

  positions.forEach((p, i) => {
    const g = geos[i % geos.length];
    const m = new THREE.Mesh(g, p.mat);
    m.position.set(p.x, p.y, p.z);
    m.scale.setScalar(p.s);
    m.userData = {
      rotSpeed: { x: 0.2 + Math.random() * 0.3, y: 0.15 + Math.random() * 0.35, z: 0.08 },
      floatAmp: 0.2 + Math.random() * 0.25,
      floatFreq: 0.6 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
      baseY: p.y,
    };
    scene.add(m);
    shapes.push(m);
  });

  // Lights (la plupart du rendu vient de l'envMap, on ajoute juste un fill)
  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(4, 5, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xb45cff, 1.8);
  rim.position.set(-4, -2, 3);
  scene.add(rim);
  scene.add(new THREE.AmbientLight(0x202030, 0.5));

  // Resize
  function onResize() {
    w = hero.clientWidth;
    h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);

  // Animate
  const clock = new THREE.Clock();
  function render() {
    const t = clock.getElapsedTime();

    shapes.forEach((m) => {
      const d = m.userData;
      m.rotation.x += d.rotSpeed.x * 0.005;
      m.rotation.y += d.rotSpeed.y * 0.005;
      m.rotation.z += d.rotSpeed.z * 0.005;
      m.position.y = d.baseY + Math.sin(t * d.floatFreq + d.phase) * d.floatAmp;
    });

    // Mouse parallax sur la caméra (les reflets bougent = vie)
    camera.position.x += (mouse.x * 0.6 - camera.position.x) * 0.04;
    camera.position.y += (-mouse.y * 0.4 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
  render();
})();
