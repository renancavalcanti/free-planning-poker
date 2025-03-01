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
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
    
    // Add point light
    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(0, 6, 0);
    this.scene.add(pointLight);
    
    // Create table
    this.createTable();
    
    // Add a floor
    this.addFloor();
    
    // Set up event listener for window resize
    window.addEventListener('resize', () => this.onWindowResize(container));
    
    // Start animation loop
    this.animate();
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
  }

  private addFloor(): void {
    if (!this.scene) return;
    
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xe0e0e0, // Light gray
      roughness: 1.0,
      metalness: 0.0
    });
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2; // Make it horizontal
    floor.position.y = 0; // At floor level
    floor.receiveShadow = true;
    this.scene.add(floor);
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

  // Original card-related methods kept for backward compatibility
  createCard(value: string): void {
    if (!this.scene) return;
    
    // Remove existing card if any
    if (this.cardMesh) {
      this.scene.remove(this.cardMesh);
    }
    
    // Create the card mesh
    this.cardMesh = this.createCardMesh(value, true);
    this.cardMesh.position.set(0, 4, 0); // Floating above the table
    this.scene.add(this.cardMesh);
  }

  private addTextToCard(value: string): void {
    if (!this.scene || !this.cardMesh) return;
    
    // Create a canvas texture for the text
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    if (context) {
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw text on canvas
      context.fillStyle = 'black';
      context.font = 'Bold 160px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(value, canvas.width / 2, canvas.height / 2);
      
      // Create texture from canvas
      const texture = new THREE.CanvasTexture(canvas);
      
      // Apply texture to front face of the card
      if (Array.isArray(this.cardMesh.material)) {
        this.cardMesh.material[4] = new THREE.MeshStandardMaterial({ 
          map: texture 
        });
      }
    }
  }

  flipCard(): void {
    if (!this.cardMesh) return;
    
    // Animate the card flip
    const duration = 1000; // in milliseconds
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use easing function for smoother animation
      const easeProgress = this.easeInOutQuad(progress);
      
      // Calculate rotation angle
      const rotationY = Math.PI * easeProgress;
      
      if (this.cardMesh) {
        this.cardMesh.rotation.y = rotationY;
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  private onWindowResize(container: HTMLElement): void {
    if (!this.camera || !this.renderer) return;
    
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
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
} 