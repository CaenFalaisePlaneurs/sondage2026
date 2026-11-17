'use strict';

let chartTheme = 'dark';
let currentTab = 'synthese';
let exporting = false;
let tooltip = null;

const satData = [
  { label: 'Très satisfait', value: 17 },
  { label: 'Plutôt satisfait', value: 11 },
  { label: 'Neutre', value: 4 },
  { label: 'Plutôt insatisfait', value: 1 }
];
const satColors = ['#4ade80', '#fbbf24', '#fb923c', '#f87171'];

const membreData = [
  { label: 'Tout à fait', value: 18 },
  { label: 'Plutôt oui', value: 12 },
  { label: 'Plutôt non', value: 3 }
];
const membreColors = ['#4ade80', '#fbbf24', '#f87171'];

const ambianceColors = ['#4ade80', '#fbbf24', '#fb923c', '#f87171'];
const ambianceData = [
  { label: 'Très bonne', value: 9, color: ambianceColors[0] },
  { label: 'Plutôt bonne', value: 18, color: ambianceColors[1] },
  { label: 'À améliorer', value: 5, color: ambianceColors[2] },
  { label: 'Mauvaise', value: 1, color: ambianceColors[3] }
];

const ageData = [
  { label: '14-17', value: 4 },
  { label: '18-25', value: 8 },
  { label: '26-40', value: 2 },
  { label: '41-60', value: 6 },
  { label: '61-80', value: 13 }
];
const ageColors = ['#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#fb7185'];

const freqData = [
  { label: 'Plusieurs/sem', full: 'Plusieurs fois par semaine', value: 8, color: '#4ade80' },
  { label: 'Presque tt WE', full: 'Presque tous les week-ends', value: 2, color: '#4ade80' },
  { label: '1/semaine', full: 'Une fois par semaine', value: 5, color: '#fbbf24' },
  { label: 'Quelques/mois', full: 'Quelques fois par mois', value: 4, color: '#fb923c' },
  { label: 'Quelques/an', full: 'Quelques fois par an', value: 9, color: '#fb923c' },
  { label: 'Très rare', full: 'Très rarement', value: 4, color: '#f87171' }
];

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

function showTab(id, btn) {
  currentTab = id;
  document.querySelectorAll('.tab-content').forEach((el) => el.classList.remove('active'));
  document.querySelectorAll('.tab').forEach((el) => {
    el.classList.remove('active');
    el.setAttribute('aria-selected', 'false');
  });
  document.getElementById(id).classList.add('active');
  btn.classList.add('active');
  btn.setAttribute('aria-selected', 'true');
  if (id === 'synthese') redrawCharts(true);
}

