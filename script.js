// Doi tab
function showTab(tabName) {
  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll(".content")
    .forEach((c) => c.classList.remove("active"));

  event.target.classList.add("active");
  document.getElementById(tabName).classList.add("active");
}

// ============ TSP ============
const tspCanvas = document.getElementById("tspCanvas");
const tspCtx = tspCanvas.getContext("2d");
let cities = [];
let tspSolving = false;
let distanceCache = {};

function initTSP() {
  cities = [];
  distanceCache = {};
  const numCities = 6;
  const padding = 80;

  for (let i = 0; i < numCities; i++) {
    cities.push({
      x: padding + Math.random() * (tspCanvas.width - 2 * padding),
      y: padding + Math.random() * (tspCanvas.height - 2 * padding),
      name: String.fromCharCode(65 + i),
    });
  }

  // Tinh san cac khoang cach
  for (let i = 0; i < cities.length; i++) {
    for (let j = 0; j < cities.length; j++) {
      if (i !== j) {
        distanceCache[`${i}-${j}`] = distance(cities[i], cities[j]);
      }
    }
  }

  drawTSP();
  renderDistanceMatrix();
  document.getElementById("tspRoutes").innerHTML =
    'Nhấn "Tìm Đường Đi Ngắn Nhất" để xem quá trình giải!';
  document.getElementById("tspExplanation").innerHTML = "";
}

function drawTSP(path = null, currentCity = -1) {
  tspCtx.fillStyle = "#1a1a2e";
  tspCtx.fillRect(0, 0, tspCanvas.width, tspCanvas.height);

  // Ve canh neu ton tai diem
  if (path) {
    tspCtx.strokeStyle = "#ffb6c1";
    tspCtx.lineWidth = 3;
    tspCtx.beginPath();
    for (let i = 0; i < path.length; i++) {
      const city = cities[path[i]];
      if (i === 0) {
        tspCtx.moveTo(city.x, city.y);
      } else {
        tspCtx.lineTo(city.x, city.y);
      }
    }
    tspCtx.lineTo(cities[path[0]].x, cities[path[0]].y);
    tspCtx.stroke();

    // Ve mui ten
    for (let i = 0; i < path.length; i++) {
      const from = cities[path[i]];
      const to = cities[path[(i + 1) % path.length]];
      drawArrow(from.x, from.y, to.x, to.y);
    }
  }

  // Ve cac thanh pho
  cities.forEach((city, i) => {
    tspCtx.beginPath();
    tspCtx.arc(city.x, city.y, 25, 0, Math.PI * 2);

    if (i === currentCity) {
      tspCtx.fillStyle = "#ff69b4";
      tspCtx.shadowColor = "#ff69b4";
      tspCtx.shadowBlur = 20;
    } else {
      tspCtx.fillStyle = "#ffc0cb";
      tspCtx.shadowBlur = 0;
    }
    tspCtx.fill();

    tspCtx.strokeStyle = "#fff";
    tspCtx.lineWidth = 3;
    tspCtx.stroke();
    tspCtx.shadowBlur = 0;

    tspCtx.fillStyle = "#1a1a2e";
    tspCtx.font = "bold 18px Inter";
    tspCtx.textAlign = "center";
    tspCtx.textBaseline = "middle";
    tspCtx.fillText(city.name, city.x, city.y);
  });
}

function drawArrow(fromX, fromY, toX, toY) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const headlen = 15;
  const offset = 25;

  const midX = fromX + (toX - fromX) * 0.5;
  const midY = fromY + (toY - fromY) * 0.5;

  tspCtx.fillStyle = "#ffb6c1";
  tspCtx.beginPath();
  tspCtx.moveTo(midX, midY);
  tspCtx.lineTo(
    midX - headlen * Math.cos(angle - Math.PI / 6),
    midY - headlen * Math.sin(angle - Math.PI / 6)
  );
  tspCtx.lineTo(
    midX - headlen * Math.cos(angle + Math.PI / 6),
    midY - headlen * Math.sin(angle + Math.PI / 6)
  );
  tspCtx.closePath();
  tspCtx.fill();
}

function distance(city1, city2) {
  return Math.sqrt(
    Math.pow(city1.x - city2.x, 2) + Math.pow(city1.y - city2.y, 2)
  );
}

