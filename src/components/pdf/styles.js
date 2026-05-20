import { StyleSheet } from '@react-pdf/renderer'

export const COLORS = {
  navy:      '#13193a',
  white:     '#FFFFFF',
  ink:       '#1A1A1A',
  dim:       '#5A5A5A',
  border:    '#AAAAAA',
  rule:      '#CCCCCC',
  stripe:    '#F0F0F0',
  stripeAlt: '#E8E8E8',
  subtot:    '#E2E2E2',
  grayHead:  '#737373',
  pageBg:    '#EBEBEB',
}

export const F = {
  xxs: 5.0,
  xs:  6.0,
  sm:  7.0,
  md:  8.5,
  lg:  10.5,
  xl:  13.0,
}

export const styles = StyleSheet.create({
  page: {
    fontFamily:        'Helvetica',
    fontSize:          F.sm,
    color:             COLORS.ink,
    paddingTop:        16,
    paddingBottom:     16,
    paddingHorizontal: 20,
    backgroundColor:   COLORS.white,
  },
  row: {
    flexDirection: 'row',
  },
  companyInfo: {
    fontSize:     F.xs,
    color:        '#000000',
    textAlign:    'center',
    marginBottom: 2,
  },
  docTitle: {
    fontSize:   F.lg,
    fontFamily: 'Helvetica-Bold',
    textAlign:  'center',
    color:      COLORS.dim,
  },
  copyLabel: {
    fontSize:  F.sm,
    color:     COLORS.dim,
    marginTop: 3,
    textAlign: 'center',
  },
})
