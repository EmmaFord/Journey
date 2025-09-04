import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Character extends THREE.Group {
    constructor(options = {}) {
        super();
        this.options = options;

        // Class property for elevation data
        this.elevationImageData = null;

        // Load elevation texture and extract image data
        const loader = new THREE.TextureLoader();
        loader.load(
        '/journey/world-map.png',
        (texture) => {
            const image = texture.image;

            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);

            this.elevationImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            console.log("Elevation texture loaded");
        },
        undefined,
        (err) => {
            console.error("Error loading elevation texture:", err);
        }
        );

        const geometry = new THREE.BoxGeometry( 0.1, 0.1, 0.1 ); 
        const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} ); 
        const cube = new THREE.Mesh( geometry, material ); 
        this.add( cube );



        // Initial position on sphere
        this.characterPos = new THREE.Vector3(0, options.radius + options.characterScaleOffset, 0);
        this.characterForward = new THREE.Vector3(1, 0, 0);
        this.characterUp = this.characterPos.clone().normalize();

        this.position.copy(this.characterPos);
        this.lastCharacterPos = this.characterPos.clone();

        // Movement settings
        this.moveSpeed = 0.02;
        this.turnSpeed = 0.015;

        // Keyboard state
        this.keysPressed = {};
    }

    updateCharacterPos() {
        this.position.copy(this.characterPos);
        this.up.copy(this.characterUp);
        const lookTarget = this.characterPos.clone().add(this.characterForward);
        this.lookAt(lookTarget);
    }

    moveAlongSphere(direction) {
        const axis = new THREE.Vector3().crossVectors(this.characterForward, this.characterUp).normalize();
        const angle = direction * this.moveSpeed;
        this.characterPos.applyAxisAngle(axis, angle).normalize().multiplyScalar(this.options.radius + this.options.characterScaleOffset);
        this.characterUp.copy(this.characterPos).normalize();
        this.characterForward = this.projectOnTangentPlane(this.characterForward, this.characterUp);
    }

    turnCharacter(leftRight) {
        this.characterForward.applyAxisAngle(this.characterUp, leftRight * this.turnSpeed);
        this.characterForward.normalize();
    }

    projectOnTangentPlane(vec, normal) {
        return vec.clone().sub(normal.clone().multiplyScalar(vec.dot(normal))).normalize();
    }

    sphericalDirToUV(dir) {
        const u = 0.5 + Math.atan2(dir.z, dir.x) / (2 * Math.PI);
        const v = 0.5 - Math.asin(dir.y) / Math.PI;
        return new THREE.Vector2(u, v);
    }

    getLuminanceAtUV(uv) {
        const imageData = this.elevationImageData;
        if (!imageData) return 0;

        const u = THREE.MathUtils.clamp(uv.x, 0, 1);
        const v = THREE.MathUtils.clamp(uv.y, 0, 1);

        const x = Math.floor(u * (imageData.width - 1));
        const y = Math.floor(v * (imageData.height - 1));
        const index = (y * imageData.width + x) * 4;
        const r = imageData.data[index];
        return 1.0 - r / 255;
    }

    update(time, water) {
        let moved = false;
        
        // --- Elevation Detection ---
        const dir = this.characterPos.clone().normalize();
        const uv = this.sphericalDirToUV(dir);
        const luminance = this.getLuminanceAtUV(uv);

        const groundAmplitude = 0.15;
        const elevation = luminance * groundAmplitude;

        if (elevation < 0.05) {
            if (this.keysPressed['w'] || this.keysPressed['arrowup']) {
                this.moveAlongSphere(+1);
                moved = true;
            }
            if (this.keysPressed['s'] || this.keysPressed['arrowdown']) {
                this.moveAlongSphere(-1);
                moved = true;
            }
        }
        if (this.keysPressed['a'] || this.keysPressed['arrowleft']) {
            this.turnCharacter(+1);
        }
        if (this.keysPressed['d'] || this.keysPressed['arrowright']) {
            this.turnCharacter(-1);
        }

        if (moved && this.position.distanceTo(this.lastCharacterPos) > 0.1) {
            this.lastCharacterPos.copy(this.position);
            water.addRipple(this.position.clone(), time);
        }

            
        if (elevation > 0.05) {
            console.log("Character is over elevated ground!", elevation.toFixed(3));
        }

        this.updateCharacterPos();
    }
}
