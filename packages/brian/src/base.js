export default (part) => {
  let {
    measurements,
    options,
    store,
    points,
    snippets,
    Point,
    Snippet,
    Path,
    paths,
    utils,
    complete,
    macro,
  } = part.shorthand()

  store.set('stretchFactor', utils.stretchToScale(options.fabricStretch));
  const getStretchFactor = () => store.get('stretchFactor');
  store.set('shoulderEase', (measurements.shoulderToShoulder * options.shoulderEase) / 2)
  // Center back (cb) vertical axis
  points.cbHps = new Point(0, 0)
  points.cbNeck = new Point(0, options.backNeckCutout * measurements.neck)

  points.cbBust = new Point(0, measurements.hpsToBust)
  points.cbWaist = new Point(0, measurements.hpsToWaistBack)
  points.cbHips = new Point(0, points.cbWaist.y + measurements.waistToHips)

  // Shoulder line

  points.neck = new Point((measurements.neck * (1 + options.collarEase) * getStretchFactor()) / options.collarFactor, 0)
  points.hps = points.neck.clone() // We started using HPS in many measurements
  const xShoulder = (measurements.shoulderToShoulder / 2 + store.get('shoulderEase')) * getStretchFactor()
  // Shoulder point using shoulderSlope degree measurement.
  const shoulderIntersection = utils.beamsIntersect(
    points.hps,
    points.hps.shift(measurements.shoulderSlope * -1, 100),
    new Point(xShoulder, -100),
    new Point(xShoulder, 100)
  )
  const yShoulder = (shoulderIntersection.y - points.cbHps.y) * (1 - options.shoulderSlopeReduction);
  points.shoulder = new Point(xShoulder, Math.max(yShoulder, 0));

  points.cbShoulder = new Point(0, points.shoulder.y)
  //TODO use a proper measurement for armscyeToWaist
  const armscyeToWaist = options.armscyeToWaist * measurements.hpsToWaistBack
  const armscye = measurements.biceps * (1 + options.armscye)

  points.cbChest = new Point(0, armscyeToWaist)
  store.set('armscye', armscye)
  const armscyeDepth = armscyeToWaist - points.shoulder.y
  const minArmscyeDepth = 1.2 * store.get('armscye')/Math.PI
  store.set('armholeDepth',  (1 + options.bicepsEase) * Math.max(armscyeDepth,  minArmscyeDepth));

  points.cbArmhole = new Point(0, points.shoulder.y + store.get('armholeDepth'))
  points.cbHem = new Point(0, points.cbHips.y * (1 + options.lengthBonus))

  // Side back (cb) vertical axis
  const chestScale =  (1 + options.chestEase) * getStretchFactor() / 4;
  points.chest = new Point(measurements.chest * chestScale, points.cbChest.y)
  let xBust = measurements.bust ? measurements.bust * chestScale : points.chest.x;
  points.bust = new Point(xBust, points.cbBust.y)

  let xArmhole = points.bust.x
  let dyArmhole = points.cbBust.y - points.cbArmhole.y
  let dyChest = points.cbBust.y - points.cbChest.y
  if(options.draftForHighBust && dyArmhole > 10 && dyChest > 10) {
    let chestReduction = Math.min(1, dyArmhole / dyChest)
    let dxBust = points.bust.x - points.chest.x
    xArmhole = points.bust.x - chestReduction * dxBust
  }

  points.armhole = new Point(xArmhole, points.cbArmhole.y)
  points.waist = new Point(measurements.waist * (1 + options.waistEase) * getStretchFactor() / 4, points.cbWaist.y)
  points.hips = new Point(measurements.hips * (1 + options.hipsEase) * getStretchFactor() / 4, points.cbHips.y)
  points.hem = new Point(points.hips.x, points.cbHem.y)

  //  Side shaping
  points.hipsCp2 = points.hips.shift(90, measurements.waistToHips / 3)
  points.waistCp1 = points.waist.shift(-90, measurements.waistToHips / 3)
  let waistToBust = (measurements.hpsToWaistBack - measurements.hpsToBust);
  points.waistCp2 = points.waist.shift(90, waistToBust / 3)
  points.bustCp1 = points.bust.shift(-90, waistToBust / 3)
  points.bustCp2 = points.bust.shift(90, (measurements.hpsToBust - points.cbArmhole.y) / 2)

  // Armhole
  // TODO calculate the pitch as minor radius of the armhole ellipse (armscye -> circumference; armscyeDepth -> armscyeHeight -> major radius)
  // TODO broken for deeper front pitch
  points.armholePitch = new Point(
    (xShoulder * options.acrossBackFactor),
    points.shoulder.y + points.shoulder.dy(points.armhole) / 2
  )
  points._tmp1 = new Point(points.armholePitch.x, points.armhole.y)
  points._tmp3 = utils.beamsIntersect(
    points._tmp1,
    points._tmp1.shift(45, 10),
    points.armhole,
    points.armholePitch
  )

  //TODO get rid of armholeHollow
  points.armholeHollow = points._tmp1.shiftFractionTowards(points._tmp3, 0.5)
  points.armholeCp2 = points.armhole.shift(180, points._tmp1.dx(points.armhole) / 4)
  points.armholeHollowCp1 = points.armholeHollow.shift(
    -45,
    points.armholeHollow.dy(points.armhole) / 2
  )
  points.armholeHollowCp2 = points.armholeHollow.shift(
    135,
    points.armholePitch.dx(points.armholeHollow)
  )
  //TODO align with point.shoulderCp1
  points.armholePitchCp1 = points.armholePitch.shift(
    -90,
    points.armholePitch.dy(points.armholeHollow) / 2
  )
  points.armholePitchCp2 = points.armholePitch.shift(
    90,
    points.shoulder.dy(points.armholePitch) / 2
  )
  points.shoulderCp1 = points.shoulder
    .shiftTowards(points.neck, points.shoulder.dy(points.armholePitch) / 5)
    .rotate(90, points.shoulder)

  // Neck opening (back)
  points._tmp4 = points.neck.shiftTowards(points.shoulder, 10).rotate(-90, points.neck)
  points.neckCp2 = utils.beamIntersectsY(points.neck, points._tmp4, points.cbNeck.y)

  // Fit collar
  points.cfNeck = points.neck.rotate(-90, new Point(0, 0))
  let target = measurements.neck * (1 + options.collarEase) * getStretchFactor()
  let delta = 0
  let run = 0
  do {
    run++
    points.cfNeck = points.cfNeck.shift(90, delta / 3)
    points.frontNeckCpEdge = utils.beamsIntersect(
      points.neck,
      points.neckCp2,
      points.cfNeck,
      new Point(20, points.cfNeck.y)
    )
    points.cfNeckCp1 = points.cfNeck.shiftFractionTowards(points.frontNeckCpEdge, 0.55)
    points.neckCp2Front = points.neck.shiftFractionTowards(points.frontNeckCpEdge, 0.65)
    paths.neckOpening = new Path()
      .move(points.cfNeck)
      .curve(points.cfNeckCp1, points.neckCp2Front, points.neck)
      .curve(points.neckCp2, points.cbNeck, points.cbNeck)
      .attr('class', 'dashed stroke-xl various')
    delta = paths.neckOpening.length() * 2 - target
  } while (Math.abs(delta) > 1 && options.brianFitCollar && run < 10)
  delete paths.neckOpening

  // Anchor point for sampling
  points.gridAnchor = points.cbHem

  /*
   * People would like to have the option to shift the shoulder seam
   * See https://github.com/freesewing/freesewing/issues/642
   * So let's make the people happy
   */
  // Front armhole is a bit deeper, add those points
  let deeper = armscyeDepth * options.frontArmholeDeeper
  for (const p of ['', 'Cp1', 'Cp2']) {
    points[`frontArmholePitch${p}`] = points[`armholePitch${p}`].shift(180, deeper)
  }
  // Add points needed for the mirrored front&back neck/armhole path
  macro('mirror', {
    mirror: [points.hps, points.shoulder],
    points: [
      points.neckCp2Front,
      points.cfNeckCp1,
      points.cfNeck,
      points.cbNeck,
      points.neckCp2,
      points.frontArmholePitch,
      points.frontArmholePitchCp2,
      points.shoulderCp1,
    ],
    clone: true,
  })

  // How much space do we have to work with here?
  // s3 = ShoulderSeamShift
  store.set('s3CollarMaxFront', points.hps.dy(points.cfNeck) / 2)
  store.set('s3CollarMaxBack', points.hps.dy(points.cbNeck) / 2)
  store.set('s3ArmholeMax', points.shoulder.dy(points.frontArmholePitch) / 4)
  // Let's leave the actual splitting the curves for the front/back parts

  // Complete pattern?
  if (complete) {
    points.title = new Point(points.armholePitch.x / 2, points.armholePitch.y)
    points.logo = points.title.shift(-90, 100)
    snippets.logo = new Snippet('logo', points.logo)
  }

  return part
}
