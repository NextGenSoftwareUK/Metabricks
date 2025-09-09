import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  result: {
    jwtToken: string;
    refreshToken: string;
    avatarId: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthManagerService {
  private readonly API_BASE_URL = 'https://localhost:5002';
  private readonly CREDENTIALS: AuthCredentials = {
    username: 'metabricks_admin',
    password: 'Uppermall1!'
  };

  private currentTokenSubject = new BehaviorSubject<string>('');
  public currentToken$ = this.currentTokenSubject.asObservable();

  private refreshTokenSubject = new BehaviorSubject<string>('');
  private avatarIdSubject = new BehaviorSubject<string>('');

  constructor(private http: HttpClient) {
    console.log('🔧 AuthManagerService constructor called');
    
    // Make service available globally for debugging
    (window as any).authManager = this;
    
    // Delay initialization to ensure HTTP client is ready
    setTimeout(() => {
      this.initializeAuth();
    }, 1000);
  }

  /**
   * Initialize authentication and set up automatic refresh
   */
  private initializeAuth(): void {
    console.log('🚀 Initializing authentication...');
    
    // Authenticate immediately
    this.authenticate().subscribe({
      next: (response) => {
        console.log('✅ Initial authentication successful');
      },
      error: (error) => {
        console.error('❌ Initial authentication failed:', error);
        // Retry after 5 seconds
        setTimeout(() => {
          console.log('🔄 Retrying authentication...');
          this.authenticate().subscribe();
        }, 5000);
      }
    });

    // Set up automatic refresh every 10 minutes (before 15-minute expiry)
    timer(0, 10 * 60 * 1000).pipe(
      switchMap(() => this.authenticate()),
      catchError(error => {
        console.error('❌ Auto-refresh authentication failed:', error);
        return this.authenticate(); // Retry once
      })
    ).subscribe();
  }

  /**
   * Authenticate with OASIS API and get fresh tokens
   */
  private authenticate(): Observable<AuthResponse> {
    console.log('🔐 Authenticating with OASIS API...');
    
    return this.http.post<AuthResponse>(`${this.API_BASE_URL}/api/avatar/authenticate`, this.CREDENTIALS).pipe(
      tap(response => {
        if (response?.result?.jwtToken) {
          this.currentTokenSubject.next(response.result.jwtToken);
          this.refreshTokenSubject.next(response.result.refreshToken);
          this.avatarIdSubject.next(response.result.avatarId);
          console.log('✅ Authentication successful, token refreshed');
        } else {
          throw new Error('Invalid authentication response');
        }
      }),
      catchError(error => {
        console.error('❌ Authentication failed:', error);
        throw error;
      })
    );
  }

  /**
   * Get current valid JWT token
   */
  getCurrentToken(): string {
    return this.currentTokenSubject.value;
  }

  /**
   * Get current avatar ID
   */
  getCurrentAvatarId(): string {
    return this.avatarIdSubject.value;
  }

  /**
   * Check if authentication is ready
   */
  isAuthenticated(): boolean {
    return !!this.currentTokenSubject.value;
  }

  /**
   * Force refresh authentication (for manual intervention)
   */
  forceRefresh(): Observable<AuthResponse> {
    console.log('🔄 Force refreshing authentication...');
    return this.authenticate();
  }

  /**
   * Wait for authentication to be ready
   */
  waitForAuthentication(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isAuthenticated()) {
        resolve(true);
        return;
      }

      // Wait up to 30 seconds for authentication
      const timeout = setTimeout(() => {
        console.error('⏰ Authentication timeout after 30 seconds');
        resolve(false);
      }, 30000);

      // Check every second if authentication is ready
      const interval = setInterval(() => {
        if (this.isAuthenticated()) {
          clearTimeout(timeout);
          clearInterval(interval);
          resolve(true);
        }
      }, 1000);
    });
  }
}
