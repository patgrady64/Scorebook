import React, { useState } from 'react';
import {
  Modal, Pressable,
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
// We calculate the exact pixel width of the entire board
const TOTAL_TABLE_WIDTH = LINEUP_WIDTH + (CELL_SIZE * INNINGS.length);

export default function ScorebookScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAtBat, setSelectedAtBat] = useState<{ player: string, inning: number | null }>({
    player: '',
    inning: null
  });

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>SCOREBOOK</Text>
        </View>

        {/* HORIZONTAL SCROLL IS THE BOSS 
          We use contentContainerStyle to force the width to be exactly what we need.
        */}
        <ScrollView
          horizontal
          bounces={false}
          contentContainerStyle={{ width: TOTAL_TABLE_WIDTH }}
        >
          {/* VERTICAL SCROLL: Inside the horizontal one */}
          <ScrollView bounces={false} showsVerticalScrollIndicator={true}>

            {/* 1. HEADER ROW */}
            <View style={styles.row}>
              <View style={[styles.headerCell, { width: LINEUP_WIDTH }]}>
                <Text style={styles.headerLabel}>LINEUP</Text>
              </View>
              {INNINGS.map(i => (
                <View key={i} style={[styles.cell, styles.headerCell]}>
                  <Text style={styles.headerLabel}>{i}</Text>
                </View>
              ))}
            </View>

            {/* 2. PLAYER ROWS */}
            {LINEUP.map((p) => (
              <View key={p.spot} style={styles.row}>
                {/* Name Cell */}
                <View style={[styles.playerCell, { width: LINEUP_WIDTH }]}>
                  <Text style={styles.playerName}>{p.spot}. {p.name}</Text>
                  <Text style={styles.playerPos}>{p.pos}</Text>
                </View>

                {/* Inning Cells */}
                {INNINGS.map(i => (
                  <TouchableOpacity
                    key={`${p.spot}-${i}`}
                    style={styles.cell}
                    onPress={() => {
                      setSelectedAtBat({ player: p.name, inning: i });
                      setModalVisible(true);
                    }}
                  >
                    <View style={styles.diamond} />
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            {/* Failsafe padding so the 9th batter is never hidden by the system nav bar */}
            <View style={{ height: 150 }} />
          </ScrollView>
        </ScrollView>

        {/* MODAL (Keep as is) */}
        <Modal animationType="fade" transparent={true} visible={modalVisible}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedAtBat.player} • Inn {selectedAtBat.inning}</Text>
              <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButtonText}>CLOSE</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { height: 60, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  row: { flexDirection: 'row', backgroundColor: '#fff' },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 0.5,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerCell: {
    height: 45,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#ccc'
  },
  headerLabel: { fontWeight: 'bold', fontSize: 12, color: '#333' },
  playerCell: {
    height: CELL_SIZE,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderColor: '#eee',
    justifyContent: 'center',
    backgroundColor: '#fff'
  },
  playerName: { fontWeight: 'bold', fontSize: 14, color: '#000' },
  playerPos: { fontSize: 11, color: '#666' },
  diamond: {
    width: 34,
    height: 34,
    borderWidth: 1,
    borderColor: '#ddd',
    transform: [{ rotate: '45deg' }]
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 15,
    alignItems: 'center'
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  closeButton: { marginTop: 10 },
  closeButtonText: { color: '#007AFF', fontWeight: 'bold', fontSize: 16 }
});