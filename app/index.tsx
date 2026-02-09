import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView, StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const INNINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const LINEUP = [
  { spot: 1, name: 'Henderson', pos: 'LF' },
  { spot: 2, name: 'Boggs', pos: '3B' },
  { spot: 3, name: 'Gwynn', pos: 'RF' },
  { spot: 4, name: 'Walker', pos: 'CF' },
  { spot: 5, name: 'Murray', pos: '1B' },
  { spot: 6, name: 'Ripken', pos: 'SS' },
  { spot: 7, name: 'Sandberg', pos: '2B' },
  { spot: 8, name: 'Fisk', pos: 'C' },
  { spot: 9, name: 'Maddux', pos: 'P' },
];

const CELL_SIZE = 90;
const LINEUP_WIDTH = 130;
const TOTAL_TABLE_WIDTH = LINEUP_WIDTH + (CELL_SIZE * INNINGS.length);

interface AtBat {
  result: string;
  runScored: boolean;
}

export default function ScorebookScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAtBat, setSelectedAtBat] = useState<{ player: string, inning: number | null }>({
    player: '',
    inning: null
  });
  const [scores, setScores] = useState<Record<string, AtBat>>({});

  // NEW: Calculate total runs automatically
  const totalRuns = useMemo(() => {
    return Object.values(scores).filter(atBat => atBat.runScored).length;
  }, [scores]);

  // NEW: Calculate runs per inning
  const getRunsForInning = (inning: number) => {
    return Object.keys(scores).filter(key => {
      const parts = key.split('-');
      return parts[parts.length - 1] === inning.toString() && scores[key].runScored;
    }).length;
  };

  const openCell = (playerName: string, inning: number) => {
    setSelectedAtBat({ player: playerName, inning: inning });
    setModalVisible(true);
  };

  const handleOutcome = (outcome: string | null) => {
    if (selectedAtBat.inning !== null) {
      const key = `${selectedAtBat.player}-${selectedAtBat.inning}`;
      setScores(prev => {
        const newScores = { ...prev };
        if (outcome === null) {
          delete newScores[key];
        } else {
          const wasScored = prev[key]?.runScored || false;
          newScores[key] = { result: outcome, runScored: wasScored };
        }
        return newScores;
      });
    }
    setModalVisible(false);
  };

  const toggleRun = () => {
    if (selectedAtBat.inning !== null) {
      const key = `${selectedAtBat.player}-${selectedAtBat.inning}`;
      setScores(prev => ({
        ...prev,
        [key]: {
          result: prev[key]?.result || '',
          runScored: !prev[key]?.runScored
        }
      }));
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

        {/* SCOREBOARD HEADER */}
        <View style={styles.scoreboard}>
          <View style={styles.teamInfo}>
            <Text style={styles.teamName}>HOME TEAM</Text>
            <View style={styles.runBadge}>
              <Text style={styles.runCount}>{totalRuns}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <Text style={styles.inningSummary}>
            {totalRuns === 1 ? '1 RUN SCORED' : `${totalRuns} RUNS SCORED`}
          </Text>
        </View>

        <ScrollView horizontal bounces={false} contentContainerStyle={{ width: TOTAL_TABLE_WIDTH }}>
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            {/* TABLE HEADER */}
            <View style={styles.row}>
              <View style={[styles.headerCell, { width: LINEUP_WIDTH }]}>
                <Text style={styles.headerLabel}>LINEUP</Text>
              </View>
              {INNINGS.map(i => (
                <View key={i} style={[styles.cell, styles.headerCell]}>
                  <Text style={styles.headerLabel}>{i}</Text>
                  <Text style={styles.inningRuns}>{getRunsForInning(i)}R</Text>
                </View>
              ))}
            </View>

            {/* PLAYER ROWS */}
            {LINEUP.map((p) => (
              <View key={p.spot} style={styles.row}>
                <View style={[styles.playerCell, { width: LINEUP_WIDTH }]}>
                  <Text style={styles.playerName}>{p.spot}. {p.name}</Text>
                  <Text style={styles.playerPos}>{p.pos}</Text>
                </View>

                {INNINGS.map(i => {
                  const data = scores[`${p.name}-${i}`];
                  return (
                    <TouchableOpacity key={`${p.spot}-${i}`} style={styles.cell} onPress={() => openCell(p.name, i)}>
                      <View style={[styles.diamond, data?.result ? styles.diamondActive : null]}>
                        {data?.runScored && <View style={styles.runCircle} />}
                        {data?.result ? (
                          <View style={styles.resultContainer}>
                            <Text style={styles.resultText}>{data.result}</Text>
                          </View>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
            <View style={{ height: 150 }} />
          </ScrollView>
        </ScrollView>

        {/* MODAL (Same as before) */}
        <Modal animationType="slide" transparent={true} visible={modalVisible}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedAtBat.player} • Inn {selectedAtBat.inning}</Text>

              <TouchableOpacity
                style={[styles.runToggleButton, scores[`${selectedAtBat.player}-${selectedAtBat.inning}`]?.runScored && styles.runToggleActive]}
                onPress={toggleRun}
              >
                <Text style={[styles.runToggleText, scores[`${selectedAtBat.player}-${selectedAtBat.inning}`]?.runScored && { color: '#fff' }]}>
                  {scores[`${selectedAtBat.player}-${selectedAtBat.inning}`]?.runScored ? "🏃 RUN RECORDED" : "➕ RECORD RUN"}
                </Text>
              </TouchableOpacity>

              <View style={styles.buttonGrid}>
                {['1B', '2B', '3B', 'HR', 'K', 'ꓘ', 'BB', 'E', '6-3', 'F8', 'SAC', 'FC'].map((outcome) => (
                  <TouchableOpacity key={outcome} style={styles.outcomeButton} onPress={() => handleOutcome(outcome)}>
                    <Text style={styles.outcomeText}>{outcome}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={[styles.footerButton, styles.clearButton]} onPress={() => handleOutcome(null)}>
                  <Text style={styles.clearButtonText}>CLEAR SCORE</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>CLOSE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scoreboard: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#007AFF'
  },
  teamInfo: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  teamName: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  runBadge: { backgroundColor: '#007AFF', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 8 },
  runCount: { color: '#fff', fontSize: 24, fontWeight: '900' },
  divider: { height: 1, backgroundColor: '#333', width: '60%', marginVertical: 10 },
  inningSummary: { color: '#666', fontSize: 12, fontWeight: 'bold' },

  row: { flexDirection: 'row', backgroundColor: '#fff' },
  cell: { width: CELL_SIZE, height: CELL_SIZE, borderWidth: 0.5, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
  headerCell: { height: 60, backgroundColor: '#f2f2f2', justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderColor: '#ccc' },
  headerLabel: { fontWeight: 'bold', fontSize: 12, color: '#333' },
  inningRuns: { fontSize: 10, color: '#007AFF', fontWeight: 'bold', marginTop: 2 },

  playerCell: { height: CELL_SIZE, paddingHorizontal: 10, borderBottomWidth: 0.5, borderColor: '#eee', justifyContent: 'center', backgroundColor: '#fff' },
  playerName: { fontWeight: 'bold', fontSize: 14, color: '#000' },
  playerPos: { fontSize: 11, color: '#666' },

  diamond: { width: 44, height: 44, borderWidth: 1, borderColor: '#eee', transform: [{ rotate: '45deg' }], alignItems: 'center', justifyContent: 'center' },
  diamondActive: { borderColor: '#007AFF', borderWidth: 1.5 },
  runCircle: { position: 'absolute', width: 24, height: 24, borderRadius: 12, backgroundColor: '#007AFF', borderWidth: 1, borderColor: '#007AFF' },
  resultContainer: { transform: [{ rotate: '-45deg' }] },
  resultText: { fontSize: 13, fontWeight: 'bold', color: '#007AFF' },
  // ... (Other styles same as previous)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', padding: 25, borderTopLeftRadius: 25, borderTopRightRadius: 25, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  runToggleButton: { width: '100%', padding: 12, borderRadius: 10, backgroundColor: '#f0f0f0', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#ddd' },
  runToggleActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  runToggleText: { fontWeight: 'bold', color: '#333' },
  buttonGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  outcomeButton: { width: 65, height: 50, backgroundColor: '#f8f8f8', justifyContent: 'center', alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#eee' },
  outcomeText: { fontWeight: 'bold', fontSize: 14, color: '#333' },
  modalFooter: { width: '100%', marginTop: 20 },
  footerButton: { width: '100%', height: 45, justifyContent: 'center', alignItems: 'center' },
  clearButton: { marginTop: 10 },
  clearButtonText: { color: '#ff4444', fontWeight: 'bold' },
  cancelButtonText: { color: '#999', fontWeight: 'bold' }
});