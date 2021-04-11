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

  // Clean up
  for (let id in paths) delete paths[id]

  // Straighten part
  const angle = points.flyTop.angle(points.flyCorner) * -1 + 270
  for (let id in points) {
    if (id !== 'flyTop') points[id] = points[id].rotate(angle, points.flyTop)
  }

  // Paths
  paths.saBase = new Path()
    .move(points.flyCorner)
    .line(points.flyBottom)
    .join(
      new Path()
        .move(points.fork)
        .curve(points.crotchSeamCurveCp1, points.crotchSeamCurveCp2, points.crotchSeamCurveStart)
        .split(points.flyBottom)
        .pop()
    )
    .line(points.styleWaistIn)
    .line(points.flyTop)
    .setRender(false)
  paths.seam = paths.saBase
    .clone()
    .line(points.flyCorner)
    .close()
    .setRender(true)
    .attr('class', 'fabric')

  if (complete) {
    macro('cutonfold', {
      from: points.flyTop,
      to: points.flyCorner,
      grainline: true
    })
    points.titleAnchor = points.flyCurveStart
    macro('title', {
      at: points.titleAnchor,
      nr: 9,
      title: 'flyExtention'
    })
    if (sa)
      paths.sa = paths.saBase
        .offset(sa)
        .line(points.flyTop)
        .reverse()
        .line(points.flyCorner)
        .attr('class', 'fabric sa')

    if (paperless) {
    }
  }

  return part
}