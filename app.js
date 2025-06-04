import * as THREE from 'https://unpkg.com/three@0.155.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.155.0/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, controls, extintor;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let tooltip = document.getElementById('tooltip');

// Dados das partes
const partData = {
    corpo: {
        nome: "Corpo Principal",
        descricao: "Cilindro de aço pressurizado que armazena o agente extintor",
        cor: 0xff0000
    },
    manometro: {
        nome: "Manômetro",
        descricao: "Indica a pressão interna (deve estar na zona verde)",
        cor: 0xffffff
    },
    mangueira: {
        nome: "Mangueira",
        descricao: "Conduto flexível para direcionar o jato",
        cor: 0x111111
    },
    alca: {
        nome: "Alça de Transporte",
        descricao: "Permite carregar o extintor com segurança",
        cor: 0x888888
    },
    pino: {
        nome: "Pino de Segurança",
        descricao: "Impede acionamento acidental (cor amarela)",
        cor: 0xffff00
    }
};

init();
animate();

function init() {
    // Cena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    // Câmera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(1.5, 1.5, 2);

    // Renderizador
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Controles
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Luzes
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(3, 5, 2);
    directional.castShadow = true;
    scene.add(directional);

    // Construir extintor
    createExtintor();

    // Eventos
    window.addEventListener('click', onMouseClick);
    window.addEventListener('resize', onWindowResize);
}

function createExtintor() {
    extintor = new THREE.Group();

    // Corpo principal
    const corpo = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 1.2, 32),
        new THREE.MeshStandardMaterial({ 
            color: partData.corpo.cor,
            metalness: 0.2,
            roughness: 0.5
        })
    );
    corpo.position.y = 0.6;
    corpo.name = "corpo";
    extintor.add(corpo);

    // Base
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.1, 32),
        new THREE.MeshStandardMaterial({ 
            color: 0x444444,
            metalness: 0.7,
            roughness: 0.3
        })
    );
    base.position.y = 0.05;
    extintor.add(base);

    // Tampa Superior
    const tampa = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ 
            color: 0x666666,
            metalness: 0.8,
            roughness: 0.2
        })
    );
    tampa.position.y = 1.35;
    extintor.add(tampa);

    // Alça
    const alca = new THREE.Mesh(
        new THREE.TorusGeometry(0.12, 0.015, 16, 100, Math.PI),
        new THREE.MeshStandardMaterial({ 
            color: partData.alca.cor,
            metalness: 0.8,
            roughness: 0.1
        })
    );
    alca.position.set(0, 1.42, 0);
    alca.rotation.z = Math.PI / 2;
    alca.name = "alca";
    extintor.add(alca);

    // Pino de Segurança
    const pino = new THREE.Mesh(
        new THREE.CylinderGeometry(0.005, 0.005, 0.08, 8),
        new THREE.MeshStandardMaterial({ 
            color: partData.pino.cor,
            metalness: 0.4,
            roughness: 0.4
        })
    );
    pino.position.set(0.12, 1.37, 0);
    pino.rotation.z = Math.PI / 2;
    pino.name = "pino";
    extintor.add(pino);

    // Manômetro
    const manometro = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.035, 0.02, 16),
        new THREE.MeshStandardMaterial({ 
            color: partData.manometro.cor,
            metalness: 0.5,
            roughness: 0.3
        })
    );
    manometro.position.set(0, 1.37, 0.12);
    manometro.rotation.x = Math.PI / 2;
    manometro.name = "manometro";
    extintor.add(manometro);

    // Mangueira
    const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.12, 1.3, 0),
        new THREE.Vector3(0.25, 1.1, 0.1),
        new THREE.Vector3(0.3, 0.7, 0.2),
        new THREE.Vector3(0.2, 0.3, 0.15)
    ]);
    const mangueira = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 50, 0.02, 8),
        new THREE.MeshStandardMaterial({ 
            color: partData.mangueira.cor,
            metalness: 0.1,
            roughness: 0.8
        })
    );
    mangueira.name = "mangueira";
    extintor.add(mangueira);

    scene.add(extintor);
}

function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(extintor.children, true);

    if (intersects.length > 0) {
        const obj = intersects[0].object;
        showTooltip(obj, event.clientX, event.clientY);
    }
}

function showTooltip(obj, x, y) {
    const data = partData[obj.name];
    if (!data) return;

    tooltip.style.left = `${x + 15}px`;
    tooltip.style.top = `${y + 15}px`;
    tooltip.innerHTML = `
        <strong>${data.nome}</strong><br>
        <span style="color: #aaa">${data.descricao}</span>
    `;
    tooltip.style.opacity = 1;

    setTimeout(() => tooltip.style.opacity = 0, 3000);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