function calculateTourDistance(path) {
  let total = 0;
  for (let i = 0; i < path.length; i++) {
    total += distanceCache[`${path[i]}-${path[(i + 1) % path.length]}`];
  }
  return total;
}

function renderDistanceMatrix() {
  const container = document.getElementById("distanceMatrix");
  let html = "<table><tr><th></th>";

  cities.forEach((city) => {
    html += `<th>${city.name}</th>`;
  });
  html += "</tr>";

  cities.forEach((city1, i) => {
    html += `<tr><th>${city1.name}</th>`;
    cities.forEach((city2, j) => {
      if (i === j) {
        html += "<td>-</td>";
      } else {
        html += `<td>${distanceCache[`${i}-${j}`].toFixed(1)}</td>`;
      }
    });
    html += "</tr>";
  });
  html += "</table>";
  container.innerHTML = html;
}

async function solveTSP() {
  if (tspSolving) return;
  tspSolving = true;
  document.getElementById("tspSolveBtn").disabled = true;

  let explanation =
    '<div class="step"><span class="step-number">Bước 1</span>Khởi tạo: Bắt đầu từ thành phố A (đỉnh 0)</div>';

  let bestPath = [0];
  let unvisited = new Set([...Array(cities.length).keys()].slice(1));
  let stepNum = 2;

  explanation +=
    '<div class="step"><span class="step-number">Bước 2</span>Áp dụng thuật toán Nearest Neighbor:</div>';

  while (unvisited.size > 0) {
    let current = bestPath[bestPath.length - 1];
    let nearest = null;
    let minDist = Infinity;

    let candidates = [];
    for (let city of unvisited) {
      let d = distanceCache[`${current}-${city}`];
      candidates.push({ city, dist: d });
      if (d < minDist) {
        minDist = d;
        nearest = city;
      }
    }

    explanation += `<div class="step"><span class="step-number">Bước ${stepNum}</span>Từ thành phố <strong>${cities[current].name}</strong>, xét các thành phố chưa đi qua:<br>`;
    candidates.forEach((c) => {
      if (c.city === nearest) {
        explanation += `&nbsp;&nbsp;• ${cities[c.city].name}: ${c.dist.toFixed(
          1
        )} <strong style="color: #ffb6c1;">(Chọn - gần nhất)</strong><br>`;
      } else {
        explanation += `&nbsp;&nbsp;• ${cities[c.city].name}: ${c.dist.toFixed(
          1
        )}<br>`;
      }
    });
    explanation += "</div>";

    bestPath.push(nearest);
    unvisited.delete(nearest);
    stepNum++;

    drawTSP(bestPath, nearest);
    document.getElementById("tspExplanation").innerHTML = explanation;
    await new Promise((resolve) => setTimeout(resolve, 800));
  }

  const returnDist = distanceCache[`${bestPath[bestPath.length - 1]}-0`];
  explanation += `<div class="step"><span class="step-number">Bước ${stepNum}</span>Quay về thành phố xuất phát <strong>${
    cities[0].name
  }</strong>: Khoảng cách = ${returnDist.toFixed(1)}</div>`;

  drawTSP(bestPath);
  const totalDist = calculateTourDistance(bestPath);
  const pathStr =
    bestPath.map((i) => cities[i].name).join(" → ") +
    " → " +
    cities[bestPath[0]].name;

  explanation += `<div class="result-highlight">✅ Chu trình tối ưu: ${pathStr}<br>Tổng khoảng cách: ${totalDist.toFixed(
    2
  )} Km</div>`;

  document.getElementById("tspExplanation").innerHTML = explanation;
  document.getElementById("tspRoutes").innerHTML = `
                <div class="result-highlight">Đã tìm thấy tuyến đường tối ưu!</div>
                <p><strong>Chu trình:</strong> ${pathStr}</p>
                <p><strong>Tổng khoảng cách:</strong> ${totalDist.toFixed(
                  2
                )} đơn vị</p>
                <div class="explanation" style="margin-top: 15px;">
                    <strong>Lưu ý:</strong> Thuật toán Nearest Neighbor là thuật toán tham lam, cho kết quả nhanh nhưng không đảm bảo luôn là tối ưu tuyệt đối. Với ${
                      cities.length
                    } thành phố, có ${
    factorial(cities.length - 1) / 2
  } chu trình khác nhau cần xét để tìm nghiệm tối ưu thực sự.
                </div>
            `;

  tspSolving = false;
  document.getElementById("tspSolveBtn").disabled = false;
}

