import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BrickEventsService {
  private mintedSubject = new Subject<any>();
  minted$ = this.mintedSubject.asObservable();

  private networkChangeSubject = new Subject<'solana' | 'arbitrum'>();
  networkChange$ = this.networkChangeSubject.asObservable();

  notifyMinted(brickData?: any) {
    this.mintedSubject.next(brickData);
  }

  emitNetworkChange(network: 'solana' | 'arbitrum') {
    this.networkChangeSubject.next(network);
  }
} 