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
  const { balls, strikes, playInput } = props;

  // =========================
  // BALLS
  // =========================
  const addBall = () => {
    if (balls < 3) props.setBalls(balls + 1);
    else {
      props.onSavePlay('BB');
      resetAll();
    }
  };

  const removeBall = () => {
    props.setBalls(Math.max(0, balls - 1));
  };

  // =========================
  // STRIKES
  // =========================
  const addStrike = () => {
    if (strikes < 2) props.setStrikes(strikes + 1);
    else {
      props.onSavePlay('K');
      resetAll();
    }
  };

  const removeStrike = () => {
    props.setStrikes(Math.max(0, strikes - 1));
  };

  const resetAll = () => {
    props.setBalls(0);
    props.setStrikes(0);
    props.setPlayInput('');
  };

  // =========================
  // INPUT
  // =========================
  const deleteOne = () => {
    props.setPlayInput((prev) => prev.slice(0, -1));
  };

  const clearAll = () => {
    props.setPlayInput('');
  };

  const record = () => {
    props.onSavePlay(playInput);
    resetAll();
    props.onClose();
  };

  const numpad = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    ['CLR', 0, 'DEL'],
  ];

  // =========================
  // UI
  // =========================
  return (
    <Modal visible={props.visible} transparent animationType='fade'>
      <View style={styles.mBg}>
        <View style={styles.mCard}>
          {/* ===================== */}
          {/* BALLS / STRIKES */}
          {/* ===================== */}
          <View style={styles.headerConsole}>
            {/* BALLS */}
            <View style={styles.countBlock}>
              <Text style={styles.countLabel}>BALLS</Text>

              <View style={styles.counterRow}>
                <TouchableOpacity style={styles.countOp} onPress={removeBall}>
                  <Text style={styles.countOpTxt}>−</Text>
                </TouchableOpacity>

                <Text style={styles.countDisplayNum}>{balls}</Text>

                <TouchableOpacity style={styles.countOp} onPress={addBall}>
                  <Text style={styles.countOpTxt}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* STRIKES */}
            <View style={styles.countBlock}>
              <Text style={styles.countLabel}>STRIKES</Text>

              <View style={styles.counterRow}>
                <TouchableOpacity style={styles.countOp} onPress={removeStrike}>
                  <Text style={styles.countOpTxt}>−</Text>
                </TouchableOpacity>

                <Text style={styles.countDisplayNum}>{strikes}</Text>

                <TouchableOpacity style={styles.countOp} onPress={addStrike}>
                  <Text style={styles.countOpTxt}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ===================== */}
          {/* INPUT DISPLAY */}
          {/* ===================== */}
          <View style={styles.displayArea}>
            <Text style={styles.mBigInText}>{playInput || '---'}</Text>
          </View>

          {/* ===================== */}
          {/* HITS */}
          {/* ===================== */}
          <Text style={styles.sectionLabel}>HITS</Text>
          <View style={styles.consoleRow}>
            {['1B', '2B', '3B', 'HR'].map((v) => (
              <TouchableOpacity
                key={v}
                style={styles.consoleBtn}
                onPress={() => props.onHandleKeyEntry(v)}>
                <Text style={styles.consoleTxt}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ===================== */}
          {/* OUTS */}
          {/* ===================== */}
          <Text style={styles.sectionLabel}>OUTS</Text>
          <View style={styles.consoleRow}>
            {['GO', 'FO', 'DP', 'K', 'E', 'FC', 'SAC'].map((v) => (
              <TouchableOpacity
                key={v}
                style={styles.consoleBtnOut}
                onPress={() => props.onHandleKeyEntry(v)}>
                <Text style={styles.consoleTxt}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ===================== */}
          {/* NUMPAD */}
          {/* ===================== */}
          <Text style={styles.sectionLabel}>NUMPAD</Text>

          <View style={{ gap: 8 }}>
            {numpad.map((row, rowIndex) => (
              <View key={rowIndex} style={{ flexDirection: 'row', gap: 8 }}>
                {row.map((item, index) => {
                  const isAction = item === 'CLR' || item === 'DEL';

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.consoleBtnAlt,
                        isAction && { backgroundColor: '#ddd' },
                        {
                          flex: 1,
                          alignItems: 'center',
                          justifyContent: 'center',
                        },
                      ]}
                      onPress={() => {
                        if (item === 'DEL') {
                          props.setPlayInput((prev) => prev.slice(0, -1));
                        } else if (item === 'CLR') {
                          props.setPlayInput('');
                        } else {
                          props.onHandleKeyEntry(String(item));
                        }
                      }}>
                      <Text style={styles.consoleTxt}>{item}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          {/* ===================== */}
          {/* ACTIONS */}
          {/* ===================== */}
          <View style={styles.commitBar}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={props.onClose}>
              <Text style={styles.secondaryTxt}>CANCEL</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryBtn} onPress={record}>
              <Text style={styles.primaryTxt}>RECORD PLAY</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