function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

function resetTSP() {
  initTSP();
}

// ============ JOB ASSIGNMENT ============
let costMatrixData = [];

function initJobAssignment() {
  costMatrixData = [
    [9, 2, 7, 8],
    [6, 4, 3, 7],
    [5, 8, 1, 8],
    [7, 6, 9, 4],
  ];
  renderMatrix();
  document.getElementById("jobResult").innerHTML =
    'Nhấn "Giải Bài Toán" để xem kết quả phân công nhoa!';
  document.getElementById("jobExplanation").innerHTML = "";
}

function renderMatrix(assignments = null) {
  const container = document.getElementById("costMatrix");
  container.innerHTML = "";

  container.appendChild(createCell("", true));
  for (let j = 0; j < 4; j++) {
    container.appendChild(createCell(`CV${j + 1}`, true));
  }

  for (let i = 0; i < 4; i++) {
    container.appendChild(createCell(`CN${i + 1}`, true));
    for (let j = 0; j < 4; j++) {
      const cell = createCell(costMatrixData[i][j]);
      if (assignments && assignments[i] === j) {
        cell.classList.add("selected");
      }
      container.appendChild(cell);
    }
  }
}

function createCell(content, isHeader = false) {
  const cell = document.createElement("div");
  cell.className = "matrix-cell" + (isHeader ? " header" : "");
  cell.textContent = content;
  return cell;
}

function randomizeMatrix() {
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      costMatrixData[i][j] = Math.floor(Math.random() * 10) + 1;
    }
  }
  renderMatrix();
  document.getElementById("jobResult").innerHTML =
    'Nhấn "Giải Bài Toán" để xem kết quả phân công nhoa!';
  document.getElementById("jobExplanation").innerHTML = "";
}

async function solveJobAssignment() {
  document.getElementById("jobSolveBtn").disabled = true;

  let explanation =
    '<div class="step"><span class="step-number">Bước 1</span>Khởi tạo ma trận chi phí ban đầu</div>';
  explanation +=
    '<div class="step"><span class="step-number">Bước 2</span>Áp dụng thuật toán tham lam để tìm phân công tối ưu:</div>';

  const assignments = {};
  const usedJobs = new Set();
  let totalCost = 0;
  let stepNum = 3;

  for (let worker = 0; worker < 4; worker++) {
    let bestJob = -1;
    let minCost = Infinity;
    let options = [];

    for (let job = 0; job < 4; job++) {
      if (!usedJobs.has(job)) {
        options.push({ job, cost: costMatrixData[worker][job] });
        if (costMatrixData[worker][job] < minCost) {
          minCost = costMatrixData[worker][job];
          bestJob = job;
        }
      }
    }

    explanation += `<div class="step"><span class="step-number">Bước ${stepNum}</span>Công nhân <strong>CN${
      worker + 1
    }</strong> xét các công việc chưa ai làm:<br>`;
    options.forEach((opt) => {
      if (opt.job === bestJob) {
        explanation += `&nbsp;&nbsp;• CV${opt.job + 1}: Chi phí ${
          opt.cost
        } <strong style="color: #ffb6c1;">(Chọn - chi phí thấp nhất)</strong><br>`;
      } else {
        explanation += `&nbsp;&nbsp;• CV${opt.job + 1}: Chi phí ${
          opt.cost
        }<br>`;
      }
    });
    explanation += `Phân công: <strong>CN${worker + 1} → CV${
      bestJob + 1
    }</strong></div>`;

    assignments[worker] = bestJob;
    usedJobs.add(bestJob);
    totalCost += minCost;
    stepNum++;

    renderMatrix(assignments);
    document.getElementById("jobExplanation").innerHTML = explanation;
    await new Promise((resolve) => setTimeout(resolve, 800));
  }

  explanation += `<div class="result-highlight">✅ Phân công hoàn tất!<br>Tổng chi phí tối ưu: ${totalCost}</div>`;

  explanation +=
    '<div class="explanation" style="margin-top: 15px;"><strong>Giải thích thuật toán:</strong><br>';
  explanation +=
    "• Thuật toán tham lam chọn công việc có chi phí thấp nhất cho mỗi công nhân theo thứ tự.<br>";
  explanation += "• Đảm bảo mỗi công việc chỉ được giao cho một người.<br>";
  explanation += "• Kết quả cho nghiệm gần tối ưu với độ phức tạp O(n²).</div>";

  document.getElementById("jobExplanation").innerHTML = explanation;

  let resultHTML =
    '<div class="result-highlight">Kết quả phân công tối ưu:</div>';
  for (let i = 0; i < 4; i++) {
    resultHTML += `<div class="step">Công nhân <strong>CN${
      i + 1
    }</strong> → Công việc <strong>CV${assignments[i] + 1}</strong> (Chi phí: ${
      costMatrixData[i][assignments[i]]
    })</div>`;
  }
  resultHTML += `<div class="result-highlight">Tổng chi phí: ${totalCost}</div>`;

  document.getElementById("jobResult").innerHTML = resultHTML;
  document.getElementById("jobSolveBtn").disabled = false;
}

