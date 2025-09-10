import { Component, OnInit } from '@angular/core';
import { BrickStatusService, HallOfFameEntry } from '../../services/brick-status.service';

@Component({
  selector: 'app-hall-of-fame',
  templateUrl: './hall-of-fame.component.html',
  styleUrls: ['./hall-of-fame.component.scss']
})
export class HallOfFameComponent implements OnInit {
  hallOfFame: HallOfFameEntry[] = [];
  loading = true;
  error: string | null = null;

  constructor(private brickStatusService: BrickStatusService) { }

  ngOnInit(): void {
    this.loadHallOfFame();
  }

  loadHallOfFame(): void {
    this.loading = true;
    this.error = null;

    this.brickStatusService.getHallOfFame().subscribe({
      next: (data) => {
        this.hallOfFame = data;
        this.loading = false;
        console.log('🏆 Loaded Hall of Fame:', data.length, 'buyers');
      },
      error: (error) => {
        console.error('❌ Failed to load Hall of Fame:', error);
        this.error = 'Failed to load Hall of Fame data';
        this.loading = false;
      }
    });
  }

  formatWalletAddress(address: string): string {
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

}