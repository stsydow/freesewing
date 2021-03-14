export default (part) => {
  // Shorthand
  let {
    points,
    Point,
    paths,
    Path,
    measurements,
    options,
    complete,
    paperless,
    store,
    macro,
    utils,
    snippets,
    Snippet,
    sa
  } = part.shorthand()

  if (options.splitWaistband) return part

  points.topLeft = new Point(0, 0)
  points.top = new Point(measurements.waist * options.waistbandWidth * options.waistbandFactor, 0)
  points.topRight = new Point(points.top.x * 2, 0)
  points.bottomLeft = new Point(
    0,
    2 * store.get('waistbandBack') + 2 * store.get('waistbandFront') + store.get('waistbandFly')
  )
  points.bottom = new Point(points.top.x, points.bottomLeft.y)
  points.bottomRight = new Point(points.topRight.x, points.bottomLeft.y)

  paths.saBase = new Path()
    .move(points.topLeft)
    .line(points.topRight)
    .line(points.bottomRight)
    .line(points.bottomLeft)
    .setRender(false)
  paths.seam = paths.saBase.clone().close().attr('class', 'fabric').setRender(true)

  if (complete) {
    points.flyNotchRight = points.topRight.shift(-90, store.get('waistbandFly'))
    points.flyNotchLeft = new Point(0, points.flyNotchRight.y)
    points.firstSideNotchRight = points.flyNotchRight.shift(-90, store.get('waistbandFront'))
    points.firstSideNotchLeft = new Point(0, points.firstSideNotchRight.y)
    points.cbNotchRight = points.firstSideNotchRight.shift(-90, store.get('waistbandBack'))
    points.cbNotchLeft = new Point(0, points.cbNotchRight.y)
    points.secondSideNotchRight = points.cbNotchRight.shift(-90, store.get('waistbandBack'))
    points.secondSideNotchLeft = new Point(0, points.secondSideNotchRight.y)
    macro('sprinkle', {
      snippet: 'notch',
      on: [
        'flyNotchRight',
        'flyNotchLeft',
        'firstSideNotchRight',
        'firstSideNotchLeft',
        'cbNotchRight',
        'cbNotchLeft',
        'secondSideNotchRight',
        'secondSideNotchLeft'
      ]
    })
    points.titleAnchor = points.cbNotchLeft.shiftFractionTowards(points.cbNotchRight, 0.5)
    points.logoAnchor = points.secondSideNotchLeft.shiftFractionTowards(
      points.secondSideNotchRight,
      0.5
    )
    macro('title', {
      at: points.titleAnchor,
      nr: 3,
      title: 'waistband'
    })
    macro('grainline', {
      from: points.firstSideNotchLeft,
      to: points.firstSideNotchRight
    })
    snippets.logo = new Snippet('logo', points.logoAnchor)
    paths.fold = new Path().move(points.top).line(points.bottom).attr('class', 'fabric help')
    if (sa) {
      paths.sa = paths.saBase
        .offset(sa * -1)
        .join(
          new Path()
            .move(points.bottomLeft)
            .line(points.topLeft)
            .offset(sa * -2)
        )
        .close()
        .attr('class', 'fabric sa')
    }

    if (paperless) {
    }
  }

  return part
}