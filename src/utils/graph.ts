import type { FileChange, DirectoryStats, GraphData, GraphNode, GraphEdge } from '../types.js';

export function generateGraphData(
  directories: DirectoryStats,
  files: FileChange[],
  maxChanges: number,
  maxFiles: number = 100
): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const topFiles = files.slice(0, maxFiles);

  function addDirectoryNode(dir: DirectoryStats): void {
    const intensity = Math.min(dir.totalChanges / maxChanges, 1);
    const size = 20 + intensity * 50;
    
    nodes.push({
      id: dir.path,
      label: dir.path === '.' ? 'root' : dir.path.split('/').pop() || dir.path,
      changes: dir.totalChanges,
      type: 'directory',
      size,
      color: getHeatmapColor(intensity),
    });

    for (const child of dir.children) {
      if ('children' in child) {
        edges.push({
          source: dir.path,
          target: child.path,
        });
        addDirectoryNode(child);
      }
    }
  }

  addDirectoryNode(directories);

  for (const file of topFiles) {
    const intensity = Math.min(file.changes / maxChanges, 1);
    const size = 10 + intensity * 30;
    const dirPath = file.path.includes('/') 
      ? file.path.substring(0, file.path.lastIndexOf('/')) 
      : '.';

    nodes.push({
      id: file.path,
      label: file.path.split('/').pop() || file.path,
      changes: file.changes,
      type: 'file',
      size,
      color: getHeatmapColor(intensity),
    });

    edges.push({
      source: dirPath || '.',
      target: file.path,
    });
  }

  return { nodes, edges };
}

function getHeatmapColor(intensity: number): string {
  const colors = [
    { r: 59, g: 130, b: 246 },   // blue-500 (low)
    { r: 34, g: 197, b: 94 },    // green-500
    { r: 234, g: 179, b: 8 },    // yellow-500
    { r: 249, g: 115, b: 22 },   // orange-500
    { r: 239, g: 68, b: 68 },    // red-500 (high)
  ];

  const index = Math.min(Math.floor(intensity * (colors.length - 1)), colors.length - 2);
  const localIntensity = (intensity * (colors.length - 1)) - index;
  
  const c1 = colors[index];
  const c2 = colors[index + 1];
  
  const r = Math.round(c1.r + (c2.r - c1.r) * localIntensity);
  const g = Math.round(c1.g + (c2.g - c1.g) * localIntensity);
  const b = Math.round(c1.b + (c2.b - c1.b) * localIntensity);
  
  return `rgb(${r}, ${g}, ${b})`;
}

export function generateHTML(graphData: GraphData, stats: {
  totalFiles: number;
  totalChanges: number;
  dateRange: { from: string; to: string };
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Repository Heatmap</title>
  <script src="https://unpkg.com/cytoscape@3.26.0/dist/cytoscape.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      overflow: hidden;
    }
    
    #header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      padding: 16px 24px;
      background: rgba(15, 23, 42, 0.9);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid #1e293b;
      z-index: 100;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    #header h1 {
      font-size: 18px;
      font-weight: 600;
      color: #f8fafc;
    }
    
    #stats {
      display: flex;
      gap: 24px;
      font-size: 13px;
      color: #94a3b8;
    }
    
    #stats span {
      color: #f8fafc;
      font-weight: 500;
    }
    
    #cy {
      width: 100vw;
      height: 100vh;
    }
    
    #legend {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: rgba(15, 23, 42, 0.9);
      backdrop-filter: blur(10px);
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 16px;
      z-index: 100;
    }
    
    #legend h3 {
      font-size: 12px;
      font-weight: 600;
      color: #94a3b8;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 12px;
      color: #cbd5e1;
    }
    
    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 3px;
    }
    
    #tooltip {
      position: fixed;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid #334155;
      border-radius: 6px;
      padding: 12px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s;
      z-index: 200;
      max-width: 280px;
    }
    
    #tooltip.visible {
      opacity: 1;
    }
    
    #tooltip h4 {
      font-size: 13px;
      font-weight: 600;
      color: #f8fafc;
      margin-bottom: 4px;
      word-break: break-all;
    }
    
    #tooltip p {
      font-size: 12px;
      color: #94a3b8;
      margin: 2px 0;
    }
    
    #controls {
      position: fixed;
      bottom: 24px;
      left: 24px;
      display: flex;
      gap: 8px;
      z-index: 100;
    }
    
    button {
      background: #1e293b;
      border: 1px solid #334155;
      color: #e2e8f0;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.15s;
    }
    
    button:hover {
      background: #334155;
    }
    
    #search {
      position: fixed;
      top: 80px;
      right: 24px;
      z-index: 100;
    }
    
    #search input {
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid #334155;
      border-radius: 6px;
      padding: 8px 12px;
      color: #e2e8f0;
      font-size: 13px;
      width: 200px;
      outline: none;
    }
    
    #search input::placeholder {
      color: #64748b;
    }
    
    #search input:focus {
      border-color: #3b82f6;
    }
  </style>
