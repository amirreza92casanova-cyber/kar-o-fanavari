(() => {
  'use strict';
  const data = window.OLYMPIC_DATA;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const medalLabels = { gold: 'طلا', silver: 'نقره', bronze: 'برنز' };
  const medalClasses = { gold: 'medal-gold', silver: 'medal-silver', bronze: 'medal-bronze' };
  const medalIcons = { gold: '🥇', silver: '🥈', bronze: '🥉' };
  const sportIcons = { 'کشتی':'🤼', 'وزنه‌برداری':'🏋️', 'تکواندو':'🥋', 'تیراندازی':'🎯', 'کاراته':'🥋', 'دوومیدانی':'🏃' };
  const STORAGE_KEY = 'olympicIranProjectV1';
  const defaultState = { theme:'dark', filters:{search:'',year:'all',sport:'all',medal:'all'}, steps:{}, studentName:'', studentClass:'', teacherName:'', generalNotes:'' };
  let state = loadState();
  const fa = value => new Intl.NumberFormat('fa-IR').format(value);
  function loadState(){
    try { return { ...defaultState, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
    catch { return { ...defaultState }; }
  }
  function saveState(){
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      const indicator = $('#saveIndicator');
      if (indicator) { indicator.textContent = 'ذخیره شد ✓'; window.clearTimeout(saveState.timer); saveState.timer = window.setTimeout(() => indicator.textContent = 'ذخیرهٔ خودکار فعال است', 1300); }
    } catch { const indicator = $('#saveIndicator'); if (indicator) indicator.textContent = 'ذخیره در این مرورگر در دسترس نیست'; }
  }
  function escapeHTML(value){ return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
  function verifyDataset(){
    const counts = data.medals.reduce((acc, medal) => { acc[medal.medal]++; return acc; }, {gold:0,silver:0,bronze:0});
    const total = counts.gold + counts.silver + counts.bronze;
    if (total !== 88 || counts.gold !== 27 || counts.silver !== 29 || counts.bronze !== 32) {
      console.warn('Olympic data validation:', {total, ...counts});
    }
    $('#totalCount').textContent = fa(total);
    $('#goldCount').textContent = fa(counts.gold);
    $('#silverCount').textContent = fa(counts.silver);
    $('#bronzeCount').textContent = fa(counts.bronze);
  }
  function initFilters(){
    const years = [...new Set(data.medals.map(m => m.year))].sort((a,b)=>b-a);
    const sports = [...new Set(data.medals.map(m => m.sport))].sort((a,b)=>a.localeCompare(b,'fa'));
    $('#yearFilter').insertAdjacentHTML('beforeend', years.map(y=>`<option value="${y}">${fa(y)}</option>`).join(''));
    $('#sportFilter').insertAdjacentHTML('beforeend', sports.map(s=>`<option value="${escapeHTML(s)}">${escapeHTML(s)}</option>`).join(''));
    $('#searchInput').value = state.filters.search || '';
    $('#yearFilter').value = state.filters.year || 'all';
    $('#sportFilter').value = state.filters.sport || 'all';
    $('#medalFilter').value = state.filters.medal || 'all';
  }
  function getFilteredMedals(){
    const q = (state.filters.search || '').trim().toLocaleLowerCase('fa');
    return data.medals.filter(m => {
      const searchMatch = !q || `${m.name} ${m.sport} ${m.event} ${m.city} ${m.year}`.toLocaleLowerCase('fa').includes(q);
      return searchMatch && (state.filters.year==='all' || String(m.year)===String(state.filters.year)) && (state.filters.sport==='all' || m.sport===state.filters.sport) && (state.filters.medal==='all' || m.medal===state.filters.medal);
    });
  }
  function renderMedalTable(){
    const filtered = getFilteredMedals();
    const sorted = [...filtered].sort((a,b)=>a.year-b.year || ({gold:0,silver:1,bronze:2}[a.medal]-{gold:0,silver:1,bronze:2}[b.medal]) || a.name.localeCompare(b.name,'fa'));
    $('#resultsCount').textContent = `${fa(filtered.length)} مدال از ${fa(data.medals.length)} مدال`;
    $('#tablePageNote').textContent = filtered.length ? `${fa(filtered.length)} رکورد نمایش داده شده` : 'رکوردی پیدا نشد';
    $('#medalTableBody').innerHTML = sorted.length ? sorted.map((m,index)=>`<tr>
      <td>${fa(index+1)}</td><td class="athlete-cell">${escapeHTML(m.name)}${m.note?` <span title="توضیح دربارهٔ تغییر نتیجه" class="note-mark">*</span>`:''}</td>
      <td><span class="medal-pill ${medalClasses[m.medal]}">${medalIcons[m.medal]} ${medalLabels[m.medal]}</span></td>
      <td>${fa(m.year)} · ${escapeHTML(m.city)}</td><td>${escapeHTML(m.sport)}</td><td class="event-cell">${escapeHTML(m.event)}</td>
      </tr>`).join('') : '<tr><td colspan="6" class="empty-row">با این فیلترها نتیجه‌ای پیدا نشد. فیلترها را تغییر بده.</td></tr>';
  }
  function bindFilters(){
    const setFilter = (key,value) => { state.filters[key] = value; saveState(); renderMedalTable(); };
    $('#searchInput').addEventListener('input', e=>setFilter('search',e.target.value));
    $('#yearFilter').addEventListener('change', e=>setFilter('year',e.target.value));
    $('#sportFilter').addEventListener('change', e=>setFilter('sport',e.target.value));
    $('#medalFilter').addEventListener('change', e=>setFilter('medal',e.target.value));
    $('#resetFilters').addEventListener('click', ()=>{
      state.filters = {...defaultState.filters}; saveState();
      $('#searchInput').value=''; $('#yearFilter').value='all'; $('#sportFilter').value='all'; $('#medalFilter').value='all'; renderMedalTable();
    });
    const paris = () => {
      state.filters = {search:'',year:'2024',sport:'all',medal:'all'}; saveState();
      $('#searchInput').value=''; $('#yearFilter').value='2024'; $('#sportFilter').value='all'; $('#medalFilter').value='all';
      renderMedalTable(); document.querySelector('#medalists').scrollIntoView({behavior:'smooth'});
    };
    $('#showParis').addEventListener('click', paris); $('#parisFilterButton').addEventListener('click', paris);
  }
  function renderHistory(){
    const max = Math.max(...data.games.map(g=>g.total));
    $('#historyChart').innerHTML = data.games.map(g=>{
      const height = 175;
      const hGold = g.gold/max*height, hSilver = g.silver/max*height, hBronze = g.bronze/max*height;
      const active = g.year===2024 ? 'active' : '';
      return `<button type="button" class="history-bar-group ${active}" data-year="${g.year}" aria-label="${g.year}، ${g.total} مدال">
        <span class="bar-stack"><i class="bar-segment gold-bg" style="height:${hGold}px"></i><i class="bar-segment silver-bg" style="height:${hSilver}px"></i><i class="bar-segment bronze-bg" style="height:${hBronze}px"></i></span>
        <span class="bar-year">${fa(String(g.year).slice(2))}</span></button>`;
    }).join('');
    $$('.history-bar-group').forEach(button=>button.addEventListener('click',()=>{
      $$('.history-bar-group').forEach(b=>b.classList.remove('active')); button.classList.add('active');
      const game = data.games.find(g=>String(g.year)===button.dataset.year);
      $('#selectedGame').innerHTML = `<span class="card-overline">SELECTED EDITION</span><h3>${escapeHTML(game.city)} ${fa(game.year)}</h3><p>آمار مدال‌های ایران در این دوره</p><div class="selected-total"><strong>${fa(game.total)}</strong><span>مدال</span></div><div class="selected-mini"><span>🥇 طلا <b>${fa(game.gold)}</b></span><span>🥈 نقره <b>${fa(game.silver)}</b></span><span>🥉 برنز <b>${fa(game.bronze)}</b></span></div><button class="button button-primary button-full no-print" type="button" id="showSelectedGame">دیدن مدال‌آوران این سال</button>`;
      $('#showSelectedGame').addEventListener('click',()=>{
        state.filters={search:'',year:String(game.year),sport:'all',medal:'all'}; saveState();
        $('#searchInput').value=''; $('#yearFilter').value=String(game.year); $('#sportFilter').value='all'; $('#medalFilter').value='all'; renderMedalTable(); document.querySelector('#medalists').scrollIntoView({behavior:'smooth'});
      });
    }));
  }
  function renderSports(){
    $('#sportsGrid').innerHTML = data.sports.map(s=>{
      const max=55; const g=s.gold/s.total*100, si=s.silver/s.total*100, b=s.bronze/s.total*100;
      return `<article class="sport-card"><div class="sport-top"><span class="sport-icon">${sportIcons[s.sport]||'🏅'}</span><strong class="sport-total">${fa(s.total)}</strong></div><h3 class="sport-name">${escapeHTML(s.sport)}</h3><span class="sport-desc">${fa(s.total)} مدال از مجموع ۸۸ مدال</span><div class="sport-bar"><span class="gold-bg" style="width:${g}%"></span><span class="silver-bg" style="width:${si}%"></span><span class="bronze-bg" style="width:${b}%"></span></div><div class="sport-counts"><span>🥇 <b>${fa(s.gold)}</b></span><span>🥈 <b>${fa(s.silver)}</b></span><span>🥉 <b>${fa(s.bronze)}</b></span></div></article>`;
    }).join('');
  }
  const steps = [
    ['انتخاب موضوع','تعیین پرسش اصلی و محدودهٔ زمانی پژوهش.'],
    ['جمع‌آوری اطلاعات','یادداشت اطلاعات از منابع و بررسی اولیهٔ اعداد.'],
    ['دسته‌بندی داده‌ها','مرتب‌سازی نام ورزشکاران بر اساس سال، رشته و مدال.'],
    ['طراحی مستند','طراحی جلد، صفحه‌های گزارش و نمودارهای آماری.'],
    ['برنامه‌نویسی','پیاده‌سازی جست‌وجو، فیلترها و تعامل‌های صفحه.'],
    ['آزمایش و اصلاح','بررسی صحت داده‌ها، سازگاری و رفع خطاها.'],
    ['ارائهٔ نهایی','ثبت نتیجه، چاپ گزارش و آماده‌سازی ارائه.']
  ];
  function renderSteps(){
    const statusOptions=[['todo','شروع نشده'],['doing','در حال انجام'],['done','انجام شده']];
    $('#stepsGrid').innerHTML=steps.map((s,i)=>{
      const key=String(i+1), entry=state.steps[key]||{};
      return `<article class="step-card"><span class="step-number">${fa(String(i+1).padStart(2,'0'))}</span><h3>${s[0]}</h3><p>${s[1]}</p><select aria-label="وضعیت مرحلهٔ ${i+1}" data-step-status="${key}">${statusOptions.map(o=>`<option value="${o[0]}" ${((entry.status||'todo')===o[0])?'selected':''}>${o[1]}</option>`).join('')}</select><textarea aria-label="یادداشت مرحلهٔ ${i+1}" data-step-note="${key}" placeholder="یادداشت این مرحله...">${escapeHTML(entry.note||'')}</textarea></article>`;
    }).join('');
    $$('[data-step-status]').forEach(el=>el.addEventListener('change',e=>{ const k=e.target.dataset.stepStatus; state.steps[k]={...(state.steps[k]||{}),status:e.target.value}; saveState(); updateProgress(); }));
    $$('[data-step-note]').forEach(el=>el.addEventListener('input',e=>{ const k=e.target.dataset.stepNote; state.steps[k]={...(state.steps[k]||{}),note:e.target.value}; saveState(); }));
    updateProgress();
  }
  function updateProgress(){
    const complete=steps.filter((_,i)=>(state.steps[String(i+1)]||{}).status==='done').length;
    const pct=Math.round(complete/steps.length*100);
    $('#progressPercent').textContent=fa(`${pct}٪`); $('#progressBar').style.width=`${pct}%`;
  }
  function initStudentNotes(){
    $('#studentName').value=state.studentName||''; $('#studentClass').value=state.studentClass||''; $('#teacherName').value=state.teacherName||''; $('#generalNotes').value=state.generalNotes||'';
    [['studentName','studentName'],['studentClass','studentClass'],['teacherName','teacherName'],['generalNotes','generalNotes']].forEach(([id,key])=>$('#'+id).addEventListener('input',e=>{state[key]=e.target.value;saveState();}));
  }
  function initTheme(){
    document.body.classList.toggle('light-theme',state.theme==='light');
    $('#themeToggle').textContent=state.theme==='light'?'☾':'☼';
    $('#themeToggle').addEventListener('click',()=>{state.theme=state.theme==='light'?'dark':'light';document.body.classList.toggle('light-theme',state.theme==='light');$('#themeToggle').textContent=state.theme==='light'?'☾':'☼';saveState();});
  }
  function initPrint(){
    const sync=()=>{
      $('#printStudentName').textContent=state.studentName||'................................';
      $('#printStudentClass').textContent=state.studentClass||'................';
      $('#printTeacherName').textContent=state.teacherName||'........................';
    };
    $('#printButton').addEventListener('click',()=>{sync();window.print();});
    $('#finalPrint').addEventListener('click',()=>{sync();window.print();});
  }
  function initCSV(){
    $('#csvButton').addEventListener('click',()=>{
      const rows=[['نام ورزشکار','نوع مدال','سال','شهر میزبان','رشته','ماده / وزن'],...getFilteredMedals().map(m=>[m.name,medalLabels[m.medal],m.year,m.city,m.sport,m.event])];
      const csv='\uFEFF'+rows.map(row=>row.map(cell=>'"'+String(cell).replace(/"/g,'""')+'"').join(',')).join('\r\n');
      downloadFile(csv,'olympic-iran-medalists.csv','text/csv;charset=utf-8');
    });
  }
  function downloadFile(content,filename,type){
    const blob=new Blob([content],{type}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }
  function initBackup(){
    $('#exportProgress').addEventListener('click',()=>{
      const backup={project:'OLYMPIC IRAN',exportedAt:new Date().toISOString(),student:{name:state.studentName,class:state.studentClass,teacher:state.teacherName},generalNotes:state.generalNotes,steps:state.steps};
      downloadFile(JSON.stringify(backup,null,2),'olympic-iran-research-notes.json','application/json');
    });
    $('#clearProgress').addEventListener('click',()=>{
      if(!window.confirm('یادداشت‌ها و وضعیت مراحل ذخیره‌شده پاک شوند؟')) return;
      state.steps={};state.studentName='';state.studentClass='';state.teacherName='';state.generalNotes='';saveState();
      renderSteps();initStudentNotes();
    });
  }
  function initQuiz(){
    const answers={q1:'1948',q2:'salmasi',q3:'wrestling',q4:'3',q5:'paralympic'};
    const explanations={q1:'نخستین حضور تیمی ایران در المپیک تابستانی در ۱۹۴۸ لندن بود.',q2:'جعفر سلماسی در لندن ۱۹۴۸ نخستین مدال المپیکی ایران را به دست آورد.',q3:'کشتی با ۵۵ مدال، پرافتخارترین رشتهٔ ایران در این جدول است.',q4:'ایران در پاریس ۲۰۲۴ سه مدال طلا کسب کرد.',q5:'این گزارش فقط المپیک تابستانی بزرگسالان را بررسی می‌کند.'};
    $('#quizForm').addEventListener('submit',e=>{
      e.preventDefault();let score=0,missing=0;Object.keys(answers).forEach(q=>{const selected=$(`input[name="${q}"]:checked`);if(!selected)missing++;else if(selected.value===answers[q])score++;});
      const result=$('#quizResult');result.hidden=false;
      result.innerHTML=`<b>نتیجهٔ آزمون: ${fa(score)} از ۵</b><p>${missing?`به ${fa(missing)} پرسش پاسخ ندادی. `:''}${score===5?'عالی! همهٔ پاسخ‌ها درست است.':score>=3?'خوب پیش رفتی؛ توضیح پاسخ‌ها را مرور کن.':'پاسخ‌های درست را مرور کن و دوباره تلاش کن.'}</p><ul>${Object.keys(answers).map(q=>`<li>${explanations[q]}</li>`).join('')}</ul>`;
      result.scrollIntoView({behavior:'smooth',block:'nearest'});
    });
    $('#quizReset').addEventListener('click',()=>{$('#quizResult').hidden=true;});
  }
  verifyDataset();initFilters();bindFilters();renderMedalTable();renderHistory();renderSports();renderSteps();initStudentNotes();initTheme();initPrint();initCSV();initBackup();initQuiz();
})();
