// The theme picker. `ui.md` §5.7.
//
// Three unlabelled colour buttons. Each is a rounded square showing that theme's `ground`
// with its three role hues as a **solid / split / dotted** bar across it, so the button
// *is* a sample of the thing it selects. No text, no name, instantly reversible,
// non-destructive — and legible to a four-year-old who cannot read, which is the point of
// putting them on the album page at 44 pt as well as on the chooser at 56 pt.

import { Pressable, StyleSheet, View } from 'react-native';

import { THEME_IDS, themeTokens } from '../theme';

function SampleBar({ pattern, colour, width, height }) {
  if (pattern === 'split') {
    const seg = (width - width * 0.14) / 2;
    return (
      <View style={[styles.row, { height }]}>
        <View style={{ width: seg, height, backgroundColor: colour, borderRadius: height / 2 }} />
        <View style={{ width: width * 0.14, height }} />
        <View style={{ width: seg, height, backgroundColor: colour, borderRadius: height / 2 }} />
      </View>
    );
  }
  if (pattern === 'dotted') {
    const seg = width * 0.2;
    const gap = (width - seg * 3) / 2;
    return (
      <View style={[styles.row, { height }]}>
        <View style={{ width: seg, height, backgroundColor: colour, borderRadius: height / 2 }} />
        <View style={{ width: gap, height }} />
        <View style={{ width: seg, height, backgroundColor: colour, borderRadius: height / 2 }} />
        <View style={{ width: gap, height }} />
        <View style={{ width: seg, height, backgroundColor: colour, borderRadius: height / 2 }} />
      </View>
    );
  }
  return <View style={{ width, height, backgroundColor: colour, borderRadius: height / 2 }} />;
}

export function ThemeButtons({ size = 56, selected, onSelect, style }) {
  return (
    <View style={[styles.wrap, style]}>
      {THEME_IDS.map((id, i) => {
        const t = themeTokens(id);
        const barW = size - 16;
        const barH = Math.max(4, Math.round(size * 0.1));
        return (
          <Pressable
            key={id}
            onPress={() => onSelect(id)}
            accessibilityRole="button"
            accessibilityLabel={t.label}
            accessibilityState={{ selected: selected === id }}
            hitSlop={8}
            style={[styles.button, {
              width: size,
              height: size,
              marginLeft: i === 0 ? 0 : 12,
              borderRadius: Math.round(size * 0.26),
              backgroundColor: t.ground,
              borderColor: selected === id ? t.ink : t.hairline,
              borderWidth: selected === id ? 3 : 1,
            }]}
          >
            <SampleBar pattern={t.role1Pattern} colour={t.role1} width={barW} height={barH} />
            <SampleBar pattern={t.role2Pattern} colour={t.role2} width={barW} height={barH} />
            <SampleBar pattern={t.role3Pattern} colour={t.role3} width={barW} height={barH} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center' },
  button: { alignItems: 'center', justifyContent: 'space-evenly', paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
});
