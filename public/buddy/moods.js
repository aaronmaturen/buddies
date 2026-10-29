// Every value here is a spring target, so switching moods blends instead of snapping.
// Eye shape: topCut/tilt flatten and slant the top edge, botCut/botCurve arch the bottom, lid draws a head-colored lid.
// Head: pitch/roll/yawBias pose it, follow is how much of the gaze the head takes, energy speeds everything up.
export const BASE = {
  lid: 0, topCut: 0, tilt: 0, botCut: 0, botCurve: 0, eyeScale: 1, pupil: 1,
  browRaise: 0, browTilt: 0, browCurve: .25, browAsym: 0, lidAsym: 0, eyeAsym: 0,
  pitch: 0, roll: 0, yawBias: 0, gazeYaw: 0, gazePitch: 0, follow: .65, lean: 1, bob: 1, energy: 1,
};

const PRESETS = {
  neutral: {},
  happy: { botCut: .3, botCurve: .55, browRaise: .05, browTilt: .15, browCurve: .5, pitch: .08, roll: .08, bob: 1.8, energy: 1.3 },
  sad: { topCut: .3, tilt: -.9, eyeScale: .95, pupil: 1.1, browTilt: .9, browCurve: -.05, pitch: -.22, gazePitch: -.25, roll: -.05, bob: .4, energy: .5, follow: .4 },
  angry: { topCut: .34, tilt: .95, botCut: .06, eyeScale: .94, pupil: .8, browRaise: -.07, browTilt: -1, browCurve: -.15, pitch: -.1, lean: 1.05, bob: .5, energy: 1.6, follow: .85 },
  surprised: { eyeScale: 1.25, pupil: .6, browRaise: .15, browTilt: .15, browCurve: .6, pitch: .12, lean: .95, energy: 1.8 },
  curious: { eyeScale: 1.08, pupil: 1.15, browAsym: .09, browRaise: .03, roll: .22, lean: 1.06, follow: .8, energy: 1.2 },
  thinking: { topCut: .12, browTilt: -.25, browAsym: .06, browCurve: .1, roll: .12, energy: .7, follow: .5 },
  sleepy: { lid: .55, tilt: -.25, botCut: .05, browRaise: -.05, browCurve: .1, pitch: -.15, gazePitch: -.15, bob: .6, energy: .3, follow: .3 },
  skeptical: { lidAsym: .38, browAsym: .13, browTilt: -.2, yawBias: -.3, roll: -.06, follow: .35, energy: .9 },
  excited: { eyeScale: 1.18, pupil: 1.25, botCut: .12, botCurve: .25, browRaise: .1, browCurve: .5, pitch: .1, lean: 1.04, bob: 2.4, energy: 2 },
  shy: { botCut: .1, botCurve: .3, browTilt: .5, pupil: 1.1, yawBias: .25, gazePitch: -.3, roll: .18, lean: .96, follow: .3, bob: .5, energy: .6 },
  bored: { lid: .38, browRaise: -.02, browCurve: 0, gazeYaw: .35, pitch: -.08, roll: -.15, pupil: .9, follow: .2, bob: .3, energy: .4 },
  confused: { eyeAsym: .15, browAsym: .14, browTilt: .3, eyeScale: 1.05, pupil: .85, roll: -.28, energy: .9 },
  worried: { topCut: .12, tilt: -.5, eyeScale: 1.05, pupil: .75, browTilt: 1, browRaise: .06, pitch: -.06, lean: .96, energy: 1.2 },
  smug: { lid: .3, botCut: .15, botCurve: .3, browAsym: .1, browTilt: -.1, pitch: .15, roll: .1, yawBias: .12, follow: .5, energy: .6 },
};

export const MOODS = Object.fromEntries(Object.entries(PRESETS).map(([k, v]) => [k, { ...BASE, ...v }]));
export const MOOD_NAMES = Object.keys(MOODS);
