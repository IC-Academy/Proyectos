const KEY='pm365_demo_v1';
const seed={
 user:{name:'Jorge Mejía',role:'SUPERADMIN'},
 modelUpdated:'2026-09-04T09:30:00',
 users:[
  {id:1,name:'Jorge Mejía',role:'SUPERADMIN',active:true,permissions:['*']},
  {id:2,name:'Jorge Martinez',role:'ADMIN',active:true,permissions:['*functional']},
  {id:3,name:'Ana Pricing',role:'PRICING',active:true,permissions:['salary','tax','uniform','exceptions','audit']},
  {id:4,name:'Luis Pricing',role:'PRICING',active:true,permissions:['equipment','vehicle','exceptions']},
  {id:5,name:'Daniel Ventas',role:'SALES',active:true,permissions:[]},
  {id:6,name:'Mayra Ventas',role:'SALES',active:true,permissions:[]},
  {id:7,name:'Dante Ventas',role:'SALES',active:true,permissions:[]}
 ],
 catalogs:[
  {id:1,type:'Salarios',name:'Guardia Intramuros',location:'Querétaro',value:11200,unit:'MXN/mes',min:10500,max:12000,start:'2026-01-01',end:'2026-12-31',notify:30,owner:'Pricing',updated:'2026-08-28',status:'Vigente'},
  {id:2,type:'Salarios',name:'Guardia Intramuros',location:'CDMX',value:11800,unit:'MXN/mes',min:11000,max:12500,start:'2026-01-01',end:'2026-12-31',notify:30,owner:'Pricing',updated:'2026-08-28',status:'Vigente'},
  {id:3,type:'Salarios',name:'Guardia Armado',location:'Guadalajara',value:14200,unit:'MXN/mes',min:13500,max:15500,start:'2026-01-01',end:'2026-12-31',notify:30,owner:'Pricing',updated:'2026-08-28',status:'Vigente'},
  {id:4,type:'Salarios',name:'Supervisor',location:'Querétaro',value:17500,unit:'MXN/mes',min:16500,max:19000,start:'2026-01-01',end:'2026-12-31',notify:30,owner:'Pricing',updated:'2026-08-28',status:'Vigente'},
  {id:5,type:'Impuestos',name:'ISN',location:'Jalisco',value:3,unit:'%',start:'2026-01-01',end:'2026-12-31',notify:45,owner:'Pricing',updated:'2026-01-05',status:'Vigente'},
  {id:6,type:'Impuestos',name:'ISN',location:'Querétaro',value:3,unit:'%',start:'2026-01-01',end:'2026-12-31',notify:45,owner:'Pricing',updated:'2026-01-05',status:'Vigente'},
  {id:7,type:'Uniformes',name:'Uniforme Guardia Básico',location:'Nacional',value:2850,unit:'MXN/anual',start:'2026-07-01',end:'2026-09-25',notify:30,owner:'Compras',updated:'2026-07-01',status:'Próximo a vencer'},
  {id:8,type:'Uniformes',name:'Uniforme Supervisor',location:'Nacional',value:3420,unit:'MXN/anual',start:'2026-07-01',end:'2026-09-25',notify:30,owner:'Compras',updated:'2026-07-01',status:'Próximo a vencer'},
  {id:9,type:'Vehículos',name:'Sedán operativo',location:'Nacional',value:12800,unit:'MXN/mes',start:'2026-01-01',end:'2026-08-31',notify:60,owner:'Compras',updated:'2026-01-15',status:'Vencido'},
  {id:10,type:'Vehículos',name:'Van operativa',location:'Nacional',value:17600,unit:'MXN/mes',start:'2026-01-01',end:'2026-12-31',notify:60,owner:'Compras',updated:'2026-01-15',status:'Vigente'},
  {id:11,type:'Equipamiento',name:'Radio portátil',location:'Nacional',value:620,unit:'MXN/mes',start:'2026-07-01',end:'2026-09-18',notify:30,owner:'Compras',updated:'2026-07-01',status:'Próximo a vencer'},
  {id:12,type:'Equipamiento',name:'Equipo básico puesto',location:'Nacional',value:380,unit:'MXN/mes',start:'2026-07-01',end:'2026-12-31',notify:30,owner:'Pricing',updated:'2026-08-15',status:'Vigente'},
  {id:13,type:'Capacitación',name:'Inducción estándar',location:'Nacional',value:900,unit:'MXN/ingreso',start:'2026-01-01',end:'2026-12-31',notify:45,owner:'DO',updated:'2026-01-20',status:'Vigente'},
  {id:14,type:'Exámenes',name:'Examen médico básico',location:'Nacional',value:680,unit:'MXN/persona',start:'2026-01-01',end:'2026-10-01',notify:30,owner:'DO',updated:'2026-04-01',status:'Próximo a vencer'},
  {id:15,type:'Permisos',name:'Permiso estatal estándar',location:'Querétaro',value:7200,unit:'MXN/anual',start:'2026-01-01',end:'2026-12-31',notify:60,owner:'Gubernamental',updated:'2026-02-01',status:'Vigente'}
 ],
 quotes:[
  {id:'PM-2026-00001',client:'Planta Norte',seller:'Daniel Ventas',city:'Querétaro',status:'Validada',total:284500,date:'2026-08-12',exceptions:0},
  {id:'PM-2026-00002',client:'Centro Logístico MX',seller:'Mayra Ventas',city:'CDMX',status:'Pendiente de validación',total:438000,date:'2026-08-18',exceptions:1},
  {id:'PM-2026-00003',client:'Tech Campus',seller:'Dante Ventas',city:'Guadalajara',status:'Propuesta generada',total:512300,date:'2026-08-22',exceptions:0},
  {id:'PM-2026-00004',client:'Industrial Bajío',seller:'Daniel Ventas',city:'Querétaro',status:'Calculada',total:197600,date:'2026-08-29',exceptions:0},
  {id:'PM-2026-00005',client:'Retail Uno',seller:'Mayra Ventas',city:'CDMX',status:'Pendiente de validación',total:325800,date:'2026-09-02',exceptions:2}
 ],
 validations:[
  {id:1,quote:'PM-2026-00002',client:'Centro Logístico MX',seller:'Mayra Ventas',field:'Salario Guardia Intramuros',captured:13200,expected:'11,000 – 12,500',diff:'+5.6%',date:'2026-08-18',status:'Pendiente'},
  {id:2,quote:'PM-2026-00005',client:'Retail Uno',seller:'Mayra Ventas',field:'Gross Margin',captured:'13%',expected:'≥ 15%',diff:'-2 pp',date:'2026-09-02',status:'Pendiente'},
  {id:3,quote:'PM-2026-00005',client:'Retail Uno',seller:'Mayra Ventas',field:'Vehículo',captured:'Sedán operativo',expected:'Catálogo vencido',diff:'Vigencia',date:'2026-09-02',status:'Pendiente'}
 ],
 audit:[
  {date:'2026-09-03 16:42',user:'Jorge Martinez',action:'Actualizó catálogo',detail:'Salario Guardia Intramuros / Querétaro: $11,000 → $11,200'},
  {date:'2026-09-02 12:18',user:'Ana Pricing',action:'Aceptó excepción',detail:'PM-2026-00004 · margen comercial'},
  {date:'2026-09-01 09:05',user:'Jorge Martinez',action:'Cambió permiso',detail:'Ana Pricing: habilitó edición de Impuestos'},
  {date:'2026-08-28 14:30',user:'Ana Pricing',action:'Actualizó catálogo',detail:'Rangos salariales Querétaro'}
 ],
 notifications:[
  {level:'bad',title:'Catálogo vencido',text:'Sedán operativo venció el 31/08/2026.',date:'2026-09-01'},
  {level:'warn',title:'Próximo vencimiento',text:'Radio portátil vence el 18/09/2026.',date:'2026-09-01'},
  {level:'warn',title:'Validación pendiente',text:'PM-2026-00005 tiene 2 parámetros fuera de estándar.',date:'2026-09-02'}
 ]
};
let db=load();let page='dashboard';let quoteDraft=null;
function load(){try{return JSON.parse(localStorage.getItem(KEY))||structuredClone(seed)}catch{return structuredClone(seed)}}
function save(){localStorage.setItem(KEY,JSON.stringify(db))}
function money(v){return new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(Number(v)||0)}
function roleLabel(r){return {SUPERADMIN:'Superadmin técnico',ADMIN:'Administrador',PRICING:'Pricing',SALES:'Ventas'}[r]||r}
function statusClass(s){return s==='Vigente'?'ok':s==='Vencido'?'bad':'warn'}
function navItems(){return db.user.role==='SALES'?[['dashboard','Dashboard'],['newquote','Nueva Cotización'],['quotes','Mis Cotizaciones']]:[['dashboard','Dashboard'],['quotes','Cotizaciones'],['validations','Centro de Validaciones'],['catalogs','Catálogos'],['users','Usuarios'],['audit','Auditoría'],['settings','Configuración']]}
function shell(){document.getElementById('app').innerHTML=`<div class="app"><aside class="sidebar"><div class="brand">Price Model 365<small>Commercial Pricing Platform</small></div><div class="nav">${navItems().map(([id,t])=>`<button data-nav="${id}" class="${page===id?'active':''}"><span>${t}</span></button>`).join('')}</div><div class="sidebar-footer">Demo V0.1 · Microsoft 365 ready</div></aside><main class="main"><header class="topbar"><div><div class="top-title">Price Model 365</div><div class="small muted">Última actualización: ${new Date(db.modelUpdated).toLocaleString('es-MX')}</div></div><div class="top-meta"><span class="chip">${roleLabel(db.user.role)}</span><button class="btn" id="roleBtn">${db.user.name}</button></div></header><section class="content" id="view"></section></main></div>`;
 document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>{page=b.dataset.nav;render()});document.getElementById('roleBtn').onclick=openRoleModal;renderPage();}
