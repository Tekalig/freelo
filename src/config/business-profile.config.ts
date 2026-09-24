import { registerAs } from '@nestjs/config';

export default registerAs('businessProfile', () => ({
  name: process.env.BUSINESS_NAME ?? 'Your Company',
  address: process.env.BUSINESS_ADDRESS ?? '',
  email: process.env.BUSINESS_EMAIL ?? '',
  phone: process.env.BUSINESS_PHONE ?? '',
  bankName: process.env.BUSINESS_BANK_NAME ?? '',
  bankAccount: process.env.BUSINESS_BANK_ACCOUNT ?? '',
  bankRouting: process.env.BUSINESS_BANK_ROUTING ?? '',
}));
