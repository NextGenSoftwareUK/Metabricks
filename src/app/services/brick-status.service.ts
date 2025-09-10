import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface BrickStatus {
  brickId: string;
  isSold: boolean;
  available: boolean;
}

export interface SoldBrick {
  brickId: string;
  brickName: string;
  brickType: string;
  soldAt: string;
  walletAddress: string;
  transactionHash: string;
  tokenId: string;
}

export interface Purchase {
  id: string;
  timestamp: string;
  brickId: string;
  brickName: string;
  brickType: string;
  walletAddress: string;
  transactionHash: string;
  tokenId: string;
  price: number;
  imageUrl: string;
  perks: string[];
}

export interface HallOfFameEntry {
  walletAddress: string;
  totalPurchases: number;
  totalSpent: number;
  firstPurchase: string;
  lastPurchase: string;
  purchases: {
    brickId: string;
    brickName: string;
    brickType: string;
    transactionHash: string;
    timestamp: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class BrickStatusService {
  private baseUrl = 'http://localhost:3001/api';
  private soldBricksSubject = new BehaviorSubject<Set<string>>(new Set());
  public soldBricks$ = this.soldBricksSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadSoldBricks();
  }

  /**
   * Check if a specific brick is sold
   */
  checkBrickStatus(brickId: string): Observable<BrickStatus> {
    return this.http.get<{success: boolean, data: BrickStatus}>(`${this.baseUrl}/brick-status/${brickId}`)
      .pipe(map(response => response.data));
  }

  /**
   * Get all sold bricks
   */
  getSoldBricks(): Observable<SoldBrick[]> {
    return this.http.get<{success: boolean, data: SoldBrick[]}>(`${this.baseUrl}/sold-bricks`)
      .pipe(
        map(response => response.data),
        tap(soldBricks => {
          const soldBrickIds = new Set(soldBricks.map(brick => brick.brickId));
          this.soldBricksSubject.next(soldBrickIds);
        })
      );
  }

  /**
   * Get available bricks (not sold)
   */
  getAvailableBricks(): Observable<any[]> {
    return this.http.get<{success: boolean, data: any[]}>(`${this.baseUrl}/available-bricks`)
      .pipe(map(response => response.data));
  }

  /**
   * Get Hall of Fame (buyers)
   */
  getHallOfFame(): Observable<HallOfFameEntry[]> {
    return this.http.get<{success: boolean, data: HallOfFameEntry[]}>(`${this.baseUrl}/hall-of-fame`)
      .pipe(map(response => response.data));
  }

  /**
   * Get all purchases
   */
  getAllPurchases(): Observable<Purchase[]> {
    return this.http.get<{success: boolean, data: Purchase[]}>(`${this.baseUrl}/purchases`)
      .pipe(map(response => response.data));
  }

  /**
   * Load sold bricks on service initialization
   */
  private loadSoldBricks(): void {
    this.getSoldBricks().subscribe({
      next: (soldBricks) => {
        console.log('📋 Loaded sold bricks:', soldBricks.length);
      },
      error: (error) => {
        console.error('❌ Failed to load sold bricks:', error);
      }
    });
  }

  /**
   * Check if a brick is sold (synchronous)
   */
  isBrickSold(brickId: string): boolean {
    return this.soldBricksSubject.value.has(brickId);
  }

  /**
   * Refresh sold bricks data
   */
  refreshSoldBricks(): void {
    this.loadSoldBricks();
  }
}
