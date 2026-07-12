export function sceneToCanvas(viewer, sceneX, sceneY, THREE) {
  const camera = viewer.GetCamera();
  const canvas = viewer.GetCanvas();
  const width = canvas.clientWidth || viewer.canvasWidth;
  const height = canvas.clientHeight || viewer.canvasHeight;
  const v = new THREE.Vector3(sceneX, sceneY, 0).project(camera);
  return {
    x: ((v.x + 1) / 2) * width,
    y: ((-v.y + 1) / 2) * height,
  };
}

export function pixelDistance(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function polylineLength(points) {
  if (!points || points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += pixelDistance(points[i - 1], points[i]);
  }
  return total;
}

export function polygonArea(points) {
  if (!points || points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

export function quantityFromGeometry(tool, points, scaleRatio) {
  const scale = Number(scaleRatio) || 0;
  if (!scale || !points?.length) return 0;
  if (tool === "length" || tool === "SKIRTING_LENGTH") {
    return parseFloat((polylineLength(points) * scale).toFixed(2));
  }
  if (tool === "count") {
    return points.length;
  }
  return parseFloat((polygonArea(points) * scale * scale).toFixed(2));
}

export function defaultUnitForType(lineType) {
  const map = {
    DOOR_COUNT: "PCS",
    WINDOW_COUNT: "PCS",
    PLUMBING_FIXTURE: "PCS",
    LIGHTING_FIXTURE: "PCS",
    SKIRTING_LENGTH: "RMT",
  };
  return map[lineType] || "SQM";
}
