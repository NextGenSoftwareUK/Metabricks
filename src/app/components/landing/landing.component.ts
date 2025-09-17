import { Component, OnInit } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { BrickDetailsComponent } from '../popup/brick-details/brick-details.component';
import { WhatComponent } from '../popup/what/what.component';
import { HowComponent } from '../popup/how/how.component';
import { WhitepaperComponent } from '../popup/whitepaper/whitepaper.component';
import { DeliverableComponent } from '../popup/deliverable/deliverable.component';
import { HttpClient } from '@angular/common/http';
import { BrickEventsService } from '../../services/brick-events.service';
import { WalletService } from '../../services/wallet.service';
import { BrickStatusService } from '../../services/brick-status.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {
  allBricks: any[] = [];
  mintedBricks: string[] = [];
  modalRef!: BsModalRef;
  walletAddress: string | null = null;
  isOnRightSide: boolean = false;
  isHamburgerOpen: boolean = false;
  
  // Brick count properties
  destroyedCount: number = 0;
  leftCount: number = 432; // Total bricks
  
  // Position tracking for brick count box
  isCountOnLeftSide: boolean = false;
  
  // Position tracking for navigation box
  isNavOnRightSide: boolean = false;

  constructor(
    private modalService: BsModalService, 
    private http: HttpClient, 
    private brickEvents: BrickEventsService,
    private walletService: WalletService,
    private brickStatusService: BrickStatusService
  ) {}

  ngOnInit(): void {
    this.loadSoldBricksAndResetWall();
    this.fetchMintedBricks();
    this.checkWalletConnection();
    this.brickEvents.minted$.subscribe((mintedBrick) => {
      console.log('🎯 Brick minted event received:', mintedBrick);
      
      if (mintedBrick) {
        // Use the brick data passed from the mint component
        const brick = this.allBricks.find(b => 
          b.id === mintedBrick.id || 
          b.brickNumber === mintedBrick.brickNumber ||
          b.metadataUri === mintedBrick.metadataUri
        );
        
        if (brick) {
          console.log('💥 Triggering explosion for brick:', brick.brickNumber);
          this.triggerExplosion(brick);
        } else {
          console.log('❌ Could not find brick in allBricks array');
        }
      }
      
      this.fetchMintedBricks();
      // Refresh wall to remove sold brick after a short delay
      setTimeout(() => {
        this.loadSoldBricksAndResetWall();
      }, 1000);
    });
  }

  /**
   * Load sold bricks and reset wall to hide sold bricks
   */
  loadSoldBricksAndResetWall(): void {
    console.log('🔄 Loading sold bricks and resetting wall...');
    this.brickStatusService.getSoldBricks().subscribe({
      next: (soldBricks) => {
        console.log('📋 Loaded sold bricks:', soldBricks.length);
        console.log('📋 Sold brick IDs:', soldBricks.map(b => b.brickId));
        // Wait a bit for the BehaviorSubject to update, then reset wall
        setTimeout(() => {
          this.resetWall();
        }, 100);
      },
      error: (error) => {
        console.error('❌ Failed to load sold bricks:', error);
        this.resetWall(); // Still reset wall even if loading fails
      }
    });
  }

  async resetMintedBricks(): Promise<void> {
    // Call a backend endpoint to reset mintedBricks.json
    try {
      await this.http.post('http://localhost:3001/api/reset-minted-bricks', {}).toPromise();
    } catch (err) {
      console.error('Failed to reset minted bricks', err);
    }
  }

  resetWall(): void {
    this.allBricks = [];
    const rows = 24;
    const cols = 18;
    // Updated to use the new randomized MetaBricks IPFS hash
    const METADATA_CID = 'bafybeihkspp2kxsz4moylkgjpkdwm4sbafqluqmtzh3hy7x42jhvx6n5ym';
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        let isOffsetRow = i % 2 !== 0;
        let offsetAdjustment = isOffsetRow ? 0.5 : 0;
        const id = i * cols + j;
        
        // Enable all 432 bricks with metadata (not just first 30)
        const brickNumber = id + 1;
        const metadataUri = brickNumber <= 432 ? `https://gateway.pinata.cloud/ipfs/${METADATA_CID}/${brickNumber}.json` : null;
        
        // Check if brick is sold to set transparency and availability
        const isSold = this.brickStatusService.isBrickSold(brickNumber.toString());
        
        // Debug logging for sold bricks
        if (isSold) {
          console.log(`🔍 Brick ${brickNumber} is marked as sold`);
        }
        
        // Always add all bricks, but set transparency and availability based on sold status
        this.allBricks.push({
          id: id,
          brickNumber: `Brick ${brickNumber}`,
          mintPrice: '$50',
          position: `X${j + offsetAdjustment + 1}, Y${i + 1}`,
          offset: isOffsetRow,
          metadataUri: metadataUri,
          // Add brick number for easy reference
          brickNumberForMetadata: brickNumber <= 432 ? brickNumber : null,
          seriesNumber: brickNumber,
          sold: isSold,
          // Set transparency to 0 for sold bricks, 1 for available bricks
          opacity: isSold ? 0 : 1,
          // Make sold bricks unavailable to mint
          available: !isSold
        });
      }
    }
    
    // Update brick counts - count available bricks (not sold)
    this.leftCount = this.allBricks.filter(brick => !brick.sold).length;
    this.destroyedCount = this.allBricks.filter(brick => brick.sold).length;
    
    console.log(`📊 Brick counts updated: ${this.leftCount} available, ${this.destroyedCount} sold`);
  }

  fetchMintedBricks(): void {
    this.http.get<{ success: boolean; data: string[]; totalMinted: number }>('http://localhost:3001/api/minted-bricks').subscribe({
      next: (res) => {
        this.mintedBricks = res.data || [];
        // Update brick counts based on sold status (not minted status)
        this.destroyedCount = this.allBricks.filter(brick => brick.sold).length;
        this.leftCount = this.allBricks.filter(brick => !brick.sold).length;
      },
      error: (err) => {
        console.error('Failed to fetch minted bricks', err);
        this.mintedBricks = []; // Set empty array on error
      }
    });
  }

  isMinted(brick: any): boolean {
    // Check if this brick's ID is in the mintedBricks array
    // mintedBricks contains brick IDs as strings (e.g., "1", "2", "3")
    const brickId = brick.seriesNumber?.toString() || brick.brickNumberForMetadata?.toString();
    return !!brickId && this.mintedBricks && this.mintedBricks.includes(brickId);
  }

  // Call this after a successful mint
  triggerExplosion(brick: any): void {
    console.log('💥 triggerExplosion called for brick:', brick);
    
    if (!brick) {
      console.log('❌ No brick provided to triggerExplosion');
      return;
    }
    
    brick.exploding = true;
    brick.shattering = true; // Add shatter effect
    
    console.log('🎬 Starting explosion animation for brick:', brick.brickNumber);
    
    // Play explosion sound
    this.playExplosionSound();
    
    // After animation, mark brick as sold and remove from wall
    setTimeout(() => {
      brick.exploding = false;
      brick.shattering = false;
      brick.sold = true;
      brick.opacity = 0;
      brick.available = false;
      
      // Update counts
      this.leftCount = this.allBricks.filter(brick => !brick.sold).length;
      this.destroyedCount = this.allBricks.filter(brick => brick.sold).length;
      
      console.log(`💥 Brick ${brick.brickNumber} destroyed! Counts: ${this.leftCount} left, ${this.destroyedCount} destroyed`);
    }, 2000); // 2 second shatter animation
  }

  // Play explosion sound effect
  private playExplosionSound(): void {
    try {
      // Try multiple sound files for better compatibility
      const soundFiles = [
        'assets/sounds/explosion.mp3',
        'assets/sounds/explosion.wav',
        'assets/explosion.mp3',
        'assets/explosion.wav'
      ];
      
      let audioPlayed = false;
      
      for (const soundFile of soundFiles) {
        try {
          const audio = new Audio(soundFile);
          audio.volume = 0.7;
          audio.play().then(() => {
            audioPlayed = true;
          }).catch(() => {
            // Try next sound file
          });
          break; // If we get here, sound started playing
        } catch (error) {
          // Try next sound file
        }
      }
      
      // Fallback: create a simple beep sound using Web Audio API
      if (!audioPlayed) {
        this.createBeepSound();
      }
    } catch (error) {
      console.log('Could not play explosion sound:', error);
      this.createBeepSound();
    }
  }

  // Create a simple beep sound as fallback
  private createBeepSound(): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.5);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Could not create beep sound:', error);
    }
  }

  // Check wallet connection status
  async checkWalletConnection(): Promise<void> {
    try {
      const publicKey = await this.walletService.checkWalletConnected();
      this.walletAddress = publicKey ? publicKey.toString() : null;
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      this.walletAddress = null;
    }
  }

  // Connect wallet
  async connectWallet(): Promise<void> {
    try {
      const result = await this.walletService.connectWallet();
      if (result) {
        this.walletAddress = result.publicKey.toString();
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  }

  filterBricks(): void {
    if (!this.mintedBricks) this.mintedBricks = [];
    console.log('Minted list:', this.mintedBricks);
    console.log('All wall brick URIs:', this.allBricks.map(b => b.metadataUri));
    // this.bricks = this.allBricks.filter(brick => brick.metadataUri && !this.mintedBricks.includes(brick.metadataUri));
  }

  generateBricks(): void {
    const rows = 24; // 24 rows as mentioned
    const cols = 18; // 18 columns for each row
    // Updated to use the new randomized MetaBricks IPFS hash
    const METADATA_CID = 'bafybeihkspp2kxsz4moylkgjpkdwm4sbafqluqmtzh3hy7x42jhvx6n5ym';
    let index = 0;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        let isOffsetRow = i % 2 !== 0;
        let offsetAdjustment = isOffsetRow ? 0.5 : 0; // Adjust X position by half a brick width on odd rows
        const id = i * cols + j;
        const brickNumber = id + 1;
        
        // Enable all 432 bricks with metadata
        if (brickNumber <= 432) {
          // this.bricks.push({ // This line was removed as per the edit hint
          //   id: id,
          //   brickNumber: `Brick ${brickNumber}`,
          //   mintPrice: '0.4 SOL',
          //   position: `X${j + offsetAdjustment + 1}, Y${i + 1}`,
          //   offset: isOffsetRow, // Adding the offset property for conditional styling
          //   metadataUri: `https://gateway.pinata.cloud/ipfs/${METADATA_CID}/${brickNumber}.json`
          // });
        }
      }
    }
  }
  

  openBrickModal(brick: any): void {
    console.log('Clicked brick metadataUri:', brick.metadataUri);
    this.modalRef = this.modalService.show(BrickDetailsComponent, {
      class: 'modal-dialog-slide-up',
      initialState: {
        brick: brick  // Pass the clicked brick's data to the modal
      }
    });
  }

  openModal(type: string): void {
    let component: any;
    
    switch (type) {
      case 'what':
        component = this.modalService.show(WhatComponent);
        break;
      case 'how':
        component = this.modalService.show(HowComponent);
        break;
      case 'whitepaper':
        component = this.modalService.show(WhitepaperComponent);
        break;
      case 'deliverable':
        component = this.modalService.show(DeliverableComponent);
        break;
    }
  }

  togglePosition(): void {
    this.isOnRightSide = !this.isOnRightSide;
  }

  toggleHamburgerMenu(): void {
    this.isHamburgerOpen = !this.isHamburgerOpen;
  }

  toggleCountPosition(): void {
    this.isCountOnLeftSide = !this.isCountOnLeftSide;
  }

  toggleNavPosition(): void {
    this.isNavOnRightSide = !this.isNavOnRightSide;
  }

  forceRefresh(): void {
    this.fetchMintedBricks();
  }
}
