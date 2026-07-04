import { StyleSheet } from 'react-native';

import { CELL_SIZE, INN_COL_WIDTH } from '../../constants/dimensions';

type PlayState = {
  result: string | null;
  direction?: string; // RF, LF, CF
  detail?: string; // groundout, flyout, etc
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  boardContainer: { backgroundColor: '#1a0000', padding: 10 },
  boardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  boardStat: { alignItems: 'center' },
  boardLabel: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
  boardValRed: {
    color: '#ff1a1a',
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  lineRowFlex: { flexDirection: 'row', alignItems: 'center' },
  lineTeamName: { color: '#fff', fontSize: 10, fontWeight: '900', height: 18 },
  lineHeaderTxt: {
    color: '#666',
    fontSize: 9,
    width: INN_COL_WIDTH,
    textAlign: 'center',
  },
  lineVal: {
    color: '#ff1a1a',
    fontSize: 16,
    width: INN_COL_WIDTH,
    textAlign: 'center',
    height: 20,
  },
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
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hCell: {
    height: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hText: { fontSize: 10, fontWeight: 'bold', color: '#555' },
  pCell: { padding: 10, backgroundColor: '#fff', justifyContent: 'center' },
  pName: { fontWeight: 'bold', fontSize: 12 },
  miniCountBox: { position: 'absolute', top: 5, left: 5 },
  countRow: { flexDirection: 'row', gap: 2, marginBottom: 2 },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#eee',
    borderWidth: 0.5,
    borderColor: '#ccc',
  },
  dotB: { backgroundColor: '#4CD964' },
  dotS: { backgroundColor: '#FFCC00' },
  diamond: { width: 65, height: 65 },
  base: {
    position: 'absolute',
    width: 32,
    height: 2,
    backgroundColor: '#f4f4f4',
  },
  baseOn: { backgroundColor: '#FF3B30', height: 3 },
  l1: { transform: [{ rotate: '-45deg' }], bottom: 18, right: 4 },
  l2: { transform: [{ rotate: '45deg' }], top: 18, right: 4 },
  l3: { transform: [{ rotate: '-45deg' }], top: 18, left: 4 },
  l4: { transform: [{ rotate: '45deg' }], bottom: 18, left: 4 },
  resTxt: {
    position: 'absolute',
    width: 65,
    textAlign: 'center',
    top: 22,
    fontWeight: '900',
    color: '#007AFF',
    fontSize: 15,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  counterGroup: {
    flex: 1,
    alignItems: 'center',
  },

  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 6,
  },

  counterBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#EAF2FF',
    justifyContent: 'center',
    alignItems: 'center',

    // makes it feel "pressable"
    elevation: 2,
  },

  counterBtnTxt: {
    fontSize: 26,
    fontWeight: '900',
    color: '#007AFF',
  },

  bigCount: {
    fontSize: 28,
    fontWeight: '900',
    minWidth: 32,
    textAlign: 'center',
  },
});

export default styles;