import { Component, OnInit } from '@angular/core';
import { DirectOASISService } from '../../services/direct-oasis.service';

@Component({
  selector: 'app-test-direct-oasis',
  template: `
    <div style="padding: 20px; border: 2px solid #007bff; margin: 20px; border-radius: 8px;">
      <h3>🧪 Direct OASIS Service Test</h3>
      
      <div *ngIf="isLoading" style="color: #007bff;">
        ⏳ {{ loadingMessage }}
      </div>
      
      <div *ngIf="result" style="color: #28a745; margin-top: 10px;">
        <h4>✅ Test Result:</h4>
        <pre style="background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto;">{{ result | json }}</pre>
      </div>
      
      <div *ngIf="error" style="color: #dc3545; margin-top: 10px;">
        <h4>❌ Test Error:</h4>
        <pre style="background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto;">{{ error }}</pre>
      </div>
      
      <button 
        (click)="testDirectMinting()" 
        [disabled]="isLoading"
        style="margin-top: 10px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
        🚀 Test Direct NFT Minting
      </button>
    </div>
  `,
  standalone: true
})
export class TestDirectOasisComponent implements OnInit {
  isLoading = false;
  loadingMessage = '';
  result: any = null;
  error: string | null = null;

  constructor(private directOASISService: DirectOASISService) {}

  ngOnInit() {
    this.initializeService();
  }

  async initializeService() {
    try {
      this.isLoading = true;
      this.loadingMessage = 'Initializing Direct OASIS Service...';
      
      await this.directOASISService.initialize();
      
      this.loadingMessage = '✅ Service initialized successfully!';
      setTimeout(() => {
        this.isLoading = false;
        this.loadingMessage = '';
      }, 2000);
    } catch (error: any) {
      this.isLoading = false;
      this.error = `Service initialization failed: ${error.message}`;
    }
  }

  async testDirectMinting() {
    try {
      this.isLoading = true;
      this.error = null;
      this.result = null;
      
      this.loadingMessage = 'Testing direct NFT minting...';
      
      // Test with a simple brick
      const result = await this.directOASISService.mintAndTransferNFT(
        '5asLfkbBXe3N8sJ8JQfRuSGxUJHhMGjnY2hRyqcJSuaW', // Test wallet
        'Brick 50', // Test brick
        'MetaBrick #Brick 50', // Test name
        'regular' // Test type
      );
      
      this.result = result;
      this.loadingMessage = '✅ Direct minting test completed!';
      
      setTimeout(() => {
        this.isLoading = false;
        this.loadingMessage = '';
      }, 2000);
      
    } catch (error: any) {
      this.isLoading = false;
      this.error = `Direct minting test failed: ${error.message}`;
    }
  }
}
