import React, { useMemo, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import RecordPlay from '../RecordPlay/RecordPlay';

import styles from './Scorebook.styles';

import {
  DEFAULT_MAX_INNINGS,
  DEFAULT_LINEUP,
  TEAM_AWAY,
} from '../../constants/baseball';

import { LINEUP_WIDTH, CELL_SIZE } from '../../constants/dimensions';

export default function Scorebook() {
  const [activeTeam, setActiveTeam] = useState<'AWAY' | 'HOME'>(TEAM_AWAY);
  const [maxInning, setMaxInning] = useState(DEFAULT_MAX_INNINGS);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAtBat, setSelectedAtBat] = useState({ idx: 0, inn: 1 });
  const [playInput, setPlayInput] = useState('');

  const [balls, setBalls] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [inningOuts, setInningOuts] = useState(0);
  const [pitchesHome, setPitchesHome] = useState(0);
  const [pitchesGuest, setPitchesGuest] = useState(0);

  const [lineupAWAY] = useState(DEFAULT_LINEUP('Guest'));
  const [lineupHOME] = useState(DEFAULT_LINEUP('Home'));
  const [scores, setScores] = useState<Record<string, any>>({
    AWAY: {},
    HOME: {},
  });

  const inningsArray = useMemo(
    () => Array.from({ length: maxInning }, (_, i) => i + 1),
    [maxInning],
  );

  const handleKeyEntry = (key: string) => {
    setPlayInput((prev) => {
      const lastChar = prev.slice(-1);
      if (/\d/.test(key) && /\d/.test(lastChar) && prev.length > 0)
        return prev + '-' + key;
      return prev + key;
    });
  };

  const lineScore = useMemo(() => {
    const getStats = (team: 'AWAY' | 'HOME') => {
      const innData = Array(maxInning).fill(0);
      let totalHits = 0;
      Object.keys(scores[team]).forEach((key) => {
        const atBat = scores[team][key];
        const inn = parseInt(key.split('-').pop() || '1');
        if (atBat.runScored && inn <= maxInning) innData[inn - 1]++;
        if (/1B|2B|3B|HR/.test(atBat.result)) totalHits++;
      });
      return {
        perInning: innData,
        runs: innData.reduce((a, b) => a + b, 0),
        hits: totalHits,
      };
    };
    return { AWAY: getStats('AWAY'), HOME: getStats('HOME') };
  }, [scores, maxInning]);

  const savePlay = (val: string, isGhost = false) => {
    const player = (activeTeam === 'AWAY' ? lineupAWAY : lineupHOME)[
      selectedAtBat.idx
    ];
    const key = `${player.name}-${selectedAtBat.inn}`;

    setScores((prev) => {
      const teamS = { ...prev[activeTeam] };
      const cleanVal = isGhost ? 'GR' : val;
      let run = false,
        bases: number[] = [];

      if (isGhost) bases = [2];
      else if (
        cleanVal.includes('1B') ||
        cleanVal.includes('BB') ||
        cleanVal.includes('HBP')
      )
        bases = [1];
      else if (cleanVal.includes('2B')) bases = [1, 2];
      else if (cleanVal.includes('3B')) bases = [1, 2, 3];
      else if (cleanVal.includes('HR')) {
        bases = [1, 2, 3];
        run = true;
      }

      const isOut =
        /K|ꓘ|F|P|L|DP|\d/.test(cleanVal) && !/1B|2B|3B|E|GR/.test(cleanVal);
      if (isOut)
        setInningOuts((prevO) => ((prevO + 1) % 4 === 3 ? 0 : prevO + 1));

      teamS[key] = {
        result: cleanVal,
        runScored: run,
        bases,
        count: { b: balls, s: strikes },
      };
      return { ...prev, [activeTeam]: teamS };
    });
    setBalls(0);
    setStrikes(0);
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle='light-content' />

      {/* SCOREBOARD */}
      <View style={styles.boardContainer}>
        <View style={styles.boardTop}>
          <View style={styles.boardStat}>
            <Text style={styles.boardLabel}>P. HOME</Text>
            <TouchableOpacity onPress={() => setPitchesHome((p) => p + 1)}>
              <Text style={styles.boardValRed}>{pitchesHome}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.boardStat}>
            <Text style={styles.boardLabel}>BALL</Text>
            <Text style={styles.boardValRed}>{balls}</Text>
          </View>
          <View style={styles.boardStat}>
            <Text style={styles.boardLabel}>STRIKE</Text>
            <Text style={styles.boardValRed}>{strikes}</Text>
          </View>
          <View style={styles.boardStat}>
            <Text style={styles.boardLabel}>OUT</Text>
            <Text style={styles.boardValRed}>{inningOuts}</Text>
          </View>
          <View style={styles.boardStat}>
            <Text style={styles.boardLabel}>P. GUEST</Text>
            <TouchableOpacity onPress={() => setPitchesGuest((p) => p + 1)}>
              <Text style={styles.boardValRed}>{pitchesGuest}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.lineRowFlex}>
          <View style={{ width: 55 }}>
            <Text style={styles.lineTeamName}>GUEST</Text>
            <Text style={styles.lineTeamName}>HOME</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flex: 1 }}>
            <View>
              <View style={{ flexDirection: 'row' }}>
                {inningsArray.map((i) => (
                  <Text key={i} style={styles.lineHeaderTxt}>
                    {i}
                  </Text>
                ))}
              </View>
              <View style={{ flexDirection: 'row' }}>
                {lineScore.AWAY.perInning.map((v, i) => (
                  <Text key={i} style={styles.lineVal}>
                    {v || '0'}
                  </Text>
                ))}
              </View>
              <View style={{ flexDirection: 'row' }}>
                {lineScore.HOME.perInning.map((v, i) => (
                  <Text key={i} style={styles.lineVal}>
                    {v || '0'}
                  </Text>
                ))}
              </View>
            </View>
          </ScrollView>
          <View style={styles.totalsBox}>
            <View style={styles.totalCol}>
              <Text style={styles.lineHeaderTxt}>R</Text>
              <Text style={styles.lineTotal}>{lineScore.AWAY.runs}</Text>
              <Text style={styles.lineTotal}>{lineScore.HOME.runs}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.toggleRow}>
        <TouchableOpacity
          onPress={() => setActiveTeam('AWAY')}
          style={[styles.tBtn, activeTeam === 'AWAY' && styles.tBtnActive]}>
          <Text style={styles.tBtnTxt}>GUEST</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTeam('HOME')}
          style={[styles.tBtn, activeTeam === 'HOME' && styles.tBtnActive]}>
          <Text style={styles.tBtnTxt}>HOME</Text>
        </TouchableOpacity>
      </View>

      {/* THE GRID */}
      <ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Header */}
            <View style={styles.row}>
              <View
                style={[
                  styles.hCell,
                  styles.lineBottom,
                  styles.lineDivider,
                  { width: LINEUP_WIDTH },
                ]}>
                <Text style={styles.hText}>PLAYER</Text>
              </View>
              {inningsArray.map((i) => (
                <View
                  key={i}
                  style={[
                    styles.hCell,
                    styles.lineBottom,
                    styles.lineRight,
                    { width: CELL_SIZE },
                  ]}>
                  <Text style={styles.hText}>INN {i}</Text>
                </View>
              ))}
              <TouchableOpacity
                style={[
                  styles.hCell,
                  styles.lineBottom,
                  { width: 50, backgroundColor: '#eef' },
                ]}
                onPress={() => setMaxInning((p) => p + 1)}>
                <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Players */}
            {(activeTeam === 'AWAY' ? lineupAWAY : lineupHOME).map((p, idx) => (
              <View key={idx} style={styles.row}>
                <View
                  style={[
                    styles.pCell,
                    styles.lineBottom,
                    styles.lineDivider,
                    { width: LINEUP_WIDTH },
                  ]}>
                  <Text style={styles.pName}>
                    {p.spot}. {p.name}
                  </Text>
                </View>
                {inningsArray.map((i) => {
                  const d = scores[activeTeam][`${p.name}-${i}`];
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[styles.cell, styles.lineBottom, styles.lineRight]}
                      onPress={() => {
                        setPlayInput(d?.result || '');
                        setSelectedAtBat({ idx, inn: i });
                        setModalVisible(true);
                      }}>
                      <View style={styles.miniCountBox}>
                        <View style={styles.countRow}>
                          <View
                            style={[
                              styles.dot,
                              d?.count?.b >= 1 && styles.dotB,
                            ]}
                          />
                          <View
                            style={[
                              styles.dot,
                              d?.count?.b >= 2 && styles.dotB,
                            ]}
                          />
                          <View
                            style={[
                              styles.dot,
                              d?.count?.b >= 3 && styles.dotB,
                            ]}
                          />
                        </View>
                        <View style={styles.countRow}>
                          <View
                            style={[
                              styles.dot,
                              d?.count?.s >= 1 && styles.dotS,
                            ]}
                          />
                          <View
                            style={[
                              styles.dot,
                              d?.count?.s >= 2 && styles.dotS,
                            ]}
                          />
                        </View>
                      </View>
                      <View style={styles.diamond}>
                        <View
                          style={[
                            styles.base,
                            styles.l1,
                            d?.bases?.includes(1) && styles.baseOn,
                          ]}
                        />
                        <View
                          style={[
                            styles.base,
                            styles.l2,
                            d?.bases?.includes(2) && styles.baseOn,
                          ]}
                        />
                        <View
                          style={[
                            styles.base,
                            styles.l3,
                            d?.bases?.includes(3) && styles.baseOn,
                          ]}
                        />
                        <View
                          style={[
                            styles.base,
                            styles.l4,
                            d?.runScored && styles.baseOn,
                          ]}
                        />
                        {d?.result ? (
                          <Text style={styles.resTxt}>{d.result}</Text>
                        ) : null}
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

      <RecordPlay
        visible={modalVisible}
        playInput={playInput}
        setPlayInput={setPlayInput}
        balls={balls}
        strikes={strikes}
        setBalls={setBalls}
        setStrikes={setStrikes}
        onHandleKeyEntry={handleKeyEntry}
        onSavePlay={savePlay}
        onClose={() => setModalVisible(false)}
      />``
    </SafeAreaView>
  );
}
