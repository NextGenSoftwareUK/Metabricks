import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthManagerService } from '../../../services/auth-manager.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-auth-status',
  template: `
    <div class="auth-status" [class.authenticated]="isAuthenticated" [class.not-authenticated]="!isAuthenticated">
      <span class="status-indicator">●</span>
      <span class="status-text">
        {{ getStatusText() }}
      </span>
      <button *ngIf="!isAuthenticated" (click)="authenticateNow()" class="retry-btn">
        Retry
      </button>
    </div>
  `,
  styles: [`
    .auth-status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .authenticated {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    
    .not-authenticated {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    
    .status-indicator {
      font-size: 16px;
    }
    
    .retry-btn {
      background: #007bff;
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 3px;
      font-size: 10px;
      cursor: pointer;
    }
    
    .retry-btn:hover {
      background: #0056b3;
    }
  `]
})
export class AuthStatusComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  private subscription: Subscription = new Subscription();

  constructor(private authManager: AuthManagerService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.authManager.currentToken$.subscribe(token => {
        this.isAuthenticated = !!token;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  getStatusText(): string {
    if (this.isAuthenticated) {
      return 'MetaBricks Ready';
    }
    return 'Connecting...';
  }

  authenticateNow(): void {
    // Refresh the page to re-authenticate MetaBricks
    window.location.reload();
  }
}
