const Charts = { instances:{},
  destroy(id){ if(this.instances[id]){ this.instances[id].destroy(); delete this.instances[id]; } },
  line(id, labels, values, label='UA'){
    this.destroy(id); const ctx=document.getElementById(id); if(!ctx) return;
    this.instances[id]=new Chart(ctx,{type:'line',data:{labels,datasets:[{label,data:values,tension:.35,fill:true,borderWidth:3,pointRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true},x:{grid:{display:false}}}}});
  },
  lineMulti(id, labels, datasets){
    this.destroy(id); const ctx=document.getElementById(id); if(!ctx) return;
    this.instances[id]=new Chart(ctx,{
      type:'line',
      data:{labels,datasets:(datasets||[]).map(ds=>({label:ds.label,data:ds.data,tension:.35,fill:false,borderWidth:3,pointRadius:3,yAxisID:ds.yAxisID||'y'}))},
      options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{display:true,labels:{boxWidth:10,usePointStyle:true}}},scales:{y:{beginAtZero:true},y1:{beginAtZero:true,position:'right',grid:{drawOnChartArea:false}},x:{grid:{display:false}}}}
    });
  },
  bar(id, labels, values, label='UA'){
    this.destroy(id); const ctx=document.getElementById(id); if(!ctx) return;
    this.instances[id]=new Chart(ctx,{type:'bar',data:{labels,datasets:[{label,data:values,borderRadius:8}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true},x:{grid:{display:false}}}}});
  },
  barHorizontal(id, labels, values, label='UA'){
    this.destroy(id); const ctx=document.getElementById(id); if(!ctx) return;
    this.instances[id]=new Chart(ctx,{type:'bar',data:{labels,datasets:[{label,data:values,borderRadius:8}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{beginAtZero:true},y:{grid:{display:false}}}}});
  }
};
