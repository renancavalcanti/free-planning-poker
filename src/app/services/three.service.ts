import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface UserCard {
  userId: string;
  userName: string;
  cardMesh: THREE.Mesh;
  value: string;
  revealed: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ThreeService {
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private controls: OrbitControls | null = null;
  private cardMesh: THREE.Mesh | null = null;
  private tableMesh: THREE.Mesh | null = null;
  private userAvatars: Map<string, THREE.Mesh> = new Map();
  private userCards: Map<string, UserCard> = new Map();
  private animationFrameId: number | null = null;
  private tableRadius: number = 5;
  private cardWidth: number = 1.5;
  private cardHeight: number = 2;
  private cardDepth: number = 0.05;
  private roomSize: number = 18; // Increased meeting room size (was 14)
  
  constructor() { }

  initialize(container: HTMLElement): void {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75, 
      container.clientWidth / container.clientHeight, 
      0.1, 
      1000
    );
    this.camera.position.set(0, 8, 8);
    this.camera.lookAt(0, 0, 0);
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);
    
    // Create orbit controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 15;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent going below the table
    
    // Set bounds to keep camera inside the room
    const maxX = this.roomSize / 2 - 1;
    const maxZ = this.roomSize / 2 - 1;
    this.controls.addEventListener('change', () => {
      // Clamp camera position to room boundaries
      if (this.camera) {
        this.camera.position.x = Math.max(-maxX, Math.min(maxX, this.camera.position.x));
        this.camera.position.z = Math.max(-maxZ, Math.min(maxZ, this.camera.position.z));
      }
    });
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xfff8e1, 0.9);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
    
    // Add point light (overhead light)
    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    pointLight.position.set(0, 8, 0);
    pointLight.castShadow = true;
    this.scene.add(pointLight);
    
    // Add corner lights for better room illumination
    const cornerLight1 = new THREE.PointLight(0xfff0e0, 0.4);
    cornerLight1.position.set(this.roomSize/3, 7, this.roomSize/3);
    this.scene.add(cornerLight1);
    
    const cornerLight2 = new THREE.PointLight(0xe0f0ff, 0.4);
    cornerLight2.position.set(-this.roomSize/3, 7, -this.roomSize/3);
    this.scene.add(cornerLight2);
    
    // Create meeting room
    this.createMeetingRoom();
    
    // Create table
    this.createTable();
    
    // Add a floor
    this.addFloor();
    
    // Set up event listener for window resize
    window.addEventListener('resize', () => this.onWindowResize(container));
    
    // Start animation loop
    this.animate();
  }

  private createMeetingRoom(): void {
    if (!this.scene) return;
    
    const roomSize = this.roomSize;
    const wallHeight = 10;
    
    // Wall material with texture - changed to pure white
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff, // Pure white (was 0xe8eaed light gray)
      roughness: 0.9,
      metalness: 0.1,
    });
    
    // Create walls
    // Back wall
    const backWallGeometry = new THREE.BoxGeometry(roomSize, wallHeight, 0.2);
    const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
    backWall.position.set(0, wallHeight / 2, -roomSize / 2);
    backWall.receiveShadow = true;
    this.scene.add(backWall);
    
    // Left wall
    const leftWallGeometry = new THREE.BoxGeometry(0.2, wallHeight, roomSize);
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.position.set(-roomSize / 2, wallHeight / 2, 0);
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);
    
    // Right wall
    const rightWallGeometry = new THREE.BoxGeometry(0.2, wallHeight, roomSize);
    const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
    rightWall.position.set(roomSize / 2, wallHeight / 2, 0);
    rightWall.receiveShadow = true;
    this.scene.add(rightWall);
    
    // Front wall with door cutout
    const doorWidth = 3;
    const doorHeight = 7;
    
    // Front wall left section
    const frontWallLeftGeometry = new THREE.BoxGeometry((roomSize - doorWidth) / 2, wallHeight, 0.2);
    const frontWallLeft = new THREE.Mesh(frontWallLeftGeometry, wallMaterial);
    frontWallLeft.position.set(-roomSize / 4 - doorWidth / 4, wallHeight / 2, roomSize / 2);
    frontWallLeft.receiveShadow = true;
    this.scene.add(frontWallLeft);
    
    // Front wall right section
    const frontWallRightGeometry = new THREE.BoxGeometry((roomSize - doorWidth) / 2, wallHeight, 0.2);
    const frontWallRight = new THREE.Mesh(frontWallRightGeometry, wallMaterial);
    frontWallRight.position.set(roomSize / 4 + doorWidth / 4, wallHeight / 2, roomSize / 2);
    frontWallRight.receiveShadow = true;
    this.scene.add(frontWallRight);
    
    // Front wall top section (above door)
    const frontWallTopGeometry = new THREE.BoxGeometry(roomSize, wallHeight - doorHeight, 0.2);
    const frontWallTop = new THREE.Mesh(frontWallTopGeometry, wallMaterial);
    frontWallTop.position.set(0, doorHeight + (wallHeight - doorHeight) / 2, roomSize / 2);
    frontWallTop.receiveShadow = true;
    this.scene.add(frontWallTop);
    
    // Create ceiling
    const ceilingGeometry = new THREE.BoxGeometry(roomSize, 0.2, roomSize);
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.8,
      metalness: 0.1,
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.position.set(0, wallHeight, 0);
    ceiling.receiveShadow = true;
    this.scene.add(ceiling);
    
    // Add TV/Monitor on the back wall
    this.addTelevision();
    
    // Add whiteboard
    this.addWhiteboard();
    
    // Add window on left wall
    this.addWindow();
    
    // Add some decorative elements
    this.addRoomDecorations();
  }
  
  private addTelevision(): void {
    if (!this.scene) return;
    
    // TV frame
    const tvFrameGeometry = new THREE.BoxGeometry(5, 3, 0.2);
    const tvFrameMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333, // Dark gray
      roughness: 0.5,
      metalness: 0.8,
    });
    const tvFrame = new THREE.Mesh(tvFrameGeometry, tvFrameMaterial);
    tvFrame.position.set(0, 6, -this.roomSize / 2 + 0.15);
    tvFrame.castShadow = true;
    this.scene.add(tvFrame);
    
    // TV screen
    const tvScreenGeometry = new THREE.BoxGeometry(4.8, 2.8, 0.05);
    
    // Create a canvas for TV content
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    if (context) {
      // Background
      context.fillStyle = '#0a2540';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw a title
      context.fillStyle = 'white';
      context.font = 'Bold 40px Arial';
      context.textAlign = 'center';
      context.fillText('PLANNING POKER', canvas.width / 2, 80);
      
      // Draw a subtitle
      context.font = '30px Arial';
      context.fillText('Team Meeting in Progress', canvas.width / 2, 150);
      
      // Create a screen texture
      const screenTexture = new THREE.CanvasTexture(canvas);
      const tvScreenMaterial = new THREE.MeshBasicMaterial({ map: screenTexture });
      const tvScreen = new THREE.Mesh(tvScreenGeometry, tvScreenMaterial);
      tvScreen.position.set(0, 6, -this.roomSize / 2 + 0.3);
      this.scene.add(tvScreen);
    }
  }
  
  private addWhiteboard(): void {
    if (!this.scene) return;
    
    // Whiteboard frame
    const frameGeometry = new THREE.BoxGeometry(4, 3, 0.1);
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x999999,
      roughness: 0.5,
      metalness: 0.3,
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(-this.roomSize / 2 + 0.15, 5, -this.roomSize / 4);
    frame.rotateY(Math.PI / 2);
    frame.castShadow = true;
    this.scene.add(frame);
    
    // Whiteboard surface
    const boardGeometry = new THREE.BoxGeometry(3.8, 2.8, 0.05);
    const boardMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.1,
    });
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    board.position.set(-this.roomSize / 2 + 0.3, 5, -this.roomSize / 4);
    board.rotateY(Math.PI / 2);
    this.scene.add(board);
  }
  
  private addWindow(): void {
    if (!this.scene) return;
    
    // Window frame
    const frameGeometry = new THREE.BoxGeometry(0.3, 4, 6); // Wider window
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x5d4037, // Brown
      roughness: 0.7,
      metalness: 0.1,
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(this.roomSize / 2 - 0.1, 5, -this.roomSize / 4);
    frame.castShadow = true;
    this.scene.add(frame);
    
    // Window glass
    const glassGeometry = new THREE.BoxGeometry(0.05, 3.7, 5.7); // Wider glass
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xadd8e6, // Light blue
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.4,
      clearcoat: 1.0,
    });
    const glass = new THREE.Mesh(glassGeometry, glassMaterial);
    glass.position.set(this.roomSize / 2 - 0.2, 5, -this.roomSize / 4);
    this.scene.add(glass);
    
    // Window light effect
    const windowLight = new THREE.PointLight(0xffffff, 0.6);
    windowLight.position.set(this.roomSize / 2 - 1, 5, -this.roomSize / 4);
    this.scene.add(windowLight);
  }
  
  private addRoomDecorations(): void {
    if (!this.scene) return;
    
    // Add a plant in the corner
    this.addPlant(this.roomSize / 2 - 1, this.roomSize / 2 - 1, 0.4);
    
    // Add a second plant in the opposite corner
    this.addPlant(-this.roomSize / 2 + 1, -this.roomSize / 2 + 1, 0.3);
    
    // Add a clock to the wall
    const clockRimGeometry = new THREE.RingGeometry(0.8, 1, 32);
    const clockRimMaterial = new THREE.MeshStandardMaterial({
      color: 0xdddddd, // Light gray
      roughness: 0.5,
      metalness: 0.5,
    });
    const clockRim = new THREE.Mesh(clockRimGeometry, clockRimMaterial);
    clockRim.position.set(-this.roomSize / 2 + 0.15, 7, this.roomSize / 4);
    clockRim.rotateY(Math.PI / 2);
    this.scene.add(clockRim);
    
    // Clock face
    const clockFaceGeometry = new THREE.CircleGeometry(0.8, 32);
    const clockFaceMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
      metalness: 0.1,
    });
    const clockFace = new THREE.Mesh(clockFaceGeometry, clockFaceMaterial);
    clockFace.position.set(-this.roomSize / 2 + 0.14, 7, this.roomSize / 4);
    clockFace.rotateY(Math.PI / 2);
    this.scene.add(clockFace);
    
    // Clock hands
    const hourHandGeometry = new THREE.BoxGeometry(0.05, 0.4, 0.05);
    const hourHandMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.5,
      metalness: 0.2,
    });
    const hourHand = new THREE.Mesh(hourHandGeometry, hourHandMaterial);
    hourHand.position.set(-this.roomSize / 2 + 0.13, 7, this.roomSize / 4);
    hourHand.rotateY(Math.PI / 2);
    hourHand.rotateZ(Math.PI / 3); // Set time to approx 2 o'clock
    this.scene.add(hourHand);
    
    // Minute hand
    const minuteHandGeometry = new THREE.BoxGeometry(0.03, 0.6, 0.03);
    const minuteHand = new THREE.Mesh(minuteHandGeometry, hourHandMaterial);
    minuteHand.position.set(-this.roomSize / 2 + 0.13, 7, this.roomSize / 4);
    minuteHand.rotateY(Math.PI / 2);
    minuteHand.rotateZ(Math.PI / 6); // Set time to approx 2:10
    this.scene.add(minuteHand);
  }

  // Helper method to create plants
  private addPlant(x: number, z: number, scale: number = 1): void {
    if (!this.scene) return;
    
    // Pot
    const potGeometry = new THREE.CylinderGeometry(0.4 * scale, 0.3 * scale, 0.7 * scale, 16);
    const potMaterial = new THREE.MeshStandardMaterial({
      color: 0x795548, // Brown
      roughness: 0.8,
      metalness: 0.1,
    });
    const pot = new THREE.Mesh(potGeometry, potMaterial);
    pot.position.set(x, 0.35 * scale, z);
    pot.castShadow = true;
    this.scene.add(pot);
    
    // Create plant leaves using cones
    const leafMaterial = new THREE.MeshStandardMaterial({
      color: 0x2e7d32, // Green
      roughness: 1.0,
      metalness: 0.0,
    });
    
    const leafCount = Math.floor(5 + Math.random() * 3);
    for (let i = 0; i < leafCount; i++) {
      const leafGeometry = new THREE.ConeGeometry(0.3 * scale, 1.5 * scale, 8);
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      
      // Position and rotate leaves in different directions
      const angle = (i / leafCount) * Math.PI * 2;
      leaf.position.set(
        x + Math.sin(angle) * 0.2 * scale,
        1.3 * scale,
        z + Math.cos(angle) * 0.2 * scale
      );
      
      leaf.rotation.x = Math.PI / 6 + (Math.random() * 0.2 - 0.1);
      leaf.rotation.z = angle;
      leaf.castShadow = true;
      this.scene.add(leaf);
    }
  }

  private createTable(): void {
    if (!this.scene) return;
    
    // Create table geometry
    const tableGeometry = new THREE.CylinderGeometry(this.tableRadius, this.tableRadius, 0.2, 32);
    const tableMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x5d4037, // Brown color
      roughness: 0.7,
      metalness: 0.1
    });
    
    this.tableMesh = new THREE.Mesh(tableGeometry, tableMaterial);
    this.tableMesh.position.y = 2; // Table height
    this.tableMesh.receiveShadow = true;
    this.tableMesh.castShadow = true;
    this.scene.add(this.tableMesh);
    
    // Add table legs
    const legGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 12);
    const legMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x4e342e, // Darker brown
      roughness: 0.7,
      metalness: 0.1
    });
    
    // Position legs at the four corners
    const legDistance = this.tableRadius * 0.8;
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI / 2);
      const x = Math.cos(angle) * legDistance;
      const z = Math.sin(angle) * legDistance;
      
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(x, 1, z); // Position at table corner
      leg.castShadow = true;
      this.scene?.add(leg);
    }
    
    // Add green felt to the table top
    const feltGeometry = new THREE.CylinderGeometry(this.tableRadius - 0.1, this.tableRadius - 0.1, 0.05, 32);
    const feltMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2e7d32, // Green felt color
      roughness: 1.0,
      metalness: 0.0
    });
    
    const felt = new THREE.Mesh(feltGeometry, feltMaterial);
    felt.position.y = 2.1; // Just above the table
    felt.receiveShadow = true;
    this.scene.add(felt);
    
    // Add a decorative plant vase in the center of the table
    this.addTableCenterpiece();
  }

  // Add a decorative centerpiece to the table
  private addTableCenterpiece(): void {
    if (!this.scene) return;
    
    // Create vase
    const vaseGeometry = new THREE.CylinderGeometry(0.3, 0.2, 0.5, 16);
    const vaseMaterial = new THREE.MeshStandardMaterial({
      color: 0x607d8b, // Blue-gray
      roughness: 0.2,
      metalness: 0.8
    });
    
    const vase = new THREE.Mesh(vaseGeometry, vaseMaterial);
    vase.position.set(0, 2.35, 0); // Position at center of table
    vase.castShadow = true;
    this.scene.add(vase);
    
    // Add small flowers/plants in the vase
    const flowerColors = [0xf06292, 0x4db6ac, 0xffb74d, 0xba68c8]; // Pink, teal, orange, purple
    
    // Create several small flowers
    for (let i = 0; i < 7; i++) {
      const flowerColor = flowerColors[i % flowerColors.length];
      
      // Create flower stem
      const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.7, 8);
      const stemMaterial = new THREE.MeshStandardMaterial({
        color: 0x66bb6a, // Green
        roughness: 0.9,
        metalness: 0.0
      });
      
      const stem = new THREE.Mesh(stemGeometry, stemMaterial);
      
      // Position stem at angle from center
      const angle = (i / 7) * Math.PI * 2;
      const radius = 0.15;
      const stemX = Math.sin(angle) * radius;
      const stemZ = Math.cos(angle) * radius;
      
      stem.position.set(stemX, 2.7, stemZ);
      stem.rotation.x = Math.random() * 0.2 - 0.1;
      stem.rotation.z = Math.random() * 0.2 - 0.1;
      
      // Create flower head
      const flowerGeometry = new THREE.SphereGeometry(0.08, 8, 8);
      const flowerMaterial = new THREE.MeshStandardMaterial({
        color: flowerColor,
        roughness: 0.8,
        metalness: 0.1
      });
      
      const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
      flower.position.set(stemX, 3.05 + (Math.random() * 0.1), stemZ);
      flower.scale.y = 0.7; // Slightly flatten
      
      this.scene.add(stem);
      this.scene.add(flower);
    }
  }

  private addFloor(): void {
    if (!this.scene) return;
    
    // Use a larger floor that matches the room size
    const floorGeometry = new THREE.PlaneGeometry(this.roomSize, this.roomSize);
    
    // Create a canvas for the floor texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    if (context) {
      // Fill with base color
      context.fillStyle = '#f5f5f5';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Create a grid pattern
      context.strokeStyle = '#e0e0e0';
      context.lineWidth = 2;
      const tileSize = canvas.width / 8; // 8x8 grid
      
      // Draw grid lines
      for (let i = 0; i <= 8; i++) {
        const pos = i * tileSize;
        
        // Horizontal lines
        context.beginPath();
        context.moveTo(0, pos);
        context.lineTo(canvas.width, pos);
        context.stroke();
        
        // Vertical lines
        context.beginPath();
        context.moveTo(pos, 0);
        context.lineTo(pos, canvas.height);
        context.stroke();
      }
      
      // Create texture from canvas
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(4, 4); // Repeat pattern
      
      const floorMaterial = new THREE.MeshStandardMaterial({ 
        map: texture,
        roughness: 0.9,
        metalness: 0.1
      });
      
      const floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.rotation.x = -Math.PI / 2; // Make it horizontal
      floor.position.y = 0; // At floor level
      floor.receiveShadow = true;
      this.scene.add(floor);
    } else {
      // Fallback if canvas is not available
      const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xf5f5f5, // Light gray
        roughness: 1.0,
        metalness: 0.0
      });
      
      const floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.rotation.x = -Math.PI / 2; // Make it horizontal
      floor.position.y = 0; // At floor level
      floor.receiveShadow = true;
      this.scene.add(floor);
    }
  }

  updateUsers(users: { id: string, name: string }[]): void {
    if (!this.scene) return;
    
    // Remove old avatars that aren't in the new list
    this.userAvatars.forEach((mesh, userId) => {
      if (!users.some(user => user.id === userId)) {
        this.scene?.remove(mesh);
        this.userAvatars.delete(userId);
      }
    });
    
    // Add or update avatars
    users.forEach((user, index) => {
      if (!this.userAvatars.has(user.id)) {
        // Create user avatar
        const avatar = this.createUserAvatar(user.name);
        
        // Position around the table
        const angle = (index * ((2 * Math.PI) / users.length));
        const x = Math.cos(angle) * (this.tableRadius + 1);
        const z = Math.sin(angle) * (this.tableRadius + 1);
        
        avatar.position.set(x, 2, z); // Position at table edge
        avatar.lookAt(0, 2, 0); // Look at center of table
        
        this.scene?.add(avatar);
        this.userAvatars.set(user.id, avatar);
      }
    });
  }

  private createUserAvatar(name: string): THREE.Mesh {
    // Create a simple avatar representation
    const bodyGeometry = new THREE.CapsuleGeometry(0.3, 0.5, 4, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: this.getRandomColor(), // Random color for each user
      roughness: 0.7,
      metalness: 0.3
    });
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.8; // Height above ground
    body.castShadow = true;
    
    // Create head
    const headGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffe0b2, // Skin tone
      roughness: 0.7,
      metalness: 0.0
    });
    
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.3; // On top of body
    head.castShadow = true;
    
    // Create name label
    const nameLabel = this.createNameLabel(name);
    nameLabel.position.y = 1.7; // Above head
    
    // Group all parts
    const group = new THREE.Group();
    group.add(body);
    group.add(head);
    group.add(nameLabel);
    
    return group as unknown as THREE.Mesh;
  }

  private createNameLabel(name: string): THREE.Mesh {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    
    if (context) {
      context.fillStyle = 'rgba(0, 0, 0, 0)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      context.font = 'Bold 60px Arial';
      context.fillStyle = 'black';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(name, canvas.width / 2, canvas.height / 2);
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
      });
      
      const geometry = new THREE.PlaneGeometry(1.5, 0.375);
      const label = new THREE.Mesh(geometry, material);
      
      // Billboard effect - always face camera
      label.onBeforeRender = (renderer, scene, camera) => {
        if (camera instanceof THREE.PerspectiveCamera) {
          label.lookAt(camera.position);
        }
      };
      
      return label;
    }
    
    // Fallback if context creation fails
    const geometry = new THREE.PlaneGeometry(1.5, 0.375);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0
    });
    return new THREE.Mesh(geometry, material);
  }

  private getRandomColor(): number {
    const colors = [
      0x4CAF50, // Green
      0x2196F3, // Blue
      0xF44336, // Red
      0xFF9800, // Orange
      0x9C27B0, // Purple
      0x00BCD4, // Cyan
      0xFFEB3B, // Yellow
      0x795548, // Brown
      0x607D8B  // Blue Grey
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  addUserCard(userId: string, userName: string, value: string, revealed: boolean): void {
    if (!this.scene) return;
    
    // Remove existing card for this user if it exists
    this.removeUserCard(userId);
    
    // Create card mesh
    const cardMesh = this.createCardMesh(value, revealed);
    
    // Position the card on the table
    const avatar = this.userAvatars.get(userId);
    if (avatar) {
      // Position the card in front of the user, on the table
      const userPos = new THREE.Vector3();
      avatar.getWorldPosition(userPos);
      
      // Calculate position between user and center of table
      const direction = new THREE.Vector3(0, 2, 0).sub(userPos).normalize();
      const position = new THREE.Vector3(
        userPos.x + direction.x * (this.tableRadius * 0.7),
        2.15, // Just above the table
        userPos.z + direction.z * (this.tableRadius * 0.7)
      );
      
      cardMesh.position.copy(position);
      
      // Rotate to face center of table
      cardMesh.lookAt(0, 2.15, 0);
      // Add a quarter turn to make card face up
      cardMesh.rotateX(-Math.PI / 2);
      
      this.scene.add(cardMesh);
      
      // Store the card
      this.userCards.set(userId, {
        userId,
        userName,
        cardMesh,
        value,
        revealed
      });
    }
  }

  removeUserCard(userId: string): void {
    const userCard = this.userCards.get(userId);
    if (userCard && this.scene) {
      this.scene.remove(userCard.cardMesh);
      this.userCards.delete(userId);
    }
  }

  revealAllCards(): void {
    this.userCards.forEach((card) => {
      if (!card.revealed) {
        this.revealCard(card.userId);
      }
    });
  }

  revealCard(userId: string): void {
    const userCard = this.userCards.get(userId);
    if (!userCard) return;
    
    // Update card state
    userCard.revealed = true;
    
    // Replace the card mesh with a revealed version
    if (this.scene) {
      // Remove the old card
      this.scene.remove(userCard.cardMesh);
      
      // Create a new card with revealed state
      const newCardMesh = this.createCardMesh(userCard.value, true);
      
      // Copy position and rotation
      newCardMesh.position.copy(userCard.cardMesh.position);
      newCardMesh.rotation.copy(userCard.cardMesh.rotation);
      
      // Add to scene
      this.scene.add(newCardMesh);
      
      // Update the reference
      userCard.cardMesh = newCardMesh;
      
      // Animate the card flip
      const duration = 1000; // in milliseconds
      const startTime = Date.now();
      const originalRotation = userCard.cardMesh.rotation.clone();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Use easing function for smoother animation
        const easeProgress = this.easeInOutQuad(progress);
        
        if (userCard.cardMesh) {
          // Rotate around Y axis (flipping the card)
          userCard.cardMesh.rotation.y = originalRotation.y + Math.PI * easeProgress;
          
          // If animation is complete
          if (progress >= 1) {
            return;
          }
          
          // Continue animation
          requestAnimationFrame(animate);
        }
      };
      
      // Start animation
      animate();
    }
  }

  updateCardFace(cardMesh: THREE.Mesh, value: string): void {
    // Create a canvas texture for the text
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    if (context && cardMesh.material instanceof THREE.MeshStandardMaterial) {
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw text on canvas
      context.fillStyle = 'black';
      context.font = 'Bold 120px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(value, canvas.width / 2, canvas.height / 2);
      
      // Create texture from canvas
      const texture = new THREE.CanvasTexture(canvas);
      
      // Apply texture to front face of the card
      if (Array.isArray(cardMesh.material)) {
        // Update the appropriate face (front should be index 4)
        cardMesh.material[4] = new THREE.MeshStandardMaterial({ 
          map: texture,
          roughness: 0.1,
          metalness: 0.1
        });
      }
    }
  }

  private createCardMesh(value: string, revealed: boolean): THREE.Mesh {
    // Create card geometry
    const geometry = new THREE.BoxGeometry(this.cardWidth, this.cardHeight, this.cardDepth);
    
    // Create materials for all sides of the card
    const backMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1565c0, // Blue
      roughness: 0.5,
      metalness: 0.1 
    });
    
    // Create canvas for the front face if revealed
    let frontMaterial: THREE.MeshStandardMaterial;
    
    if (revealed) {
      // Create the front face with the card value
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const context = canvas.getContext('2d');
      
      if (context) {
        // Fill the canvas with white
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add a border
        context.strokeStyle = '#1976d2';
        context.lineWidth = 20;
        context.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        
        // Draw the card value with a bigger, bolder font
        context.fillStyle = '#1976d2'; // Blue text color
        context.font = 'Bold 180px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(value, canvas.width / 2, canvas.height / 2);
        
        // Add small value indicators in corners
        context.font = 'Bold 60px Arial';
        context.fillText(value, 70, 70); // Top left
        context.fillText(value, canvas.width - 70, canvas.height - 70); // Bottom right
        
        const texture = new THREE.CanvasTexture(canvas);
        frontMaterial = new THREE.MeshStandardMaterial({ 
          map: texture,
          roughness: 0.1,
          metalness: 0.1
        });
      } else {
        frontMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xffffff, // White
          roughness: 0.1,
          metalness: 0.1
        });
      }
    } else {
      // If not revealed, both sides are blue
      frontMaterial = backMaterial;
    }
    
    const edgeMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffffff, // White
      roughness: 0.5,
      metalness: 0.1 
    });
    
    const materials = [
      edgeMaterial, // Right side
      edgeMaterial, // Left side
      edgeMaterial, // Top edge
      edgeMaterial, // Bottom edge
      frontMaterial, // Front face (with value or blue)
      backMaterial  // Back face (blue)
    ];
    
    // Create the card mesh
    const cardMesh = new THREE.Mesh(geometry, materials);
    cardMesh.castShadow = true;
    cardMesh.receiveShadow = true;
    
    return cardMesh;
  }

  // Modified createCard method - no longer shows a card in the middle
  createCard(value: string): void {
    // This method is kept for backward compatibility but no longer displays a card
    // The user's card selection is shown in their hand on the table instead
  }

  private addTextToCard(value: string): void {
    // No longer needed but kept for backward compatibility
  }

  flipCard(): void {
    // No longer needed but kept for backward compatibility
  }

  private onWindowResize(container: HTMLElement): void {
    if (!this.camera || !this.renderer) return;
    
    // Make sure we get the actual dimensions
    const width = container.clientWidth || container.offsetWidth;
    const height = container.clientHeight || container.offsetHeight;
    
    // Only update if dimensions are valid (greater than 0)
    if (width > 0 && height > 0) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height, true);
    }
  }
  
  // Public method to manually trigger a resize when component is shown/hidden
  resizeRenderer(container: HTMLElement): void {
    // Small delay to ensure the container has settled into its new size
    setTimeout(() => {
      this.onWindowResize(container);
    }, 100);
  }

  private animate(): void {
    if (!this.scene || !this.camera || !this.renderer || !this.controls) return;
    
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    
    // Update controls
    this.controls.update();
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    // Stop animation loop
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    // Remove event listeners
    window.removeEventListener('resize', () => this.onWindowResize);
    
    // Dispose of Three.js resources
    if (this.cardMesh) {
      if (Array.isArray(this.cardMesh.material)) {
        this.cardMesh.material.forEach(material => material.dispose());
      }
      this.cardMesh.geometry.dispose();
    }
    
    // Dispose of user cards
    this.userCards.forEach(card => {
      if (Array.isArray(card.cardMesh.material)) {
        card.cardMesh.material.forEach(material => {
          if (material instanceof THREE.MeshStandardMaterial && material.map) {
            material.map.dispose();
          }
          material.dispose();
        });
      }
      card.cardMesh.geometry.dispose();
    });
    
    // Dispose of user avatars
    this.userAvatars.forEach(avatar => {
      if (avatar instanceof THREE.Group) {
        avatar.children.forEach(child => {
          if (child instanceof THREE.Mesh) {
            if (child.geometry) child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                if (mat instanceof THREE.MeshBasicMaterial && mat.map) {
                  mat.map.dispose();
                }
                mat.dispose();
              });
            } else if (child.material) {
              if (child.material instanceof THREE.MeshBasicMaterial && child.material.map) {
                child.material.map.dispose();
              }
              child.material.dispose();
            }
          }
        });
      }
    });
    
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }
} 