// ============ GRAPH COLORING ============
const graphCanvas = document.getElementById("graphCanvas");
const graphCtx = graphCanvas.getContext("2d");
let nodes = [];
let edges = [];
const colors = [
  "#ffb6c1",
  "#87ceeb",
  "#98fb98",
  "#ffd700",
  "#dda0dd",
  "#ffa07a",
];
const colorNames = ["Hồng", "Xanh Da Trời", "Xanh Lá", "Vàng", "Tím", "Cam"];

function initGraph() {
  nodes = [];
  edges = [];

  const numNodes = 7;
  const centerX = graphCanvas.width / 2;
  const centerY = graphCanvas.height / 2;
  const radius = 140;

  for (let i = 0; i < numNodes; i++) {
    const angle = (i / numNodes) * 2 * Math.PI;
    nodes.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      name: `Đ${i + 1}`,
      color: null,
    });
  }

  for (let i = 0; i < numNodes; i++) {
    for (let j = i + 1; j < numNodes; j++) {
      if (Math.random() < 0.4) {
        edges.push([i, j]);
      }
    }
  }

  if (edges.length < 8) {
    for (let i = 0; i < numNodes - 1; i++) {
      if (
        !edges.some(
          (e) =>
            (e[0] === i && e[1] === i + 1) || (e[0] === i + 1 && e[1] === i)
        )
      ) {
        edges.push([i, i + 1]);
      }
    }
  }

  drawGraph();
  renderEdgeTable();
  document.getElementById("graphExplanation").innerHTML = "";
  updateColorLegend();
}

function drawGraph() {
  graphCtx.fillStyle = "#1a1a2e";
  graphCtx.fillRect(0, 0, graphCanvas.width, graphCanvas.height);

  graphCtx.strokeStyle = "#555";
  graphCtx.lineWidth = 2;
  edges.forEach(([i, j]) => {
    graphCtx.beginPath();
    graphCtx.moveTo(nodes[i].x, nodes[i].y);
    graphCtx.lineTo(nodes[j].x, nodes[j].y);
    graphCtx.stroke();
  });

  nodes.forEach((node, i) => {
    graphCtx.beginPath();
    graphCtx.arc(node.x, node.y, 30, 0, Math.PI * 2);
    graphCtx.fillStyle = node.color || "#666";
    graphCtx.fill();

    graphCtx.strokeStyle = "#fff";
    graphCtx.lineWidth = 3;
    graphCtx.stroke();

    graphCtx.fillStyle = node.color ? "#1a1a2e" : "#fff";
    graphCtx.font = "bold 16px Inter";
    graphCtx.textAlign = "center";
    graphCtx.textBaseline = "middle";
    graphCtx.fillText(node.name, node.x, node.y);
  });
}

function renderEdgeTable() {
  const container = document.getElementById("edgeTable");
  let html =
    "<table><tr><th>STT</th><th>Đỉnh 1</th><th>Đỉnh 2</th><th>Ràng buộc</th></tr>";

  edges.forEach((edge, idx) => {
    const [i, j] = edge;
    html += `<tr><td>${idx + 1}</td><td>${nodes[i].name}</td><td>${
      nodes[j].name
    }</td><td>(không cùng màu)</td></tr>`;
  });

  html += "</table>";
  container.innerHTML = html;
}

