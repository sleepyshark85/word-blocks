// Screen: the parental gate. `ui.md` §9.7, `gameplay.md` §7.2.
//
// A multiplication written out **in words**, in the app's language, answered in digits on
// a keypad. It needs reading and multiplication, which is the cleanest separation between
// a four-year-old and a literate adult, and it needs **nothing remembered** — a PIN set
// today is a PIN forgotten in three months, and there is nothing behind this gate worth a
// password.
//
// Operands 3–9 × 3–9, re-randomised on every open so it cannot be learned by watching
// (`acceptance-criteria.md` I5, I6). Three wrong answers disable the keypad for 30 s with
// a visible countdown (I7).

import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme';
import { GATE_COOLDOWN } from '../../motion/durations.mjs';
import { createTimerBag } from '../../state/timers.mjs';
import { AppText } from '../Text';
import { ParentScreen } from './ParentChrome';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'];

/** Operands 3–9, inclusive, both. `Math.random` is a presentation concern here. */
export function newProblem() {
  const a = 3 + Math.floor(Math.random() * 7);
  const b = 3 + Math.floor(Math.random() * 7);
  return { a, b, answer: a * b };
}

export function GateScreen({ strings, onBack, onPass }) {
  const theme = useTheme();
  const [problem, setProblem] = useState(newProblem);
  const [entry, setEntry] = useState('');
  const [wrong, setWrong] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const timers = useRef(createTimerBag()).current;

  // Every timer, cleaned up on unmount. A 30 s countdown that outlives this screen would
  // fire into a component that is gone (`development-process.md` §3).
  useEffect(() => () => timers.clearAll(), [timers]);

  useEffect(() => {
    if (cooldown <= 0) {
      timers.clear('cooldown');
      return;
    }
    timers.set('cooldown', () => setCooldown((n) => n - 1), 1000);
  }, [cooldown, timers]);

  const press = (key) => {
    if (cooldown > 0) return;
    if (key === 'del') { setEntry((e) => e.slice(0, -1)); return; }
    if (key === 'ok') {
      if (Number(entry) === problem.answer) { onPass(); return; }
      const next = wrong + 1;
      setWrong(next);
      setEntry('');
      if (next >= 3) {
        setWrong(0);
        setCooldown(GATE_COOLDOWN / 1000);
        setProblem(newProblem());
      }
      return;
    }
    setEntry((e) => (e.length >= 3 ? e : e + key));
  };

  const words = `${strings.numberWords[problem.a]} ${strings.gateTimes} ${strings.numberWords[problem.b]}`;

  return (
    <ParentScreen title={strings.gateTitle} modeTitle={strings.modeTitle} onBack={onBack}>
      <AppText role="gateOperands" style={styles.operands}>{words}</AppText>

      <View style={[styles.display, { borderColor: theme.hairline }]}>
        <AppText role="screenTitle">{entry || ' '}</AppText>
      </View>

      {cooldown > 0 ? (
        <AppText role="secondary" colour={theme.inkSoft} style={styles.note}>
          {strings.gateCooldown(cooldown)}
        </AppText>
      ) : null}
      {cooldown === 0 && wrong > 0 ? (
        <AppText role="secondary" colour={theme.inkSoft} style={styles.note}>{strings.gateWrong}</AppText>
      ) : null}

      <View style={styles.keypad}>
        {KEYS.map((key) => (
          <Pressable
            key={key}
            onPress={() => press(key)}
            disabled={cooldown > 0}
            accessibilityRole="button"
            accessibilityLabel={key}
            style={[styles.key, {
              backgroundColor: theme.surface,
              borderColor: theme.hairline,
              opacity: cooldown > 0 ? 0.4 : 1,
            }]}
          >
            <AppText role="body">{key === 'del' ? '⌫' : key === 'ok' ? '✓' : key}</AppText>
          </Pressable>
        ))}
      </View>
    </ParentScreen>
  );
}

const styles = StyleSheet.create({
  operands: { marginTop: 8 },
  display: {
    marginTop: 16,
    minHeight: 56,
    borderWidth: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: { marginTop: 10 },
  keypad: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 56 * 3 + 24,
  },
  key: {
    width: 56,
    height: 56,
    margin: 4,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