function chartsAnimate() {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function labelColor() {
  return chartTheme === 'light' ? '#111827' : '#e2e8f0';
}

function chartFont() {
  return 'Arial, Helvetica, sans-serif';
}

function sliceStroke() {
  return chartTheme === 'light' ? '#ffffff' : '#1e293b';
}

function axisLineColor() {
  return chartTheme === 'light' ? '#cbd5e1' : '#64748b';
}

function styleAxis(axis) {
  axis.selectAll('text')
    .attr('fill', labelColor())
    .attr('font-size', chartTheme === 'light' ? '13px' : '11px')
    .attr('font-family', chartFont());
  axis.selectAll('path, line').attr('stroke', axisLineColor());
}

function paint(selection, fill) {
  selection.attr('fill', fill).style('fill', fill);
}

function showTooltip(event, title, value) {
  if (!tooltip) return;
  tooltip.style('opacity', 1).html(
    `<strong>${escapeHtml(title)}</strong><br>${escapeHtml(value)} réponses`
  );
  tooltip.style('left', `${event.pageX + 12}px`).style('top', `${event.pageY - 28}px`);
}

function hideTooltip() {
  if (tooltip) tooltip.style('opacity', 0);
}

function drawDonut(containerId, data, colors, animate) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.replaceChildren();
  const width = container.clientWidth || 300;
  const height = 250;
  const radius = Math.min(width, height) / 2 - 8;
  const svg = d3.select(container).append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('role', 'img')
    .append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`);
  const pie = d3.pie().value((d) => d.value).sort(null);
  const arc = d3.arc().innerRadius(radius * 0.58).outerRadius(radius);
  const arcs = pie(data);
  const paths = svg.selectAll('path')
    .data(arcs)
    .enter()
    .append('path')
    .call((sel) => paint(sel, (_, i) => colors[i]))
    .attr('stroke', sliceStroke())
    .style('stroke', sliceStroke())
    .attr('stroke-width', 2)
    .attr('d', (d) => arc({ startAngle: d.startAngle, endAngle: animate ? d.startAngle : d.endAngle }))
    .on('mouseover', function (event, d) {
      d3.select(this).attr('opacity', 0.85);
      showTooltip(event, d.data.label, d.data.value);
    })
    .on('mouseout', function () {
      d3.select(this).attr('opacity', 1);
      hideTooltip();
    });
  if (animate) {
    paths.transition()
      .duration(800)
      .delay((_, i) => i * 80)
      .ease(d3.easeCubicOut)
      .attrTween('d', (d) => {
        const interp = d3.interpolate({ startAngle: d.startAngle, endAngle: d.startAngle }, d);
        return (t) => arc(interp(t));
      });
  }
  const total = d3.sum(data, (d) => d.value);
  const totalLabel = svg.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .attr('fill', labelColor())
    .attr('font-family', chartFont())
    .attr('font-size', chartTheme === 'light' ? '22px' : '18px')
    .attr('font-weight', '700')
    .text(animate ? 0 : total);
  if (animate) {
    totalLabel.transition().duration(800).ease(d3.easeCubicOut).tween('text', function () {
      const interp = d3.interpolateNumber(0, total);
      return function (t) { this.textContent = Math.round(interp(t)); };
    });
  }
}

function bindBarHover(selection) {
  selection
    .on('mouseover', function (event, d) {
      d3.select(this).attr('opacity', 0.85);
      showTooltip(event, d.full || d.label, d.value);
    })
    .on('mouseout', function () {
      d3.select(this).attr('opacity', 1);
      hideTooltip();
    });
}

function drawBar(containerId, data, color, animate) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.replaceChildren();
  const full = container.clientWidth || 300;
  if (chartTheme === 'light' || full >= 520) drawHorizontalBar(container, data, color, full, animate);
  else drawVerticalBar(container, data, color, full, animate);
}

function drawVerticalBar(container, data, color, full, animate) {
  const margin = { top: 8, right: 8, bottom: 72, left: 32 };
  const width = Math.max(full - margin.left - margin.right, 140);
  const height = 240 - margin.top - margin.bottom;
  const svg = d3.select(container).append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .attr('role', 'img')
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  const x = d3.scaleBand().domain(data.map((d) => d.label)).range([0, width]).padding(0.28);
  const yMax = d3.max(data, (d) => d.value) || 0;
  const y = d3.scaleLinear().domain([0, yMax]).nice().range([height, 0]);
  const xAxis = svg.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x));
  styleAxis(xAxis);
  xAxis.selectAll('text')
    .attr('transform', 'rotate(-30)')
    .style('text-anchor', 'end');
  styleAxis(svg.append('g').call(
    d3.axisLeft(y).ticks(Math.min(5, yMax)).tickFormat(d3.format('d'))
  ));
  const bars = svg.selectAll('rect')
    .data(data)
    .enter()
    .append('rect')
    .attr('x', (d) => x(d.label))
    .attr('y', animate ? height : (d) => y(d.value))
    .attr('width', x.bandwidth())
    .attr('height', animate ? 0 : (d) => Math.max(0, height - y(d.value)))
    .call((sel) => paint(sel, (d) => d.color || color))
    .attr('rx', 4);
  bindBarHover(bars);
  if (animate) {
    bars.transition()
      .duration(750)
      .delay((_, i) => i * 70)
      .ease(d3.easeCubicOut)
      .attr('y', (d) => y(d.value))
      .attr('height', (d) => Math.max(0, height - y(d.value)));
  }
}

function drawHorizontalBar(container, data, color, full, animate) {
  const names = data.map((d) => d.full || d.label);
  const longest = names.reduce((max, name) => Math.max(max, name.length), 0);
  const margin = {
    top: 4,
    right: 28,
    bottom: 28,
    left: Math.min(200, Math.max(108, Math.ceil(longest * 6.8)))
  };
  const width = Math.max(full - margin.left - margin.right, 180);
  const height = data.length * 36;
  const svg = d3.select(container).append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .attr('role', 'img')
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  const yMax = d3.max(data, (d) => d.value) || 0;
  const x = d3.scaleLinear().domain([0, yMax]).nice().range([0, width]);
  const y = d3.scaleBand().domain(names).range([0, height]).padding(0.32);
  styleAxis(svg.append('g').call(d3.axisLeft(y)));
  styleAxis(svg.append('g').attr('transform', `translate(0,${height})`).call(
    d3.axisBottom(x).ticks(Math.min(5, yMax)).tickFormat(d3.format('d'))
  ));
  const bars = svg.selectAll('rect')
    .data(data)
    .enter()
    .append('rect')
    .attr('x', 0)
    .attr('y', (d) => y(d.full || d.label))
    .attr('width', animate ? 0 : (d) => Math.max(0, x(d.value)))
    .attr('height', y.bandwidth())
    .call((sel) => paint(sel, (d) => d.color || color))
    .attr('rx', 4);
  bindBarHover(bars);
  const values = svg.selectAll('.bar-value')
    .data(data)
    .enter()
    .append('text')
    .attr('x', animate ? 6 : (d) => x(d.value) + 6)
    .attr('y', (d) => y(d.full || d.label) + y.bandwidth() / 2)
    .attr('dominant-baseline', 'middle')
    .attr('fill', labelColor())
    .attr('font-family', chartFont())
    .attr('font-size', chartTheme === 'light' ? '13px' : '12px')
    .attr('opacity', animate ? 0 : 1)
    .text((d) => d.value);
  if (animate) {
    bars.transition()
      .duration(750)
      .delay((_, i) => i * 60)
      .ease(d3.easeCubicOut)
      .attr('width', (d) => Math.max(0, x(d.value)));
    values.transition()
      .duration(750)
      .delay((_, i) => i * 60)
      .ease(d3.easeCubicOut)
      .attr('opacity', 1)
      .attr('x', (d) => x(d.value) + 6);
  }
}

function renderLegend(id, data, colors) {
  const el = document.getElementById(id);
  if (!el) return;
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  el.innerHTML = data.map((d, i) => {
    const name = escapeHtml(d.full || d.label);
    const pct = Math.round((d.value / total) * 100);
    return `<span class="legend-item"><span class="swatch" style="background-color:${colors[i]}"></span>${name} · ${d.value} (${pct}%)</span>`;
  }).join('');
}

function renderLegends() {
  renderLegend('legendSat', satData, satColors);
  renderLegend('legendMembre', membreData, membreColors);
  renderLegend('legendAmbiance', ambianceData, ambianceColors);
  renderLegend('legendAge', ageData, ageColors);
  renderLegend('legendFreq', freqData, freqData.map((d) => d.color));
}

function redrawCharts(animate) {
  if (typeof d3 === 'undefined') return;
  const motion = Boolean(animate) && chartsAnimate();
  drawDonut('chartSat', satData, satColors, motion);
  drawDonut('chartMembre', membreData, membreColors, motion);
  drawBar('chartAmbiance', ambianceData, '#38bdf8', motion);
  drawDonut('chartAge', ageData, ageColors, motion);
  drawBar('chartFreq', freqData, '#818cf8', motion);
}

function setStatus(message) {
  const status = document.getElementById('pdfStatus');
  if (status) status.textContent = message || '';
}

function applyVisibleTab() {
  document.querySelectorAll('.tab-content').forEach((el) => {
    el.classList.toggle('active', el.id === currentTab);
  });
}

function freezeCharts() {
  const jobs = [...document.querySelectorAll('#report .chart-container svg')].map((svg) => {
    const clone = svg.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const w = Math.ceil(svg.getBoundingClientRect().width) || Number(svg.getAttribute('width')) || 300;
    const h = Math.ceil(svg.getBoundingClientRect().height) || Number(svg.getAttribute('height')) || 200;
    clone.setAttribute('width', String(w));
    clone.setAttribute('height', String(h));
    const xml = new XMLSerializer().serializeToString(clone);
    const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }));
    return new Promise((resolve) => {
      const source = new Image();
      source.onload = () => {
        const scale = 2;
        const canvas = document.createElement('canvas');
        canvas.width = w * scale;
        canvas.height = h * scale;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
        const shot = new Image();
        shot.alt = '';
        shot.style.width = `${w}px`;
        shot.style.height = `${h}px`;
        shot.style.display = 'block';
        shot.style.margin = '0 auto';
        shot.onload = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        shot.onerror = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        svg.replaceWith(shot);
        shot.src = canvas.toDataURL('image/png');
      };
      source.onerror = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      source.src = url;
    });
  });
  return Promise.all(jobs);
}

function restoreAfterExport(scrollY) {
  document.body.classList.remove('pdf-export');
  const report = document.getElementById('report');
  if (report) report.style.width = '';
  chartTheme = 'dark';
  applyVisibleTab();
  redrawCharts(true);
  const overlay = document.getElementById('pdfOverlay');
  if (overlay) overlay.hidden = true;
  const btn = document.getElementById('pdfBtn');
  if (btn) btn.disabled = false;
  exporting = false;
  window.scrollTo(0, scrollY);
}

async function telechargerPDF() {
  if (exporting) return;
  const btn = document.getElementById('pdfBtn');
  if (typeof html2pdf !== 'function') {
    setStatus('Le téléchargement PDF est indisponible pour le moment.');
    return;
  }
  exporting = true;
  if (btn) btn.disabled = true;
  setStatus('Préparation du PDF…');
  const overlay = document.getElementById('pdfOverlay');
  if (overlay) overlay.hidden = false;
  hideTooltip();
  const scrollY = window.scrollY;
  window.scrollTo(0, 0);

  const report = document.getElementById('report');
  document.body.classList.add('pdf-export');
  chartTheme = 'light';
  document.querySelectorAll('.tab-content').forEach((el) => el.classList.add('active'));
  if (report) report.style.width = '800px';
  renderLegends();
  redrawCharts();
  await freezeCharts();

  const opt = {
    margin: [12, 12, 16, 12],
    filename: 'sondage-club-2026.pdf',
    image: { type: 'jpeg', quality: 1 },
    html2canvas: {
      scale: 2,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      windowWidth: 800
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: {
      mode: ['css', 'legacy'],
      avoid: ['.stat-card', '.theme', '.q-block', '.actions', '.chart-block', '.callout']
    }
  };

  try {
    const pdf = await html2pdf().set(opt).from(report).toPdf().get('pdf');
    const total = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= total; i += 1) {
      pdf.setPage(i);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(90);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.text(
        `Sondage club 2026 - Caen Falaise Planeurs - ${i}/${total}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );
    }
    pdf.save('sondage-club-2026.pdf');
    setStatus('');
  } catch (error) {
    console.error(error);
    setStatus('Le PDF n’a pas pu être généré. Réessayez.');
  } finally {
    restoreAfterExport(scrollY);
  }
}

function preparePrintTheme() {
  if (exporting) return;
  chartTheme = 'light';
  document.body.classList.add('pdf-export');
  redrawCharts();
}

function restoreScreenTheme() {
  if (exporting) return;
  document.body.classList.remove('pdf-export');
  chartTheme = 'dark';
  applyVisibleTab();
  redrawCharts();
}

let resizeTimer;
window.addEventListener('resize', () => {
  if (exporting || currentTab !== 'synthese') return;
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(redrawCharts, 150);
});

window.addEventListener('beforeprint', preparePrintTheme);
window.addEventListener('afterprint', restoreScreenTheme);

window.addEventListener('load', () => {
  tooltip = typeof d3 !== 'undefined' ? d3.select('#tooltip') : null;
  if (typeof d3 === 'undefined') {
    document.querySelectorAll('.chart-container').forEach((el) => {
      el.textContent = 'Graphique indisponible.';
    });
  } else {
    renderLegends();
    redrawCharts(true);
  }
  if (typeof html2pdf !== 'function') {
    setStatus('Export PDF indisponible : rechargez la page.');
  }
});