function updateColorLegend() {
  const container = document.getElementById("colorLegend");
  let html = "<strong>Bảng màu:</strong> ";
  const usedColors = new Set(nodes.map((n) => n.color).filter((c) => c));

  if (usedColors.size === 0) {
    html += "Chưa tô màu";
  } else {
    colors.forEach((color, idx) => {
      if (usedColors.has(color)) {
        html += `<div class="color-item"><div class="color-box" style="background: ${color};"></div><span>${colorNames[idx]}</span></div>`;
      }
    });
  }

  container.innerHTML = html;
}

async function solveGraphColoring() {
  document.getElementById("graphSolveBtn").disabled = true;

  nodes.forEach((node) => (node.color = null));

  let explanation =
    '<div class="step"><span class="step-number">Bước 1</span>Khởi tạo: Tất cả đỉnh chưa được tô màu</div>';
  explanation +=
    '<div class="step"><span class="step-number">Bước 2</span>Áp dụng thuật toán Greedy Coloring:</div>';

  let stepNum = 3;

  for (let i = 0; i < nodes.length; i++) {
    const usedColors = new Set();

    edges.forEach(([a, b]) => {
      if (a === i && nodes[b].color) {
        usedColors.add(nodes[b].color);
      } else if (b === i && nodes[a].color) {
        usedColors.add(nodes[a].color);
      }
    });

    const neighbors = [];
    edges.forEach(([a, b]) => {
      if (a === i)
        neighbors.push({ name: nodes[b].name, color: nodes[b].color });
      else if (b === i)
        neighbors.push({ name: nodes[a].name, color: nodes[a].color });
    });

    explanation += `<div class="step"><span class="step-number">Bước ${stepNum}</span>Tô màu đỉnh <strong>${nodes[i].name}</strong>:<br>`;

    if (neighbors.length > 0) {
      explanation += "&nbsp;&nbsp;Các đỉnh kề:<br>";
      neighbors.forEach((n) => {
        if (n.color) {
          const colorIdx = colors.indexOf(n.color);
          explanation += `&nbsp;&nbsp;&nbsp;&nbsp;• ${n.name}: Màu ${colorNames[colorIdx]}<br>`;
        } else {
          explanation += `&nbsp;&nbsp;&nbsp;&nbsp;• ${n.name}: Chưa tô<br>`;
        }
      });
    } else {
      explanation += "&nbsp;&nbsp;Không có đỉnh kề nào<br>";
    }

    for (let colorIdx = 0; colorIdx < colors.length; colorIdx++) {
      if (!usedColors.has(colors[colorIdx])) {
        nodes[i].color = colors[colorIdx];
        explanation += `&nbsp;&nbsp;→ Chọn màu <strong style="color: ${colors[colorIdx]};">${colorNames[colorIdx]}</strong> (vì các đỉnh kề chưa dùng màu này)</div>`;
        break;
      }
    }

    stepNum++;

    drawGraph();
    updateColorLegend();
    document.getElementById("graphExplanation").innerHTML = explanation;
    await new Promise((resolve) => setTimeout(resolve, 700));
  }

  const usedColorSet = new Set(nodes.map((n) => n.color));

  explanation += `<div class="result-highlight">✅ Đồ thị đã được tô màu thành công!<br>Số màu tối thiểu: ${usedColorSet.size}</div>`;

  explanation +=
    '<div class="explanation" style="margin-top: 15px;"><strong>Giải thích thuật toán:</strong><br>';
  explanation += "• Duyệt qua từng đỉnh theo thứ tự.<br>";
  explanation += "• Với mỗi đỉnh, kiểm tra màu của các đỉnh kề.<br>";
  explanation += "• Chọn màu nhỏ nhất chưa được sử dụng bởi các đỉnh kề.<br>";
  explanation += "• Đảm bảo ràng buộc: Không có hai đỉnh kề nhau cùng màu.<br>";
  explanation += `• Độ phức tạp: O(V + E) với V = ${nodes.length} đỉnh, E = ${edges.length} cạnh.</div>`;

  document.getElementById("graphExplanation").innerHTML = explanation;
  document.getElementById("graphSolveBtn").disabled = false;
}

function resetGraph() {
  initGraph();
}

// Khoi tao cac ban demo
initTSP();
initJobAssignment();
initGraph();
