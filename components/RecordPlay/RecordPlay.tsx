import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';

import styles from './RecordPlay.styles';

type RecordPlayProps = {
  visible: boolean;

  playInput: string;
  setPlayInput: React.Dispatch<React.SetStateAction<string>>;

  balls: number;
  strikes: number;

  setBalls: React.Dispatch<React.SetStateAction<number>>;
  setStrikes: React.Dispatch<React.SetStateAction<number>>;

  onClose: () => void;

  onHandleKeyEntry: (key: string) => void;

  onSavePlay: (value: string, isGhost?: boolean) => void;
};

export default function RecordPlay(props: RecordPlayProps) {
    return(
<Modal visible={props.visible} transparent animationType='fade'>
  <View style={styles.mBg}>
    <View style={[styles.mCard, { width: '95%' }]}>
      <View style={styles.modalCountSection}>
        <View style={styles.countGroup}>
          <Text style={styles.countLabel}>B</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity
              style={styles.countOp}
              onPress={() => props.setBalls(Math.max(0, props.balls - 1))}>
              <Text style={styles.countOpTxt}>-</Text>
            </TouchableOpacity>
            <Text style={styles.countDisplayNum}>{props.balls}</Text>
            <TouchableOpacity
              style={styles.countOp}
              onPress={() => {
                if (props.balls < 3) props.setBalls(props.balls + 1);
                else {
                  props.onHandleKeyEntry('BB');
                  props.onSavePlay('BB');
                }
              }}>
              <Text style={styles.countOpTxt}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.countGroup}>
          <Text style={styles.countLabel}>S</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity
              style={styles.countOp}
              onPress={() => props.setStrikes(Math.max(0, props.strikes - 1))}>
              <Text style={styles.countOpTxt}>-</Text>
            </TouchableOpacity>
            <Text style={styles.countDisplayNum}>{props.strikes}</Text>
            <TouchableOpacity
              style={styles.countOp}
              onPress={() => {
                if (props.strikes < 2) props.setStrikes(props.strikes + 1);
                else {
                  props.onHandleKeyEntry('K');
                  props.onSavePlay('K');
                }
              }}>
              <Text style={styles.countOpTxt}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity
          style={styles.smallGhostBtn}
          onPress={() => props.onSavePlay('', true)}>
          <Text style={styles.smallGhostTxt}>GHOST (2B)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.displayArea}>
        <Text style={styles.mBigInText}>{props.playInput}</Text>
        <TouchableOpacity
          onPress={() => props.setPlayInput((prev) => prev.slice(0, -1))}>
          <Text style={{ color: '#FF3B30', fontWeight: 'bold' }}>DEL</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.topActions}>
        {['1B', '2B', '3B', 'HR', 'BB', 'HBP', 'FC', 'SAC', 'K', 'ꓘ', 'E'].map(
          (item) => (
            <TouchableOpacity
              key={item}
              style={styles.actionBtn}
              onPress={() => props.onHandleKeyEntry(item)}>
              <Text style={styles.actionBtnTxt}>{item}</Text>
            </TouchableOpacity>
          ),
        )}
      </View>

      <View style={styles.bottomKeys}>
        <View style={styles.numpad}>
          <View style={styles.numGrid}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <TouchableOpacity
                key={num}
                style={styles.numBtn}
                onPress={() => props.onHandleKeyEntry(num.toString())}>
                <Text style={styles.numBtnTxt}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.flightpad}>
          {['F', 'P', 'L', 'DP'].map((f) => (
            <TouchableOpacity
              key={f}
              style={styles.flightBtn}
              onPress={() => props.onHandleKeyEntry(f)}>
              <Text style={styles.flightBtnTxt}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={styles.recordBtn}
        onPress={() => props.onSavePlay(props.playInput)}>
        <Text style={styles.recordBtnTxt}>RECORD PLAY</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => props.onClose()}
        style={{ marginTop: 15 }}>
        <Text style={{ color: '#999' }}>CANCEL</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
)}