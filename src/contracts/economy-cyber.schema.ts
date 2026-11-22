import { z } from 'zod';

/**
 * [L0] FUP-004 / FUP-008 | SM-03 / SM-04 | SADT A3.3–A3.5
 * Economy (Bank Loans, Market Exchange, Anno 3-Module Extensions), 4-Class Drones & Cyber-Paralysis.
 */
export const TradableResourceSchema = z.enum(['materials', 'water', 'food', 'electronics', 'helium3']);

export const MarketTradeIntentSchema = z.object({
  resource: TradableResourceSchema,
  action: z.enum(['BUY', 'SELL']),
  quantity: z.number().int().min(1).max(200),
});

export const BankLoanRequestSchema = z.object({
  principal: z.number().min(100).max(2500),
});

export const AnnoModuleGraftIntentSchema = z.object({
  districtId: z.string().min(2).max(64),
  moduleSlot: z.number().int().min(1).max(3),
  moduleKind: z.enum(['ENERGY_CORE', 'LOGISTICS_BAY', 'BIO_FILTER']),
});

export const DroneRoleSchema = z.enum(['construction', 'defense', 'attack', 'recon']);

export const DroneReassignIntentSchema = z.object({
  fromRole: DroneRoleSchema,
  toRole: DroneRoleSchema,
});

export const CyberParalysisIntentSchema = z.object({
  targetRivalId: z.string().min(2).max(64),
  committedCompute: z.number().min(1),
});

export type TradableResource = z.infer<typeof TradableResourceSchema>;
export type MarketTradeIntent = z.infer<typeof MarketTradeIntentSchema>;
export type BankLoanRequest = z.infer<typeof BankLoanRequestSchema>;
export type AnnoModuleGraftIntent = z.infer<typeof AnnoModuleGraftIntentSchema>;
export type DroneRole = z.infer<typeof DroneRoleSchema>;
export type DroneReassignIntent = z.infer<typeof DroneReassignIntentSchema>;
export type CyberParalysisIntent = z.infer<typeof CyberParalysisIntentSchema>;
