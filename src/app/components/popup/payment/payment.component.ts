import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { PaymentService, PaymentMethod, PaymentRequest, PaymentResponse } from '../../../services/payment.service';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit {
  @Input() brickId: string = '';
  @Input() brickName: string = '';
  @Input() price: number = 0.02;
  @Input() walletAddress: string = '';
  
  @Output() paymentComplete = new EventEmitter<PaymentResponse>();
  @Output() paymentCancel = new EventEmitter<void>();

  paymentMethods: PaymentMethod[] = [];
  selectedMethod: string = '';
  isLoading: boolean = false;
  error: string = '';

  constructor(private paymentService: PaymentService) {}

  ngOnInit() {
    this.loadPaymentMethods();
  }

  async loadPaymentMethods() {
    this.paymentService.getPaymentMethods().subscribe(methods => {
      this.paymentMethods = methods;
      
      // Auto-select first available method
      const availableMethod = methods.find(m => m.enabled);
      if (availableMethod) {
        this.selectedMethod = availableMethod.id;
      }
    });
  }

  async selectPaymentMethod(methodId: string) {
    this.selectedMethod = methodId;
    this.error = '';
  }

  async processPayment() {
    if (!this.selectedMethod) {
      this.error = 'Please select a payment method';
      return;
    }

    this.isLoading = true;
    this.error = '';

    try {
      const paymentRequest: PaymentRequest = {
        brickId: this.brickId,
        brickName: this.brickName,
        price: this.price,
        walletAddress: this.walletAddress,
        paymentMethod: this.getPaymentMethodType(this.selectedMethod)
      };

      const response = await this.paymentService.processPayment(paymentRequest);
      
      if (response.success) {
        this.paymentComplete.emit(response);
      } else {
        this.error = response.error || 'Payment failed';
      }

    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Payment failed';
    } finally {
      this.isLoading = false;
    }
  }

  private getPaymentMethodType(methodId: string): 'crypto' | 'stripe' {
    switch (methodId) {
      case 'metamask':
      case 'phantom':
        return 'crypto';
      case 'stripe':
        return 'stripe';
      default:
        return 'crypto';
    }
  }

  cancel() {
    this.paymentCancel.emit();
  }

  getSelectedMethod(): PaymentMethod | undefined {
    return this.paymentMethods.find(m => m.id === this.selectedMethod);
  }
}
