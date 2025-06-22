/**
 * Centralized constants for the Israel-Iran War Tracker
 * All hardcoded values and shared types should be defined here
 */

// Severity Levels
export const SEVERITY_LEVELS = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

export type SeverityLevel = typeof SEVERITY_LEVELS[keyof typeof SEVERITY_LEVELS];

// Alert Types
export const ALERT_TYPES = {
  MISSILE: 'missile',
  STRIKE: 'strike',
  CASUALTY: 'casualty',
  DIPLOMATIC: 'diplomatic',
  NUCLEAR: 'nuclear',
  CYBER: 'cyber',
  EVACUATION: 'evacuation',
  MILITARY: 'military',
} as const;

export type AlertType = typeof ALERT_TYPES[keyof typeof ALERT_TYPES];

// Event Types (for timeline)
export const EVENT_TYPES = {
  STRIKE: 'strike',
  MISSILE: 'missile',
  DIPLOMACY: 'diplomacy',
  EVACUATION: 'evacuation',
  CASUALTY: 'casualty',
  NUCLEAR: 'nuclear',
  CYBER: 'cyber',
  ALERT: 'alert',
  INTELLIGENCE: 'intelligence',
  OTHER: 'other',
} as const;

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];

// Facility Status
export const FACILITY_STATUS = {
  OPERATIONAL: 'operational',
  DAMAGED: 'damaged',
  DESTROYED: 'destroyed',
  EVACUATED: 'evacuated',
  OFFLINE: 'offline',
} as const;

export type FacilityStatus = typeof FACILITY_STATUS[keyof typeof FACILITY_STATUS];

// Radiation Risk Levels
export const RADIATION_RISK = {
  NONE: 'none',
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type RadiationRisk = typeof RADIATION_RISK[keyof typeof RADIATION_RISK];

// Threat Levels
export const THREAT_LEVELS = {
  MINIMAL: 1,
  LOW: 2,
  MODERATE: 3,
  HIGH: 4,
  CRITICAL: 5,
} as const;

export type ThreatLevel = typeof THREAT_LEVELS[keyof typeof THREAT_LEVELS];

// Threat Trends
export const THREAT_TRENDS = {
  INCREASING: 'increasing',
  STABLE: 'stable',
  DECREASING: 'decreasing',
} as const;

export type ThreatTrend = typeof THREAT_TRENDS[keyof typeof THREAT_TRENDS];

// Diplomatic Status
export const DIPLOMATIC_STATUS = {
  ACTIVE: 'active',
  STALLED: 'stalled',
  SUSPENDED: 'suspended',
  NONE: 'none',
} as const;

export type DiplomaticStatus = typeof DIPLOMATIC_STATUS[keyof typeof DIPLOMATIC_STATUS];

// Iranian Nuclear Facilities
export const NUCLEAR_FACILITIES = {
  ARAK: {
    id: '1',
    name: 'Arak Heavy Water Reactor',
    location: 'Arak, Iran',
    coordinates: { lat: 34.3773, lng: 49.7643 },
  },
  NATANZ: {
    id: '2',
    name: 'Natanz Nuclear Facility',
    location: 'Natanz, Iran',
    coordinates: { lat: 33.7245, lng: 51.7263 },
  },
  BUSHEHR: {
    id: '3',
    name: 'Bushehr Nuclear Plant',
    location: 'Bushehr, Iran',
    coordinates: { lat: 28.8296, lng: 50.8884 },
  },
  FORDOW: {
    id: '4',
    name: 'Fordow Fuel Enrichment',
    location: 'Qom, Iran',
    coordinates: { lat: 34.8845, lng: 50.9936 },
  },
} as const;

// Map Constants
export const MAP_DEFAULTS = {
  CENTER: [32.0, 44.0] as [number, number], // Between Israel and Iran
  ZOOM: 6,
  MIN_ZOOM: 3,
  MAX_ZOOM: 18,
} as const;

// Update Intervals (in milliseconds)
export const UPDATE_INTERVALS = {
  NEWS_FETCH: 60000, // 1 minute
  DATA_REFRESH: 30000, // 30 seconds
  CASUALTY_UPDATE: 5000, // 5 seconds
  THREAT_ASSESSMENT: 120000, // 2 minutes
} as const;

// API Endpoints (for reference)
export const API_ENDPOINTS = {
  NEWS_API: process.env.REACT_APP_NEWS_API_URL || 'https://newsapi.org/v2',
  RELIEF_WEB: 'https://api.reliefweb.int/v1',
  IAEA_RSS: 'https://www.iaea.org/feeds/topnews.rss',
} as const;

// Conflict Start Date
export const CONFLICT_START_DATE = new Date('2025-06-13T00:00:00Z');

// Color Codes for Severity
export const SEVERITY_COLORS = {
  critical: '#d32f2f',
  high: '#f44336',
  medium: '#ff9800',
  low: '#ffc107',
} as const;

// Data Source Types
export const DATA_SOURCE_TYPES = {
  NEWS: 'news',
  GOVERNMENT: 'government',
  OSINT: 'osint',
} as const;

export type DataSourceType = typeof DATA_SOURCE_TYPES[keyof typeof DATA_SOURCE_TYPES];