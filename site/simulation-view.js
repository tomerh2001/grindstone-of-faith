import { createUpgrade, advanceUpgrade, UpgradeExperiment } from './simulation.js?v=3';
import { seededRandom, formatProbability } from './model.js?v=3';
const $ = id => document.getElementById(id);
const money = (v, digits=2) => `${v.toLocaleString('en-US',{maximumFractionDigits:digits})}b`;
const pct = formatProbability;
const COLORS = ['#74eed0','#f3cc84','#b9a1ff','#76b9f7'];
const empty = '<div class="chart-empty">Simulations will fill this chart.</div>';
const frame = (label,w,h) => `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}"><title>${label}</title>`;
export class SimulationView {
  constructor(settings) {
    this.settings=settings; this.seed=2712026; this.singleTimer=null; this.manyTimer=null; this.valid=true;
    this.runs=[]; this.experiments=[];
    $('watchOne').addEventListener('click',()=>this.watchOne());
    $('finishOne').addEventListener('click',()=>this.finishOne());
    $('simulate').addEventListener('click',()=>this.startMany());
    $('stopSimulation').addEventListener('click',()=>this.stopMany());
    window.addEventListener('resize',()=>{if(this.experiments[0]?.completed)this.drawCharts();});
  }
  reset(valid=true) {
    clearTimeout(this.singleTimer); clearTimeout(this.manyTimer);
    this.singleTimer=null; this.manyTimer=null; this.valid=valid; this.runs=[]; this.experiments=[];
    $('watchOne').disabled=!valid; $('simulate').disabled=!valid; $('finishOne').disabled=true; $('stopSimulation').disabled=!valid;
    $('runLanes').innerHTML='';
    $('runLog').textContent='Start the animation to watch the four automatically selected strategies.';
    $('experimentCount').textContent='0 / 50,000 per strategy'; $('experimentProgress').style.width='0%';
    $('histogramChart').innerHTML=empty; $('runningMeanChart').innerHTML=empty; $('experimentTable').innerHTML='';
    $('simulationResult').textContent=valid?'Preparing 50,000 upgrades for each strategy…':'Enter a valid price to simulate.';
    if(valid){
      const {analysis}=this.settings();
      $('simulationLegend').innerHTML=analysis.comparisons.map((s,i)=>`<span style="--key:${COLORS[i]}">${s.n} / attempt</span>`).join('');
      this.renderOne();
      // Like the Star Force calculator, results populate automatically after inputs settle.
      this.manyTimer=setTimeout(()=>this.startMany(),180);
    }
  }
  watchOne() {
    if(!this.valid)return;
    clearTimeout(this.singleTimer);
    const {type,price,analysis}=this.settings();
    this.random=seededRandom(++this.seed);
    this.runs=analysis.comparisons.map(s=>createUpgrade(type,s.n,price));
    $('finishOne').disabled=false; this.renderOne();
    const step=()=>{
      this.runs.forEach(run=>advanceUpgrade(run,this.random)); this.renderOne();
      if(this.runs.every(run=>run.success)){this.singleTimer=null;$('finishOne').disabled=true;}
      else this.singleTimer=setTimeout(step,180);
    };
    this.singleTimer=setTimeout(step,180);
  }
  finishOne() {
    if(!this.runs.length)return;
    clearTimeout(this.singleTimer);this.singleTimer=null;
    for(const run of this.runs)while(!run.success)advanceUpgrade(run,this.random);
    $('finishOne').disabled=true;this.renderOne();
  }
  renderOne() {
    const {analysis}=this.settings(), G=analysis.recommended.expectedCost;
    const rows=this.runs.length?this.runs:analysis.comparisons.map(s=>({batch:s.n,attempts:0,cost:0,outcomes:[],success:false}));
    $('runLanes').innerHTML=rows.map((r,i)=>`<div class="run-lane" style="--key:${COLORS[i]}"><div class="lane-heading"><strong>${r.batch} / attempt${i===0?' · recommended':''}</strong><span>${r.attempts} attempt${r.attempts===1?'':'s'} · ${money(r.cost)} · ${r.success?`level ${analysis.rules.to} ✓`:`level ${analysis.rules.from}`}</span></div><div class="attempt-track">${r.outcomes.length>35?`<span class="small earlier-attempts">${r.outcomes.length-35} earlier failures</span>`:''}${r.outcomes.slice(-35).map((ok,j)=>`<span class="attempt-chip ${ok?'success':''}"><span>Attempt ${Math.max(0,r.outcomes.length-35)+j+1}</span><strong>${ok?'Success':'Failed'}</strong></span>`).join('')||'<span class="small">Ready to polish</span>'}</div><div class="spending-track"><div class="${r.cost>G+1e-9?'over':''}" style="width:${Math.min(100,r.cost/G*100)}%"></div></div></div>`).join('');
    const done=this.runs.length&&this.runs.every(r=>r.success);
    $('runLog').textContent=done?`All four upgrades finished. Bars compare each run with the ${money(G)} guaranteed total; amber means it spent more. Every failure is charged.`:`Each bar fills at the ${money(G)} guaranteed total. The full amount succeeds immediately; smaller amounts keep trying until success.`;
  }
  startMany() {
    if(!this.valid)return;
    clearTimeout(this.manyTimer);
    const {type,price,analysis}=this.settings();
    this.experimentSeed=++this.seed;
    this.experiments=analysis.comparisons.map((s,i)=>new UpgradeExperiment(type,s.n,price,50000,this.experimentSeed+i));
    $('histogramChart').innerHTML=empty;$('runningMeanChart').innerHTML=empty;$('experimentTable').innerHTML='';
    $('stopSimulation').disabled=false;
    this.renderMany('Running');
    const step=()=>{
      this.experiments.forEach(e=>e.advance(625));
      const finished=this.experiments.every(e=>e.finished);
      this.renderMany(finished?'Finished':'Running');
      if(finished){this.manyTimer=null;$('stopSimulation').disabled=true;}
      else this.manyTimer=setTimeout(step,24);
    };
    this.manyTimer=setTimeout(step,24);
  }
  stopMany() {
    clearTimeout(this.manyTimer);this.manyTimer=null;$('stopSimulation').disabled=true;
    if(this.experiments.length)this.renderMany('Stopped');
    else $('simulationResult').textContent='Stopped before any upgrades. Use “Run simulations again” to begin.';
  }
  renderMany(status) {
    const count=this.experiments[0]?.completed||0;
    $('experimentCount').textContent=`${count.toLocaleString('en-US')} / 50,000 per strategy`;
    $('experimentProgress').style.width=`${count/500}%`;
    $('simulationResult').textContent=`${status}${count?` ${count.toLocaleString('en-US')} upgrades per strategy`:' before any upgrades'}. Exact mean: ${money(this.settings().analysis.recommended.expectedCost)} for every strategy. Seed ${this.experimentSeed} (plus each series index).`;
    if(!count)return;
    $('experimentTable').innerHTML=this.experiments.map((e,i)=>`<tr class="${i===0?'guarantee':''}"><td>${e.batch}${i===0?' · recommended':''}</td><td>${money(e.mean)}</td><td>${money(e.quantile(.95))}</td><td>${money(e.quantile(.99))}</td><td>${pct(e.below/count)}</td><td>${pct(e.equal/count)}</td><td>${pct(e.above/count)}</td></tr>`).join('');
    this.drawCharts();
  }
  drawCharts() {
    this.drawHistogram();this.drawMean();
  }
  drawHistogram() {
    const W=Math.max(340,$('histogramChart').clientWidth||520),H=365,left=53,right=14,top=25,bottom=46;
    const xmax=Math.max(...this.experiments.map(e=>(e.counts.length-1)*e.attemptCost))*1.03;
    const X=v=>left+v/xmax*(W-left-right), rowH=(H-top-bottom)/4, bins=24, binWidth=xmax/bins;
    let svg=frame('Simulated cost distributions for four strategies; all outcomes included',W,H);
    this.experiments.forEach((e,i)=>{
      const counts=new Array(bins).fill(0);
      e.counts.forEach((count,attempt)=>{if(count)counts[Math.min(bins-1,Math.floor(attempt*e.attemptCost/binWidth))]+=count;});
      const base=top+(i+1)*rowH-12;
      svg+=`<text x="${left}" y="${base-rowH+13}" fill="${COLORS[i]}">${e.batch} / attempt${i===0?' · recommended':''}</text><line class="grid" x1="${left}" x2="${W-right}" y1="${base}" y2="${base}"/>`;
      counts.forEach((count,b)=>{
        const h=count/e.completed*(rowH-25);
        if(count)svg+=`<rect x="${X(b*binWidth)}" y="${base-h}" width="${Math.max(1,(W-left-right)/bins-1)}" height="${h}" fill="${COLORS[i]}"><title>${e.batch} stones: ${pct(count/e.completed)} of outcomes between ${money(b*binWidth)} and ${money((b+1)*binWidth)} (upper boundary excluded)</title></rect>`;
      });
    });
    for(let i=0;i<=3;i++)svg+=`<text x="${X(xmax*i/3)}" y="${H-25}" text-anchor="${i===3?'end':'middle'}">${money(xmax*i/3,0)}</text>`;
    svg+=`<text x="${W/2}" y="${H-3}" text-anchor="middle">Total cost · bar height = share (0–100%)</text></svg>`;
    $('histogramChart').innerHTML=svg;
  }
  drawMean() {
    const W=Math.max(340,$('runningMeanChart').clientWidth||520),H=310,left=65,right=15,top=22,bottom=48;
    const G=this.settings().analysis.recommended.expectedCost;
    const points=this.experiments.flatMap(e=>e.checkpoints);
    const ymin=Math.min(G*.93,...points.map(p=>p.mean*.99)),ymax=Math.max(G*1.07,...points.map(p=>p.mean*1.01));
    const X=n=>left+n/50000*(W-left-right),Y=v=>H-bottom-(v-ymin)/(ymax-ymin)*(H-top-bottom);
    let svg=frame('Chronological running mean cost for each simulated strategy versus the exact mean',W,H);
    for(let i=0;i<=3;i++){
      const v=ymin+(ymax-ymin)*i/3;
      svg+=`<line class="grid" x1="${left}" x2="${W-right}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${left-7}" y="${Y(v)+4}" text-anchor="end">${money(v,1)}</text>`;
    }
    svg+=`<line x1="${left}" x2="${W-right}" y1="${Y(G)}" y2="${Y(G)}" stroke="#a4b0c0" stroke-dasharray="4 5"/>`;
    this.experiments.forEach((e,i)=>{
      if(e.checkpoints.length)svg+=`<path class="line" stroke="${COLORS[i]}" d="${e.checkpoints.map((p,j)=>`${j?'L':'M'} ${X(p.runs)} ${Y(p.mean)}`).join(' ')}"><title>${e.batch} stones per attempt</title></path>`;
    });
    for(const n of [0,25000,50000])svg+=`<text x="${X(n)}" y="${H-25}" text-anchor="${n===50000?'end':'middle'}">${n/1000}k</text>`;
    svg+=`<text x="${W/2}" y="${H-3}" text-anchor="middle">Completed upgrades per strategy</text></svg>`;
    $('runningMeanChart').innerHTML=svg;
  }
}
