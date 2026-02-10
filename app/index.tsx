import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
const STORAGE_KEY = '@baseball_scorebook_v1';
const INNINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const INITIAL_LINEUP = [
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
  bases: number[];
}

export default function ScorebookScreen() {
  const [activeTeam, setActiveTeam] = useState<'AWAY' | 'HOME'>('AWAY');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAtBat, setSelectedAtBat] = useState<{ player: string, inning: number | null }>({ player: '', inning: null });
  const [customPlay, setCustomPlay] = useState("");

  const [scores, setScores] = useState<Record<'AWAY' | 'HOME', Record<string, AtBat>>>({
    AWAY: {},
    HOME: {}
  });

  // --- PERSISTENCE LOGIC ---

  // Load data on startup
  useEffect(() => {
    const loadGame = async () => {
      try {
        const savedData = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedData !== null) {
          setScores(JSON.parse(savedData));
        }
      } catch (e) {
        console.error("Failed to load game", e);
      }
    };
    loadGame();
  }, []);

  // Save data whenever scores change
  useEffect(() => {
    const saveGame = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
      } catch (e) {
        console.error("Failed to save game", e);
      }
    };
    saveGame();
  }, [scores]);

  const resetGame = () => {
    Alert.alert("Reset Game", "Are you sure you want to wipe all scores?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset", style: "destructive", onPress: async () => {
          const fresh = { AWAY: {}, HOME: {} };
          setScores(fresh);
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      }
    ]);
  };

  // --- SCORE LOGIC ---
  const totals = useMemo(() => ({
    AWAY: Object.values(scores.AWAY).filter(a => a.runScored).length,
    HOME: Object.values(scores.HOME).filter(a => a.runScored).length
  }), [scores]);

  const openCell = (playerName: string, inning: number) => {
    setSelectedAtBat({ player: playerName, inning: inning });
    setCustomPlay(scores[activeTeam][`${playerName}-${inning}`]?.result || "");
    setModalVisible(true);
  };

  const saveAtBat = (outcome: string | null) => {
    if (selectedAtBat.inning !== null) {
      const key = `${selectedAtBat.player}-${selectedAtBat.inning}`;
      setScores(prev => {
        const teamScores = { ...prev[activeTeam] };
        if (outcome === null) {
          delete teamScores[key];
        } else {
          const current = teamScores[key] || { runScored: false, outs: 0, balls: 0, strikes: 0, bases: [] };
          let autoOut = current.outs;
          let autoRun = current.runScored;
          let autoBases = [...(current.bases || [])];

          const isOut = /K|ꓘ|F|P|L|DP|\d-\d/.test(outcome);
          if (isOut && autoOut === 0) {
            const outsInInning = Object.keys(teamScores)
              .filter(k => k.endsWith(`-${selectedAtBat.inning}`) && k !== key)
              .map(k => teamScores[k].outs);
            const maxOut = outsInInning.length > 0 ? Math.max(...outsInInning) : 0;
            autoOut = maxOut < 3 ? maxOut + 1 : 3;
            autoBases = [];
          }

          if (autoBases.length === 0) {
            if (outcome.includes("1B") || outcome.includes("BB") || outcome.includes("HBP")) autoBases = [1];
            else if (outcome.includes("2B")) autoBases = [1, 2];
            else if (outcome.includes("3B")) autoBases = [1, 2, 3];
            else if (outcome.includes("HR")) { autoBases = []; autoRun = true; }
          }

          teamScores[key] = { ...current, result: outcome, outs: autoOut, runScored: autoRun, bases: autoBases };
        }
        return { ...prev, [activeTeam]: teamScores };
      });
    }
    setModalVisible(false);
    setCustomPlay("");
  };

  const toggleBase = (base: number) => {
    if (selectedAtBat.inning !== null) {
      const key = `${selectedAtBat.player}-${selectedAtBat.inning}`;
      setScores(prev => {
        const teamScores = { ...prev[activeTeam] };
        const current = teamScores[key] || { result: '', runScored: false, outs: 0, balls: 0, strikes: 0, bases: [] };
        const currentBases = current.bases || [];
        const newBases = currentBases.includes(base)
          ? currentBases.filter(b => b !== base)
          : [...currentBases, base].sort();
        teamScores[key] = { ...current, bases: newBases };
        return { ...prev, [activeTeam]: teamScores };
      });
    }
  };

  const updateCount = (type: 'balls' | 'strikes', delta: number) => {
    if (selectedAtBat.inning !== null) {
      const key = `${selectedAtBat.player}-${selectedAtBat.inning}`;
      setScores(prev => {
        const current = prev[activeTeam][key] || { result: '', runScored: false, outs: 0, balls: 0, strikes: 0, bases: [] };
        let newVal = (current[type] || 0) + delta;
        if (type === 'balls' && (newVal < 0 || newVal > 4)) return prev;
        if (type === 'strikes' && (newVal < 0 || newVal > 3)) return prev;
        return { ...prev, [activeTeam]: { ...prev[activeTeam], [key]: { ...current, [type]: newVal } } };
      });
    }
  };

  const currentSelection = scores[activeTeam][`${selectedAtBat.player}-${selectedAtBat.inning}`];

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

        <View style={styles.scoreboard}>
          <TouchableOpacity style={[styles.teamBox, activeTeam === 'AWAY' && styles.activeTeamBox]} onPress={() => setActiveTeam('AWAY')}>
            <Text style={[styles.teamLabel, activeTeam === 'AWAY' && styles.activeText]}>AWAY (TOP)</Text>
            <Text style={[styles.scoreText, activeTeam === 'AWAY' && styles.activeText]}>{totals.AWAY}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={resetGame} style={styles.vsContainer}><Text style={styles.vsText}>RESET</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.teamBox, activeTeam === 'HOME' && styles.activeTeamBox]} onPress={() => setActiveTeam('HOME')}>
            <Text style={[styles.teamLabel, activeTeam === 'HOME' && styles.activeText]}>HOME (BOT)</Text>
            <Text style={[styles.scoreText, activeTeam === 'HOME' && styles.activeText]}>{totals.HOME}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal bounces={false} contentContainerStyle={{ width: TOTAL_TABLE_WIDTH }}>
          <ScrollView bounces={false}>
            <View style={styles.row}>
              <View style={[styles.headerCell, { width: LINEUP_WIDTH }]}><Text style={styles.headerLabel}>{activeTeam} LINEUP</Text></View>
              {INNINGS.map(i => <View key={i} style={[styles.cell, styles.headerCell]}><Text style={styles.headerLabel}>{i}</Text></View>)}
            </View>

            {INITIAL_LINEUP.map((p) => (
              <View key={p.spot} style={styles.row}>
                <View style={[styles.playerCell, { width: LINEUP_WIDTH }]}>
                  <Text style={styles.playerName}>{p.spot}. {p.name}</Text>
                  <Text style={styles.playerPos}>{p.pos}</Text>
                </View>
                {INNINGS.map(i => {
                  const data = scores[activeTeam][`${p.name}-${i}`];
                  return (
                    <TouchableOpacity key={i} style={styles.cell} onPress={() => openCell(p.name, i)}>
                      <View style={styles.diamondContainer}>
                        <View style={[styles.baseLine, styles.lineHomeTo1st, data?.bases?.includes(1) && styles.lineActive]} />
                        <View style={[styles.baseLine, styles.line1stTo2nd, data?.bases?.includes(2) && styles.lineActive]} />
                        <View style={[styles.baseLine, styles.line2ndTo3rd, data?.bases?.includes(3) && styles.lineActive]} />
                        <View style={[styles.baseLine, styles.line3rdToHome, data?.runScored && styles.lineActive]} />
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

            <View style={[styles.row, styles.summaryRow]}>
              <View style={[styles.playerCell, { width: LINEUP_WIDTH, backgroundColor: '#f9f9f9', justifyContent: 'center' }]}><Text style={styles.summaryTitle}>INNING TOTALS</Text></View>
              {INNINGS.map(i => {
                const inningData = Object.keys(scores[activeTeam]).filter(key => key.endsWith(`-${i}`)).map(key => scores[activeTeam][key]);
                const runs = inningData.filter(d => d.runScored).length;
                const hits = inningData.filter(d => ['1B', '2B', '3B', 'HR'].includes(d.result)).length;
                const errors = inningData.filter(d => d.result.includes('E')).length;
                return (
                  <View key={i} style={[styles.cell, styles.summaryCell]}>
                    <View style={styles.summaryStat}><Text style={styles.statLabel}>R</Text><Text style={styles.statValue}>{runs}</Text></View>
                    <View style={styles.summaryStat}><Text style={styles.statLabel}>H</Text><Text style={styles.statValue}>{hits}</Text></View>
                    <View style={styles.summaryStat}><Text style={styles.statLabel}>E</Text><Text style={styles.statValue}>{errors}</Text></View>
                  </View>
                );
              })}
            </View>
            <View style={{ height: 100 }} />
          </ScrollView>
        </ScrollView>

        <Modal animationType="slide" transparent visible={modalVisible}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{activeTeam} • {selectedAtBat.player} • Inn {selectedAtBat.inning}</Text>
              <View style={styles.displayBar}>
                <TextInput style={styles.displayText} value={customPlay} placeholder="..." onChangeText={setCustomPlay} />
                <TouchableOpacity onPress={() => setCustomPlay(prev => prev.slice(0, -1))} style={styles.backBtn}><Text style={{ color: '#fff' }}>⌫</Text></TouchableOpacity>
              </View>

              <View style={styles.actionGrid}>
                {['1B', '2B', '3B', 'HR', 'BB', 'K', 'ꓘ', 'HBP', 'E'].map(act => (
                  <TouchableOpacity key={act} style={styles.actionBtn} onPress={() => setCustomPlay(prev => prev + act)}><Text style={styles.actionBtnText}>{act}</Text></TouchableOpacity>
                ))}
              </View>

              <View style={styles.middleRow}>
                <View style={styles.keypad}>
                  {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(num => (
                    <TouchableOpacity key={num} style={styles.keyBtn} onPress={() => setCustomPlay(prev => {
                      if (prev.length > 0 && !isNaN(Number(num)) && !isNaN(Number(prev.slice(-1)))) return `${prev}-${num}`;
                      return prev + num;
                    })}><Text style={styles.keyText}>{num}</Text></TouchableOpacity>
                  ))}
                </View>

                <View style={styles.statusPanel}>
                  <Text style={styles.sideLabel}>BASES</Text>
                  <View style={styles.basePickerRow}>
                    {[1, 2, 3].map(b => (
                      <TouchableOpacity key={b} onPress={() => toggleBase(b)} style={[styles.basePickerBtn, currentSelection?.bases?.includes(b) && styles.basePickerActive]}>
                        <Text style={[styles.basePickerText, currentSelection?.bases?.includes(b) && { color: '#fff' }]}>{b}B</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.sideLabel}>COUNT / RUN</Text>
                  <View style={{ flexDirection: 'row', gap: 5 }}>
                    <TouchableOpacity onPress={() => updateCount('balls', 1)} style={[styles.sBtn, { flex: 1 }]}><Text>B: {currentSelection?.balls || 0}</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => updateCount('strikes', 1)} style={[styles.sBtn, { flex: 1 }]}><Text>S: {currentSelection?.strikes || 0}</Text></TouchableOpacity>
                  </View>
                  <TouchableOpacity style={[styles.runToggleSmall, currentSelection?.runScored && { backgroundColor: '#FF3B30' }]} onPress={() => {
                    const key = `${selectedAtBat.player}-${selectedAtBat.inning}`;
                    setScores(prev => ({ ...prev, [activeTeam]: { ...prev[activeTeam], [key]: { ...(prev[activeTeam][key] || { result: '', outs: 0, balls: 0, strikes: 0, bases: [] }), runScored: !prev[activeTeam][key]?.runScored } } }));
                  }}><Text style={{ fontSize: 10, fontWeight: 'bold', color: currentSelection?.runScored ? '#fff' : '#000' }}>SCORED</Text></TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={() => saveAtBat(customPlay)}><Text style={styles.saveBtnText}>SAVE AT-BAT</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => saveAtBat(null)} style={{ marginTop: 15 }}><Text style={{ color: '#ff4444' }}>Clear Cell</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 10 }}><Text style={{ color: '#999' }}>Close</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scoreboard: { backgroundColor: '#1a1a1a', flexDirection: 'row', padding: 15, alignItems: 'center', justifyContent: 'space-between' },
  teamBox: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 10, backgroundColor: '#2a2a2a' },
  activeTeamBox: { backgroundColor: '#007AFF' },
  teamLabel: { color: '#888', fontSize: 10, fontWeight: 'bold' },
  scoreText: { color: '#555', fontSize: 24, fontWeight: '900' },
  activeText: { color: '#fff' },
  vsContainer: { paddingHorizontal: 15 },
  vsText: { color: '#444', fontWeight: 'bold', fontSize: 10 },
  row: { flexDirection: 'row' },
  cell: { width: CELL_SIZE, height: CELL_SIZE, borderWidth: 0.5, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  headerCell: { height: 40, backgroundColor: '#f0f0f0' },
  headerLabel: { fontSize: 10, fontWeight: 'bold', color: '#666' },
  playerCell: { padding: 10, borderBottomWidth: 0.5, borderColor: '#eee', backgroundColor: '#fff' },
  playerName: { fontWeight: 'bold' },
  playerPos: { fontSize: 10, color: '#888' },
  diamondContainer: { width: 56, height: 56, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  baseLine: { position: 'absolute', width: 28, height: 2, backgroundColor: '#eee' },
  lineActive: { backgroundColor: '#FF3B30', height: 3, zIndex: 1 },
  lineHomeTo1st: { transform: [{ rotate: '-45deg' }], bottom: 14, right: 3 },
  line1stTo2nd: { transform: [{ rotate: '45deg' }], top: 14, right: 3 },
  line2ndTo3rd: { transform: [{ rotate: '-45deg' }], top: 14, left: 3 },
  line3rdToHome: { transform: [{ rotate: '45deg' }], bottom: 14, left: 3 },
  resultText: { fontWeight: 'bold', color: '#007AFF', fontSize: 11, textAlign: 'center' },
  countIndicators: { position: 'absolute', bottom: 5, width: '100%', alignItems: 'center' },
  miniCountText: { fontSize: 9, color: '#aaa' },
  miniOutRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  miniOutDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#eee' },
  outDotActive: { backgroundColor: '#FF3B30' },
  summaryRow: { borderTopWidth: 2, borderColor: '#444' },
  summaryTitle: { fontSize: 10, fontWeight: '900', color: '#444' },
  summaryCell: { backgroundColor: '#f9f9f9', paddingVertical: 5 },
  summaryStat: { flexDirection: 'row', justifyContent: 'space-between', width: '70%', paddingHorizontal: 5 },
  statLabel: { fontSize: 9, fontWeight: 'bold', color: '#999' },
  statValue: { fontSize: 10, fontWeight: '900', color: '#007AFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, alignItems: 'center' },
  modalTitle: { fontSize: 12, fontWeight: 'bold', color: '#999', marginBottom: 10 },
  displayBar: { flexDirection: 'row', width: '100%', backgroundColor: '#f8f8f8', borderRadius: 10, padding: 10, marginBottom: 15, alignItems: 'center' },
  displayText: { flex: 1, fontSize: 24, fontWeight: '900', color: '#007AFF' },
  backBtn: { backgroundColor: '#FF3B30', padding: 8, borderRadius: 8 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 15 },
  actionBtn: { padding: 10, backgroundColor: '#E3F2FD', borderRadius: 6 },
  actionBtnText: { color: '#1976D2', fontWeight: 'bold', fontSize: 12 },
  middleRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 20 },
  keypad: { width: '55%', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  keyBtn: { width: '30%', aspectRatio: 1, backgroundColor: '#f0f0f0', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  keyText: { fontSize: 18, fontWeight: 'bold' },
  statusPanel: { width: '42%', gap: 8 },
  sideLabel: { fontSize: 9, fontWeight: 'bold', color: '#999', marginTop: 5 },
  basePickerRow: { flexDirection: 'row', gap: 4 },
  basePickerBtn: { flex: 1, padding: 8, backgroundColor: '#f0f0f0', borderRadius: 5, alignItems: 'center' },
  basePickerActive: { backgroundColor: '#FF3B30' },
  basePickerText: { fontSize: 9, fontWeight: 'bold' },
  sBtn: { padding: 10, backgroundColor: '#f0f0f0', borderRadius: 5, alignItems: 'center' },
  runToggleSmall: { padding: 10, backgroundColor: '#f0f0f0', borderRadius: 5, alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  saveBtn: { width: '100%', padding: 18, backgroundColor: '#007AFF', borderRadius: 15, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});