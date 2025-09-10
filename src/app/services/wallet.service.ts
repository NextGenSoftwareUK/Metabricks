// src/app/services/wallet.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';

// MetaMask types
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (accounts: string[]) => void) => void;
      removeListener: (event: string, callback: (accounts: string[]) => void) => void;
    };
  }
}

// Define the OASISResult interface locally since oasis.service doesn't exist
export interface OASISResult<T> {
  result: T | null;
  isError: boolean;
  message: string;
  exception?: any;
}

export interface WalletTransactionRequest {
  fromAvatarId: string;
  toAvatarId: string;
  amount: number;
  tokenSymbol: string;
  providerType: string;
  walletId: string;
}

export interface ProviderWallet {
  id: string;
  avatarId: string;
  providerType: string;
  publicKey: string;
  walletAddress: string;
  balance: number;
  transactions: WalletTransaction[];
  isDefault: boolean;
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  tokenSymbol: string;
  transactionHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  gasUsed?: number;
  gasPrice?: number;
}

export interface CreateWalletRequest {
  avatarId: string;
  name: string;
  type: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  
  private baseUrl = 'http://api.oasisplatform.world'; // OASIS API endpoint
  private apiKey = ''; // Add your OASIS API key here

  constructor(private http: HttpClient) {}

  // Add the missing methods that existing components expect
  async checkWalletConnected(): Promise<string | null> {
    try {
      // For demo purposes, return a mock wallet address
      // In a real implementation, this would check actual wallet connection
      return '0x1234567890abcdef1234567890abcdef12345678';
    } catch (error: any) {
      console.error('Failed to check wallet connection:', error);
      return null;
    }
  }

  async connectWallet(): Promise<any> {
    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please connect your MetaMask wallet.');
      }

      const wallet = {
        publicKey: accounts[0],
        isConnected: true,
        address: accounts[0]
      };
      
