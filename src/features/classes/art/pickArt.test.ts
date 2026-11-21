import { describe, expect, it } from 'vitest';
import { pickArtKind, suggestColor } from './pickArt';

describe('pickArtKind', () => {
  it('gives chemistry, bio med and linear algebra different pictures', () => {
    const kinds = ['chemistry', 'bio med', 'linear algebra'].map(pickArtKind);
    expect(kinds).toEqual(['chemistry', 'medicine', 'math']);
  });

  it.each([
    ['Biology', 'biology'],
    ['Biochemistry', 'chemistry'],
    ['AP Physics 1', 'physics'],
    ['Earth Science', 'earth'],
    ['Geometry', 'geometry'],
    ['Economics', 'stats'],
    ['Intro to Computer Science', 'code'],
    ['Spanish II', 'languages'],
    ['English as a Second Language', 'languages'],
    ['English 10', 'english'],
    ['World History', 'history'],
    ['Psychology', 'psychology'],
    ['Concert Band', 'music'],
    ['Studio Art', 'arts'],
    ['Physical Education', 'sports'],
    ['Health Science', 'medicine'],
    ['Computer Systems', 'code'],
  ])('%s → %s', (name, kind) => {
    expect(pickArtKind(name)).toBe(kind);
  });

  it('gives unknown subjects a stable fallback', () => {
    const a = pickArtKind('Homeroom');
    expect(['general', 'idea', 'notebook']).toContain(a);
    expect(pickArtKind('Homeroom')).toBe(a);
  });
});

describe('suggestColor', () => {
  it('suggests a color per subject', () => {
    expect(suggestColor('chemistry')).toBe('cyan');
    expect(suggestColor('bio med')).toBe('rose');
    expect(suggestColor('linear algebra')).toBe('blue');
    expect(suggestColor('Homeroom')).toBeNull();
  });
});
