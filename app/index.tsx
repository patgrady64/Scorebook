import React, { useMemo, useState } from 'react';
import {
  Modal, SafeAreaView,
  ScrollView, StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const LINEUP_WIDTH = 120;
const CELL_SIZE = 100;
const INN_COL_WIDTH = 28;

const DEFAULT_LINEUP = (prefix: string) =>
  Array.from({ length: 9 }, (_, i) => ({ spot: i + 1, name: `${prefix} ${i + 1}` }));

export default function App() {
  const [activeTeam, setActiveTeam] = useState<'AWAY' | 'HOME'>('AWAY');
  const [maxInning, setMaxInning] = useState(9);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAtBat, setSelectedAtBat] = useState({ idx: 0, inn: 1 });
  const [playInput, setPlayInput] = useState("");

  const [balls, setBalls] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [inningOuts, setInningOuts] = useState(0);
  const [pitchesHome, setPitchesHome] = useState(0);
  const [pitchesGuest, setPitchesGuest] = useState(0);

  const [lineupAWAY] = useState(DEFAULT_LINEUP('Guest'));
  const [lineupHOME] = useState(DEFAULT_LINEUP('Home'));
  const [scores, setScores] = useState<Record<string, any>>({ AWAY: {}, HOME: {} });

  const inningsArray = useMemo(() => Array.from({ length: maxInning }, (_, i) => i + 1), [maxInning]);

  const handleKeyEntry = (key: string) => {
    setPlayInput(prev => {
      const lastChar = prev.slice(-1);
      if (/\d/.test(key) && /\d/.test(lastChar) && prev.length > 0) return prev + "-" + key;
      return prev + key;
    });
  };

  const lineScore = useMemo(() => {
    const getStats = (team: 'AWAY' | 'HOME') => {
      const innData = Array(maxInning).fill(0);
      let totalHits = 0;
      Object.keys(scores[team]).forEach(key => {
        const atBat = scores[team][key];
        const inn = parseInt(key.split('-').pop() || "1");
        if (atBat.runScored && inn <= maxInning) innData[inn - 1]++;
        if (/1B|2B|3B|HR/.test(atBat.result)) totalHits++;
      });
      return { perInning: innData, runs: innData.reduce((a, b) => a + b, 0), hits: totalHits };
    };
    return { AWAY: getStats('AWAY'), HOME: getStats('HOME') };
  }, [scores, maxInning]);

  const savePlay = (val: string, isGhost = false) => {
    const player = (activeTeam === 'AWAY' ? lineupAWAY : lineupHOME)[selectedAtBat.idx];
    const key = `${player.name}-${selectedAtBat.inn}`;

    setScores(prev => {
      const teamS = { ...prev[activeTeam] };
      const cleanVal = isGhost ? "GR" : val;
      let run = false, bases: number[] = [];

      if (isGhost) bases = [2];
      else if (cleanVal.includes("1B") || cleanVal.includes("BB") || cleanVal.includes("HBP")) bases = [1];
      else if (cleanVal.includes("2B")) bases = [1, 2];
      else if (cleanVal.includes("3B")) bases = [1, 2, 3];
      else if (cleanVal.includes("HR")) { bases = [1, 2, 3]; run = true; }

      const isOut = /K|ꓘ|F|P|L|DP|\d/.test(cleanVal) && !/1B|2B|3B|E|GR/.test(cleanVal);
      if (isOut) setInningOuts((prevO) => (prevO + 1) % 4 === 3 ? 0 : prevO + 1);

      teamS[key] = { result: cleanVal, runScored: run, bases, count: { b: balls, s: strikes } };
      return { ...prev, [activeTeam]: teamS };
    });
    setBalls(0); setStrikes(0); setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* SCOREBOARD */}
      <View style={styles.boardContainer}>
        <View style={styles.boardTop}>
          <View style={styles.boardStat}><Text style={styles.boardLabel}>P. HOME</Text><TouchableOpacity onPress={() => setPitchesHome(p => p + 1)}><Text style={styles.boardValRed}>{pitchesHome}</Text></TouchableOpacity></View>
          <View style={styles.boardStat}><Text style={styles.boardLabel}>BALL</Text><Text style={styles.boardValRed}>{balls}</Text></View>
          <View style={styles.boardStat}><Text style={styles.boardLabel}>STRIKE</Text><Text style={styles.boardValRed}>{strikes}</Text></View>
          <View style={styles.boardStat}><Text style={styles.boardLabel}>OUT</Text><Text style={styles.boardValRed}>{inningOuts}</Text></View>
          <View style={styles.boardStat}><Text style={styles.boardLabel}>P. GUEST</Text><TouchableOpacity onPress={() => setPitchesGuest(p => p + 1)}><Text style={styles.boardValRed}>{pitchesGuest}</Text></TouchableOpacity></View>
        </View>
        <View style={styles.lineRowFlex}>
          <View style={{ width: 55 }}><Text style={styles.lineTeamName}>GUEST</Text><Text style={styles.lineTeamName}>HOME</Text></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
            <View>
              <View style={{ flexDirection: 'row' }}>{inningsArray.map(i => <Text key={i} style={styles.lineHeaderTxt}>{i}</Text>)}</View>
              <View style={{ flexDirection: 'row' }}>{lineScore.AWAY.perInning.map((v, i) => <Text key={i} style={styles.lineVal}>{v || '0'}</Text>)}</View>
              <View style={{ flexDirection: 'row' }}>{lineScore.HOME.perInning.map((v, i) => <Text key={i} style={styles.lineVal}>{v || '0'}</Text>)}</View>
            </View>
          </ScrollView>
          <View style={styles.totalsBox}>
            <View style={styles.totalCol}><Text style={styles.lineHeaderTxt}>R</Text><Text style={styles.lineTotal}>{lineScore.AWAY.runs}</Text><Text style={styles.lineTotal}>{lineScore.HOME.runs}</Text></View>
          </View>
        </View>
      </View>

      <View style={styles.toggleRow}>
        <TouchableOpacity onPress={() => setActiveTeam('AWAY')} style={[styles.tBtn, activeTeam === 'AWAY' && styles.tBtnActive]}><Text style={styles.tBtnTxt}>GUEST</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTeam('HOME')} style={[styles.tBtn, activeTeam === 'HOME' && styles.tBtnActive]}><Text style={styles.tBtnTxt}>HOME</Text></TouchableOpacity>
      </View>

      {/* THE GRID */}
      <ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Header */}
            <View style={styles.row}>
              <View style={[styles.hCell, styles.lineBottom, styles.lineDivider, { width: LINEUP_WIDTH }]}><Text style={styles.hText}>PLAYER</Text></View>
              {inningsArray.map(i => (
                <View key={i} style={[styles.hCell, styles.lineBottom, styles.lineRight, { width: CELL_SIZE }]}>
                  <Text style={styles.hText}>INN {i}</Text>
                </View>
              ))}
              <TouchableOpacity style={[styles.hCell, styles.lineBottom, { width: 50, backgroundColor: '#eef' }]} onPress={() => setMaxInning(p => p + 1)}>
                <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Players */}
            {(activeTeam === 'AWAY' ? lineupAWAY : lineupHOME).map((p, idx) => (
              <View key={idx} style={styles.row}>
                <View style={[styles.pCell, styles.lineBottom, styles.lineDivider, { width: LINEUP_WIDTH }]}><Text style={styles.pName}>{p.spot}. {p.name}</Text></View>
                {inningsArray.map(i => {
                  const d = scores[activeTeam][`${p.name}-${i}`];
                  return (
                    <TouchableOpacity key={i} style={[styles.cell, styles.lineBottom, styles.lineRight]}
                      onPress={() => { setPlayInput(d?.result || ""); setSelectedAtBat({ idx, inn: i }); setModalVisible(true); }}>
                      <View style={styles.miniCountBox}>
                        <View style={styles.countRow}><View style={[styles.dot, d?.count?.b >= 1 && styles.dotB]} /><View style={[styles.dot, d?.count?.b >= 2 && styles.dotB]} /><View style={[styles.dot, d?.count?.b >= 3 && styles.dotB]} /></View>
                        <View style={styles.countRow}><View style={[styles.dot, d?.count?.s >= 1 && styles.dotS]} /><View style={[styles.dot, d?.count?.s >= 2 && styles.dotS]} /></View>
                      </View>
                      <View style={styles.diamond}>
                        <View style={[styles.base, styles.l1, d?.bases?.includes(1) && styles.baseOn]} />
                        <View style={[styles.base, styles.l2, d?.bases?.includes(2) && styles.baseOn]} />
                        <View style={[styles.base, styles.l3, d?.bases?.includes(3) && styles.baseOn]} />
                        <View style={[styles.base, styles.l4, d?.runScored && styles.baseOn]} />
                        {d?.result ? <Text style={styles.resTxt}>{d.result}</Text> : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
                <View style={[styles.lineBottom, { width: 50 }]} />
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>

      {/* MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.mBg}>
          <View style={[styles.mCard, { width: '95%' }]}>
            <View style={styles.modalCountSection}>
              <View style={styles.countGroup}><Text style={styles.countLabel}>B</Text>
                <View style={styles.counterRow}>
                  <TouchableOpacity style={styles.countOp} onPress={() => setBalls(Math.max(0, balls - 1))}><Text style={styles.countOpTxt}>-</Text></TouchableOpacity>
                  <Text style={styles.countDisplayNum}>{balls}</Text>
                  <TouchableOpacity style={styles.countOp} onPress={() => { if (balls < 3) setBalls(balls + 1); else { handleKeyEntry('BB'); savePlay('BB'); } }}><Text style={styles.countOpTxt}>+</Text></TouchableOpacity>
                </View>
              </View>
              <View style={styles.countGroup}><Text style={styles.countLabel}>S</Text>
                <View style={styles.counterRow}>
                  <TouchableOpacity style={styles.countOp} onPress={() => setStrikes(Math.max(0, strikes - 1))}><Text style={styles.countOpTxt}>-</Text></TouchableOpacity>
                  <Text style={styles.countDisplayNum}>{strikes}</Text>
                  <TouchableOpacity style={styles.countOp} onPress={() => { if (strikes < 2) setStrikes(strikes + 1); else { handleKeyEntry('K'); savePlay('K'); } }}><Text style={styles.countOpTxt}>+</Text></TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity style={styles.smallGhostBtn} onPress={() => savePlay("", true)}><Text style={styles.smallGhostTxt}>GHOST (2B)</Text></TouchableOpacity>
            </View>

            <View style={styles.displayArea}><Text style={styles.mBigInText}>{playInput}</Text>
              <TouchableOpacity onPress={() => setPlayInput(prev => prev.slice(0, -1))}><Text style={{ color: '#FF3B30', fontWeight: 'bold' }}>DEL</Text></TouchableOpacity>
            </View>

            <View style={styles.topActions}>
              {['1B', '2B', '3B', 'HR', 'BB', 'HBP', 'FC', 'SAC', 'K', 'ꓘ', 'E'].map(item => (
                <TouchableOpacity key={item} style={styles.actionBtn} onPress={() => handleKeyEntry(item)}><Text style={styles.actionBtnTxt}>{item}</Text></TouchableOpacity>
              ))}
            </View>

            <View style={styles.bottomKeys}>
              <View style={styles.numpad}><View style={styles.numGrid}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <TouchableOpacity key={num} style={styles.numBtn} onPress={() => handleKeyEntry(num.toString())}><Text style={styles.numBtnTxt}>{num}</Text></TouchableOpacity>
                ))}</View>
              </View>
              <View style={styles.flightpad}>
                {['F', 'P', 'L', 'DP'].map(f => (
                  <TouchableOpacity key={f} style={styles.flightBtn} onPress={() => handleKeyEntry(f)}><Text style={styles.flightBtnTxt}>{f}</Text></TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.recordBtn} onPress={() => savePlay(playInput)}><Text style={styles.recordBtnTxt}>RECORD PLAY</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 15 }}><Text style={{ color: '#999' }}>CANCEL</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  boardContainer: { backgroundColor: '#1a0000', padding: 10 },
  boardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  boardStat: { alignItems: 'center' },
  boardLabel: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
  boardValRed: { color: '#ff1a1a', fontSize: 22, fontWeight: 'bold', fontFamily: 'monospace' },
  lineRowFlex: { flexDirection: 'row', alignItems: 'center' },
  lineTeamName: { color: '#fff', fontSize: 10, fontWeight: '900', height: 18 },
  lineHeaderTxt: { color: '#666', fontSize: 9, width: INN_COL_WIDTH, textAlign: 'center' },
  lineVal: { color: '#ff1a1a', fontSize: 16, width: INN_COL_WIDTH, textAlign: 'center', height: 20 },
  totalsBox: { flexDirection: 'row', marginLeft: 10 },
  totalCol: { alignItems: 'center', width: 30 },
  lineTotal: { color: '#ff1a1a', fontSize: 18, fontWeight: 'bold' },
  toggleRow: { flexDirection: 'row', backgroundColor: '#222' },
  tBtn: { flex: 1, padding: 12, alignItems: 'center' },
  tBtnActive: { borderBottomWidth: 3, borderBottomColor: '#007AFF' },
  tBtnTxt: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  row: { flexDirection: 'row', backgroundColor: '#fff' },
  lineBottom: { borderBottomWidth: 1, borderBottomColor: '#ccc' },
  lineRight: { borderRightWidth: 1.5, borderRightColor: '#ddd' },
  lineDivider: { borderRightWidth: 4, borderRightColor: '#777' },
  cell: { width: CELL_SIZE, height: CELL_SIZE, justifyContent: 'center', alignItems: 'center' },
  hCell: { height: 40, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  hText: { fontSize: 10, fontWeight: 'bold', color: '#555' },
  pCell: { padding: 10, backgroundColor: '#fff', justifyContent: 'center' },
  pName: { fontWeight: 'bold', fontSize: 12 },
  miniCountBox: { position: 'absolute', top: 5, left: 5 },
  countRow: { flexDirection: 'row', gap: 2, marginBottom: 2 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#eee', borderWidth: 0.5, borderColor: '#ccc' },
  dotB: { backgroundColor: '#4CD964' },
  dotS: { backgroundColor: '#FFCC00' },
  diamond: { width: 65, height: 65 },
  base: { position: 'absolute', width: 32, height: 2, backgroundColor: '#f4f4f4' },
  baseOn: { backgroundColor: '#FF3B30', height: 3 },
  l1: { transform: [{ rotate: '-45deg' }], bottom: 18, right: 4 },
  l2: { transform: [{ rotate: '45deg' }], top: 18, right: 4 },
  l3: { transform: [{ rotate: '-45deg' }], top: 18, left: 4 },
  l4: { transform: [{ rotate: '45deg' }], bottom: 18, left: 4 },
  resTxt: { position: 'absolute', width: 65, textAlign: 'center', top: 22, fontWeight: '900', color: '#007AFF', fontSize: 15 },
  mBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  mCard: { backgroundColor: '#fff', padding: 20, borderRadius: 20 },
  modalCountSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  countGroup: { alignItems: 'center' },
  countLabel: { fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
  counterRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 10 },
  countOp: { padding: 8 },
  countOpTxt: { fontSize: 20, color: '#007AFF', fontWeight: 'bold' },
  countDisplayNum: { fontSize: 18, fontWeight: 'bold', minWidth: 20, textAlign: 'center' },
  smallGhostBtn: { backgroundColor: '#333', padding: 8, borderRadius: 10 },
  smallGhostTxt: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  displayArea: { flexDirection: 'row', backgroundColor: '#f0f0f0', padding: 12, borderRadius: 10, marginBottom: 10, justifyContent: 'space-between' },
  mBigInText: { fontSize: 24, fontWeight: 'bold', color: '#007AFF' },
  topActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10 },
  actionBtn: { padding: 10, backgroundColor: '#eef6ff', borderRadius: 8, minWidth: 46, alignItems: 'center' },
  actionBtnTxt: { color: '#007AFF', fontWeight: 'bold' },
  bottomKeys: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  numpad: { flex: 3 },
  numGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  numBtn: { width: '31%', padding: 12, backgroundColor: '#eee', borderRadius: 8, alignItems: 'center' },
  numBtnTxt: { fontWeight: 'bold', fontSize: 18 },
  flightpad: { flex: 1, gap: 5 },
  flightBtn: { flex: 1, backgroundColor: '#fff0f0', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  flightBtnTxt: { color: '#FF3B30', fontWeight: 'bold' },
  recordBtn: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center' },
  recordBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});