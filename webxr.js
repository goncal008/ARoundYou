import * as THREE from 'https://cdn.skypack.dev/three';
import { ARButton } from 'https://cdn.skypack.dev/three/examples/jsm/webxr/ARButton.js';

// Cria a cena e a câmara
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera();

// Cria o renderizador com suporte a WebXR
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

// Adiciona o botão WebXR
document.body.appendChild(
  ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] })
);

// Luz ambiente
const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
scene.add(light);

// Cria um cubo vermelho
const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const cube = new THREE.Mesh(geometry, material);
cube.position.set(0, 0, -0.5); // Aparece à frente do utilizador
scene.add(cube);

// Esconde o ecrã de carregamento
document.getElementById('loading').style.display = 'none';

// Loop de renderização
renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});
