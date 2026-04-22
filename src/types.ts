/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Habit {
  id: string;
  name: string;
  category: string;
  color: string;
  createdAt: number;
  completedDates: string[]; // ISO date strings 'YYYY-MM-DD'
}

export type Category = 'Health' | 'Mindset' | 'Work' | 'Personal' | 'Other';

export const CATEGORIES: Category[] = ['Health', 'Mindset', 'Work', 'Personal', 'Other'];

export const HABIT_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEEAD', // Yellow
  '#D4A5A5', // Dusty Rose
  '#9B59B6', // Purple
  '#3498DB', // Bright Blue
];
