import { describe, expect, test } from 'bun:test';
import {
  catalogToolbarButtonClasses,
  catalogToolbarIconColor,
  catalogToolbarSegmentClasses,
  CATALOG_TOOLBAR_CONTROL_ACTIVE_CLASS,
  CATALOG_TOOLBAR_CONTROL_ACTIVE_CLASS_MOBILE,
  CATALOG_TOOLBAR_CONTROL_CLASS,
  CATALOG_TOOLBAR_CONTROL_CLASS_MOBILE,
  CATALOG_TOOLBAR_LABELED_CONTROL_CLASS,
  CATALOG_TOOLBAR_MOBILE_ROW_CLASS,
  CATALOG_TOOLBAR_SEGMENT_ACTIVE_CLASS,
  CATALOG_TOOLBAR_SEGMENT_ACTIVE_CLASS_MOBILE,
} from '@/constants/catalogToolbar';

describe('catalogToolbarIconColor', () => {
  test('active tone uses foreground for legibility on panel backgrounds', () => {
    expect(catalogToolbarIconColor('active')).toBe('foreground');
  });

  test('inactive tone uses muted-foreground', () => {
    expect(catalogToolbarIconColor('inactive')).toBe('muted-foreground');
  });

  test('primary tone uses primary for mobile-native emphasis', () => {
    expect(catalogToolbarIconColor('primary')).toBe('primary');
  });
});

describe('catalogToolbarButtonClasses', () => {
  test('idle button uses base control shell without active modifier', () => {
    const classes = catalogToolbarButtonClasses(false);
    expect(classes).toContain(CATALOG_TOOLBAR_CONTROL_CLASS);
    expect(classes).not.toContain(CATALOG_TOOLBAR_CONTROL_ACTIVE_CLASS);
  });

  test('active button adds panel background and ring border', () => {
    const classes = catalogToolbarButtonClasses(true);
    expect(classes).toContain(CATALOG_TOOLBAR_CONTROL_ACTIVE_CLASS);
    expect(classes).toContain('size-11');
    expect(classes).toContain('border-ring/50');
  });

  test('mobile idle button uses bordered card shell for contrast', () => {
    const classes = catalogToolbarButtonClasses(false, true);
    expect(classes).toContain(CATALOG_TOOLBAR_CONTROL_CLASS_MOBILE);
    expect(classes).toContain('border-border');
    expect(classes).toContain('h-11');
    expect(classes).toContain('w-full');
  });

  test('mobile active button uses ring border and panel fill', () => {
    const classes = catalogToolbarButtonClasses(true, true);
    expect(classes).toContain(CATALOG_TOOLBAR_CONTROL_ACTIVE_CLASS_MOBILE);
    expect(classes).toContain('border-ring/50');
    expect(classes).not.toContain('size-11');
  });

  test('labeled desktop button uses auto width shell without size-11', () => {
    const classes = catalogToolbarButtonClasses(false, false, true);
    expect(classes).toContain(CATALOG_TOOLBAR_LABELED_CONTROL_CLASS);
    expect(classes).not.toContain('size-11');
    expect(classes).toContain('px-3');
  });
});

describe('catalogToolbarSegmentClasses', () => {
  test('selected segment gets panel fill', () => {
    expect(catalogToolbarSegmentClasses(true)).toContain(CATALOG_TOOLBAR_SEGMENT_ACTIVE_CLASS);
  });

  test('unselected segment stays transparent with press feedback', () => {
    const classes = catalogToolbarSegmentClasses(false);
    expect(classes).not.toContain(CATALOG_TOOLBAR_SEGMENT_ACTIVE_CLASS);
    expect(classes).toContain('active:opacity-70');
  });

  test('mobile selected segment gets panel fill on bordered track', () => {
    expect(catalogToolbarSegmentClasses(true, true)).toContain(
      CATALOG_TOOLBAR_SEGMENT_ACTIVE_CLASS_MOBILE
    );
  });
});

describe('CATALOG_TOOLBAR_MOBILE_ROW_CLASS', () => {
  test('lays out four toolbar affordances in one full-width row', () => {
    expect(CATALOG_TOOLBAR_MOBILE_ROW_CLASS).toContain('w-full');
    expect(CATALOG_TOOLBAR_MOBILE_ROW_CLASS).toContain('flex-row');
    expect(CATALOG_TOOLBAR_MOBILE_ROW_CLASS).toContain('gap-2');
    expect(CATALOG_TOOLBAR_MOBILE_ROW_CLASS).not.toContain('justify-between');
  });
});
