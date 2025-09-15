import { Component, OnInit } from '@angular/core';
import { BackendApiService } from '../../services/backend-api.service';
import { NFTMintingService } from '../../services/nft-minting.service';

@Component({
  selector: 'app-backend-test',
  template: `
    <div class="backend-test-container">
      <h2>🔗 Backend Connection Test</h2>
      
      <div class="status-section">
        <h3>Backend Status</h3>
        <div *ngIf="backendStatus" class="status-info">
          <p><strong>URL:</strong> {{ backendStatus.url }}</p>
          <p><strong>Status:</strong> 
            <span [class]="backendStatus.isOnline ? 'status-online' : 'status-offline'">
              {{ backendStatus.isOnline ? '🟢 Online' : '🔴 Offline' }}
            </span>
          </p>
          <p *ngIf="backendStatus.responseTime"><strong>Response Time:</strong> {{ backendStatus.responseTime }}ms</p>
          <p *ngIf="backendStatus.error" class="error-message"><strong>Error:</strong> {{ backendStatus.error }}</p>
        </div>
      </div>

      <div class="test-section">
        <h3>Test NFT Minting</h3>
        <div class="test-form">
          <input 
            type="text" 
            [(ngModel)]="testWalletAddress" 
            placeholder="Enter Solana wallet address"
            class="wallet-input"
          >
          <button 
            (click)="testNFTMinting()" 
            [disabled]="isTesting || !testWalletAddress"
            class="test-button"
          >
            {{ isTesting ? 'Testing...' : 'Test NFT Minting' }}
          </button>
        </div>
        
        <div *ngIf="mintResult" class="test-result">
          <h4>Test Result:</h4>
          <div [class]="mintResult.success ? 'result-success' : 'result-error'">
            <p><strong>Success:</strong> {{ mintResult.success ? '✅ Yes' : '❌ No' }}</p>
            <p *ngIf="mintResult.signature"><strong>Transaction:</strong> {{ mintResult.signature }}</p>
            <p *ngIf="mintResult.mintAddress"><strong>Mint Address:</strong> {{ mintResult.mintAddress }}</p>
            <p *ngIf="mintResult.error"><strong>Error:</strong> {{ mintResult.error }}</p>
            <p *ngIf="mintResult.transferError"><strong>Transfer Error:</strong> {{ mintResult.transferError }}</p>
          </div>
        </div>
      </div>

      <div class="actions">
        <button (click)="refreshStatus()" class="refresh-button">🔄 Refresh Status</button>
      </div>
    </div>
  `,
  styles: [`
    .backend-test-container {
      max-width: 800px;
      margin: 20px auto;
      padding: 20px;
      font-family: Arial, sans-serif;
    }

    .status-section, .test-section {
      margin: 20px 0;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: #f9f9f9;
    }

    .status-info p {
      margin: 8px 0;
    }

    .status-online {
      color: #28a745;
      font-weight: bold;
    }

    .status-offline {
      color: #dc3545;
      font-weight: bold;
    }

    .error-message {
      color: #dc3545;
    }

    .test-form {
      display: flex;
      gap: 10px;
      margin: 15px 0;
    }

    .wallet-input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 14px;
    }

    .test-button, .refresh-button {
      padding: 8px 16px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }

    .test-button:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }

    .test-button:hover:not(:disabled) {
      background: #0056b3;
    }

    .refresh-button {
      background: #28a745;
    }

    .refresh-button:hover {
      background: #1e7e34;
    }

    .test-result {
      margin-top: 15px;
      padding: 10px;
      border-radius: 4px;
    }

    .result-success {
      background: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
    }

    .result-error {
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
    }

    .test-result p {
      margin: 5px 0;
    }

    .actions {
      text-align: center;
      margin-top: 20px;
    }
  `]
})
export class BackendTestComponent implements OnInit {
  backendStatus: any = null;
  testWalletAddress: string = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';
  isTesting: boolean = false;
  mintResult: any = null;

  constructor(
    private backendApi: BackendApiService,
    private nftMintingService: NFTMintingService
  ) {}

  ngOnInit() {
    this.refreshStatus();
  }

  async refreshStatus() {
    try {
      this.backendStatus = await this.backendApi.getBackendStatus();
      console.log('Backend status:', this.backendStatus);
    } catch (error) {
      console.error('Failed to get backend status:', error);
      this.backendStatus = {
        isOnline: false,
        url: 'Unknown',
        error: 'Failed to connect'
      };
    }
  }

  async testNFTMinting() {
    if (!this.testWalletAddress) {
      alert('Please enter a wallet address');
      return;
    }

    this.isTesting = true;
    this.mintResult = null;

    try {
      console.log('Testing NFT minting with wallet:', this.testWalletAddress);
      
      const mintData = {
        walletAddress: this.testWalletAddress,
        brickId: 999, // Test brick ID
        brickName: 'Test MetaBrick #999'
      };

      const result = await this.nftMintingService.mintNFTViaBackend(mintData, 'regular');
      this.mintResult = result;
      
      console.log('NFT minting test result:', result);
    } catch (error) {
      console.error('NFT minting test failed:', error);
      this.mintResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      this.isTesting = false;
    }
  }
}