</head>
<body>
  <div id="header">
    <h1>📊 Repository Heatmap</h1>
    <div id="stats">
      <div>Files: <span>${stats.totalFiles}</span></div>
      <div>Total Changes: <span>${stats.totalChanges.toLocaleString()}</span></div>
      <div>Period: <span>${new Date(stats.dateRange.from).toLocaleDateString()} - ${new Date(stats.dateRange.to).toLocaleDateString()}</span></div>
    </div>
  </div>
  
  <div id="search">
    <input type="text" id="searchInput" placeholder="Search files...">
  </div>
  
  <div id="cy"></div>
  
  <div id="legend">
    <h3>Change Intensity</h3>
    <div class="legend-item">
      <div class="legend-color" style="background: rgb(59, 130, 246)"></div>
      <span>Low</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: rgb(34, 197, 94)"></div>
      <span>Medium-Low</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: rgb(234, 179, 8)"></div>
      <span>Medium</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: rgb(249, 115, 22)"></div>
      <span>Medium-High</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: rgb(239, 68, 68)"></div>
      <span>High</span>
    </div>
  </div>
  
  <div id="controls">
    <button onclick="fitGraph()">Fit</button>
    <button onclick="resetLayout()">Reset Layout</button>
    <button onclick="toggleLabels()">Toggle Labels</button>
  </div>
  
  <div id="tooltip"></div>
  
  <script>
    const graphData = ${JSON.stringify(graphData)};
    let showLabels = true;
    
    const cy = cytoscape({
      container: document.getElementById('cy'),
      elements: [
        ...graphData.nodes.map(n => ({
          data: {
            id: n.id,
            label: n.label,
            changes: n.changes,
            type: n.type,
            size: n.size,
            color: n.color
          }
        })),
        ...graphData.edges.map(e => ({
          data: {
            source: e.source,
            target: e.target
          }
        }))
      ],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            'width': 'data(size)',
            'height': 'data(size)',
            'label': showLabels ? 'data(label)' : '',
            'font-size': '10px',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'color': '#94a3b8',
            'text-background-color': '#0f172a',
            'text-background-opacity': 0.8,
            'text-background-padding': '2px',
            'text-background-shape': 'roundrectangle',
            'border-width': 2,
            'border-color': '#1e293b'
          }
        },
        {
          selector: 'node[type="directory"]',
          style: {
            'shape': 'round-rectangle',
            'border-width': 3,
            'border-color': '#334155'
          }
        },
        {
          selector: 'node[type="file"]',
          style: {
            'shape': 'ellipse'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 1,
            'line-color': '#334155',
            'target-arrow-color': '#334155',
            'target-arrow-shape': 'none',
            'curve-style': 'bezier'
          }
        },
        {
          selector: '.highlighted',
          style: {
            'border-width': 4,
            'border-color': '#fbbf24',
            'z-index': 999
          }
        },
        {
          selector: '.dimmed',
          style: {
            'opacity': 0.2
          }
        }
      ],
      layout: {
        name: 'cose',
        padding: 50,
        nodeRepulsion: 8000,
        idealEdgeLength: 100,
        nodeOverlap: 20,
        componentSpacing: 100,
        nestingFactor: 5,
        gravity: 10,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0
      }
    });
    
    const tooltip = document.getElementById('tooltip');
    
    cy.on('mouseover', 'node', function(evt) {
      const node = evt.target;
      const data = node.data();
      
      tooltip.innerHTML = \`
        <h4>\${data.id}</h4>
        <p>Type: \${data.type}</p>
        <p>Changes: \${data.changes.toLocaleString()}</p>
      \`;
      
      tooltip.classList.add('visible');
    });
    
    cy.on('mousemove', function(evt) {
      tooltip.style.left = (evt.originalEvent.clientX + 15) + 'px';
      tooltip.style.top = (evt.originalEvent.clientY + 15) + 'px';
    });
    
    cy.on('mouseout', 'node', function() {
      tooltip.classList.remove('visible');
    });
    
    cy.on('tap', 'node', function(evt) {
      const node = evt.target;
      const neighborhood = node.neighborhood().add(node);
      
      cy.elements().addClass('dimmed');
      neighborhood.removeClass('dimmed').addClass('highlighted');
      
      setTimeout(() => {
        cy.elements().removeClass('dimmed highlighted');
      }, 2000);
    });
    
    cy.on('tap', function(evt) {
      if (evt.target === cy) {
        cy.elements().removeClass('dimmed highlighted');
      }
    });
    
    function fitGraph() {
      cy.fit(50);
    }
    
    function resetLayout() {
      cy.layout({
        name: 'cose',
        padding: 50,
        nodeRepulsion: 8000,
        idealEdgeLength: 100,
        nodeOverlap: 20,
        componentSpacing: 100,
        nestingFactor: 5,
        gravity: 10,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0,
        animate: true,
        animationDuration: 500
      }).run();
    }
    
    function toggleLabels() {
      showLabels = !showLabels;
      cy.style().selector('node').style('label', showLabels ? 'data(label)' : '').update();
    }
    
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', function(e) {
      const query = e.target.value.toLowerCase();
      
      if (query === '') {
        cy.elements().removeClass('dimmed highlighted');
        return;
      }
      
      const matches = cy.nodes().filter(n => 
        n.data('id').toLowerCase().includes(query) ||
        n.data('label').toLowerCase().includes(query)
      );
      
      cy.elements().addClass('dimmed');
      matches.removeClass('dimmed').addClass('highlighted');
    });
    
    // Initial fit
    setTimeout(fitGraph, 500);
  </script>
</body>
</html>`;
}
