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
}

export default function ScorebookScreen() {
  const [activeTeam, setActiveTeam] = useState<'AWAY' | 'HOME'>('AWAY');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAtBat, setSelectedAtBat] = useState<{ player: string, inning: number | null }>({ player: '', inning: null });

  const [scores, setScores] = useState<Record<'AWAY' | 'HOME', Record<string, AtBat>>>({
    AWAY: {},
    HOME: {}
  });

  const [customPlay, setCustomPlay] = useState("");

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
          const current = teamScores[key] || { runScored: false, outs: 0, balls: 0, strikes: 0 };
          let autoOut = current.outs;
          let autoRun = current.runScored;

          // Smart Logic for Outs and Runs
          const isOut = /K|ꓘ|F|P|L|DP|\d-\d/.test(outcome);
          if (outcome.includes("HR")) autoRun = true;

          if (isOut && autoOut === 0) {
            const outsInInning = Object.keys(teamScores)
              .filter(k => k.endsWith(`-${selectedAtBat.inning}`) && k !== key)
              .map(k => teamScores[k].outs);
            const maxOut = outsInInning.length > 0 ? Math.max(...outsInInning) : 0;
            autoOut = maxOut < 3 ? maxOut + 1 : 3;
          }

          teamScores[key] = { ...current, result: outcome, outs: autoOut, runScored: autoRun };
        }
        return { ...prev, [activeTeam]: teamScores };
      });
    }
    setModalVisible(false);
    setCustomPlay("");
  };

  const updateCount = (type: 'balls' | 'strikes', delta: number) => {
    if (selectedAtBat.inning !== null) {
      const key = `${selectedAtBat.player}-${selectedAtBat.inning}`;
      setScores(prev => {
        const current = prev[activeTeam][key] || { result: '', runScored: false, outs: 0, balls: 0, strikes: 0 };
        let newVal = (current[type] || 0) + delta;
        if (type === 'balls' && (newVal < 0 || newVal > 4)) return prev;
        if (type === 'strikes' && (newVal < 0 || newVal > 3)) return prev;
        return {
          ...prev,
          [activeTeam]: { ...prev[activeTeam], [key]: { ...current, [type]: newVal } }
        };
      });
    }
  };

  const toggleRun = () => {
    if (selectedAtBat.inning !== null) {
      const key = `${selectedAtBat.player}-${selectedAtBat.inning}`;
      setScores(prev => ({
        ...prev,
        [activeTeam]: {
          ...prev[activeTeam],
          [key]: {
            ...(prev[activeTeam][key] || { result: '', outs: 0, balls: 0, strikes: 0 }),
            runScored: !prev[activeTeam][key]?.runScored
          }
        }
      }));
    }
  };

  const currentSelection = scores[activeTeam][`${selectedAtBat.player}-${selectedAtBat.inning}`];

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

        <View style={styles.scoreboard}>
          <TouchableOpacity
            style={[styles.teamBox, activeTeam === 'AWAY' && styles.activeTeamBox]}
            onPress={() => setActiveTeam('AWAY')}
          >
            <Text style={[styles.teamLabel, activeTeam === 'AWAY' && styles.activeText]}>AWAY (TOP)</Text>
            <Text style={[styles.scoreText, activeTeam === 'AWAY' && styles.activeText]}>{totals.AWAY}</Text>
          </TouchableOpacity>

          <View style={styles.vsContainer}><Text style={styles.vsText}>VS</Text></View>

          <TouchableOpacity
            style={[styles.teamBox, activeTeam === 'HOME' && styles.activeTeamBox]}
            onPress={() => setActiveTeam('HOME')}
          >
            <Text style={[styles.teamLabel, activeTeam === 'HOME' && styles.activeText]}>HOME (BOT)</Text>
            <Text style={[styles.scoreText, activeTeam === 'HOME' && styles.activeText]}>{totals.HOME}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal bounces={false} contentContainerStyle={{ width: TOTAL_TABLE_WIDTH }}>
          <ScrollView bounces={false}>
            {/* Header Row */}
            <View style={styles.row}>
              <View style={[styles.headerCell, { width: LINEUP_WIDTH }]}><Text style={styles.headerLabel}>{activeTeam} LINEUP</Text></View>
              {INNINGS.map(i => (
                <View key={i} style={[styles.cell, styles.headerCell]}>
                  <Text style={styles.headerLabel}>{i}</Text>
                </View>
              ))}
            </View>

            {/* Lineup Rows */}
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
                      <View style={styles.diamond}>
                        {data?.runScored && <View style={styles.runCircle} />}
                        {data?.result && <Text style={styles.resultText}>{data.result}</Text>}
                      </View>
                      <View style={styles.countIndicators}>
                        <Text style={styles.miniCountText}>{data?.balls || 0}-{data?.strikes || 0}</Text>
                        <View style={styles.miniOutRow}>
                          {[1, 2, 3].map(o => (
                            <View key={o} style={[styles.miniOutDot, (data?.outs ?? 0) >= o ? styles.outDotActive : null]} />
                          ))}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            {/* --- INNING SUMMARY ROW --- */}
            <View style={[styles.row, styles.summaryRow]}>
              <View style={[styles.playerCell, { width: LINEUP_WIDTH, backgroundColor: '#f9f9f9', justifyContent: 'center' }]}>
                <Text style={styles.summaryTitle}>INNING TOTALS</Text>
              </View>
              {INNINGS.map(i => {
                const inningKeys = Object.keys(scores[activeTeam]).filter(key => key.endsWith(`-${i}`));
                const inningData = inningKeys.map(key => scores[activeTeam][key]);

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
                <TextInput style={styles.displayText} value={customPlay} placeholder="Tap positions..." onChangeText={setCustomPlay} />
                <TouchableOpacity onPress={() => setCustomPlay(prev => prev.slice(0, -1))} style={styles.backBtn}><Text style={{ color: '#fff' }}>⌫</Text></TouchableOpacity>
              </View>

              <View style={styles.actionGrid}>
                {['1B', '2B', '3B', 'HR', 'BB', 'K', 'ꓘ', 'HBP', 'E'].map(act => (
                  <TouchableOpacity key={act} style={styles.actionBtn} onPress={() => setCustomPlay(prev => prev + act)}>
                    <Text style={styles.actionBtnText}>{act}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.middleRow}>
                <View style={styles.keypad}>
                  {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(num => (
                    <TouchableOpacity key={num} style={styles.keyBtn} onPress={() => setCustomPlay(prev => {
                      if (prev.length > 0 && !isNaN(Number(num)) && !isNaN(Number(prev.slice(-1)))) return `${prev}-${num}`;
                      return prev + num;
                    })}>
                      <Text style={styles.keyText}>{num}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.statusPanel}>
                  <Text style={styles.sideLabel}>COUNT</Text>
                  <TouchableOpacity onPress={() => updateCount('balls', 1)} style={styles.sBtn}><Text>B: {currentSelection?.balls || 0}</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => updateCount('strikes', 1)} style={styles.sBtn}><Text>S: {currentSelection?.strikes || 0}</Text></TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.runToggleSmall, currentSelection?.runScored && { backgroundColor: '#007AFF' }]}
                    onPress={toggleRun}
                  >
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: currentSelection?.runScored ? '#fff' : '#000' }}>RUN</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={() => saveAtBat(customPlay)}>
                <Text style={styles.saveBtnText}>SAVE AT-BAT</Text>
              </TouchableOpacity>

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
  vsText: { color: '#444', fontWeight: 'bold' },

  row: { flexDirection: 'row' },
  cell: { width: CELL_SIZE, height: CELL_SIZE, borderWidth: 0.5, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  headerCell: { height: 40, backgroundColor: '#f0f0f0' },
  headerLabel: { fontSize: 10, fontWeight: 'bold', color: '#666' },
  playerCell: { padding: 10, borderBottomWidth: 0.5, borderColor: '#eee', backgroundColor: '#fff' },
  playerName: { fontWeight: 'bold' },
  playerPos: { fontSize: 10, color: '#888' },

  diamond: { width: 50, height: 50, borderWidth: 1, borderColor: '#eee', transform: [{ rotate: '45deg' }], justifyContent: 'center', alignItems: 'center' },
  runCircle: { position: 'absolute', width: 25, height: 25, borderRadius: 12.5, backgroundColor: '#007AFF', opacity: 0.3 },
  resultText: { transform: [{ rotate: '-45deg' }], fontWeight: 'bold', color: '#007AFF', fontSize: 11, textAlign: 'center' },

  countIndicators: { position: 'absolute', bottom: 5, width: '100%', alignItems: 'center' },
  miniCountText: { fontSize: 9, color: '#aaa' },
  miniOutRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  miniOutDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#eee' },
  outDotActive: { backgroundColor: '#FF3B30' },

  summaryRow: { borderTopWidth: 2, borderColor: '#444' },
  summaryTitle: { fontSize: 10, fontWeight: '900', color: '#444', letterSpacing: 0.5 },
  summaryCell: { backgroundColor: '#f9f9f9', paddingVertical: 5 },
  summaryStat: { flexDirection: 'row', justifyContent: 'space-between', width: '70%', paddingHorizontal: 5 },
  statLabel: { fontSize: 9, fontWeight: 'bold', color: '#999' },
  statValue: { fontSize: 10, fontWeight: '900', color: '#007AFF' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, alignItems: 'center' },
  modalTitle: { fontSize: 14, fontWeight: 'bold', color: '#999', marginBottom: 15 },
  displayBar: { flexDirection: 'row', width: '100%', backgroundColor: '#f8f8f8', borderRadius: 10, padding: 10, marginBottom: 15, alignItems: 'center' },
  displayText: { flex: 1, fontSize: 24, fontWeight: '900', color: '#007AFF' },
  backBtn: { backgroundColor: '#FF3B30', padding: 10, borderRadius: 8 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 },
  actionBtn: { padding: 10, backgroundColor: '#E3F2FD', borderRadius: 6 },
  actionBtnText: { color: '#1976D2', fontWeight: 'bold' },
  middleRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 20 },
  keypad: { width: '60%', flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  keyBtn: { width: '28%', aspectRatio: 1, backgroundColor: '#f0f0f0', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  keyText: { fontSize: 18, fontWeight: 'bold' },
  statusPanel: { width: '35%', gap: 10 },
  sideLabel: { fontSize: 10, fontWeight: 'bold', color: '#999' },
  sBtn: { padding: 12, backgroundColor: '#f0f0f0', borderRadius: 5, alignItems: 'center' },
  runToggleSmall: { padding: 10, backgroundColor: '#f0f0f0', borderRadius: 5, alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  saveBtn: { width: '100%', padding: 18, backgroundColor: '#007AFF', borderRadius: 15, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});