      console.log('✅ MetaMask wallet connected:', wallet);
      return wallet;
    } catch (error: any) {
      console.error('❌ Error connecting wallet:', error);
      throw error;
    }
  }

  async sendTransaction(to: string, value: string, data?: string): Promise<string> {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed.');
      }

      // Get current account
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found.');
      }

      // Prepare transaction
      const transactionParameters = {
        from: accounts[0],
        to: to,
        value: value, // Amount in wei (0.02 ETH = 20000000000000000 wei)
        data: data || '0x', // Optional data
      };

      console.log('🚀 Sending MetaMask transaction:', transactionParameters);

      // Send transaction - this will show MetaMask popup
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      });

      console.log('✅ Transaction sent:', txHash);
      return txHash;
    } catch (error: any) {
      console.error('❌ Transaction failed:', error);
      throw error;
    }
  }

  getMintedBricks(): Observable<{ minted: string[] }> {
    // For demo purposes, return mock minted bricks
    // In a real implementation, this would fetch from backend
    const mockMintedBricks = {
      minted: [
        '0x1234567890abcdef1234567890abcdef12345678',
        '0xabcdef1234567890abcdef1234567890abcdef12'
      ]
    };
    
    return of(mockMintedBricks);
  }

  // Keep existing methods
  async createWallet(walletData: CreateWalletRequest): Promise<OASISResult<ProviderWallet>> {
    try {
      const response = await this.http.post<OASISResult<ProviderWallet>>(
        `${this.baseUrl}/api/wallet/create`,
        walletData,
        this.getHeaders()
      ).toPromise();
      
      return response || { result: null, isError: true, message: 'Failed to create wallet' };
    } catch (error: any) {
      return { result: null, isError: true, message: error?.message || 'Failed to create wallet' };
    }
  }
  
  async loadWalletsByAvatarId(avatarId: string, providerType?: string): Promise<OASISResult<ProviderWallet[]>> {
    try {
      let url = `${this.baseUrl}/api/wallet/load_wallets_by_id/${avatarId}`;
      if (providerType) {
        url += `?providerType=${providerType}`;
      }
      
      const response = await this.http.get<OASISResult<ProviderWallet[]>>(
        url,
        this.getHeaders()
      ).toPromise();
      
      return response || { result: [], isError: false, message: 'No wallets found' };
    } catch (error: any) {
      return { result: [], isError: true, message: error?.message || 'Failed to load wallets' };
    }
  }
  
  async loadWalletsByUsername(username: string, providerType?: string): Promise<OASISResult<ProviderWallet[]>> {
    try {
      let url = `${this.baseUrl}/api/wallet/load_wallets_by_username/${username}`;
      if (providerType) {
        url += `?providerType=${providerType}`;
      }
      
      const response = await this.http.get<OASISResult<ProviderWallet[]>>(
        url,
        this.getHeaders()
      ).toPromise();
      
      return response || { result: [], isError: false, message: 'No wallets found' };
    } catch (error: any) {
      return { result: [], isError: true, message: error?.message || 'Failed to load wallets' };
    }
  }
  
  async loadWalletsByEmail(email: string, providerType?: string): Promise<OASISResult<ProviderWallet[]>> {
    try {
      let url = `${this.baseUrl}/api/wallet/load_wallets_by_email/${email}`;
      if (providerType) {
        url += `?providerType=${providerType}`;
      }
      
      const response = await this.http.get<OASISResult<ProviderWallet[]>>(
        url,
        this.getHeaders()
      ).toPromise();
      
      return response || { result: [], isError: false, message: 'No wallets found' };
    } catch (error: any) {
      return { result: [], isError: false, message: 'No wallets found' };
    }
  }
  
  async saveWalletsByAvatarId(avatarId: string, wallets: ProviderWallet[], providerType?: string): Promise<OASISResult<boolean>> {
    try {
      let url = `${this.baseUrl}/api/wallet/save_wallets_by_id/${avatarId}`;
      if (providerType) {
        url += `?providerType=${providerType}`;
      }
      
      const response = await this.http.post<OASISResult<boolean>>(
        url,
        wallets,
        this.getHeaders()
      ).toPromise();
      
      return response || { result: false, isError: true, message: 'Failed to save wallets' };
    } catch (error: any) {
      return { result: false, isError: true, message: error?.message || 'Failed to save wallets' };
    }
  }
  
  // Transaction Management
  async sendToken(transaction: WalletTransactionRequest): Promise<OASISResult<any>> {
    try {
      const response = await this.http.post<OASISResult<any>>(
        `${this.baseUrl}/api/wallet/send_token`,
        transaction,
        this.getHeaders()
      ).toPromise();
      
      return response || { result: null, isError: true, message: 'Failed to send token' };
    } catch (error: any) {
      return { result: null, isError: true, message: error?.message || 'Failed to send token' };
    }
  }
  
  async getTransactionHistory(walletId: string): Promise<OASISResult<WalletTransaction[]>> {
    try {
      const response = await this.http.get<OASISResult<WalletTransaction[]>>(
        `${this.baseUrl}/api/wallet/transactions/${walletId}`,
        this.getHeaders()
      ).toPromise();
      
      return response || { result: [], isError: false, message: 'No transactions found' };
    } catch (error: any) {
      return { result: [], isError: false, message: 'No transactions found' };
    }
  }
  
  // Wallet Operations
  async getDefaultWallet(avatarId: string, providerType: string): Promise<OASISResult<ProviderWallet>> {
    try {
      const response = await this.http.get<OASISResult<ProviderWallet>>(
        `${this.baseUrl}/api/wallet/default_wallet/${avatarId}?providerType=${providerType}`,
        this.getHeaders()
      ).toPromise();
      
      return response || { result: null, isError: true, message: 'No default wallet found' };
    } catch (error: any) {
      return { result: null, isError: true, message: error?.message || 'Failed to get default wallet' };
    }
  }
  
  async setDefaultWallet(avatarId: string, walletId: string, providerType: string): Promise<OASISResult<boolean>> {
    try {
      const response = await this.http.post<OASISResult<boolean>>(
        `${this.baseUrl}/api/wallet/set_default_wallet`,
        { avatarId, walletId, providerType },
        this.getHeaders()
      ).toPromise();
      
      return response || { result: false, isError: true, message: 'Failed to set default wallet' };
    } catch (error: any) {
      return { result: false, isError: true, message: error?.message || 'Failed to set default wallet' };
    }
  }
  
  async getWalletByPublicKey(publicKey: string, providerType: string): Promise<OASISResult<ProviderWallet>> {
    try {
      const response = await this.http.get<OASISResult<ProviderWallet>>(
        `${this.baseUrl}/api/wallet/wallet_by_public_key/${publicKey}?providerType=${providerType}`,
        this.getHeaders()
      ).toPromise();
      
      return response || { result: null, isError: true, message: 'Wallet not found' };
    } catch (error: any) {
      return { result: null, isError: true, message: error?.message || 'Failed to get wallet' };
    }
  }
  
  // Balance Management
  async getWalletBalance(walletId: string, providerType: string): Promise<OASISResult<number>> {
    try {
      const response = await this.http.get<OASISResult<number>>(
        `${this.baseUrl}/api/wallet/balance/${walletId}?providerType=${providerType}`,
        this.getHeaders()
      ).toPromise();
      
      return response || { result: 0, isError: true, message: 'Failed to get balance' };
    } catch (error: any) {
      return { result: 0, isError: true, message: error?.message || 'Failed to get balance' };
    }
  }
  
  async refreshWalletBalance(walletId: string, providerType: string): Promise<OASISResult<number>> {
    try {
      const response = await this.http.post<OASISResult<number>>(
        `${this.baseUrl}/api/wallet/refresh_balance`,
        { walletId, providerType },
        this.getHeaders()
      ).toPromise();
      
      return response || { result: 0, isError: true, message: 'Failed to refresh balance' };
    } catch (error: any) {
      return { result: 0, isError: true, message: error?.message || 'Failed to refresh balance' };
    }
  }
  
  // Utility Methods
  async clearCache(): Promise<OASISResult<boolean>> {
    try {
      const response = await this.http.post<OASISResult<boolean>>(
        `${this.baseUrl}/api/wallet/clear_cache`,
        {},
        this.getHeaders()
      ).toPromise();
      
      return response || { result: false, isError: true, message: 'Failed to clear cache' };
    } catch (error: any) {
      return { result: false, isError: true, message: error?.message || 'Failed to clear cache' };
    }
  }
  
  // Helper methods
  private getHeaders(): { headers: HttpHeaders } {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    if (this.apiKey) {
      headers.set('Authorization', `Bearer ${this.apiKey}`);
    }
    
    return { headers };
  }
}
