import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView, StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// --- CONSTANTS ---
const INNINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const LINEUP = [
  { spot: 1, name: 'Henderson', pos: 'LF' }, { spot: 2, name: 'Boggs', pos: '3B' },
  { spot: 3, name: 'Gwynn', pos: 'RF' }, { spot: 4, name: 'Walker', pos: 'CF' },
  { spot: 5, name: 'Murray', pos: '1B' }, { spot: 6, name: 'Ripken', pos: 'SS' },
  { spot: 7, name: 'Sandberg', pos: '2B' }, { spot: 8, name: 'Fisk', pos: 'C' },
  { spot: 9, name: 'Maddux', pos: 'P' },
];

const CELL_SIZE = 95;
const LINEUP_WIDTH = 130;
const TOTAL_TABLE_WIDTH = LINEUP_WIDTH + (CELL_SIZE * INNINGS.length);

interface AtBat {
  result: string;
  runScored: boolean;
  outs: number;
  balls: number;
  strikes: number;
}

export default function ScorebookScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAtBat, setSelectedAtBat] = useState<{ player: string, inning: number | null }>({ player: '', inning: null });
  const [scores, setScores] = useState<Record<string, AtBat>>({});

  // Custom Play Builder State
  const [customPlay, setCustomPlay] = useState("");

  const totalRuns = useMemo(() => Object.values(scores).filter(atBat => atBat.runScored).length, [scores]);

  const openCell = (playerName: string, inning: number) => {
    setSelectedAtBat({ player: playerName, inning: inning });
    setCustomPlay(scores[`${playerName}-${inning}`]?.result || "");
    setModalVisible(true);
  };

  const saveAtBat = (outcome: string | null) => {
    if (selectedAtBat.inning !== null) {
      const key = `${selectedAtBat.player}-${selectedAtBat.inning}`;
      setScores(prev => {
        const newScores = { ...prev };
        if (outcome === null) delete newScores[key];
        else {
          const current = prev[key] || { runScored: false, outs: 0, balls: 0, strikes: 0 };
          newScores[key] = { ...current, result: outcome };
        }
        return newScores;
      });
    }
    setModalVisible(false);
    setCustomPlay("");
  };

  const updateCount = (type: 'balls' | 'strikes', delta: number) => {
    if (selectedAtBat.inning !== null) {
      const key = `${selectedAtBat.player}-${selectedAtBat.inning}`;
      setScores(prev => {
        const current = prev[key] || { result: '', runScored: false, outs: 0, balls: 0, strikes: 0 };
        let newVal = (current[type] || 0) + delta;
        if (type === 'balls' && (newVal < 0 || newVal > 4)) return prev;
        if (type === 'strikes' && (newVal < 0 || newVal > 3)) return prev;
        return { ...prev, [key]: { ...current, [type]: newVal } };
      });
    }
  };

  const setInningOuts = (outCount: number) => {
    if (selectedAtBat.inning !== null) {
      const key = `${selectedAtBat.player}-${selectedAtBat.inning}`;
      setScores(prev => ({
        ...prev,
        [key]: { ...(prev[key] || { result: '', runScored: false, balls: 0, strikes: 0 }), outs: outCount === prev[key]?.outs ? 0 : outCount }
      }));
    }
  };

  const addToPlay = (val: string) => setCustomPlay(prev => (prev.length > 0 && !isNaN(Number(val)) && !isNaN(Number(prev.slice(-1)))) ? `${prev}-${val}` : prev + val);

  const currentSelection = scores[`${selectedAtBat.player}-${selectedAtBat.inning}`];

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

        {/* Header Scoreboard */}
        <View style={styles.scoreboard}>
          <Text style={styles.teamName}>HOME TEAM</Text>
          <View style={styles.runBadge}><Text style={styles.runCount}>{totalRuns}</Text></View>
        </View>

        <ScrollView horizontal bounces={false} contentContainerStyle={{ width: TOTAL_TABLE_WIDTH }}>
          <ScrollView bounces={false}>
            {/* Headers */}
            <View style={styles.row}>
              <View style={[styles.headerCell, { width: LINEUP_WIDTH }]}><Text style={styles.headerLabel}>LINEUP</Text></View>
              {INNINGS.map(i => (
                <View key={i} style={[styles.cell, styles.headerCell]}><Text style={styles.headerLabel}>{i}</Text></View>
              ))}
            </View>

            {/* Grid */}
            {LINEUP.map((p) => (
              <View key={p.spot} style={styles.row}>
                <View style={[styles.playerCell, { width: LINEUP_WIDTH }]}>
                  <Text style={styles.playerName}>{p.spot}. {p.name}</Text>
                  <Text style={styles.playerPos}>{p.pos}</Text>
                </View>
                {INNINGS.map(i => {
                  const data = scores[`${p.name}-${i}`];
                  return (
                    <TouchableOpacity key={i} style={styles.cell} onPress={() => openCell(p.name, i)}>
                      <View style={styles.diamond}>
                        {data?.runScored && <View style={styles.runCircle} />}
                        {data?.result && <Text style={styles.resultText}>{data.result}</Text>}
                      </View>
                      <View style={styles.countIndicators}>
                        <Text style={styles.miniCountText}>{data?.balls || 0}-{data?.strikes || 0}</Text>
                        <View style={styles.miniOutRow}>
                          {[1, 2, 3].map(o => <View key={o} style={[styles.miniOutDot, (data?.outs ?? 0) >= o && styles.outDotActive]} />)}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </ScrollView>

        {/* --- DYNAMIC MODAL --- */}
        <Modal animationType="slide" transparent visible={modalVisible}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedAtBat.player} - Inn {selectedAtBat.inning}</Text>

              {/* 1. THE PLAY DISPLAY */}
              <View style={styles.displayBar}>
                <TextInput
                  style={styles.displayText}
                  value={customPlay}
                  placeholder="Tap positions or action..."
                  onChangeText={setCustomPlay}
                />
                <TouchableOpacity onPress={() => setCustomPlay(prev => prev.slice(0, -1))} style={styles.backBtn}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>⌫</Text>
                </TouchableOpacity>
              </View>

              {/* 2. QUICK ACTIONS */}
              <View style={styles.actionGrid}>
                {['1B', '2B', '3B', 'HR', 'BB', 'K', 'ꓘ', 'HBP', 'E'].map(act => (
                  <TouchableOpacity key={act} style={styles.actionBtn} onPress={() => addToPlay(act)}>
                    <Text style={styles.actionBtnText}>{act}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.middleRow}>
                {/* 3. NUMERIC KEYPAD (POSITIONS) */}
                <View style={styles.keypad}>
                  {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(num => (
                    <TouchableOpacity key={num} style={styles.keyBtn} onPress={() => addToPlay(num.toString())}>
                      <Text style={styles.keyText}>{num}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={styles.keyBtn} onPress={() => addToPlay('DP')}><Text style={styles.keyText}>DP</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.keyBtn} onPress={() => addToPlay('F')}><Text style={styles.keyText}>F</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.keyBtn} onPress={() => addToPlay('U')}><Text style={styles.keyText}>U</Text></TouchableOpacity>
                </View>

                {/* 4. STATUS CONTROLS (B/S/Outs) */}
                <View style={styles.statusPanel}>
                  <Text style={styles.sideLabel}>COUNT</Text>
                  <View style={styles.miniStepper}>
                    <TouchableOpacity onPress={() => updateCount('balls', 1)} style={styles.sBtn}><Text>B: {currentSelection?.balls || 0}</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => updateCount('strikes', 1)} style={styles.sBtn}><Text>S: {currentSelection?.strikes || 0}</Text></TouchableOpacity>
                  </View>
                  <Text style={styles.sideLabel}>OUTS</Text>
                  <View style={styles.outBtnRow}>
                    {[1, 2, 3].map(n => (
                      <TouchableOpacity key={n} onPress={() => setInningOuts(n)} style={[styles.oBtn, currentSelection?.outs === n && { backgroundColor: '#FF3B30' }]}>
                        <Text style={{ color: currentSelection?.outs === n ? '#fff' : '#000' }}>{n}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* 5. FINAL ACTIONS */}
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: customPlay ? '#007AFF' : '#ccc' }]}
                onPress={() => saveAtBat(customPlay)}
              >
                <Text style={styles.saveBtnText}>SAVE AT-BAT</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 15 }}>
                <Text style={{ color: '#999' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scoreboard: { backgroundColor: '#1a1a1a', padding: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20 },
  teamName: { color: '#fff', fontSize: 18, fontWeight: '900' },
  runBadge: { backgroundColor: '#007AFF', paddingHorizontal: 12, borderRadius: 5 },
  runCount: { color: '#fff', fontSize: 20, fontWeight: 'bold' },

  row: { flexDirection: 'row' },
  cell: { width: CELL_SIZE, height: CELL_SIZE, borderWidth: 0.5, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  headerCell: { height: 40, backgroundColor: '#f0f0f0' },
  headerLabel: { fontSize: 10, fontWeight: 'bold', color: '#666' },
  playerCell: { padding: 10, borderBottomWidth: 0.5, borderColor: '#eee' },
  playerName: { fontWeight: 'bold' },
  playerPos: { fontSize: 10, color: '#888' },

  diamond: { width: 50, height: 50, borderWidth: 1, borderColor: '#ddd', transform: [{ rotate: '45deg' }], justifyContent: 'center', alignItems: 'center' },
  runCircle: { position: 'absolute', width: 25, height: 25, borderRadius: 12.5, backgroundColor: 'rgba(0,122,255,0.2)' },
  resultText: { transform: [{ rotate: '-45deg' }], fontWeight: 'bold', color: '#007AFF', fontSize: 12 },

  countIndicators: { position: 'absolute', bottom: 5, width: '100%', alignItems: 'center' },
  miniCountText: { fontSize: 9, color: '#aaa' },
  miniOutRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  miniOutDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#eee' },
  outDotActive: { backgroundColor: '#FF3B30' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, alignItems: 'center' },
  modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },

  displayBar: { flexDirection: 'row', width: '100%', backgroundColor: '#f8f8f8', borderRadius: 10, padding: 10, marginBottom: 15, alignItems: 'center' },
  displayText: { flex: 1, fontSize: 24, fontWeight: '900', color: '#007AFF' },
  backBtn: { backgroundColor: '#FF3B30', padding: 10, borderRadius: 8 },

  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#E3F2FD', borderRadius: 6 },
  actionBtnText: { color: '#1976D2', fontWeight: 'bold' },

  middleRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 20 },
  keypad: { width: '60%', flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  keyBtn: { width: '28%', aspectRatio: 1, backgroundColor: '#f0f0f0', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  keyText: { fontSize: 18, fontWeight: 'bold' },

  statusPanel: { width: '35%', gap: 10 },
  sideLabel: { fontSize: 10, fontWeight: 'bold', color: '#999' },
  miniStepper: { gap: 5 },
  sBtn: { padding: 10, backgroundColor: '#f0f0f0', borderRadius: 5, alignItems: 'center' },
  outBtnRow: { flexDirection: 'row', gap: 5 },
  oBtn: { flex: 1, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 5, alignItems: 'center' },

  saveBtn: { width: '100%', padding: 18, borderRadius: 15, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});