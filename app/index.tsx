import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  ScrollView, StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Edge, SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const STORAGE_KEY = '@baseball_scorebook_v19';
const INNINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const CELL_SIZE = 95;
const LINEUP_WIDTH = 130;

interface AtBat {
  result: string;
  runScored: boolean;
  outs: number;
  bases: number[];
  rbi: number;
  count: { b: number, s: number };
}

interface Player { spot: number; name: string; pos: string; }

const DEFAULT_LINEUP = (prefix: string): Player[] =>
  Array.from({ length: 9 }, (_, i) => ({ spot: i + 1, name: `${prefix} ${i + 1}`, pos: 'POS' }));

const SAFE_EDGES: Edge[] = ['top'];

export default function ScorebookApp() {
  const [activeTeam, setActiveTeam] = useState<'AWAY' | 'HOME'>('AWAY');
  const [currentInning, setCurrentInning] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAtBat, setSelectedAtBat] = useState({ idx: 0, inn: 1 });
  const [playInput, setPlayInput] = useState("");
  const [balls, setBalls] = useState(0);
  const [strikes, setStrikes] = useState(0);

  const [lineupAWAY, setLineupAWAY] = useState<Player[]>(DEFAULT_LINEUP('Away'));
  const [lineupHOME, setLineupHOME] = useState<Player[]>(DEFAULT_LINEUP('Home'));
  const [scores, setScores] = useState<Record<'AWAY' | 'HOME', Record<string, AtBat>>>({ AWAY: {}, HOME: {} });

  useEffect(() => {
    const load = async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        setScores(p.scores || { AWAY: {}, HOME: {} });
        setLineupAWAY(p.lA || DEFAULT_LINEUP('Away'));
        setLineupHOME(p.lH || DEFAULT_LINEUP('Home'));
      }
    };
    load();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ scores, lA: lineupAWAY, lH: lineupHOME }));
  }, [scores, lineupAWAY, lineupHOME]);

  const currentLineup = activeTeam === 'AWAY' ? lineupAWAY : lineupHOME;

  const outsInInning = useMemo(() => {
    const teamScores = scores[activeTeam] || {};
    const inningKeys = Object.keys(teamScores).filter(k => k.endsWith(`-${currentInning}`));
    const outsArr = inningKeys.map(k => teamScores[k].outs);
    return outsArr.length > 0 ? Math.max(...outsArr) : 0;
  }, [scores, activeTeam, currentInning]);

  const handleKeyEntry = (key: string) => {
    setPlayInput(prev => {
      const lastChar = prev.slice(-1);
      if (/\d/.test(key) && /\d/.test(lastChar) && prev.length > 0) return prev + "-" + key;
      return prev + key;
    });
  };

  const savePlay = (val: string | null) => {
    const inn = selectedAtBat.inn;
    const player = currentLineup[selectedAtBat.idx];
    if (!player) return;
    const key = `${player.name}-${inn}`;

    setScores(prev => {
      const teamS = { ...prev[activeTeam] };
      if (val === null || (val === "" && balls === 0 && strikes === 0)) {
        delete teamS[key];
        return { ...prev, [activeTeam]: teamS };
      }

      let outVal = 0, run = false, bases: number[] = [], advance = 0, batterRbi = 0;
      const cleanVal = val || "";

      if (cleanVal.includes("1B") || cleanVal.includes("BB")) { advance = 1; bases = [1]; }
      else if (cleanVal.includes("2B")) { advance = 2; bases = [1, 2]; }
      else if (cleanVal.includes("3B")) { advance = 3; bases = [1, 2, 3]; }
      else if (cleanVal.includes("HR")) { advance = 4; bases = [1, 2, 3]; run = true; batterRbi = 1; }

      const isOut = /K|ꓘ|F|P|L|DP|\d/.test(cleanVal) && !/1B|2B|3B/.test(cleanVal);
      const prevMaxOuts = Object.keys(teamS).filter(k => k.endsWith(`-${inn}`) && k !== key)
        .reduce((m, k) => Math.max(m, (teamS[k].outs || 0)), 0);
      outVal = isOut ? prevMaxOuts + 1 : prevMaxOuts;

      if (advance > 0) {
        Object.keys(teamS).forEach(k => {
          if (k.endsWith(`-${inn}`) && k !== key) {
            const r = teamS[k];
            if (r.bases?.length > 0 && !r.runScored && r.outs === 0) {
              const cur = Math.max(...r.bases);
              let next = (advance === 1) ? (cur + 1) : (cur + advance);
              if (next >= 4) { teamS[k] = { ...r, bases: [1, 2, 3], runScored: true }; batterRbi++; }
              else { teamS[k] = { ...r, bases: Array.from({ length: next }, (_, i) => i + 1) }; }
            }
          }
        });
      }

      teamS[key] = { result: cleanVal, runScored: run, outs: outVal, bases, rbi: batterRbi, count: { b: balls, s: strikes } };
      return { ...prev, [activeTeam]: teamS };
    });
    setModalVisible(false);
  };

  const CountDots = ({ b, s }: { b: number, s: number }) => (
    <View style={styles.miniCountContainer}>
      <View style={styles.dotRow}>
        {[1, 2, 3, 4].map(i => (
          <View key={`b-${i}`} style={[styles.dotMini, { backgroundColor: b >= i ? '#FF9500' : '#E5E5E5' }]} />
        ))}
      </View>
      <View style={styles.dotRow}>
        {[1, 2, 3].map(i => (
          <View key={`s-${i}`} style={[styles.dotMini, { backgroundColor: s >= i ? '#007AFF' : '#E5E5E5' }]} />
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={SAFE_EDGES}>
        <StatusBar barStyle="light-content" />

        <View style={styles.header}>
          <TouchableOpacity style={[styles.tBox, activeTeam === 'AWAY' && styles.tActive]} onPress={() => setActiveTeam('AWAY')}>
            <Text style={styles.tLab}>AWAY</Text><Text style={styles.tSco}>{Object.values(scores.AWAY).filter(a => a.runScored).length}</Text>
          </TouchableOpacity>
          <View style={styles.center}>
            <Text style={styles.innLab}>INN {currentInning}</Text>
            <View style={styles.outRowHeader}>
              {[1, 2, 3].map(i => <View key={i} style={[styles.headerDot, outsInInning >= i && styles.headerDotActive]} />)}
            </View>
          </View>
          <TouchableOpacity style={[styles.tBox, activeTeam === 'HOME' && styles.tActive]} onPress={() => setActiveTeam('HOME')}>
            <Text style={styles.tLab}>HOME</Text><Text style={styles.tSco}>{Object.values(scores.HOME).filter(a => a.runScored).length}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal bounces={false}>
          <ScrollView bounces={false}>
            <View style={styles.row}>
              <View style={[styles.hCell, { width: LINEUP_WIDTH }]}><Text style={styles.hText}>{activeTeam} LINEUP</Text></View>
              {INNINGS.map(i => (
                <TouchableOpacity key={i} style={[styles.cell, styles.hCell, currentInning === i && styles.activeInnCol]} onPress={() => setCurrentInning(i)}>
                  <Text style={[styles.hText, currentInning === i && { color: '#007AFF' }]}>{i}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {currentLineup.map((p, idx) => (
              <View key={idx} style={styles.row}>
                <View style={[styles.pCell, { width: LINEUP_WIDTH }]}>
                  <Text style={styles.pName} numberOfLines={1}>{p.spot}. {p.name}</Text>
                  <Text style={styles.pPos}>{p.pos}</Text>
                </View>
                {INNINGS.map(i => {
                  const d = scores[activeTeam][`${p.name}-${i}`];
                  return (
                    <TouchableOpacity key={i} style={[styles.cell, currentInning === i && { backgroundColor: '#f9f9f9' }]}
                      onPress={() => {
                        setPlayInput(d?.result || "");
                        setBalls(d?.count?.b || 0); setStrikes(d?.count?.s || 0);
                        setSelectedAtBat({ idx, inn: i }); setModalVisible(true);
                      }}>
                      <View style={styles.diamond}>
                        <View style={[styles.base, styles.l1, d?.bases?.includes(1) && styles.baseOn]} />
                        <View style={[styles.base, styles.l2, d?.bases?.includes(2) && styles.baseOn]} />
                        <View style={[styles.base, styles.l3, d?.bases?.includes(3) && styles.baseOn]} />
                        <View style={[styles.base, styles.l4, d?.runScored && styles.baseOn]} />
                        {d?.result ? <Text style={styles.resTxt}>{d.result}</Text> : null}
                        <CountDots b={d?.count?.b || 0} s={d?.count?.s || 0} />
                        {d?.outs > 0 && <View style={styles.outBadge}><Text style={styles.outBadgeTxt}>{d.outs}</Text></View>}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </ScrollView>

        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.mBg}>
            <View style={[styles.mCard, { width: '95%' }]}>
              <Text style={styles.mTitle}>{currentLineup[selectedAtBat.idx]?.name.toUpperCase()}</Text>

              {/* RESTORED +/- COUNTERS */}
              <View style={styles.modalCountSection}>
                <View style={styles.countGroup}>
                  <Text style={styles.countLabel}>BALLS</Text>
                  <View style={styles.counterRow}>
                    <TouchableOpacity style={styles.countOp} onPress={() => setBalls(Math.max(0, balls - 1))}><Text style={styles.countOpTxt}>-</Text></TouchableOpacity>
                    <Text style={styles.countDisplayNum}>{balls}</Text>
                    <TouchableOpacity style={styles.countOp} onPress={() => setBalls(Math.min(4, balls + 1))}><Text style={styles.countOpTxt}>+</Text></TouchableOpacity>
                  </View>
                </View>
                <View style={styles.countGroup}>
                  <Text style={styles.countLabel}>STRIKES</Text>
                  <View style={styles.counterRow}>
                    <TouchableOpacity style={styles.countOp} onPress={() => setStrikes(Math.max(0, strikes - 1))}><Text style={styles.countOpTxt}>-</Text></TouchableOpacity>
                    <Text style={styles.countDisplayNum}>{strikes}</Text>
                    <TouchableOpacity style={styles.countOp} onPress={() => setStrikes(Math.min(3, strikes + 1))}><Text style={styles.countOpTxt}>+</Text></TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.displayArea}>
                <Text style={styles.mBigInText}>{playInput}</Text>
                <TouchableOpacity onPress={() => setPlayInput(prev => prev.slice(0, -1))}><Text style={{ color: '#FF3B30', fontWeight: 'bold', marginRight: 10 }}>DEL</Text></TouchableOpacity>
              </View>

              <View style={styles.topActions}>
                {['1B', '2B', '3B', 'HR', 'BB', 'K', 'ꓘ', 'E'].map(item => (
                  <TouchableOpacity key={item} style={styles.actionBtn} onPress={() => handleKeyEntry(item)}><Text style={styles.actionBtnTxt}>{item}</Text></TouchableOpacity>
                ))}
              </View>

              <View style={styles.bottomKeys}>
                <View style={styles.numpad}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <TouchableOpacity key={num} style={styles.numBtn} onPress={() => handleKeyEntry(num.toString())}><Text style={styles.numBtnTxt}>{num}</Text></TouchableOpacity>
                  ))}
                </View>
                <View style={styles.flightpad}>
                  {['F', 'P', 'L', 'DP'].map(f => (
                    <TouchableOpacity key={f} style={styles.flightBtn} onPress={() => handleKeyEntry(f)}><Text style={styles.flightBtnTxt}>{f}</Text></TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity style={styles.recordBtn} onPress={() => savePlay(playInput)}><Text style={styles.recordBtnTxt}>RECORD PLAY</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 15 }}><Text style={{ color: '#999' }}>CLOSE</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { backgroundColor: '#121212', flexDirection: 'row', padding: 15, alignItems: 'center' },
  tBox: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 12, backgroundColor: '#1e1e1e' },
  tActive: { backgroundColor: '#007AFF' },
  tLab: { color: '#888', fontSize: 10, fontWeight: 'bold' },
  tSco: { color: '#fff', fontSize: 28, fontWeight: '900' },
  center: { flex: 1.5, alignItems: 'center' },
  innLab: { color: '#007AFF', fontWeight: '900', fontSize: 14, marginBottom: 5 },
  outRowHeader: { flexDirection: 'row', gap: 6 },
  headerDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#333' },
  headerDotActive: { backgroundColor: '#FF3B30' },
  row: { flexDirection: 'row' },
  cell: { width: CELL_SIZE, height: CELL_SIZE, borderBottomWidth: 0.5, borderRightWidth: 0.5, borderColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  hCell: { height: 45, backgroundColor: '#f4f4f4' },
  hText: { fontSize: 10, fontWeight: 'bold', color: '#999' },
  activeInnCol: { backgroundColor: '#E3F2FD' },
  pCell: { padding: 15, borderBottomWidth: 0.5, borderColor: '#eee' },
  pName: { fontWeight: 'bold', fontSize: 14 },
  pPos: { fontSize: 11, color: '#007AFF', fontWeight: 'bold' },
  diamond: { width: 60, height: 60, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  base: { position: 'absolute', width: 30, height: 2, backgroundColor: '#f0f0f0' },
  baseOn: { backgroundColor: '#FF3B30', height: 3, zIndex: 1 },
  l1: { transform: [{ rotate: '-45deg' }], bottom: 16, right: 4 },
  l2: { transform: [{ rotate: '45deg' }], top: 16, right: 4 },
  l3: { transform: [{ rotate: '-45deg' }], top: 16, left: 4 },
  l4: { transform: [{ rotate: '45deg' }], bottom: 16, left: 4 },
  resTxt: { fontWeight: '900', color: '#007AFF', fontSize: 16 },
  outBadge: { position: 'absolute', bottom: -8, right: -8, backgroundColor: '#000', width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  outBadgeTxt: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  miniCountContainer: { position: 'absolute', bottom: -10, left: -5 },
  dotRow: { flexDirection: 'row', gap: 3, marginBottom: 2 },
  dotMini: { width: 6, height: 6, borderRadius: 3 },
  mBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  mCard: { backgroundColor: '#fff', padding: 20, borderRadius: 25, alignItems: 'center' },
  mTitle: { fontSize: 12, color: '#aaa', marginBottom: 15, fontWeight: 'bold' },
  modalCountSection: { flexDirection: 'row', gap: 30, marginBottom: 20 },
  countGroup: { alignItems: 'center' },
  countLabel: { fontSize: 10, fontWeight: 'bold', color: '#bbb', marginBottom: 5 },
  counterRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 12, padding: 4 },
  countOp: { paddingHorizontal: 15, paddingVertical: 8 },
  countOpTxt: { fontSize: 20, fontWeight: 'bold', color: '#007AFF' },
  countDisplayNum: { fontSize: 18, fontWeight: 'bold', minWidth: 20, textAlign: 'center' },
  displayArea: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', padding: 12, borderRadius: 12, width: '100%', minHeight: 60, marginBottom: 15, justifyContent: 'space-between' },
  mBigInText: { fontSize: 28, fontWeight: '900', color: '#007AFF', marginLeft: 10 },
  topActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 15 },
  actionBtn: { padding: 10, backgroundColor: '#f0f7ff', borderRadius: 8, minWidth: 55, alignItems: 'center' },
  actionBtnTxt: { color: '#007AFF', fontWeight: 'bold', fontSize: 13 },
  bottomKeys: { flexDirection: 'row', gap: 15, width: '100%', marginBottom: 20 },
  numpad: { flex: 3, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  numBtn: { width: '30%', paddingVertical: 12, backgroundColor: '#eee', borderRadius: 8, alignItems: 'center' },
  numBtnTxt: { fontWeight: 'bold', fontSize: 18 },
  flightpad: { flex: 1, gap: 6 },
  flightBtn: { flex: 1, backgroundColor: '#fef3f2', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  flightBtnTxt: { color: '#FF3B30', fontWeight: 'bold', fontSize: 16 },
  recordBtn: { backgroundColor: '#007AFF', width: '100%', padding: 18, borderRadius: 12, alignItems: 'center' },
  recordBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});