function render(){shell()}
function hero(title,sub,action=''){return `<div class="hero"><div><h1>${title}</h1><p>${sub}</p></div>${action}</div>`}
function renderPage(){const v=document.getElementById('view');if(page==='dashboard')v.innerHTML=dashboard();if(page==='catalogs')v.innerHTML=catalogs();if(page==='quotes')v.innerHTML=quotes();if(page==='validations')v.innerHTML=validations();if(page==='newquote')v.innerHTML=newQuote();if(page==='users')v.innerHTML=users();if(page==='audit')v.innerHTML=audit();if(page==='settings')v.innerHTML=settings();bind();}
function dashboard(){if(db.user.role==='SALES')return hero('Panel de Ventas','Cotiza rápidamente usando parámetros vigentes del Price Model.',`<button class="btn primary" data-nav="newquote">Nueva cotización</button>`)+`<div class="grid kpis"><div class="card kpi"><div class="label">Mis cotizaciones</div><div class="value">${db.quotes.length}</div></div><div class="card kpi"><div class="label">Pendientes de validación</div><div class="value">${db.quotes.filter(q=>q.status.includes('Pendiente')).length}</div></div><div class="card kpi"><div class="label">Propuestas generadas</div><div class="value">${db.quotes.filter(q=>q.status==='Propuesta generada').length}</div></div></div>`;
 const vig=db.catalogs.filter(c=>c.status==='Vigente').length, warn=db.catalogs.filter(c=>c.status==='Próximo a vencer').length,bad=db.catalogs.filter(c=>c.status==='Vencido').length;
 return hero('Control de Pricing','Salud del modelo, excepciones y vigencia de parámetros.')+`<div class="grid kpis"><div class="card kpi"><div class="label">Catálogos vigentes</div><div class="value ok">${vig}</div><div class="sub">Parámetros utilizables</div></div><div class="card kpi"><div class="label">Próximos a vencer</div><div class="value warn">${warn}</div><div class="sub">Requieren actualización</div></div><div class="card kpi"><div class="label">Vencidos</div><div class="value bad">${bad}</div><div class="sub">Riesgo en cálculo</div></div><div class="card kpi"><div class="label">Validaciones pendientes</div><div class="value">${db.validations.filter(x=>x.status==='Pendiente').length}</div></div><div class="card kpi"><div class="label">Cotizaciones</div><div class="value">${db.quotes.length}</div><div class="sub">Demo actual</div></div></div><div class="grid two" style="margin-top:16px"><div class="card"><div class="section-title"><h3>Salud del Price Model</h3><button class="btn" data-nav="catalogs">Ver catálogos</button></div><table><thead><tr><th>Catálogo</th><th>Ubicación</th><th>Vigencia</th><th>Última actualización</th></tr></thead><tbody>${db.catalogs.slice(0,9).map(c=>`<tr><td>${c.type} · ${c.name}</td><td>${c.location}</td><td><span class="status ${statusClass(c.status)}"><i class="dot ${statusClass(c.status)}"></i>${c.status}</span></td><td>${c.updated}</td></tr>`).join('')}</tbody></table></div><div class="card"><div class="section-title"><h3>Notificaciones</h3></div><div class="notice-list">${db.notifications.map(n=>`<div class="notice"><div class="status ${n.level}">${n.title}</div><div class="small" style="margin-top:4px">${n.text}</div><div class="small muted" style="margin-top:6px">${n.date}</div></div>`).join('')}</div></div></div>`}
